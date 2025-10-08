import { firestore } from "@/lib/firestore";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { generateClickId } from "@/lib/affiliateUtils";

// Chain tracking function - moved outside main function
async function initiateChainTracking(affiliateId, clickId, startUrl, campaignId, publisherId) {
  try {
    const trackUrl = new URL(`${process.env.NEXTAUTH_URL || 'https://sgs-tracker.vercel.app'}/api/track-chain`);
    
    trackUrl.searchParams.set('start_url', startUrl);
    trackUrl.searchParams.set('click_id', clickId);
    trackUrl.searchParams.set('affiliate_id', affiliateId);
    trackUrl.searchParams.set('campaign_id', campaignId || '');
    trackUrl.searchParams.set('pub_id', publisherId || '');
    
    console.log('🚀 Initiating chain tracking:', trackUrl.toString());
    
    return trackUrl.toString();
    
  } catch (error) {
    console.error('Error initiating chain tracking:', error);
    return startUrl; // Fallback to original URL
  }
}

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

    // Generate click ID
    const clickId = generateClickId();
    console.log('🆔 Generated clickId:', clickId);

    // Build the final redirect URL - NO REPLACEMENTS, just pass through
    let finalRedirectUrl;
    try {
      finalRedirectUrl = buildRedirectUrl(previewUrl, clickId, {
        campaignId: campaignIdParam,
        affiliateId: affiliateIdParam,
        publisherId: publisherIdParam,
        source: sourceParam,
      });
      console.log('🎯 Final redirect URL:', finalRedirectUrl);
    } catch (urlError) {
      console.error('❌ URL building failed:', urlError);
      return new Response(JSON.stringify({ error: "Failed to build redirect URL" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    // Store tracking data (fire and forget)
    storeTrackingData({
      clickId,
      affiliateId: affiliateIdParam,
      campaignId: campaignIdParam,
      publisherId: publisherIdParam,
      source: sourceParam,
      previewUrl: previewUrl,
      finalRedirectUrl: finalRedirectUrl,
      originalParams: Object.fromEntries(sp.entries())
    }).catch(error => {
      console.error('❌ Tracking storage failed:', error);
    });

    // 🔥 Use chain tracking instead of direct redirect
    const trackingUrl = await initiateChainTracking(
      affiliateIdParam, 
      clickId, 
      finalRedirectUrl, 
      campaignIdParam, 
      publisherIdParam
    );

    console.log('🔄 Redirecting through chain tracker:', trackingUrl);
    return Response.redirect(trackingUrl, 302);

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

function buildRedirectUrl(previewUrl, clickId, trackingParams) {
  try {
    // Simply return the original previewUrl without any modifications
    console.log('🔧 Using original URL without modifications');
    return previewUrl;

  } catch (error) {
    console.error('❌ Error building redirect URL:', error);
    throw error;
  }
}

async function storeTrackingData(data) {
  try {
    const { clickId, affiliateId, originalParams, finalRedirectUrl, previewUrl } = data;

    // Store in affiliateLinks collection
    const affiliateLinkRef = doc(firestore, "affiliateLinks", clickId);
    await setDoc(affiliateLinkRef, {
      clickId,
      affiliateId,
      campaignId: data.campaignId || null,
      publisherId: data.publisherId || null,
      source: data.source || null,
      previewUrl: previewUrl,
      finalRedirectUrl: finalRedirectUrl,
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
      clickId: clickId,
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