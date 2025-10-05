"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore"
import { firestore } from "@/lib/firestore"
import { generateClickId, getClientIP } from "@/lib/affiliateUtils"

export default function DemoPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const searchParams = useSearchParams()
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const trackAndRedirect = async () => {
      try {
        // Extract all tracking params
        const campaignId = searchParams.get("campaign_id")
        const affiliateId = searchParams.get("affiliate_id")
        const publisherId = searchParams.get("pub_id") || searchParams.get("publisher_id")
        const source = searchParams.get("source") || searchParams.get("utm_source")
        const domain = searchParams.get("url") || searchParams.get("tracking_domain")
        const advertiserId = searchParams.get("advertiser_id")
        const offerId = searchParams.get("offer_id")
        const pid = searchParams.get("pid")
        const redirectUrl = searchParams.get("redirect_url")

        // Gather runtime info
        const userAgent = navigator.userAgent
        let ipAddress = "unknown"
        try {
          ipAddress = await getClientIP()
        } catch (e) {
          console.error("Failed to get IP:", e)
        }

        // Generate a session key for localStorage
        const sessionKey = `click_session_${affiliateId}_${campaignId}`
        
        // Check localStorage for existing session
        let clickId
        let isRepeatClick = false
        
        const existingSession = localStorage.getItem(sessionKey)
        if (existingSession) {
          const sessionData = JSON.parse(existingSession)
          const timeDiff = Date.now() - sessionData.lastClick
          const twentyFourHours = 24 * 60 * 60 * 1000
          
          if (timeDiff < twentyFourHours) {
            // Reuse existing clickID
            clickId = sessionData.clickId
            isRepeatClick = true
            console.log('🔄 Reusing existing clickID from localStorage:', clickId)
          }
        }

        // If no valid session found, create new one
        if (!clickId) {
          clickId = generateClickId()
          console.log('🆕 Generated new clickID:', clickId)
        }

        // Update or create session in localStorage
        const sessionData = {
          clickId,
          lastClick: Date.now(),
          affiliateId,
          campaignId,
          ipAddress
        }
        localStorage.setItem(sessionKey, JSON.stringify(sessionData))

        // Compose tracking data
        const trackingData = {
          clickId,
          campaignId,
          affiliateId,
          publisherId,
          source,
          domain,
          advertiserId,
          offerId,
          pid,
          ipAddress,
          userAgent,
          timestamp: new Date().toISOString(),
          referrer: document.referrer || "direct",
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          cookiesEnabled: navigator.cookieEnabled,
          javaEnabled: typeof navigator.javaEnabled === "function" ? navigator.javaEnabled() : false,
          isRepeatClick: isRepeatClick
        }

        // Store tracking info using affiliate_id
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

            // Store/update session record by clickId
            const sessionDocRef = doc(firestore, "trackingSessions", clickId)
            const existingSession = await getDoc(sessionDocRef)
            
            if (existingSession.exists()) {
              // Update existing session
              const existingData = existingSession.data()
              await updateDoc(sessionDocRef, {
                ...trackingData,
                clickCount: (existingData.clickCount || 1) + 1,
                lastClickAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })
            } else {
              // Create new session
              await setDoc(sessionDocRef, {
                ...trackingData,
                clickCount: 1,
                firstClickAt: new Date().toISOString(),
                lastClickAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
              })
            }

            console.log('💾 Stored tracking data with clickID:', clickId)
            console.log('🔄 Repeat click:', isRepeatClick)

          } catch (fireErr) {
            console.error("Failed to write tracking data:", fireErr)
            // continue to redirect regardless
          }
        }

        // Redirect via the server so it can log and compose URLs correctly
        const redirectApi = new URL("/api/redirect", window.location.origin)
        
        // Pass ALL original parameters plus the click_id
        searchParams.forEach((value, key) => {
          redirectApi.searchParams.set(key, value)
        })
        
        // Add the click_id (either existing or new)
        redirectApi.searchParams.set("click_id", clickId)
        redirectApi.searchParams.set("preview_url", window.location.href)
        redirectApi.searchParams.set("redirect_url", redirectUrl || domain || "https://example.com")
        redirectApi.searchParams.set("is_repeat_click", isRepeatClick.toString())

        console.log('🔗 Redirecting to API with click_id:', clickId)
        console.log('🔄 Is repeat click:', isRepeatClick)
        console.log('📋 API URL:', redirectApi.toString())

        setTimeout(() => {
          window.location.href = redirectApi.toString()
        }, 300)
      } catch (err) {
        console.error("Tracking error:", err)
        setError(err?.message || "Something went wrong. Redirecting...")
        setTimeout(() => {
          window.location.href = "https://example.com"
        }, 3000)
      } finally {
        setLoading(false)
      }
    }

    trackAndRedirect()
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing your request...</p>
          <p className="text-sm text-gray-500">Tracking your click and redirecting...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">You will be redirected shortly...</p>
        </div>
      </div>
    )
  }

  return null
}