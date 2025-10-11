import { NextResponse } from "next/server";
import { firestore } from "@/lib/firestore";
import {
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  collection,
} from "firebase/firestore";

// ------------------- VISUAL TRAVERSAL -------------------
async function traverseUrl(startUrl, maxRedirects = 10, delayMs = 500) {
  let currentUrl = startUrl;
  let redirectCount = 0;
  const visitedUrls = new Set([startUrl]);
  const chain = [
    {
      url: startUrl,
      timestamp: new Date().toISOString(),
      status: "initial",
      redirectNumber: 0,
      stepId: `step_0_${Date.now()}`,
    },
  ];

  while (redirectCount < maxRedirects) {
    try {
      let finalUrl = currentUrl;
      let locationHeader = null;
      let metaRefreshUrl = null;
      let responseStatus = null;
      let contentType = null;
      let headers = {};
      let responseTime = null;

      // Try HEAD request first
      try {
        const startTime = Date.now();
        const headRes = await fetch(currentUrl, {
          method: "HEAD",
          redirect: "manual",
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        responseTime = Date.now() - startTime;
        responseStatus = headRes.status;
        contentType = headRes.headers.get("content-type");
        locationHeader = headRes.headers.get("location");

        headRes.headers.forEach((v, k) => {
          headers[k] = v;
        });

        if (locationHeader && responseStatus >= 300 && responseStatus < 400) {
          finalUrl = new URL(locationHeader, currentUrl).toString();
        }
      } catch {}

      // GET request fallback if no Location header
      if (!locationHeader || !(responseStatus >= 300 && responseStatus < 400)) {
        try {
          const startTime = Date.now();
          const getRes = await fetch(currentUrl, {
            method: "GET",
            redirect: "manual",
            headers: { "User-Agent": "Mozilla/5.0" },
          });
          responseTime = Date.now() - startTime;
          responseStatus = getRes.status;
          contentType = getRes.headers.get("content-type");
          locationHeader = getRes.headers.get("location");

          getRes.headers.forEach((v, k) => {
            headers[k] = v;
          });

          if (locationHeader && responseStatus >= 300 && responseStatus < 400) {
            finalUrl = new URL(locationHeader, currentUrl).toString();
          } else if (
            responseStatus === 200 &&
            contentType &&
            contentType.includes("text/html")
          ) {
            const html = await getRes.text();
            metaRefreshUrl = extractMetaRefresh(html, currentUrl);
            if (metaRefreshUrl) finalUrl = metaRefreshUrl;
          }
        } catch {}
      }

      if (finalUrl !== currentUrl && !visitedUrls.has(finalUrl)) {
        redirectCount++;
        visitedUrls.add(finalUrl);

        const step = {
          url: finalUrl,
          timestamp: new Date().toISOString(),
          status: "redirected",
          redirectNumber: redirectCount,
          redirectType: locationHeader
            ? "http_redirect"
            : metaRefreshUrl
            ? "meta_refresh"
            : "unknown",
          responseStatus,
          contentType,
          responseTime,
          headers,
          previousUrl: currentUrl,
          delay: delayMs,
          stepId: `step_${redirectCount}_${Date.now()}`,
        };

        chain.push(step);
        currentUrl = finalUrl;
      } else {
        break; // no more redirects
      }
    } catch {
      break;
    }
  }

  return { finalUrl: currentUrl, chain, totalRedirects: redirectCount };
}

// ------------------- META REFRESH PARSER -------------------
function extractMetaRefresh(html, baseUrl) {
  const metaTags = html.match(/<meta[^>]*http-equiv=["']?refresh["']?[^>]*>/gi);
  if (!metaTags) return null;
  for (const tag of metaTags) {
    const match = tag.match(/content=["']?\s*\d+\s*;\s*url=([^"'>\s]+)/i);
    if (match && match[1]) {
      const url = decodeURIComponent(match[1].replace(/&amp;/g, "&"));
      return new URL(url, baseUrl).toString();
    }
  }
  return null;
}

// ------------------- FIRESTORE STORAGE -------------------
async function storeStep(trackingId, step, stepNumber) {
  try {
    const stepRef = doc(collection(firestore, "visualTraversal", trackingId, "steps"));
    await setDoc(stepRef, { ...step, trackingId, stepNumber, storedAt: serverTimestamp() });
  } catch (e) {
    console.error("Error storing step:", e);
  }
}

async function storeTraversalData(trackingId, data) {
  try {
    const traversalRef = doc(firestore, "visualTraversal", trackingId);
    await setDoc(traversalRef, { ...data, createdAt: serverTimestamp() });
  } catch (e) {
    console.error("Error storing traversal:", e);
  }
}

// ------------------- ROUTE HANDLER -------------------
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startUrl = searchParams.get("url");
    const affiliateId = searchParams.get("affiliate_id");
    const clickId = searchParams.get("click_id");
    const mode = searchParams.get("mode");

    if (!startUrl || !affiliateId) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400 });
    }

    const trackingId = `${affiliateId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Traverse redirects
    const traversal = await traverseUrl(startUrl);

    // Store each step
    for (let i = 0; i < traversal.chain.length; i++) {
      await storeStep(trackingId, traversal.chain[i], i);
    }

    // Store overall traversal
    await storeTraversalData(trackingId, {
      trackingId,
      affiliateId,
      clickId,
      startUrl,
      finalUrl: traversal.finalUrl,
      totalRedirects: traversal.totalRedirects,
      redirectChain: traversal.chain,
      status: "completed",
    });

    // JSON response mode
    if (mode === "json") {
      return new Response(JSON.stringify({
        trackingId,
        affiliateId,
        startUrl,
        finalUrl: traversal.finalUrl,
        totalRedirects: traversal.totalRedirects,
        redirectChain: traversal.chain,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Default redirect
    return NextResponse.redirect(traversal.finalUrl);

  } catch (error) {
    console.error("Proxy track error:", error);
    return new Response(JSON.stringify({ error: "Tracking failed", message: error.message }), { status: 500 });
  }
}
