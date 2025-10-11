import { firestore } from "@/lib/firestore";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  collection,
  addDoc
} from "firebase/firestore";

// Enhanced traversal with individual step storage
async function traverseWithVisualDelays(initialUrl, delayMs = 800, trackingId) {
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

  // Mark traversal as completed
  await updateTraversalCompletion(trackingId, redirectChain);

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
      timestamp: new Date().toISOString() // Keep original timestamp
    };

    await setDoc(stepRef, stepDocument);
   
    
  } catch (error) {
    console.error('❌ Error storing individual step:', error);
  }
}

// Update traversal completion status
async function updateTraversalCompletion(trackingId, redirectChain) {
  try {
    const traversalRef = doc(firestore, "visualTraversal", trackingId);
    
    await updateDoc(traversalRef, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      finalDestination: redirectChain[redirectChain.length - 1].url,
      totalSteps: redirectChain.length,
      updatedAt: serverTimestamp()
    });
    
    
    
  } catch (error) {
    console.error('❌ Error updating traversal completion:', error);
  }
}

// Store traversal data with proper data validation
async function storeVisualTraversalData(data) {
  try {
    const { trackingId, affiliateId, redirectChain, clientInfo, ipAddress, campaignId, publisherId, source } = data;
    
    const traversalRef = doc(firestore, "visualTraversal", trackingId);
    
    // Ensure all fields have valid values (no undefined)
    const traversalData = {
      trackingId: trackingId || 'unknown',
      affiliateId: affiliateId || 'unknown',
      campaignId: campaignId || 'unknown',
      publisherId: publisherId || 'unknown',
      source: source || 'unknown',
      ipAddress: ipAddress || 'unknown',
      redirectChain: redirectChain || [],
      totalSteps: redirectChain?.length || 0,
      clientInfo: clientInfo || {},
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: 'in_progress',
      createdAt: serverTimestamp(),
      stepStorage: true // Flag to indicate individual step storage
    };

    await setDoc(traversalRef, traversalData);
    
    
  } catch (error) {
    console.error('❌ Error storing visual traversal data:', error);
  }
}

// Enhanced IP detection
function getClientIP(req) {
  try {
    const headers = req.headers;
    
    const ipHeaders = [
      'x-client-ip',
      'x-forwarded-for',
      'cf-connecting-ip',
      'fastly-client-ip',
      'true-client-ip',
      'x-real-ip',
      'x-cluster-client-ip',
      'x-forwarded',
      'forwarded-for',
      'forwarded'
    ];

    let clientIP = 'unknown';

    for (const header of ipHeaders) {
      const value = headers.get(header);
      if (value) {
        if (header === 'x-forwarded-for') {
          const ips = value.split(',').map(ip => ip.trim());
          clientIP = ips[0];
          break;
        } else {
          clientIP = value;
          break;
        }
      }
    }

    // For local development
    if (clientIP === '::1' || clientIP === '127.0.0.1') {
      clientIP = 'localhost';
    }

   
    return clientIP;

  } catch (error) {
    console.warn('⚠️ Error getting client IP:', error);
    return 'error-detecting-ip';
  }
}

