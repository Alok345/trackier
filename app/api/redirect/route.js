import { firestore } from "@/lib/firestore";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";

// Note: chain tracking disabled for simple redirect flow

export async function GET(req) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  console.log('🔍 Starting redirect process...');

  try {
    // Extract parameters
    const campaignIdParam = sp.get("campaign_id");
    const affiliateIdParam = sp.get("affiliate_id");
    const publisherIdParam = sp.get("pub_id");
    const sourceParam = sp.get("source");
    const encodedUrl = sp.get("url");

    // Validate required parameters
    if (!affiliateIdParam || !encodedUrl) {
      return new Response(JSON.stringify({ 
        error: "Missing required parameters: affiliate_id and url are required" 
      }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Decode the URL
    let previewUrl;
    try {
      previewUrl = decodeURIComponent(encodedUrl);
      console.log('🔍 Decoded preview URL:', previewUrl);
    } catch (decodeError) {
      console.error('❌ URL decoding failed:', decodeError);
      return new Response(JSON.stringify({ error: "Invalid URL encoding" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Create a simple tracking id (no runtime clickId generation)
    const trackingId = `${sp.get("campaign_id") || 'unknown'}_${Date.now()}`;
    console.log('🆔 Generated trackingId:', trackingId);

    // Resolve full redirect chain server-side to the true destination
    const chainResult = await followRedirectionChain(previewUrl);
    const finalRedirectUrl = chainResult.finalUrl || buildRedirectUrl(previewUrl);
    console.log('🔗 Redirect chain count:', chainResult.redirectCount);
    console.log('🔍 Redirect chain:');
    (chainResult.redirectChain || []).forEach((u, i) => console.log(`${i + 1}. ${u}`));
    console.log('🎯 Final redirect URL (resolved):', finalRedirectUrl);

    // Store tracking data (fire and forget)
    storeTrackingData({
      trackingId,
      affiliateId: affiliateIdParam,
      campaignId: campaignIdParam,
      publisherId: publisherIdParam,
      source: sourceParam,
      previewUrl: previewUrl,
      finalRedirectUrl: finalRedirectUrl,
      redirectChain: chainResult.redirectChain,
      redirectCount: chainResult.redirectCount,
      originalParams: Object.fromEntries(sp.entries())
    }).catch(error => {
      console.error('❌ Tracking storage failed:', error);
    });

    // Also persist final destination URL parameters immediately for reliability
    try {
      const paramsObj = {};
      const parsedFinal = new URL(finalRedirectUrl);
      parsedFinal.searchParams.forEach((v, k) => { paramsObj[k] = v });
      await storeFinalAtRedirect({
        affiliateId: affiliateIdParam,
        trackingId,
        finalUrl: finalRedirectUrl,
        parameters: paramsObj,
        linkType: 'redirect_open',
        campaignData: {
          campaign_id: campaignIdParam,
          publisher_id: publisherIdParam,
          source: sourceParam
        }
      });
    } catch (e) {
      console.warn('⚠️ Could not persist final destination params at redirect time:', e?.message || e);
    }

    // Simple redirect to the decoded target URL
    console.log('🔄 Redirecting to:', finalRedirectUrl);
    return Response.redirect(finalRedirectUrl, 302);

  } catch (error) {
    console.error('🚨 Critical error in redirect API:', error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      message: error.message 
    }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

function buildRedirectUrl(previewUrl) {
  try {
    // Simply return the original previewUrl without any modifications
    console.log('🔧 Using original URL without modifications');
    return previewUrl;

  } catch (error) {
    console.error('❌ Error building redirect URL:', error);
    throw error;
  }
}

async function followRedirectionChain(url, maxRedirects = 10) {
  let currentUrl = url;
  let redirectCount = 0;
  const redirectChain = [url];

  while (redirectCount < maxRedirects) {
    try {
      // Attempt 1: HEAD manual
      const headRes = await fetch(currentUrl, { method: 'HEAD', redirect: 'manual' });
      if (headRes.status >= 300 && headRes.status < 400) {
        const loc = headRes.headers.get('location');
        if (loc) {
          const nextUrl = new URL(loc, currentUrl).toString();
          currentUrl = nextUrl;
          redirectChain.push(nextUrl);
          redirectCount++;
          continue;
        }
      }

      // Attempt 2: GET manual
      const getRes = await fetch(currentUrl, { method: 'GET', redirect: 'manual' });
      if (getRes.status >= 300 && getRes.status < 400) {
        const loc2 = getRes.headers.get('location');
        if (loc2) {
          const nextUrl = new URL(loc2, currentUrl).toString();
          currentUrl = nextUrl;
          redirectChain.push(nextUrl);
          redirectCount++;
          continue;
        }
      }

      // Attempt 3: 200 with meta refresh in body
      if (getRes.status >= 200 && getRes.status < 300) {
        try {
          const html = await getRes.text();
          const metaMatch = html.match(/<meta[^>]*http-equiv=["']?refresh["']?[^>]*>/i);
          if (metaMatch) {
            const contentMatch = metaMatch[0].match(/content=["']?\s*\d+\s*;\s*url=([^"'>\s]+)/i);
            if (contentMatch && contentMatch[1]) {
              const decoded = contentMatch[1].replace(/&amp;/g, '&');
              const nextUrl = new URL(decoded, currentUrl).toString();
              currentUrl = nextUrl;
              redirectChain.push(nextUrl);
              redirectCount++;
              continue;
            }
          }
        } catch (_) { /* ignore */ }
      }
      // No redirect signals; stop
      break;
    } catch (_) {
      break;
    }
  }

  return { finalUrl: currentUrl, redirectChain, redirectCount };
}

async function storeTrackingData(data) {
  try {
    const { trackingId, affiliateId, originalParams, finalRedirectUrl, previewUrl, redirectChain } = data;

    // Store in affiliateLinks collection
    const affiliateLinkRef = doc(firestore, "affiliateLinks", trackingId);
    await setDoc(affiliateLinkRef, {
      trackingId,
      affiliateId,
      campaignId: data.campaignId || null,
      publisherId: data.publisherId || null,
      source: data.source || null,
      previewUrl: previewUrl,
      finalRedirectUrl: finalRedirectUrl,
      redirectChain: redirectChain || null,
      redirectCount: Array.isArray(redirectChain) ? redirectChain.length - 1 : null,
      originalParams: originalParams,
      status: "redirected",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Store in extractUrl collection
    const extractUrlRef = doc(firestore, "extractUrl", affiliateId);
    const extractUrlSnap = await getDoc(extractUrlRef);

    const extractionData = {
      affiliateId: affiliateId,
      trackingId: trackingId,
      finalUrl: finalRedirectUrl,
      extractedAt: new Date().toISOString(),
      parameters: originalParams,
      clientInfo: {
        extractedAt: new Date().toISOString()
      }
    };

    if (extractUrlSnap.exists()) {
      await updateDoc(extractUrlRef, {
        extractionHistory: arrayUnion(extractionData),
        totalExtractions: (extractUrlSnap.data().totalExtractions || 0) + 1,
        lastExtractedAt: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(extractUrlRef, {
        affiliateId: affiliateId,
        extractionHistory: [extractionData],
        totalExtractions: 1,
        firstExtractedAt: new Date().toISOString(),
        lastExtractedAt: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    console.log('✅ Tracking data stored successfully');

  } catch (error) {
    console.error('❌ Error storing tracking data:', error);
    throw error;
  }
}

async function storeFinalAtRedirect({ affiliateId, trackingId, finalUrl, parameters, linkType, campaignData }) {
  const finalDocRef = doc(firestore, "previewUrlTracking", affiliateId);
  const finalDocSnap = await getDoc(finalDocRef);
  // Build extractedParams with common fields broken out + all_parameters
  const extractedParams = {
    utm_source: parameters?.utm_source || '',
    utm_medium: parameters?.utm_medium || '',
    utm_campaign: parameters?.utm_campaign || '',
    utm_term: parameters?.utm_term || '',
    utm_content: parameters?.utm_content || '',
    clickref: parameters?.clickref || '',
    partner_id: parameters?.partner_id || '',
    sub_id: parameters?.sub_id || '',
    affiliate_id: parameters?.affiliate_id || '',
    campaign_id: parameters?.campaign_id || '',
    pub_id: parameters?.pub_id || parameters?.publisher_id || '',
    source: parameters?.source || '',
    advertiser_id: parameters?.advertiser_id || '',
    domain_url: parameters?.domain_url || '',
    all_parameters: parameters || {}
  };
  const trackingData = {
    trackingId,
    finalUrl,
    parameters,
    extractedParams,
    timestamp: new Date().toISOString(),
    trackedAt: new Date().toISOString(),
    linkType: linkType || 'redirect_open',
    campaignData: campaignData || null,
    parameterCount: Object.keys(parameters || {}).length,
    domain: (() => { try { return new URL(finalUrl).hostname } catch { return null } })(),
    browsingCompleted: true
  };

  if (finalDocSnap.exists()) {
    await updateDoc(finalDocRef, {
      trackingData: arrayUnion(trackingData),
      totalTrackings: (finalDocSnap.data().totalTrackings || 0) + 1,
      lastTracking: new Date().toISOString(),
      updatedAt: serverTimestamp()
    });
  } else {
    await setDoc(finalDocRef, {
      affiliateId,
      trackingData: [trackingData],
      totalTrackings: 1,
      firstTracking: new Date().toISOString(),
      lastTracking: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}