import { NextResponse } from 'next/server';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/lib/firestore";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const affiliateId = searchParams.get('affiliate_id');
    const clickId = searchParams.get('click_id');
    const currentUrl = searchParams.get('current_url');

    console.log('🎯 Tracking final URL from client:', currentUrl);

    if (!affiliateId || !clickId || !currentUrl) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Extract parameters from current URL
    const urlObj = new URL(currentUrl);
    const params = {};
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    console.log('📊 Extracted parameters:', params);
    console.log('🔍 Clickref value:', params.clickref);

    // Store the final URL with actual clickref
    await storeFinalClickref(affiliateId, clickId, currentUrl, params);

    return new Response(JSON.stringify({ 
      success: true,
      clickref: params.clickref 
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('Error tracking final URL:', error);
    return new Response(JSON.stringify({ error: 'Tracking failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}

async function storeFinalClickref(affiliateId, clickId, finalUrl, params) {
  try {
    const finalDocRef = doc(firestore, "finalClickrefData", affiliateId);
    const finalDocSnap = await getDoc(finalDocRef);

    const finalData = {
      clickId: clickId,
      finalUrl: finalUrl,
      parameters: params,
      clickref: params.clickref || '',
      trackedAt: new Date().toISOString(),
      hasClickref: !!params.clickref,
      clickrefValue: params.clickref || 'empty'
    };

    if (finalDocSnap.exists()) {
      await updateDoc(finalDocRef, {
        trackingData: arrayUnion(finalData),
        totalTrackings: (finalDocSnap.data().totalTrackings || 0) + 1,
        lastTracking: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(finalDocRef, {
        affiliateId: affiliateId,
        trackingData: [finalData],
        totalTrackings: 1,
        firstTracking: new Date().toISOString(),
        lastTracking: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    console.log('✅ Final clickref data stored:', params.clickref);

  } catch (error) {
    console.error('❌ Error storing final clickref data:', error);
    throw error;
  }
}