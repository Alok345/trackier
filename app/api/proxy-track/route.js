import { NextResponse } from 'next/server';
import { doc, setDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/lib/firestore";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startUrl = searchParams.get('url');
    const affiliateId = searchParams.get('affiliate_id');
    const clickId = searchParams.get('click_id');

    if (!startUrl || !affiliateId) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
    }

    // Follow redirects and capture final URL
    const finalUrl = await followRedirects(startUrl);
    
    // Extract parameters from final URL
    const finalUrlObj = new URL(finalUrl);
    const finalParams = {};
    finalUrlObj.searchParams.forEach((value, key) => {
      finalParams[key] = value;
    });

    // Store final URL data
    await storeFinalUrlAnalysis(affiliateId, clickId, finalUrl, finalParams);

    // Redirect to final URL
    return NextResponse.redirect(finalUrl);

  } catch (error) {
    console.error('Proxy track error:', error);
    return new Response(JSON.stringify({ error: 'Tracking failed' }), { status: 500 });
  }
}

async function followRedirects(url, maxRedirects = 5) {
  let currentUrl = url;
  
  for (let i = 0; i < maxRedirects; i++) {
    try {
      const response = await fetch(currentUrl, { 
        method: 'HEAD',
        redirect: 'manual'
      });
      
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (location) {
          currentUrl = new URL(location, currentUrl).toString();
          continue;
        }
      }
      
      // No more redirects
      return currentUrl;
    } catch (error) {
      console.error('Error following redirect:', error);
      return currentUrl;
    }
  }
  
  return currentUrl;
}

async function storeFinalUrlAnalysis(affiliateId, clickId, finalUrl, finalParams) {
  try {
    const analysisDocRef = doc(firestore, "urlAnalysis", affiliateId);
    
    const analysisData = {
      clickId,
      finalUrl,
      parameters: finalParams,
      analyzedAt: new Date().toISOString(),
      utmParams: {
        source: finalParams.utm_source,
        medium: finalParams.utm_medium,
        campaign: finalParams.utm_campaign,
        term: finalParams.utm_term,
        content: finalParams.utm_content
      },
      clickRef: finalParams.clickref,
      hasPartnerize: finalParams.utm_source === 'partnerize'
    };

    await setDoc(analysisDocRef, {
      affiliateId,
      analyses: arrayUnion(analysisData),
      lastAnalysis: new Date().toISOString()
    }, { merge: true });

    console.log('✅ Final URL analysis stored:', finalUrl);
    
  } catch (error) {
    console.error('Error storing URL analysis:', error);
  }
}