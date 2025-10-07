import { NextResponse } from 'next/server';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/lib/firestore";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const startUrl = searchParams.get('start_url');
    const clickId = searchParams.get('click_id');
    const affiliateId = searchParams.get('affiliate_id');
    const campaignId = searchParams.get('campaign_id');
    const publisherId = searchParams.get('pub_id');

    console.log('🔗 Starting redirect chain tracking for:', startUrl);

    if (!startUrl || !clickId || !affiliateId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Follow the entire redirect chain
    const redirectChain = await followRedirectChain(startUrl);
    
    // Store the complete chain data
    await storeRedirectChain(affiliateId, clickId, redirectChain, {
      campaignId,
      publisherId,
      startUrl
    });

    console.log('✅ Redirect chain tracked successfully');
    console.log('📊 Chain length:', redirectChain.length);

    const finalUrl = redirectChain[redirectChain.length - 1]?.url || startUrl;
    console.log('🎯 Final URL:', finalUrl);

    // Create tracking pixel URL
    const pixelUrl = new URL('/api/tracking-pixel', request.nextUrl.origin);
    pixelUrl.searchParams.set('affiliate_id', affiliateId);
    pixelUrl.searchParams.set('click_id', clickId);
    pixelUrl.searchParams.set('final_url', finalUrl);
    pixelUrl.searchParams.set('campaign_id', campaignId || '');
    pixelUrl.searchParams.set('pub_id', publisherId || '');

    // Return HTML page with immediate redirect and tracking pixel
   // Return HTML page that redirects and tracks from the final page
const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Redirecting...</title>
</head>
<body>
    <script>
        // Redirect immediately to final URL
        window.location.href = "${finalUrl}";
    </script>
    
    <noscript>
        <p>Redirecting to <a href="${finalUrl}">destination</a>...</p>
    </noscript>
</body>
</html>`;

return new Response(html, {
  status: 200,
  headers: {
    'Content-Type': 'text/html',
  },
});

  } catch (error) {
    console.error('Error in redirect chain tracking:', error);
    // Fallback to original URL
    const startUrl = new URL(request.url).searchParams.get('start_url');
    if (startUrl) {
      return NextResponse.redirect(startUrl);
    }
    return new Response(JSON.stringify({ error: 'Chain tracking failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}

async function followRedirectChain(startUrl, maxRedirects = 10) {
  const chain = [];
  let currentUrl = startUrl;
  let redirectCount = 0;

  while (redirectCount < maxRedirects) {
    try {
      console.log(`🔄 Following redirect ${redirectCount + 1}:`, currentUrl);
      
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const chainEntry = {
        step: redirectCount + 1,
        url: currentUrl,
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString()
      };

      // Extract parameters from current URL
      try {
        const urlObj = new URL(currentUrl);
        const params = {};
        urlObj.searchParams.forEach((value, key) => {
          params[key] = value;
        });
        chainEntry.parameters = params;
        chainEntry.baseUrl = urlObj.origin + urlObj.pathname;
      } catch (e) {
        chainEntry.parameters = {};
        chainEntry.baseUrl = currentUrl;
      }

      chain.push(chainEntry);

      // Check if redirect
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (location) {
          // Handle relative URLs
          currentUrl = new URL(location, currentUrl).toString();
          redirectCount++;
          continue;
        }
      }

      // No more redirects
      break;

    } catch (error) {
      console.error(`❌ Error following redirect ${redirectCount + 1}:`, error);
      chain.push({
        step: redirectCount + 1,
        url: currentUrl,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      break;
    }
  }

  return chain;
}

async function storeRedirectChain(affiliateId, clickId, redirectChain, metadata) {
  try {
    const chainDocRef = doc(firestore, "redirectChains", affiliateId);
    const chainDocSnap = await getDoc(chainDocRef);

    const finalUrl = redirectChain[redirectChain.length - 1]?.url;
    const finalParams = redirectChain[redirectChain.length - 1]?.parameters || {};

    const chainData = {
      clickId: clickId,
      startUrl: metadata.startUrl,
      finalUrl: finalUrl,
      redirectCount: redirectChain.length,
      chain: redirectChain,
      trackedAt: new Date().toISOString(),
      finalUrlParameters: finalParams,
      metadata: {
        campaignId: metadata.campaignId,
        publisherId: metadata.publisherId,
        hasFinalUrl: !!finalUrl,
        finalUrlBase: finalParams._baseUrl || '',
        parameterCount: Object.keys(finalParams).length
      }
    };

    if (chainDocSnap.exists()) {
      await updateDoc(chainDocRef, {
        chains: arrayUnion(chainData),
        totalChains: (chainDocSnap.data().totalChains || 0) + 1,
        lastChainTracked: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(chainDocRef, {
        affiliateId: affiliateId,
        chains: [chainData],
        totalChains: 1,
        firstChainTracked: new Date().toISOString(),
        lastChainTracked: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    console.log('✅ Redirect chain stored successfully');

  } catch (error) {
    console.error('❌ Error storing redirect chain:', error);
    throw error;
  }
}