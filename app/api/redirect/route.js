import { firestore } from "@/lib/firestore"
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore"

export async function GET(req) {
  const url = new URL(req.url)
  const sp = url.searchParams

  // Helper: decode nested URIs up to 3 times (handles double-encoded final_url)
  const decodeNestedURI = (value) => {
    if (!value) return value
    let out = value
    for (let i = 0; i < 3; i++) {
      try {
        const dec = decodeURIComponent(out)
        if (dec === out) break
        out = dec
      } catch {
        break
      }
    }
    return out
  }

  // Helper: merge params with click_id as first parameter
  const mergeParamsIntoUrl = (targetUrlString, paramsObj, clickId) => {
    if (!targetUrlString) return targetUrlString
    let target
    try {
      target = new URL(targetUrlString)
    } catch {
      // Attempt to coerce if missing protocol
      try {
        target = new URL(`https://${targetUrlString}`)
      } catch {
        return targetUrlString
      }
    }

    // First, ensure click_id is the first parameter
    if (clickId) {
      // Remove existing click_id if any
      target.searchParams.delete('click_id')
      // Add click_id as first parameter by reconstructing the URL
      const newSearchParams = new URLSearchParams()
      newSearchParams.append('click_id', clickId)
      
      // Then add all other parameters
      for (const [k, v] of Object.entries(paramsObj)) {
        if (k == null || k === "" || v == null || k === 'click_id') continue
        newSearchParams.append(k, String(v))
      }
      
      // Also include any existing parameters from the target URL (except click_id)
      for (const [k, v] of target.searchParams.entries()) {
        if (k !== 'click_id') {
          newSearchParams.append(k, v)
        }
      }
      
      target.search = newSearchParams.toString()
    } else {
      // If no click_id, use normal merging
      for (const [k, v] of Object.entries(paramsObj)) {
        if (k == null || k === "" || v == null) continue
        if (!target.searchParams.has(k)) {
          target.searchParams.append(k, String(v))
        }
      }
    }
    
    return target.toString()
  }

  // Get the click_id from the request (passed from demo page as first parameter)
  const clickId = sp.get("click_id")
  const redirectUrl = sp.get("redirect_url")
  const returnJson = sp.get("return_json") === "true" // New parameter to control response type
  
  if (!redirectUrl) {
    return new Response(JSON.stringify({ error: "Missing redirect_url parameter" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    })
  }

  // Decode nested encoding on redirect_url
  const decodedRedirectUrl = decodeNestedURI(redirectUrl)

  // Build a params object from the current query string
  const allParams = Object.fromEntries(sp.entries())
  
  // Remove parameters that shouldn't be passed to final URL
  const paramsToRemove = ['redirect_url', 'preview_url', 'return_json']
  paramsToRemove.forEach(param => delete allParams[param])

  // Start by merging into the OUTER affiliate URL WITH CLICK_ID AS FIRST PARAMETER
  let composedFinal = mergeParamsIntoUrl(decodedRedirectUrl, allParams, clickId)

  // Now detect common nested URL parameter names and append the same params to them too
  const nestedKeys = ["lpurl", "url", "u", "redirect", "redir", "target", "dest", "destination", "to", "r"]
  try {
    const outerURL = new URL(composedFinal)
    for (const key of nestedKeys) {
      if (!outerURL.searchParams.has(key)) continue
      const nestedRaw = outerURL.searchParams.get(key)
      const nestedDecoded = decodeNestedURI(nestedRaw)
      // Only attempt if the nested raw looks like a URL
      if (nestedDecoded && /^https?:\/\//i.test(nestedDecoded)) {
        // Ensure click_id is first parameter in nested URLs too
        const mergedNested = mergeParamsIntoUrl(nestedDecoded, allParams, clickId)
        // Setting directly will auto-encode the nested URL as needed
        outerURL.searchParams.set(key, mergedNested)
      }
    }
    composedFinal = outerURL.toString()
  } catch {
    // If parsing fails, we still try to redirect to composedFinal as-is
  }

  // Issue a server-side redirect (302) to the fully composed URL
  let finalRedirect = composedFinal
  try {
    const outerURL = new URL(composedFinal)
    const nestedKeys = [
      "lpurl",
      "url",
      "u",
      "redirect",
      "redir",
      "target",
      "dest",
      "destination",
      "to",
      "r",
      "landing",
      "landing_url",
      "merchant_url",
    ]
    const hasNested = nestedKeys.some((k) => outerURL.searchParams.has(k))

    // If we find a real merchant URL, append the same params there.
    let merchantResolved = await resolveMerchantByFollow(composedFinal)

    if (!merchantResolved && !hasNested) {
      merchantResolved = await resolveMerchantFromAffiliate(composedFinal)
    }

    if (merchantResolved && /^https?:\/\//i.test(merchantResolved)) {
      // Ensure click_id is first parameter in merchant URL too
      finalRedirect = mergeParamsIntoUrl(merchantResolved, allParams, clickId)
      try {
        fetch(composedFinal).catch(() => {})
      } catch {}
    }
  } catch {
    // If parsing fails, we still try to redirect to composedFinal as-is
  }

  // After computing finalRedirect, persist data into Firestore
  try {
    const affiliateId = sp.get("affiliate_id") || null
    const campaignId = sp.get("campaign_id") || null
    const publisherId = sp.get("pub_id") || sp.get("publisher_id") || null
    const source = sp.get("source") || sp.get("utm_source") || null

    const previewUrl = sp.get("preview_url") || url.toString()
    const outerAffiliateUrl = decodedRedirectUrl
    const composedAffiliateUrl = composedFinal
    const resolvedFinalUrl = finalRedirect
    const serverResolvedAt = new Date().toISOString()
    const requestIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null
    const userAgent = req.headers.get("user-agent") || null

    // Update per-click session with additional API data
    if (clickId) {
      const sessionRef = doc(firestore, "trackingSessions", clickId)
      const sessionDoc = await getDoc(sessionRef)
      
      const sessionData = {
        clickId,
        affiliateId,
        campaignId,
        publisherId,
        source,
        previewUrl,
        outerAffiliateUrl,
        composedAffiliateUrl,
        finalUrl: resolvedFinalUrl,
        serverResolvedAt,
        requestIp,
        userAgent,
        lastUpdatedAt: serverResolvedAt,
      }

      // If session exists, update it; otherwise create new
      if (sessionDoc.exists()) {
        await updateDoc(sessionRef, {
          ...sessionData,
          apiCalls: arrayUnion({
            timestamp: serverResolvedAt,
            finalUrl: resolvedFinalUrl
          })
        })
      } else {
        await setDoc(sessionRef, {
          ...sessionData,
          apiCalls: [{
            timestamp: serverResolvedAt,
            finalUrl: resolvedFinalUrl
          }],
          createdAt: serverResolvedAt
        })
      }
    }

    // Update affiliate aggregate using affiliate_id as document ID
    if (affiliateId && clickId) {
      const affiliateRef = doc(firestore, "affiliateLinks", affiliateId)
      const snap = await getDoc(affiliateRef)
      const logEntry = {
        clickId,
        campaignId,
        publisherId,
        source,
        previewUrl,
        outerAffiliateUrl,
        composedAffiliateUrl,
        finalUrl: resolvedFinalUrl,
        serverResolvedAt,
        isRepeatClick: sp.get("is_repeat_click") === "true"
      }

      if (snap.exists()) {
        await updateDoc(affiliateRef, {
          trackingLogs: arrayUnion(logEntry),
          lastPreviewUrl: previewUrl,
          lastFinalUrl: resolvedFinalUrl,
          lastActivity: serverResolvedAt,
          totalClicks: (snap.data().totalClicks || 0) + (logEntry.isRepeatClick ? 0 : 1),
        })
      } else {
        await setDoc(affiliateRef, {
          affiliateId,
          totalClicks: 1,
          createdAt: serverResolvedAt,
          lastActivity: serverResolvedAt,
          lastPreviewUrl: previewUrl,
          lastFinalUrl: resolvedFinalUrl,
          trackingLogs: [logEntry],
        })
      }
    }
  } catch (e) {
    // Best-effort logging; never block redirect
    console.error("[API] Firestore logging failed:", e)
  }

  // Return JSON instead of redirecting if requested
  if (returnJson) {
    return new Response(JSON.stringify({ 
      success: true,
      previewUrl: decodedRedirectUrl,
      finalRedirectUrl: finalRedirect,
      clickId: clickId,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 
        "content-type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      },
    })
  }

  // Default behavior: redirect immediately
  return Response.redirect(finalRedirect, 302)
}

async function resolveMerchantFromAffiliate(affiliateUrl) {
  // Try up to 3 manual redirects to discover final Location without following it
  let current = affiliateUrl
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(current, { method: "GET", redirect: "manual" })
      const location = res.headers.get("location")
      // If no Location or status isn't a redirect, stop
      if (!location || res.status < 300 || res.status > 399) break
      // Resolve relative locations against current
      const nextUrl = new URL(location, current).toString()
      // If the location looks like a merchant URL, return it; otherwise keep chasing
      if (/^https?:\/\//i.test(nextUrl)) {
        current = nextUrl
        // Continue the loop to see if there are deeper redirects, but remember this as the latest
        continue
      } else {
        break
      }
    } catch {
      break
    }
  }
  return current === affiliateUrl ? null : current
}

async function resolveMerchantByFollow(affiliateUrl) {
  try {
    // Try to fully follow the chain and rely on Response.url to expose the final URL.
    // Avoid reading the body to minimize overhead.
    const res = await fetch(affiliateUrl, { method: "GET", redirect: "follow" })
    // If fetch succeeded, res.url should be the final landing URL after redirects.
    // Some networks may still mask this, but this works in many cases.
    if (res && typeof res.url === "string" && res.url.startsWith("http")) {
      return res.url
    }
  } catch (e) {
    // Swallow errors; we'll fallback below.
  }
  return null
}