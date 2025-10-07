"use client"

import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore"
import { firestore } from "@/lib/firestore"
import { generateClickId, getClientIP } from "@/lib/affiliateUtils"

export default function DemoPage() {
  const searchParams = useSearchParams()
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const trackAndRedirect = async () => {
      try {
        // Extract all parameters from the URL
        const allParams = {}
        searchParams.forEach((value, key) => {
          allParams[key] = value
        })

        const campaignId = searchParams.get("campaign_id")
        const affiliateId = searchParams.get("affiliate_id")
        const publisherId = searchParams.get("pub_id") || searchParams.get("publisher_id")
        const source = searchParams.get("source") || searchParams.get("utm_source")
        const redirectUrl = searchParams.get("redirect_url")
        const finalUrl = searchParams.get("url") // This is the final destination URL

        if (!finalUrl && !redirectUrl) {
          window.location.href = "https://example.com"
          return
        }

        // Generate click ID and check for repeat clicks
        let clickId = generateClickId()
        let isRepeatClick = false

        const sessionKey = `click_session_${affiliateId}_${campaignId}`
        const existingSession = localStorage.getItem(sessionKey)
        if (existingSession) {
          const sessionData = JSON.parse(existingSession)
          const timeDiff = Date.now() - sessionData.lastClick
          const twentyFourHours = 24 * 60 * 60 * 1000
          
          if (timeDiff < twentyFourHours) {
            clickId = sessionData.clickId
            isRepeatClick = true
          }
        }

        localStorage.setItem(sessionKey, JSON.stringify({
          clickId,
          lastClick: Date.now(),
          affiliateId,
          campaignId
        }))

        // Get client IP
        let ipAddress = "unknown"
        try {
          ipAddress = await getClientIP()
        } catch (e) {
          console.error("Failed to get IP:", e)
        }

        // Prepare tracking data
        const trackingData = {
          clickId,
          campaignId,
          affiliateId,
          publisherId,
          source,
          ipAddress,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          referrer: document.referrer || "direct",
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          isRepeatClick: isRepeatClick,
          // Store all extracted parameters
          extractedParameters: allParams
        }

        // 🔹 NEW: Store extracted URL data in extractUrl collection
        if (affiliateId) {
          try {
            await storeExtractedUrlData(affiliateId, trackingData, finalUrl || redirectUrl, allParams)
          } catch (extractErr) {
            console.error("Failed to store extracted URL data:", extractErr)
          }
        }

        // Store in affiliateLinks collection (existing functionality)
        if (affiliateId) {
          try {
            const affiliateDocRef = doc(firestore, "affiliateLinks", affiliateId)
            const affiliateDocSnap = await getDoc(affiliateDocRef)

            if (affiliateDocSnap.exists()) {
              await updateDoc(affiliateDocRef, {
                trackingData: arrayUnion(trackingData),
                totalClicks: (affiliateDocSnap.data().totalClicks || 0) + (isRepeatClick ? 0 : 1),
                lastActivity: new Date().toISOString(),
              })
            } else {
              await setDoc(affiliateDocRef, {
                affiliateId,
                trackingData: [trackingData],
                totalClicks: 1,
                createdAt: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
              })
            }

            // Store in trackingSessions collection
            const sessionDocRef = doc(firestore, "trackingSessions", clickId)
            const existingSessionDoc = await getDoc(sessionDocRef)
            
            if (existingSessionDoc.exists()) {
              await updateDoc(sessionDocRef, {
                ...trackingData,
                clickCount: (existingSessionDoc.data().clickCount || 1) + 1,
                lastClickAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })
            } else {
              await setDoc(sessionDocRef, {
                ...trackingData,
                clickCount: 1,
                firstClickAt: new Date().toISOString(),
                lastClickAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
              })
            }

          } catch (fireErr) {
            console.error("Failed to write tracking data:", fireErr)
          }
        }

        // Redirect to final URL with tracking parameters
        const destinationUrl = finalUrl || redirectUrl
        if (destinationUrl) {
          const finalUrlWithParams = new URL(decodeURIComponent(destinationUrl))
          
          // Add tracking parameters to final URL
          finalUrlWithParams.searchParams.set('click_id', clickId)
          if (campaignId) finalUrlWithParams.searchParams.set('campaign_id', campaignId)
          if (affiliateId) finalUrlWithParams.searchParams.set('affiliate_id', affiliateId)
          if (publisherId) finalUrlWithParams.searchParams.set('pub_id', publisherId)
          if (source) finalUrlWithParams.searchParams.set('source', source)
          finalUrlWithParams.searchParams.set('is_repeat_click', isRepeatClick.toString())

          console.log('🎯 Redirecting to Final URL:', finalUrlWithParams.toString())
          window.location.href = finalUrlWithParams.toString()
        } else {
          window.location.href = "https://example.com"
        }

      } catch (err) {
        console.error("Tracking error:", err)
        const redirectUrl = searchParams.get("redirect_url") || searchParams.get("url")
        if (redirectUrl) {
          window.location.href = decodeURIComponent(redirectUrl)
        } else {
          window.location.href = "https://example.com"
        }
      }
    }

    trackAndRedirect()
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Redirecting to affiliate link...</p>
      </div>
    </div>
  )
}

