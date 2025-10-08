import { firestore } from "@/lib/firestore";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  query,
  where,
  getDocs,
  collection,
} from "firebase/firestore";

// Enhanced IP detection with multiple fallbacks
function getClientIP(req) {
  try {
    const headers = req.headers;
    
    // Comprehensive IP header checks
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

    // Check all possible IP headers
    for (const header of ipHeaders) {
      const value = headers.get(header);
      if (value) {
        console.log(`🔍 Found IP in ${header}:`, value);
        
        // Handle x-forwarded-for format (comma-separated)
        if (header === 'x-forwarded-for') {
          const ips = value.split(',').map(ip => ip.trim());
          clientIP = ips[0]; // First IP is the original client
          break;
        } else {
          clientIP = value;
          break;
        }
      }
    }

    // Cloudflare specific
    const cf = req.cf;
    if (cf) {
      if (cf.clientIp && cf.clientIp !== 'unknown') {
        console.log('🌐 Using Cloudflare clientIp:', cf.clientIp);
        clientIP = cf.clientIp;
      }
      
      // Additional Cloudflare data
      if (cf.country) {
        console.log('📍 Cloudflare country:', cf.country);
      }
      if (cf.city) {
        console.log('🏙️ Cloudflare city:', cf.city);
      }
    }

    // Validate IP format
    if (clientIP && clientIP !== 'unknown') {
      // Basic IP validation
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$|^([a-fA-F0-9:]+:+)+[a-fA-F0-9]+$/;
      if (!ipRegex.test(clientIP)) {
        console.warn('⚠️ Invalid IP format detected:', clientIP);
        clientIP = 'invalid-format';
      }
    }

    console.log('🎯 Final client IP:', clientIP);
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

  // Cloudflare additional data
  const cf = req.cf;
  if (cf) {
    clientInfo.cloudflare = {
      country: cf.country || 'Unknown',
      city: cf.city || 'Unknown',
      region: cf.region || 'Unknown',
      latitude: cf.latitude || 'Unknown',
      longitude: cf.longitude || 'Unknown',
      timezone: cf.timezone || 'Unknown',
      asn: cf.asn || 'Unknown',
      asOrganization: cf.asOrganization || 'Unknown',
      colo: cf.colo || 'Unknown'
    };
  }

  console.log('🖥️ Client Info:', {
    browser: clientInfo.browser,
    os: clientInfo.os,
    deviceType: clientInfo.deviceType,
    country: clientInfo.cloudflare?.country
  });

  return clientInfo;
}

// Enhanced IP-based click tracking
async function getOrCreateTrackingByIP(ipAddress, affiliateId, campaignId, clientInfo) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Query for existing tracking from same IP in last 24 hours
  const trackingQuery = query(
    collection(firestore, "affiliateLinks"),
    where("ipAddress", "==", ipAddress),
    where("affiliateId", "==", affiliateId),
    where("campaignId", "==", campaignId),
    where("createdAt", ">=", twentyFourHoursAgo)
  );

  const querySnapshot = await getDocs(trackingQuery);
  
  if (!querySnapshot.empty) {
    // Return existing tracking record
    const existingDoc = querySnapshot.docs[0];
    console.log('🔁 Found existing click from same IP:', ipAddress);
    return {
      exists: true,
      trackingId: existingDoc.id,
      data: existingDoc.data()
    };
  }

  // Create new tracking ID with client info fingerprint
  const clientFingerprint = generateClientFingerprint(clientInfo);
  const newTrackingId = `${campaignId}_${Date.now()}_${clientFingerprint}`;
  
  return {
    exists: false,
    trackingId: newTrackingId
  };
}

// Generate simple client fingerprint
function generateClientFingerprint(clientInfo) {
  const fingerprintData = [
    clientInfo.browser,
    clientInfo.os,
    clientInfo.deviceType,
    clientInfo.acceptLanguage?.split(',')[0] // Primary language
  ].filter(Boolean).join('|');
  
  return Buffer.from(fingerprintData).toString('base64').slice(0, 10);
}

