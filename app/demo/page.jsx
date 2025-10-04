// app/demo/page.jsx
"use client"

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { doc, getDoc, setDoc, updateDoc, arrayUnion, getDocs, collection } from 'firebase/firestore'
import { firestore } from '@/lib/firestore'
import { generateClickId } from '@/lib/affiliateUtils'

export default function DemoPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const hasRun = useRef(false)

  useEffect(() => {
    // 🔹 Prevent the effect from running multiple times
    if (hasRun.current) return
    hasRun.current = true

    const trackAndRedirect = async () => {
      try {
        // Get only session_id from URL
        const sessionId = searchParams.get('session_id')

        console.log('🔗 Received session_id:', sessionId)

        if (!sessionId) {
          throw new Error('Missing session_id parameter')
        }

        // Fetch campaign data from Firebase using session_id
        const sessionDocRef = doc(firestore, "campaignSessions", sessionId)
        const sessionDocSnap = await getDoc(sessionDocRef)

        if (!sessionDocSnap.exists()) {
          throw new Error('Session data not found')
        }

        const sessionData = sessionDocSnap.data()
        
        // Extract parameters from stored session data
        const {
          affiliateId,
          campaignId,
          advertiserId,
          publisherId,
          source,
          domain,
          campaignTitle,
          previewUrl
        } = sessionData

        console.log('📦 Retrieved parameters from database:', {
          affiliateId,
          campaignId,
          advertiserId,
          publisherId,
          source,
          domain,
          campaignTitle
        })

        // Get user information
        const userAgent = navigator.userAgent
        
        // Get IP address
        let ipAddress = 'unknown'
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json')
          const ipData = await ipResponse.json()
          ipAddress = ipData.ip
        } catch (ipError) {
          console.error('Error fetching IP:', ipError)
        }

        console.log('🌐 User IP Address:', ipAddress)

        // Get or create affiliate document
        const affiliateDocRef = doc(firestore, "affiliateLinks", affiliateId)
        const affiliateDocSnap = await getDoc(affiliateDocRef)

        let clickId;
        let userSessionData;
        let isNewClick = false;

        if (affiliateDocSnap.exists()) {
          const affiliateData = affiliateDocSnap.data()
          
          // Check if this IP already has any session for this campaign
          const existingSession = affiliateData.userSessions?.find(
            session => session.ipAddress === ipAddress && session.campaignId === campaignId
          )
          
          if (existingSession) {
            // 🔹 SAME IP & SAME CAMPAIGN: Reuse existing clickId
            clickId = existingSession.clickId
            console.log('🔄 Reusing existing clickId for same IP and campaign:', clickId)
            isNewClick = false;
          } else {
            // 🔹 NEW IP or DIFFERENT CAMPAIGN: Generate new clickId
            clickId = generateClickId()
            console.log('🆕 Generating new clickId for new IP or different campaign:', clickId)
            isNewClick = true;
          }
        } else {
          // 🔹 NEW AFFILIATE: Generate new clickId
          clickId = generateClickId()
          console.log('🆕 Generating new clickId for new affiliate:', clickId)
          isNewClick = true;
        }

        // Create user session data
        userSessionData = {
          clickId,
          sessionId,
          campaignId,
          campaignTitle,
          advertiserId,
          publisherId,
          source,
          domain,
          ipAddress,
          userAgent,
          timestamp: new Date().toISOString(),
          referrer: document.referrer || 'direct',
          screenResolution: `${screen.width}x${screen.height}`,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          cookiesEnabled: navigator.cookieEnabled,
          javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false,
          sessionType: isNewClick ? 'first_click' : 'repeat_click',
          clickCount: 1,
          browserSessionId: generateClickId() // Unique ID for this browser session
        }

        // 🔹 Check if this exact browser session already exists
        const currentAffiliateData = affiliateDocSnap.exists() ? affiliateDocSnap.data() : null
        const existingBrowserSession = currentAffiliateData?.userSessions?.find(
          session => session.browserSessionId === userSessionData.browserSessionId
        )

        if (existingBrowserSession) {
          console.log('🔄 Browser session already processed, redirecting...')
        } else {
          // Update affiliate document with new session
          if (affiliateDocSnap.exists()) {
            await updateDoc(affiliateDocRef, {
              userSessions: arrayUnion(userSessionData),
              totalClicks: (currentAffiliateData.totalClicks || 0) + 1,
              lastActivity: new Date().toISOString()
            })
            console.log('✅ Added new session to affiliate document for browser:', userSessionData.browserSessionId)
          } else {
            await setDoc(affiliateDocRef, {
              affiliateId,
              userSessions: [userSessionData],
              totalClicks: 1,
              createdAt: new Date().toISOString(),
              lastActivity: new Date().toISOString()
            })
            console.log('✅ Created new affiliate document for browser:', userSessionData.browserSessionId)
          }
        }

        // Update session document to track multiple browser usage (don't mark as fully processed)
        await updateDoc(sessionDocRef, {
          clickId: clickId,
          ipAddress: ipAddress,
          lastProcessedAt: new Date().toISOString(),
          isRepeatClick: !isNewClick,
          totalBrowserSessions: (sessionData.totalBrowserSessions || 0) + 1
        }, { merge: true })

        console.log('🌐 Preview URL from database:', previewUrl)

        if (!previewUrl) {
          throw new Error('Preview URL not found in session data')
        }

        // Construct the final preview URL with all parameters from database
        const finalUrl = new URL(previewUrl)
        
        // Add all tracking parameters from the database
        finalUrl.searchParams.set('click_id', clickId)
        finalUrl.searchParams.set('campaign_id', campaignId || '')
        finalUrl.searchParams.set('affiliate_id', affiliateId || '')
        
        if (publisherId) finalUrl.searchParams.set('pub_id', publisherId)
        finalUrl.searchParams.set('force_transparent', 'true')
        if (source) finalUrl.searchParams.set('source', source)
        if (domain) finalUrl.searchParams.set('url', domain)
        
        console.log('🎯 Final redirect URL with parameters from DB:', finalUrl.toString())

        // Redirect to the final preview URL
        setTimeout(() => {
          window.location.href = finalUrl.toString()
        }, 1000)

      } catch (err) {
        console.error('❌ Error in tracking:', err)
        setError(err.message || 'Failed to process your request. Redirecting...')
        // Fallback redirect after error
        setTimeout(() => {
          window.location.href = 'https://example.com'
        }, 3000)
      } finally {
        setLoading(false)
      }
    }

    trackAndRedirect()

    // 🔹 Cleanup function to prevent further executions
    return () => {
      hasRun.current = true
    }
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing your request...</p>
          <p className="text-sm text-gray-500">Loading campaign data...</p>
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