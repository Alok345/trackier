import { firestore } from "@/lib/firestore";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection
} from "firebase/firestore";

// Enhanced traversal with individual step storage
export async function traverseWithVisualDelays(initialUrl, delayMs = 800, trackingId) {
  let currentUrl = initialUrl;
  const redirectChain = [{
    url: initialUrl,
    timestamp: new Date().toISOString(),
    status: 'initial',
    redirectNumber: 0,
    stepId: `step_0_${Date.now()}`
  }];
  
  let redirectCount = 0;
  const maxRedirects = 10;
  const visitedUrls = new Set([initialUrl]);

  // Store initial step
  await storeIndividualStep(trackingId, redirectChain[0], 0);

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
        const headResponse = await fetch(currentUrl, {
          method: 'HEAD',
          redirect: 'manual',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        responseTime = Date.now() - startTime;

        responseStatus = headResponse.status;
        contentType = headResponse.headers.get('content-type');
        locationHeader = headResponse.headers.get('location');

        // Collect all headers for storage
        headResponse.headers.forEach((value, key) => {
          headers[key] = value;
        });

        if (locationHeader && responseStatus >= 300 && responseStatus < 400) {
          finalUrl = new URL(locationHeader, currentUrl).toString();
        }
      } catch (headError) {
        console.log('⚠️ HEAD request failed:', headError.message);
      }

      // If no Location header found, try GET request
      if (!locationHeader || !(responseStatus >= 300 && responseStatus < 400)) {
        try {
          const startTime = Date.now();
          const getResponse = await fetch(currentUrl, {
            method: 'GET',
            redirect: 'manual',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          responseTime = Date.now() - startTime;

          responseStatus = getResponse.status;
          contentType = getResponse.headers.get('content-type');
          locationHeader = getResponse.headers.get('location');

          // Collect all headers for storage
          getResponse.headers.forEach((value, key) => {
            headers[key] = value;
          });

          if (locationHeader && responseStatus >= 300 && responseStatus < 400) {
            finalUrl = new URL(locationHeader, currentUrl).toString();
          } else if (responseStatus === 200 && contentType && contentType.includes('text/html')) {
            try {
              const html = await getResponse.text();
              metaRefreshUrl = extractMetaRefreshUrl(html, currentUrl);
              if (metaRefreshUrl) {
                finalUrl = metaRefreshUrl;
              }
            } catch (htmlError) {
              console.log('⚠️ Failed to parse HTML:', htmlError.message);
            }
          }
        } catch (getError) {
          console.log('❌ GET request failed:', getError.message);
          break;
        }
      }

      // Add to redirect chain if we found a new URL
      if (finalUrl !== currentUrl && !visitedUrls.has(finalUrl)) {
        redirectCount++;
        visitedUrls.add(finalUrl);
        
        const stepData = {
          url: finalUrl,
          timestamp: new Date().toISOString(),
          status: 'redirected',
          redirectNumber: redirectCount,
          redirectType: locationHeader ? 'http_redirect' : metaRefreshUrl ? 'meta_refresh' : 'unknown',
          responseStatus: responseStatus,
          contentType: contentType,
          responseTime: responseTime,
          headers: headers,
          previousUrl: currentUrl,
          delay: delayMs,
          stepId: `step_${redirectCount}_${Date.now()}`
        };
        
        redirectChain.push(stepData);
        
        // Store individual step in database
        await storeIndividualStep(trackingId, stepData, redirectCount);
        
        currentUrl = finalUrl;
      } else {
        console.log('🏁 No more redirects found');
        break;
      }

    } catch (error) {
      console.log('❌ Error during traversal:', error.message);
      
      // Store error step
      const errorStep = {
        url: currentUrl,
        timestamp: new Date().toISOString(),
        status: 'error',
        redirectNumber: redirectCount + 1,
        error: error.message,
        stepId: `error_${redirectCount + 1}_${Date.now()}`
      };
      
      await storeIndividualStep(trackingId, errorStep, redirectCount + 1);
      break;
    }
  }

  return {
    finalUrl: redirectChain[redirectChain.length - 1].url,
    redirectChain: redirectChain,
    totalRedirects: redirectCount,
    traversalComplete: redirectCount < maxRedirects
  };
}

// Store individual step in database
async function storeIndividualStep(trackingId, stepData, stepNumber) {
  try {
    const stepRef = doc(collection(firestore, "visualTraversal", trackingId, "steps"));
    
    const stepDocument = {
      trackingId: trackingId,
      stepNumber: stepNumber,
      ...stepData,
      storedAt: serverTimestamp(),
      timestamp: new Date().toISOString()
    };

    await setDoc(stepRef, stepDocument);
  } catch (error) {
    console.error('❌ Error storing individual step:', error);
  }
}

// Meta refresh extraction
function extractMetaRefreshUrl(html, baseUrl) {
  try {
    const metaRefreshRegex = /<meta[^>]*http-equiv=["']?refresh["']?[^>]*>/gi;
    const metaRefreshMatches = html.match(metaRefreshRegex);
    
    if (metaRefreshMatches) {
      for (const metaTag of metaRefreshMatches) {
        const contentMatch = metaTag.match(/content=["']?\s*\d+\s*;\s*url=([^"'>\s]+)/i);
        if (contentMatch && contentMatch[1]) {
          let url = contentMatch[1].replace(/&amp;/g, '&');
          try {
            url = decodeURIComponent(url);
          } catch (e) {}
          return new URL(url, baseUrl).toString();
        }
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}