// URL traversal function (keep your existing implementation)
async function traverseAllRedirects(initialUrl, maxRedirects = 20) {
  let currentUrl = initialUrl;
  const redirectChain = [{
    url: initialUrl,
    timestamp: new Date().toISOString(),
    status: 'initial',
    redirectNumber: 0
  }];
  
  let redirectCount = 0;
  const visitedUrls = new Set([initialUrl]);

  console.log('🔗 Starting URL traversal...');
  console.log('📍 Initial URL:', initialUrl);

  while (redirectCount < maxRedirects) {
    try {
      console.log(`🔄 [Step ${redirectCount + 1}] Checking:`, currentUrl);
      
      let finalUrl = currentUrl;
      let locationHeader = null;
      let metaRefreshUrl = null;
      let responseStatus = null;
      let contentType = null;

      // Try HEAD request first
      try {
        const headResponse = await fetch(currentUrl, {
          method: 'HEAD',
          redirect: 'manual',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        responseStatus = headResponse.status;
        contentType = headResponse.headers.get('content-type');
        locationHeader = headResponse.headers.get('location');

        console.log(`📊 HEAD Response - Status: ${responseStatus}, Content-Type: ${contentType}, Location: ${locationHeader}`);

        if (locationHeader && responseStatus >= 300 && responseStatus < 400) {
          finalUrl = new URL(locationHeader, currentUrl).toString();
          console.log('📍 Found Location header redirect:', finalUrl);
        }
      } catch (headError) {
        console.log('⚠️ HEAD request failed, trying GET:', headError.message);
      }

      // If no Location header found, try GET request
      if (!locationHeader || !(responseStatus >= 300 && responseStatus < 400)) {
        try {
          const getResponse = await fetch(currentUrl, {
            method: 'GET',
            redirect: 'manual',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });

          responseStatus = getResponse.status;
          contentType = getResponse.headers.get('content-type');
          locationHeader = getResponse.headers.get('location');

          console.log(`📊 GET Response - Status: ${responseStatus}, Content-Type: ${contentType}, Location: ${locationHeader}`);

          if (locationHeader && responseStatus >= 300 && responseStatus < 400) {
            finalUrl = new URL(locationHeader, currentUrl).toString();
            console.log('📍 Found Location header in GET:', finalUrl);
          } else if (responseStatus === 200 && contentType && contentType.includes('text/html')) {
            try {
              const html = await getResponse.text();
              metaRefreshUrl = extractMetaRefreshUrl(html, currentUrl);
              if (metaRefreshUrl) {
                finalUrl = metaRefreshUrl;
                console.log('📍 Found meta refresh redirect:', finalUrl);
              }
            } catch (htmlError) {
              console.log('⚠️ Failed to parse HTML for meta refresh:', htmlError.message);
            }
          }
        } catch (getError) {
          console.log('❌ GET request failed:', getError.message);
          break;
        }
      }

      if (finalUrl !== currentUrl && !visitedUrls.has(finalUrl)) {
        redirectCount++;
        visitedUrls.add(finalUrl);
        
        redirectChain.push({
          url: finalUrl,
          timestamp: new Date().toISOString(),
          status: 'redirected',
          redirectNumber: redirectCount,
          redirectType: locationHeader ? 'http_redirect' : 'meta_refresh',
          responseStatus: responseStatus,
          contentType: contentType
        });
        
        console.log(`✅ [Step ${redirectCount}] Added to chain:`, finalUrl);
        currentUrl = finalUrl;
      } else {
        console.log('🏁 No more redirects found. Stopping traversal.');
        break;
      }

    } catch (error) {
      console.log('❌ Error during URL traversal:', error.message);
      break;
    }
  }

  console.log(`🎯 Traversal complete. Total steps: ${redirectChain.length}`);
  return {
    finalUrl: redirectChain[redirectChain.length - 1].url,
    redirectChain: redirectChain,
    totalRedirects: redirectCount,
    traversalComplete: redirectCount < maxRedirects
  };
}

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
    console.log('⚠️ Error extracting meta refresh URL:', error.message);
    return null;
  }
}