// Enhanced client information detection
function getClientInfo(req) {
  const headers = req.headers;
  const clientInfo = {
    userAgent: headers.get('user-agent') || 'unknown',
    accept: headers.get('accept') || 'unknown',
    acceptLanguage: headers.get('accept-language') || 'unknown',
    acceptEncoding: headers.get('accept-encoding') || 'unknown',
    connection: headers.get('connection') || 'unknown',
    cacheControl: headers.get('cache-control') || 'unknown',
    secFetchDest: headers.get('sec-fetch-dest') || 'unknown',
    secFetchMode: headers.get('sec-fetch-mode') || 'unknown',
    secFetchSite: headers.get('sec-fetch-site') || 'unknown',
    secChUa: headers.get('sec-ch-ua') || 'unknown',
    secChUaMobile: headers.get('sec-ch-ua-mobile') || 'unknown',
    secChUaPlatform: headers.get('sec-ch-ua-platform') || 'unknown',
  };

  // Extract browser and OS information from user agent
  const ua = clientInfo.userAgent.toLowerCase();
  
  // Browser detection
  if (ua.includes('chrome') && !ua.includes('edg')) clientInfo.browser = 'Chrome';
  else if (ua.includes('firefox')) clientInfo.browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) clientInfo.browser = 'Safari';
  else if (ua.includes('edg')) clientInfo.browser = 'Edge';
  else if (ua.includes('opera')) clientInfo.browser = 'Opera';
  else clientInfo.browser = 'Unknown';

  // OS detection
  if (ua.includes('windows')) clientInfo.os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os')) clientInfo.os = 'macOS';
  else if (ua.includes('linux')) clientInfo.os = 'Linux';
  else if (ua.includes('android')) clientInfo.os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) clientInfo.os = 'iOS';
  else clientInfo.os = 'Unknown';

  // Device type
  if (ua.includes('mobile')) clientInfo.deviceType = 'Mobile';
  else if (ua.includes('tablet')) clientInfo.deviceType = 'Tablet';
  else clientInfo.deviceType = 'Desktop';

  return clientInfo;
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

// Store in main tracking collection
async function storeMainTrackingData(data) {
  try {
    const { trackingId, affiliateId, campaignId, publisherId, source, previewUrl, finalRedirectUrl, redirectChain, clientInfo, ipAddress } = data;

    const trackingData = {
      trackingId,
      affiliateId,
      campaignId,
      publisherId,
      source,
      previewUrl,
      finalRedirectUrl,
      redirectChain,
      redirectCount: redirectChain?.length ? redirectChain.length - 1 : 0,
      ipAddress,
      clientInfo,
      clickCount: 1,
      status: "redirected",
      visualTraversal: true,
      stepStorage: true, // Indicate individual steps are stored
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const affiliateLinkRef = doc(firestore, "affiliateLinks", trackingId);
    await setDoc(affiliateLinkRef, trackingData);
    
    

  } catch (error) {
    console.error('❌ Error storing main tracking data:', error);
  }
}

export async function GET(req) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  

  try {
    // Extract parameters
    const campaignIdParam = sp.get("campaign_id");
    const affiliateIdParam = sp.get("affiliate_id");
    const publisherIdParam = sp.get("pub_id");
    const sourceParam = sp.get("source");
    const encodedUrl = sp.get("url");

    // Validate required parameters
    if (!affiliateIdParam || !encodedUrl || !campaignIdParam) {
      return new Response(JSON.stringify({ 
        error: "Missing required parameters: affiliate_id, campaign_id and url are required" 
      }), { status: 400 });
    }

    // Decode the target URL
    let targetUrl;
    try {
      targetUrl = decodeURIComponent(encodedUrl);
     
    } catch (decodeError) {
      return new Response(JSON.stringify({ error: "Invalid URL encoding" }), {
        status: 400,
      });
    }

    // Get client info
    const clientIP = getClientIP(req);
    const clientInfo = getClientInfo(req);

    // Generate tracking ID
    const trackingId = `${campaignIdParam}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Perform complete traversal in backend
    
    const traversalResult = await traverseWithVisualDelays(targetUrl, 500, trackingId);
    
    // Store all data
    await storeVisualTraversalData({
      trackingId,
      affiliateId: affiliateIdParam,
      campaignId: campaignIdParam,
      publisherId: publisherIdParam,
      source: sourceParam,
      redirectChain: traversalResult.redirectChain,
      clientInfo,
      ipAddress: clientIP
    });

    // Store in main tracking collection
    await storeMainTrackingData({
      trackingId: trackingId,
      affiliateId: affiliateIdParam,
      campaignId: campaignIdParam,
      publisherId: publisherIdParam,
      source: sourceParam,
      previewUrl: targetUrl,
      finalRedirectUrl: traversalResult.finalUrl,
      redirectChain: traversalResult.redirectChain,
      clientInfo: clientInfo,
      ipAddress: clientIP
    });

   
    
    // Redirect to final URL without showing any UI
    return new Response(null, {
      status: 302,
      headers: {
        'Location': traversalResult.finalUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('🚨 Error in backend redirect:', error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      message: error.message 
    }), { status: 500 });
  }
}