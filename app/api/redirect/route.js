import { firestore } from "@/lib/firestore";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { generateClickId } from "@/lib/affiliateUtils";

export async function GET(req) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  // Optional identifiers coming from the generated link (no final URL or click_id required)
  const campaignIdParam = sp.get("campaign_id");
  const affiliateIdParam = sp.get("affiliate_id");
  const publisherIdParam = sp.get("pub_id") || sp.get("publisher_id");
  const sourceParam = sp.get("source");
  const domainParam = sp.get("domain") || sp.get("url");
  const advertiserIdParam = sp.get("advertiser_id");
  const maybeRedirectUrl = sp.get("redirect_url");

  // Resolve the preview URL without exposing it in the generated link
  // Priority:
  // 1) If redirect_url is provided, use it (backward-compat),
  // 2) Else try to fetch by campaign_id from Firestore collection "campaigns/{campaign_id}" (doc id),
  //    if not found, query campaigns where field campaignId == campaign_id,
  // 3) Else fail with 400.
  let previewUrl = null;
  let resolvedFrom = "";

  if (maybeRedirectUrl) {
    previewUrl = decodeURIComponent(maybeRedirectUrl);
    resolvedFrom = "query_param";
  } else if (campaignIdParam) {
    try {
      // First try campaigns/{campaign_id} by document id
      const campaignDocRef = doc(firestore, "campaigns", campaignIdParam);
      const campaignDocSnap = await getDoc(campaignDocRef);
      if (campaignDocSnap.exists()) {
        const campaignData = campaignDocSnap.data();
        previewUrl = campaignData.previewUrl || null;
        resolvedFrom = "campaigns_docId";
      } else {
        // Fallback: query campaigns where field campaignId == campaign_id
        const q = query(
          collection(firestore, "campaigns"),
          where("campaignId", "==", campaignIdParam)
        );
        const qs = await getDocs(q);
        if (!qs.empty) {
          const matched = qs.docs[0].data();
          previewUrl = matched.previewUrl || null;
          resolvedFrom = "campaigns_field_campaignId";
        }
      }
    } catch (e) {
      console.error("[API] Failed to load campaignLinks doc:", e);
    }
  }

  if (!previewUrl) {
    return new Response(JSON.stringify({ error: "Preview URL not found" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // Gather client info
  let ip = req.headers.get("x-forwarded-for") || "unknown";
  if (ip.includes(",")) ip = ip.split(",")[0].trim();
  const userAgent = req.headers.get("user-agent") || "unknown";
  const host = req.headers.get("host") || "";
  const serverResolvedAt = new Date().toISOString();

  // Try to reuse existing clickId for same affiliate+campaign+IP (within 24h), else generate
  let clickId = null;
  // 1) Check cookie
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const cookieKey = `click_session_${affiliateIdParam || ""}_${
      campaignIdParam || ""
    }_${ip}`;
    const match = cookieHeader
      .split(";")
      .map((s) => s.trim())
      .find((c) => c.startsWith(`${cookieKey}=`));
    if (match) {
      const value = decodeURIComponent(match.split("=")[1] || "");
      const parsed = JSON.parse(value);
      if (parsed && parsed.clickId) {
        const within24h =
          Date.now() - (parsed.lastClick || 0) < 24 * 60 * 60 * 1000;
        if (within24h) {
          clickId = parsed.clickId;
        }
      }
    }
  } catch (e) {
    // noop
  }
  try {
    if (affiliateIdParam && campaignIdParam && ip && ip !== "unknown") {
      const sessionsRef = collection(firestore, "trackingSessions");
      const q = query(
        sessionsRef,
        where("affiliateId", "==", affiliateIdParam),
        where("campaignId", "==", campaignIdParam),
        where("ipAddress", "==", ip),
        orderBy("lastUpdatedAt", "desc"),
        limit(1)
      );
      const qs = await getDocs(q);
      if (!qs.empty) {
        const existing = qs.docs[0].data();
        // Optional: time-window check (24h)
        const lastUpdatedAt = new Date(
          existing.lastUpdatedAt || existing.createdAt || 0
        );
        const within24h =
          Date.now() - lastUpdatedAt.getTime() < 24 * 60 * 60 * 1000;
        if (within24h && existing.clickId) {
          clickId = existing.clickId;
        }
      }
    }
  } catch (e) {
    console.error("[API] Failed session reuse lookup:", e);
  }
  if (!clickId) {
    clickId = generateClickId();
  }

  try {
    // Build affiliateLinks record for this click
    const affiliateLinkRef = doc(firestore, "affiliateLinks", clickId);
    const affiliateLinkData = {
      clickId,
      previewUrl,
      campaignId: campaignIdParam || null,
      affiliateId: affiliateIdParam || null,
      publisherId: publisherIdParam || null,
      advertiserId: advertiserIdParam || null,
      source: sourceParam || null,
      domainUrl: domainParam || null,
      trackingDomain: host || null,
      status: "generated",
      resolvedFrom,
      ipAddress: ip,
      userAgent,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(affiliateLinkRef, affiliateLinkData);

    // Maintain per-affiliate document for aggregation
    if (affiliateIdParam) {
      const perAffiliateRef = doc(
        firestore,
        "affiliateClicks",
        affiliateIdParam
      );
      const perAffiliateSnap = await getDoc(perAffiliateRef);
     const clickEntry = {
  clickId,
  campaignId: campaignIdParam || null,
  publisherId: publisherIdParam || null,
  source: sourceParam || null,
  advertiserId: advertiserIdParam || null,
  ipAddress: ip,
  userAgent,
  previewUrl: finalUrlString, // ← CHANGED: Use the final URL instead of original
  timestamp: serverResolvedAt,
};
      if (perAffiliateSnap.exists()) {
        await updateDoc(perAffiliateRef, {
          clicks: arrayUnion(clickEntry),
          lastActivity: serverResolvedAt,
        });
      } else {
        await setDoc(perAffiliateRef, {
          affiliateId: affiliateIdParam,
          clicks: [clickEntry],
          createdAt: serverResolvedAt,
          lastActivity: serverResolvedAt,
        });
      }
    }

    // Also write a lightweight session log
    const sessionRef = doc(firestore, "trackingSessions", clickId);
    const sessionDoc = await getDoc(sessionRef);
    const sessionEntry = {
      timestamp: serverResolvedAt,
      type: "preview_redirect",
      url: previewUrl,
    };
    if (sessionDoc.exists()) {
      await updateDoc(sessionRef, {
        clickId,
        campaignId: campaignIdParam || null,
        affiliateId: affiliateIdParam || null,
        ipAddress: ip,
        previewUrl,
        lastUpdatedAt: serverResolvedAt,
        apiCalls: arrayUnion(sessionEntry),
      });
    } else {
      await setDoc(sessionRef, {
        clickId,
        campaignId: campaignIdParam || null,
        affiliateId: affiliateIdParam || null,
        ipAddress: ip,
        previewUrl,
        apiCalls: [sessionEntry],
        createdAt: serverResolvedAt,
        lastUpdatedAt: serverResolvedAt,
      });
    }
  } catch (e) {
    console.error("[API] Firestore logging failed:", e);
  }

  // Append database parameters to preview URL before redirect
 try {
  const finalPreview = new URL(previewUrl);
  // Remove duplicate/undesired params if present from incoming URL
  finalPreview.searchParams.delete("force_transparent");
  // Do NOT include click_id at top level; use ref_id as clickRef instead
  finalPreview.searchParams.delete("click_id");
  if (campaignIdParam)
    finalPreview.searchParams.set("campaign_id", campaignIdParam);
  if (affiliateIdParam)
    finalPreview.searchParams.set("affiliate_id", affiliateIdParam);
  if (publisherIdParam)
    finalPreview.searchParams.set("pub_id", publisherIdParam);
  if (sourceParam) finalPreview.searchParams.set("source", sourceParam);
  if (advertiserIdParam)
    finalPreview.searchParams.set("advertiser_id", advertiserIdParam);
  // Optional: include tracking domain
  if (host) finalPreview.searchParams.set("tracking_domain", host);

  // Replace placeholder tokens with runtime clickId
  // Example: ref_id={gclid} -> ref_id=clickId
  const refId = finalPreview.searchParams.get("ref_id");
  if (clickId) {
    const newRef = (refId || "{gclid}")
      .replace("{gclid}", clickId)
      .replace("{gclikcID}", clickId)
      .replace("{gclickid}", clickId);
    finalPreview.searchParams.set("ref_id", newRef);
  }

  // ✅ CRITICAL: Replace camref value in redirection_url parameter
  const redirectionRaw = finalPreview.searchParams.get("redirection_url");
  if (redirectionRaw && clickId) {
    try {
      console.log('[API] Original redirection_url:', redirectionRaw);
      
      // Decode the redirection_url (it's URL encoded)
      let decoded = decodeURIComponent(redirectionRaw);
      
      // Replace camref:1101l3MtY4 with camref:clickId
      const replaced = decoded.replace(/camref:([A-Za-z0-9]+)/g, `camref:${clickId}`);
      
      console.log('[API] Modified redirection_url:', replaced);
      
      // Re-encode and set back
      finalPreview.searchParams.set("redirection_url", encodeURIComponent(replaced));
    } catch (e) {
      console.error("[API] Failed to replace camref in redirection_url:", e);
    }
  }

    // Persist the fully-parameterized preview URL back to Firestore
    const finalUrlString = finalPreview.toString();
    try {
      // Update affiliateLinks doc with final URL
      await updateDoc(doc(firestore, "affiliateLinks", clickId), {
        finalPreviewUrl: finalUrlString,
        updatedAt: serverTimestamp(),
      });

      // Upsert in affiliateClicks: store the finalized URL on the latest entry
      if (affiliateIdParam) {
        const perAffiliateRef = doc(
          firestore,
          "affiliateClicks",
          affiliateIdParam
        );

        const perAffiliateSnap = await getDoc(perAffiliateRef);
        const clickEntry = {
          clickId,
          campaignId: campaignIdParam || null,
          publisherId: publisherIdParam || null,
          source: sourceParam || null,
          advertiserId: advertiserIdParam || null,
          ipAddress: ip,
          userAgent,
          previewUrl: finalUrlString,
          timestamp: serverResolvedAt,
        };
        if (perAffiliateSnap.exists()) {
          await updateDoc(perAffiliateRef, {
            clicks: arrayUnion(clickEntry),
            lastActivity: serverResolvedAt,
          });
        } else {
          await setDoc(perAffiliateRef, {
            affiliateId: affiliateIdParam,
            clicks: [clickEntry],
            createdAt: serverResolvedAt,
            lastActivity: serverResolvedAt,
          });
        }
      }

      // Update session log latest URL
      await updateDoc(doc(firestore, "trackingSessions", clickId), {
        previewUrl: finalUrlString,
        lastUpdatedAt: serverResolvedAt,
        apiCalls: arrayUnion({
          timestamp: serverResolvedAt,
          type: "final_preview",
          url: finalUrlString,
        }),
      });
    } catch (persistErr) {
      console.error("[API] Failed to persist final URL:", persistErr);
    }

    // Prepare cookie to help reuse on subsequent calls (24h)
    try {
      const cookieKey = `click_session_${affiliateIdParam || ""}_${
        campaignIdParam || ""
      }_${ip}`;
      const cookieVal = encodeURIComponent(
        JSON.stringify({ clickId, lastClick: Date.now() })
      );
      const cookie = `${cookieKey}=${cookieVal}; Max-Age=${
        24 * 60 * 60
      }; Path=/; SameSite=Lax`;
      const headers = new Headers({
        Location: finalUrlString,
        "Set-Cookie": cookie,
      });

      // Optional debug flag: logs in browser console before redirecting
      const debug = sp.get("debug");
      if (debug === "1" || debug === "true") {
        const payload = {
          previewUrl: finalUrlString,
          params: {
            click_id: clickId,
            campaign_id: campaignIdParam || null,
            affiliate_id: affiliateIdParam || null,
            pub_id: publisherIdParam || null,
            source: sourceParam || null,
            advertiser_id: advertiserIdParam || null,
            tracking_domain: host || null,
            ip: ip || null,
          },
          resolvedFrom,
        };
        const html = `<!doctype html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body><script>
          (function(){
            const data = ${JSON.stringify(payload)};
            console.log('Preview URL with DB params:', data.previewUrl);
            console.log('Params:', data.params);
            console.log('Resolved From:', data.resolvedFrom);
            setTimeout(function(){ window.location.href = data.previewUrl; }, 100);
          })();
        </script>
        <noscript>
          JavaScript is required. Continue to <a href="${finalUrlString}">destination</a>.
        </noscript></body></html>`;
        return new Response(html, { status: 200, headers });
      }

      return new Response(null, { status: 302, headers });
    } catch {
      // fallback normal redirect
    }

    // Optional debug flag: logs in browser console before redirecting
    const debug = sp.get("debug");
    if (debug === "1" || debug === "true") {
      const payload = {
        previewUrl: finalPreview.toString(),
        params: {
          click_id: clickId,
          campaign_id: campaignIdParam || null,
          affiliate_id: affiliateIdParam || null,
          pub_id: publisherIdParam || null,
          source: sourceParam || null,
          advertiser_id: advertiserIdParam || null,
          tracking_domain: host || null,
          ip: ip || null,
        },
        resolvedFrom,
      };
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body><script>
        (function(){
          const data = ${JSON.stringify(payload)};
          console.log('Preview URL with DB params:', data.previewUrl);
          console.log('Params:', data.params);
          console.log('Resolved From:', data.resolvedFrom);
          setTimeout(function(){ window.location.href = data.previewUrl; }, 100);
        })();
      </script>
      <noscript>
        JavaScript is required. Continue to <a href="${finalPreview.toString()}">destination</a>.
      </noscript></body></html>`;
      return new Response(html, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    return Response.redirect(finalUrlString, 302);
  } catch (e) {
    console.error("[API] Failed to build final preview URL, falling back:", e);
    return Response.redirect(previewUrl, 302);
  }
}
