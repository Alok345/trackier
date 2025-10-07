import { NextResponse } from 'next/server';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/lib/firestore";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const affiliateId = searchParams.get('affiliate_id');
    const clickId = searchParams.get('click_id');
    const finalUrl = searchParams.get('final_url');
    const referrer = request.headers.get('referer') || 'direct';
    
    console.log('📸 Tracking pixel hit - Final URL:', finalUrl);

    if (affiliateId && clickId && finalUrl) {
      await storeFinalUrlWithClickref(affiliateId, clickId, finalUrl, referrer);
    }

    // Return a 1x1 transparent pixel
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    
    return new Response(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Tracking pixel error:', error);
    
    // Still return a pixel even on error
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    return new Response(pixel, {
      status: 200,
      headers: { 'Content-Type': 'image/gif' }
    });
  }
}

async function storeFinalUrlWithClickref(affiliateId, clickId, finalUrl, referrer) {
  try {
    // Parse the final URL to extract parameters
    const urlObj = new URL(finalUrl);
    const params = {};
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    console.log('🎯 Storing final URL with clickref:', params.clickref);

    // Store in finalUrlsWithClickref collection
    const finalDocRef = doc(firestore, "finalUrlsWithClickref", affiliateId);
    const finalDocSnap = await getDoc(finalDocRef);

    const finalData = {
      clickId: clickId,
      finalUrl: finalUrl,
      parameters: params,
      clickref: params.clickref || '',
      trackedAt: new Date().toISOString(),
      referrer: referrer,
      hasClickref: !!params.clickref
    };

    if (finalDocSnap.exists()) {
      await updateDoc(finalDocRef, {
        finalUrls: arrayUnion(finalData),
        totalFinalUrls: (finalDocSnap.data().totalFinalUrls || 0) + 1,
        lastFinalUrl: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(finalDocRef, {
        affiliateId: affiliateId,
        finalUrls: [finalData],
        totalFinalUrls: 1,
        firstFinalUrl: new Date().toISOString(),
        lastFinalUrl: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    console.log('✅ Final URL with clickref stored successfully');

  } catch (error) {
    console.error('❌ Error storing final URL with clickref:', error);
    throw error;
  }
}