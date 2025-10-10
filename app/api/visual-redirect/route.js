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

  console.log('🔗 Starting visual URL traversal with step storage...');

  // Store initial step
  await storeIndividualStep(trackingId, redirectChain[0], 0);

  while (redirectCount < maxRedirects) {
    try {
      console.log(`🔄 [Step ${redirectCount + 1}] Checking:`, currentUrl);
      
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
        
        console.log(`✅ [Step ${redirectCount}] Added to chain and stored:`, finalUrl);
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
    console.log(`📝 Stored step ${stepNumber} for tracking:`, trackingId);
    
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
    
    console.log('✅ Traversal marked as completed:', trackingId);
    
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
    console.log('📊 Visual traversal data stored with step storage enabled');
    
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
    console.log('⚠️ Error extracting meta refresh URL:', error.message);
    return null;
  }
}

// HTML page generator for visual traversal
function generateTraversalPage({ 
  currentStep, 
  currentUrl, 
  nextStepUrl, 
  totalSteps, 
  delayMs, 
  trackingId,
  isFinalStep = false,
  redirectType = null,
  responseStatus = null
}) {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const delaySeconds = delayMs / 1000;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>URL Traversal in Progress</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: #333;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 600px;
            width: 90%;
            text-align: center;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }
        .progress-container {
            width: 100%;
            height: 8px;
            background: #f0f0f0;
            border-radius: 4px;
            margin: 30px 0;
            overflow: hidden;
        }
        .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 4px;
            transition: width 0.3s ease;
            width: ${progress}%;
        }
        .url-display {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
            word-break: break-all;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #495057;
        }
        .step-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 14px;
            color: #6c757d;
        }
        .redirect-info {
            background: #e7f3ff;
            border: 1px solid #b3d9ff;
            border-radius: 8px;
            padding: 10px;
            margin: 15px 0;
            font-size: 13px;
        }
        .storage-info {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 8px;
            padding: 8px;
            margin: 10px 0;
            font-size: 12px;
            color: #155724;
        }
        .loading-dots {
            display: inline-block;
            margin-left: 5px;
        }
        .loading-dots::after {
            content: '';
            animation: dots 1.5s steps(4, end) infinite;
        }
        @keyframes dots {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60%, 100% { content: '...'; }
        }
        .final-redirect {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🔗 URL Tracker</div>
        <h1>Tracking Redirect Chain</h1>
        
        <div class="step-info">
            <span>Step: ${currentStep + 1} of ${totalSteps}</span>
            <span>Delay: ${delaySeconds}s</span>
        </div>
        
        <div class="progress-container">
            <div class="progress-bar"></div>
        </div>
        
        <div class="url-display">
            ${currentUrl}
        </div>
        
        <div class="storage-info">
            ✅ Step ${currentStep + 1} stored in database
        </div>
        
        ${redirectType ? `
        <div class="redirect-info">
            <strong>Redirect Type:</strong> ${redirectType} 
            ${responseStatus ? `| <strong>Status:</strong> ${responseStatus}` : ''}
        </div>
        ` : ''}
        
        ${isFinalStep ? `
        <div class="final-redirect">
            <strong>🎉 Final Destination Reached!</strong>
            <br>Redirecting to final URL...
        </div>
        ` : `
        <p>Following redirect chain<span class="loading-dots"></span></p>
        `}
        
        <div style="font-size: 12px; color: #6c757d; margin-top: 20px;">
            Tracking ID: ${trackingId}
        </div>
    </div>

    <script>
        // Redirect after delay with visual progress
        setTimeout(() => {
            window.location.href = '${nextStepUrl}';
        }, ${delayMs});
        
        // Update progress bar animation
        let progress = 0;
        const progressBar = document.querySelector('.progress-bar');
        const interval = setInterval(() => {
            progress += (100 / (${delayMs} / 50));
            if (progress >= 100) {
                clearInterval(interval);
                progress = 100;
            }
            progressBar.style.width = progress + '%';
        }, 50);
    </script>
</body>
</html>
  `;
}

export async function GET(req) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  console.log('👁️ Starting visual redirect process with step storage...');

  try {
    // Extract parameters
    const campaignIdParam = sp.get("campaign_id");
    const affiliateIdParam = sp.get("affiliate_id");
    const publisherIdParam = sp.get("pub_id");
    const sourceParam = sp.get("source");
    const encodedUrl = sp.get("url");
    const step = parseInt(sp.get("step")) || 0;
    const trackingIdParam = sp.get("tracking_id");

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
      console.log('🎯 Target URL:', targetUrl);
    } catch (decodeError) {
      return new Response(JSON.stringify({ error: "Invalid URL encoding" }), {
        status: 400,
      });
    }

    // Get client info
    const clientIP = getClientIP(req);
    const clientInfo = getClientInfo(req);

    // If step 0, start the traversal and show first redirect
    if (step === 0) {
      // Generate tracking ID
      const trackingId = `${campaignIdParam}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Start traversal and get first redirect
      console.log('🚀 Starting URL traversal with step storage...');
      const traversalResult = await traverseWithVisualDelays(targetUrl, 500, trackingId);
      const firstStep = traversalResult.redirectChain[0];
      
      // Store initial data
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

      // Show HTML page with meta refresh to next step
      const nextStepUrl = `/api/visual-redirect?campaign_id=${campaignIdParam}&affiliate_id=${affiliateIdParam}&pub_id=${publisherIdParam}&source=${encodeURIComponent(sourceParam)}&url=${encodeURIComponent(encodedUrl)}&tracking_id=${trackingId}&step=1`;
      
      const html = generateTraversalPage({
        currentStep: 0,
        currentUrl: firstStep.url,
        nextStepUrl: nextStepUrl,
        totalSteps: traversalResult.redirectChain.length,
        delayMs: 1000,
        trackingId: trackingId
      });

      return new Response(html, {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });
    }

    // For subsequent steps (step > 0)
    if (step > 0 && trackingIdParam) {
      // Get stored traversal data
      const traversalRef = doc(firestore, "visualTraversal", trackingIdParam);
      const traversalDoc = await getDoc(traversalRef);
      
      if (!traversalDoc.exists()) {
        return new Response("Traversal data not found", { status: 404 });
      }

      const traversalData = traversalDoc.data();
      const redirectChain = traversalData.redirectChain || [];
      
      // Check if we have more steps
      if (step < redirectChain.length) {
        const currentStepData = redirectChain[step];
        const isLastStep = step === redirectChain.length - 1;
        
        let nextStepUrl;
        if (!isLastStep) {
          nextStepUrl = `/api/visual-redirect?campaign_id=${campaignIdParam}&affiliate_id=${affiliateIdParam}&pub_id=${publisherIdParam}&source=${encodeURIComponent(sourceParam)}&url=${encodeURIComponent(encodedUrl)}&tracking_id=${trackingIdParam}&step=${step + 1}`;
        } else {
          // Final step - redirect to actual destination
          nextStepUrl = currentStepData.url;
          
          // Update traversal as completed
          await updateDoc(traversalRef, {
            status: 'completed',
            completedAt: new Date().toISOString(),
            finalDestination: currentStepData.url,
            updatedAt: serverTimestamp()
          });

          // Also store in your main tracking collection
          await storeMainTrackingData({
            trackingId: trackingIdParam,
            affiliateId: affiliateIdParam,
            campaignId: campaignIdParam,
            publisherId: publisherIdParam,
            source: sourceParam,
            previewUrl: targetUrl,
            finalRedirectUrl: currentStepData.url,
            redirectChain: redirectChain,
            clientInfo: clientInfo,
            ipAddress: clientIP
          });
        }

        const html = generateTraversalPage({
          currentStep: step,
          currentUrl: currentStepData.url,
          nextStepUrl: nextStepUrl,
          totalSteps: redirectChain.length,
          delayMs: 800,
          trackingId: trackingIdParam,
          isFinalStep: isLastStep,
          redirectType: currentStepData.redirectType,
          responseStatus: currentStepData.responseStatus
        });

        return new Response(html, {
          status: 200,
          headers: { 'content-type': 'text/html' },
        });
      }
    }

    return new Response("Invalid step or missing tracking ID", { status: 400 });

  } catch (error) {
    console.error('🚨 Error in visual redirect:', error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      message: error.message 
    }), { status: 500 });
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
    
    console.log('✅ Main tracking data stored successfully with step storage');

  } catch (error) {
    console.error('❌ Error storing main tracking data:', error);
  }
}