// 🔹 NEW FUNCTION: Store extracted URL data in Firestore
async function storeExtractedUrlData(affiliateId, trackingData, finalUrl, allParams) {
  try {
    const extractUrlDocRef = doc(firestore, "extractUrl", affiliateId)
    const extractUrlDocSnap = await getDoc(extractUrlDocRef)

    const extractedData = {
      // Core identification
      affiliateId: affiliateId,
      clickId: trackingData.clickId,
      
      // URL information
      finalUrl: finalUrl,
      extractedAt: new Date().toISOString(),
      
      // All parameters stored separately
      parameters: {
        // Campaign parameters
        campaignId: allParams.campaign_id || allParams.campaignId,
        affiliateId: allParams.affiliate_id || allParams.affiliateId,
        publisherId: allParams.pub_id || allParams.publisher_id || allParams.publisherId,
        source: allParams.source || allParams.utm_source,
        advertiserId: allParams.advertiser_id || allParams.advertiserId,
        
        // URL parameters
        redirectUrl: allParams.redirect_url,
        url: allParams.url,
        
        // Tracking parameters
        clickId: allParams.click_id,
        forceTransparent: allParams.force_transparent,
        isRepeatClick: allParams.is_repeat_click,
        
        // UTM parameters
        utmSource: allParams.utm_source,
        utmMedium: allParams.utm_medium,
        utmCampaign: allParams.utm_campaign,
        utmTerm: allParams.utm_term,
        utmContent: allParams.utm_content,
        
        // Additional parameters (capture all)
        ...allParams
      },
      
      // Client information
      clientInfo: {
        ipAddress: trackingData.ipAddress,
        userAgent: trackingData.userAgent,
        screenResolution: trackingData.screenResolution,
        language: trackingData.language,
        timezone: trackingData.timezone,
        referrer: trackingData.referrer
      },
      
      // Click information
      clickInfo: {
        isRepeatClick: trackingData.isRepeatClick,
        timestamp: trackingData.timestamp
      }
    }

    if (extractUrlDocSnap.exists()) {
      // Update existing document - add to history array
      await updateDoc(extractUrlDocRef, {
        extractionHistory: arrayUnion(extractedData),
        totalExtractions: (extractUrlDocSnap.data().totalExtractions || 0) + 1,
        lastExtractedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    } else {
      // Create new document
      await setDoc(extractUrlDocRef, {
        affiliateId: affiliateId,
        extractionHistory: [extractedData],
        totalExtractions: 1,
        firstExtractedAt: new Date().toISOString(),
        lastExtractedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }

    console.log('✅ Extracted URL data stored successfully for affiliate:', affiliateId)
    
  } catch (error) {
    console.error('❌ Error storing extracted URL data:', error)
    throw error
  }
}