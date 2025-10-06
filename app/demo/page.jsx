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
        
        const campaignId = searchParams.get("campaign_id")
        const affiliateId = searchParams.get("affiliate_id")
        const publisherId = searchParams.get("pub_id") || searchParams.get("publisher_id")
        const source = searchParams.get("source") || searchParams.get("utm_source")
        const redirectUrl = searchParams.get("redirect_url")

        if (!redirectUrl) {
          window.location.href = "https://example.com"
          return
        }

       
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

        
        let ipAddress = "unknown"
        try {
          ipAddress = await getClientIP()
        } catch (e) {
          console.error("Failed to get IP:", e)
        }

        
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
          isRepeatClick: isRepeatClick
        }

        
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

       
        const previewUrl = decodeURIComponent(redirectUrl)
        
        
        const previewUrlWithParams = new URL(previewUrl)
        previewUrlWithParams.searchParams.set('click_id', clickId)
        previewUrlWithParams.searchParams.set('campaign_id', campaignId)
        previewUrlWithParams.searchParams.set('affiliate_id', affiliateId)
        previewUrlWithParams.searchParams.set('pub_id', publisherId)
        previewUrlWithParams.searchParams.set('source', source)
        previewUrlWithParams.searchParams.set('is_repeat_click', isRepeatClick.toString())

       
        console.log('🎯 Redirecting to Preview URL:', previewUrlWithParams.toString())

        
        window.location.href = previewUrlWithParams.toString()

      } catch (err) {
        console.error("Tracking error:", err)
        
        const redirectUrl = searchParams.get("redirect_url")
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