export async function GET(req) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  console.log('🔍 Starting enhanced redirect process...');

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

    // Get comprehensive client information
    const clientIP = getClientIP(req);
    const clientInfo = getClientInfo(req);
    
    console.log('🌐 Enhanced Client Data Captured:');
    console.log('  IP:', clientIP);
    console.log('  Browser:', clientInfo.browser);
    console.log('  OS:', clientInfo.os);
    console.log('  Device:', clientInfo.deviceType);
    console.log('  Country:', clientInfo.cloudflare?.country);

    // Check for existing tracking with enhanced fingerprint
    const trackingInfo = await getOrCreateTrackingByIP(
      clientIP, 
      affiliateIdParam, 
      campaignIdParam,
      clientInfo
    );

    const trackingId = trackingInfo.trackingId;
    const isExistingClick = trackingInfo.exists;
    
    console.log(isExistingClick ? '🔄 Updating existing click' : '🆕 Creating new click');
    console.log('🆔 Tracking ID:', trackingId);

    // Traverse ALL redirects
    console.log('🚀 Starting comprehensive URL traversal...');
    const traversalResult = await traverseAllRedirects(previewUrl);
    const finalRedirectUrl = traversalResult.finalUrl;
    const completeRedirectChain = traversalResult.redirectChain;
    
    console.log('🎯 Traversal completed!');
    console.log('📊 Total redirect steps:', completeRedirectChain.length);

    // Enhanced cookie data with client info
    const cookieData = {
      trackingId,
      affiliateId: affiliateIdParam,
      campaignId: campaignIdParam,
      publisherId: publisherIdParam,
      source: sourceParam,
      firstVisit: new Date().toISOString(),
      visitCount: 1,
      lastVisit: new Date().toISOString(),
      ipAddress: clientIP,
      redirectChainLength: completeRedirectChain.length,
      clientFingerprint: generateClientFingerprint(clientInfo),
      browser: clientInfo.browser,
      os: clientInfo.os,
      deviceType: clientInfo.deviceType
    };

    // Check existing cookie
    const cookieHeader = req.headers.get('cookie');
    let existingCookieData = null;
    
    if (cookieHeader && cookieHeader.includes('affiliate_tracking=')) {
      try {
        const cookieMatch = cookieHeader.match(/affiliate_tracking=([^;]+)/);
        if (cookieMatch) {
          existingCookieData = JSON.parse(decodeURIComponent(cookieMatch[1]));
          console.log('🔍 Found existing cookie data');
        }
      } catch (e) {
        console.warn('⚠️ Failed to parse existing cookie:', e);
      }
    }

    // Update or create cookie
    let finalCookieData;
    if (existingCookieData && existingCookieData.affiliateId === affiliateIdParam) {
      finalCookieData = {
        ...existingCookieData,
        visitCount: (existingCookieData.visitCount || 0) + 1,
        lastVisit: new Date().toISOString(),
        previousTrackingId: existingCookieData.trackingId,
        trackingId: trackingId,
        ipAddress: clientIP,
        redirectChainLength: completeRedirectChain.length,
        clientFingerprint: generateClientFingerprint(clientInfo)
      };
      console.log('🔄 Updated existing cookie, visit count:', finalCookieData.visitCount);
    } else {
      finalCookieData = cookieData;
      console.log('🍪 Creating new cookie');
    }

    // Store comprehensive tracking data
    await storeTrackingData({
      trackingId,
      affiliateId: affiliateIdParam,
      campaignId: campaignIdParam,
      publisherId: publisherIdParam,
      source: sourceParam,
      previewUrl: previewUrl,
      finalRedirectUrl: finalRedirectUrl,
      redirectChain: completeRedirectChain,
      redirectCount: completeRedirectChain.length - 1,
      originalParams: Object.fromEntries(sp.entries()),
      cookieData: finalCookieData,
      isReturningVisitor: !!existingCookieData,
      ipAddress: clientIP,
      clientInfo: clientInfo,
      isExistingClick: isExistingClick,
      clickCount: isExistingClick ? (trackingInfo.data?.clickCount || 0) + 1 : 1,
      urlTraversal: {
        totalSteps: completeRedirectChain.length,
        traversalComplete: traversalResult.traversalComplete,
        finalDestination: finalRedirectUrl
      }
    });

    // Store final destination with enhanced data
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
        },
        cookieData: finalCookieData,
        ipAddress: clientIP,
        clientInfo: clientInfo,
        isExistingClick: isExistingClick,
        redirectChain: completeRedirectChain
      });
    } catch (e) {
      console.warn('⚠️ Could not persist final destination params:', e?.message || e);
    }

    // Set cookie and redirect
    const cookieString = createTrackingCookie(finalCookieData);
    
    console.log('🍪 Setting enhanced tracking cookie');
    console.log('🔄 Redirecting to final destination:', finalRedirectUrl);
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': finalRedirectUrl,
        'Set-Cookie': cookieString,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

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

