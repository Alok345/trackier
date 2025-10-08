import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/lib/firestore";

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      affiliate_id, 
      redirection_url, 
      campaign_id, 
      publisher_id, 
      source, 
      advertiser_id, 
      domain_url 
    } = body;

    console.log('🔗 Tracking redirection chain:', redirection_url);

    if (!affiliate_id || !redirection_url) {
      return new Response(JSON.stringify({ error: 'Missing required parameters: affiliate_id and redirection_url are required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    const chainResult = await followRedirectionChain(redirection_url);

    await storeRedirectionChainData(affiliate_id, redirection_url, chainResult, {
      campaign_id,
      publisher_id,
      source,
      advertiser_id,
      domain_url
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Redirection chain tracked successfully',
      redirection_url: redirection_url,
      final_url: chainResult.finalUrl,
      redirect_chain: chainResult.redirectChain,
      redirect_count: chainResult.redirectCount
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('Error tracking redirection chain:', error);
    return new Response(JSON.stringify({ error: 'Redirection chain tracking failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}

async function followRedirectionChain(url, maxRedirects = 10) {
  let currentUrl = url;
  let redirectCount = 0;
  const redirectChain = [url];

  console.log('🔄 Starting redirection chain for:', url);

  while (redirectCount < maxRedirects) {
    try {
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (location) {
          const nextUrl = new URL(location, currentUrl).toString();
          currentUrl = nextUrl;
          redirectChain.push(nextUrl);
          redirectCount++;
          console.log(`🔄 Redirect ${redirectCount}: ${nextUrl}`);
          continue;
        }
      }

      console.log('✅ Redirection chain completed. Final URL:', currentUrl);
      break;

    } catch (error) {
      console.error('❌ Error following redirection chain:', error);
      break;
    }
  }

  return {
    finalUrl: currentUrl,
    redirectChain: redirectChain,
    redirectCount: redirectCount
  };
}

async function storeRedirectionChainData(affiliateId, redirectionUrl, chainResult, campaignData) {
  try {
    const redirectionDocRef = doc(firestore, "redirectionChain", affiliateId);
    const redirectionDocSnap = await getDoc(redirectionDocRef);

    const chainData = {
      redirectionUrl: redirectionUrl,
      finalUrl: chainResult.finalUrl,
      redirectChain: chainResult.redirectChain,
      redirectCount: chainResult.redirectCount,
      campaignData: campaignData,
      timestamp: new Date().toISOString(),
      trackedAt: new Date().toISOString(),
      status: 'completed'
    };

    if (redirectionDocSnap.exists()) {
      await updateDoc(redirectionDocRef, {
        chains: arrayUnion(chainData),
        totalChains: (redirectionDocSnap.data().totalChains || 0) + 1,
        lastTrackedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(redirectionDocRef, {
        affiliateId: affiliateId,
        chains: [chainData],
        totalChains: 1,
        firstTrackedAt: serverTimestamp(),
        lastTrackedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    console.log('✅ Redirection chain data stored:', {
      redirectionUrl,
      finalUrl: chainResult.finalUrl,
      redirectCount: chainResult.redirectCount
    });

  } catch (error) {
    console.error('❌ Error storing redirection chain data:', error);
    throw error;
  }
}



