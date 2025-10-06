"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore"
import { firestore } from "@/lib/firestore"
import { generateClickId, getClientIP } from "@/lib/affiliateUtils"

export default function DemoPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("")
  const [finalRedirectUrl, setFinalRedirectUrl] = useState("")
  const [countdown, setCountdown] = useState(5)
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
          }
        }

        // If no valid session found, create new one
        if (!clickId) {
          clickId = generateClickId()
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

          } catch (fireErr) {
            console.error("Failed to write tracking data:", fireErr)
            // continue to redirect regardless
          }
        }

        // Get the preview URL (first redirect)
        const previewUrl = decodeURIComponent(redirectUrl) || domain || "https://example.com"
        
        // Get the final redirect URL via API (request JSON response)
        const redirectApi = new URL("/api/redirect", window.location.origin)
        
        // PASS CLICK_ID AS THE FIRST PARAMETER
        redirectApi.searchParams.set("click_id", clickId)
        
        // Then add all other parameters
        searchParams.forEach((value, key) => {
          if (key !== "click_id") { // Don't overwrite the click_id we just set
            redirectApi.searchParams.set(key, value)
          }
        })
        
        redirectApi.searchParams.set("preview_url", window.location.href)
        redirectApi.searchParams.set("redirect_url", previewUrl)
        redirectApi.searchParams.set("is_repeat_click", isRepeatClick.toString())
        redirectApi.searchParams.set("return_json", "true") // Request JSON response

        // Fetch the final redirect URL from API
        const apiResponse = await fetch(redirectApi.toString())
        const result = await apiResponse.json()

        if (result.success) {
          // Set states to show preview first
          setPreviewUrl(result.previewUrl)
          setFinalRedirectUrl(result.finalRedirectUrl)
          setShowPreview(true)
          setLoading(false)

          // Start countdown
          const countdownInterval = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(countdownInterval)
                window.location.href = result.finalRedirectUrl
                return 0
              }
              return prev - 1
            })
          }, 1000)
        } else {
          throw new Error("Failed to get redirect URL from API")
        }

      } catch (err) {
        console.error("Tracking error:", err)
        setError(err?.message || "Something went wrong. Redirecting...")
        setTimeout(() => {
          window.location.href = "https://example.com"
        }, 3000)
      }
    }

    trackAndRedirect()
  }, [searchParams])

  // Show preview page
  if (showPreview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">You're Being Redirected</h1>
            <p className="text-lg text-gray-600">
              Thank you for clicking! You'll be redirected to the advertiser in{' '}
              <span className="font-semibold text-blue-600">{countdown}</span> seconds...
            </p>
          </div>

          <div className="space-y-6">
            {/* Preview URL Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                Tracking Link (Preview)
              </h3>
              <div className="bg-white p-4 rounded-lg border">
                <code className="text-sm text-blue-800 break-all">
                  {previewUrl}
                </code>
              </div>
            </div>

            {/* Final Destination Card */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Final Destination
              </h3>
              <div className="bg-white p-4 rounded-lg border">
                <code className="text-sm text-green-800 break-all">
                  {finalRedirectUrl}
                </code>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => window.location.href = finalRedirectUrl}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Continue Now
              </button>
              
              <button
                onClick={() => window.history.back()}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all duration-200 border border-gray-300"
              >
                Go Back
              </button>
            </div>

            {/* Security Notice */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-500 flex items-center justify-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Your click is being tracked securely. We never store personal information.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <p className="mt-6 text-lg font-semibold text-gray-700">Processing Your Request</p>
          <p className="mt-2 text-gray-500">Tracking your click and preparing redirect...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something Went Wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">You will be redirected shortly...</p>
        </div>
      </div>
    )
  }

  return null
}