// Enhanced tracking data storage
async function storeTrackingData(data) {
  try {
    const { 
      trackingId, 
      affiliateId, 
      originalParams, 
      finalRedirectUrl, 
      previewUrl, 
      redirectChain,
      cookieData,
      isReturningVisitor,
      ipAddress,
      clientInfo,
      isExistingClick,
      clickCount,
      urlTraversal
    } = data;

    const trackingData = {
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
      cookieData: cookieData || null,
      isReturningVisitor: isReturningVisitor || false,
      ipAddress: ipAddress,
      clientInfo: clientInfo || null,
      clickCount: clickCount,
      urlTraversal: urlTraversal || null,
      status: "redirected",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (isExistingClick) {
      // Update existing record
      const affiliateLinkRef = doc(firestore, "affiliateLinks", trackingId);
      await updateDoc(affiliateLinkRef, {
        clickCount: clickCount,
        lastClickAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        finalRedirectUrl: finalRedirectUrl,
        redirectChain: redirectChain || null,
        redirectCount: Array.isArray(redirectChain) ? redirectChain.length - 1 : null,
        urlTraversal: urlTraversal || null,
        clientInfo: clientInfo || null
      });
      
      console.log('🔄 Updated existing click count:', clickCount);
    } else {
      // Create new record
      const affiliateLinkRef = doc(firestore, "affiliateLinks", trackingId);
      await setDoc(affiliateLinkRef, trackingData);
    }

    // Store in extractUrl collection
    const extractUrlRef = doc(firestore, "extractUrl", affiliateId);
    const extractUrlSnap = await getDoc(extractUrlRef);

    const extractionData = {
      affiliateId: affiliateId,
      trackingId: trackingId,
      finalUrl: finalRedirectUrl,
      extractedAt: new Date().toISOString(),
      parameters: originalParams,
      cookieData: cookieData || null,
      ipAddress: ipAddress,
      clientInfo: clientInfo || null,
      isExistingClick: isExistingClick || false,
      clickCount: clickCount,
      redirectChain: redirectChain || [],
      urlTraversal: urlTraversal || null,
      enhancedClientData: {
        extractedAt: new Date().toISOString(),
        isReturningVisitor: isReturningVisitor || false,
        visitCount: cookieData?.visitCount || 1,
        ipAddress: ipAddress,
        totalRedirectSteps: redirectChain?.length || 0,
        browser: clientInfo?.browser || 'Unknown',
        os: clientInfo?.os || 'Unknown',
        deviceType: clientInfo?.deviceType || 'Unknown',
        country: clientInfo?.cloudflare?.country || 'Unknown',
        city: clientInfo?.cloudflare?.city || 'Unknown',
        userAgent: clientInfo?.userAgent || 'Unknown'
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

    console.log('✅ Enhanced tracking data stored successfully');

  } catch (error) {
    console.error('❌ Error storing tracking data:', error);
    throw error;
  }
}

// Enhanced final destination storage
async function storeFinalAtRedirect({ affiliateId, trackingId, finalUrl, parameters, linkType, campaignData, cookieData, ipAddress, clientInfo, isExistingClick, redirectChain }) {
  const finalDocRef = doc(firestore, "previewUrlTracking", affiliateId);
  const finalDocSnap = await getDoc(finalDocRef);
  
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
    cookieData: cookieData || null,
    ipAddress: ipAddress,
    clientInfo: clientInfo || null,
    isExistingClick: isExistingClick || false,
    redirectChain: redirectChain || [],
    parameterCount: Object.keys(parameters || {}).length,
    domain: (() => { try { return new URL(finalUrl).hostname } catch { return null } })(),
    browsingCompleted: true,
    visitCount: cookieData?.visitCount || 1,
    isReturningVisitor: !!(cookieData?.visitCount && cookieData.visitCount > 1),
    totalRedirectSteps: redirectChain?.length || 0,
    clientDetails: {
      browser: clientInfo?.browser || 'Unknown',
      os: clientInfo?.os || 'Unknown',
      deviceType: clientInfo?.deviceType || 'Unknown',
      country: clientInfo?.cloudflare?.country || 'Unknown',
      city: clientInfo?.cloudflare?.city || 'Unknown'
    }
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

// Cookie creation function
function createTrackingCookie(cookieData) {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  
  const cookieValue = encodeURIComponent(JSON.stringify(cookieData));
  
  return `affiliate_tracking=${cookieValue}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; Secure`;
}