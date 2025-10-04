"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { doc, getDoc, setDoc, updateDoc, arrayUnion, getDocs, collection } from 'firebase/firestore'
import { firestore } from '@/lib/firestore'
import { generateClickId } from '@/lib/affiliateUtils'

export default function DemoPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const trackAndRedirect = async () => {
      try {
        // Get parameters from the URL
        const clickId = searchParams.get('click_id')
        const affiliateId = searchParams.get('affiliate_id')
        const campaignId = searchParams.get('campaign_id')
        const advertiserId = searchParams.get('advertiser_id')
        const publisherId = searchParams.get('publisher_id')
        const source = searchParams.get('source')
        const domain = searchParams.get('domain')

        console.log('🔗 Received parameters:', {
          clickId,
          affiliateId,
          campaignId,
          advertiserId,
          publisherId,
          source,
          domain
        })

        if (!clickId || !affiliateId) {
          throw new Error('Missing required parameters: click_id and affiliate_id')
        }

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

        // Create user session data
        const userSession = {
          sessionId: generateClickId(),
          ipAddress,
          userAgent,
          timestamp: new Date().toISOString(),
          referrer: document.referrer || 'direct',
          screenResolution: `${screen.width}x${screen.height}`,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          cookiesEnabled: navigator.cookieEnabled,
          javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false
        }

        console.log('👤 User session data:', userSession)

        // Create or update the document in affiliateLinks collection
        const docRef = doc(firestore, "affiliateLinks", affiliateId)
        const docSnap = await getDoc(docRef)

        const sessionData = {
          clickId,
          campaignId,
          advertiserId,
          publisherId,
          source,
          domain,
          ...userSession
        }

        if (docSnap.exists()) {
          // Update existing document - add new user session to array
          await updateDoc(docRef, {
            userSessions: arrayUnion(sessionData),
            totalClicks: (docSnap.data().totalClicks || 0) + 1,
            lastActivity: new Date().toISOString()
          })
          console.log('✅ Updated existing affiliate document')
        } else {
          // Create new document with first user session
          await setDoc(docRef, {
            affiliateId,
            userSessions: [sessionData],
            totalClicks: 1,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString()
          })
          console.log('✅ Created new affiliate document')
        }

        // Also update the individual click document
        const clickDocRef = doc(firestore, "affiliateLinks", clickId)
        await setDoc(clickDocRef, {
          clickId,
          campaignId,
          advertiserId,
          publisherId,
          affiliateId,
          source,
          domain,
          status: 'clicked',
          ...userSession,
          createdAt: new Date().toISOString()
        }, { merge: true })

        console.log('✅ Updated click document')

        // Get the preview URL from the campaign data
        const previewUrl = await getPreviewUrl(campaignId)
        
        console.log('🌐 Preview URL:', previewUrl)

        if (!previewUrl) {
          throw new Error('Preview URL not found for campaign: ' + campaignId)
        }

        // Construct the final preview URL with all parameters
        const finalUrl = new URL(previewUrl)
        
        // Add all tracking parameters
        finalUrl.searchParams.set('click_id', clickId)
        finalUrl.searchParams.set('campaign_id', campaignId || '')
        finalUrl.searchParams.set('affiliate_id', affiliateId || '')
        
        if (advertiserId) finalUrl.searchParams.set('advertiser_id', advertiserId)
        if (publisherId) finalUrl.searchParams.set('publisher_id', publisherId)
        if (source) finalUrl.searchParams.set('source', source)
        if (domain) finalUrl.searchParams.set('domain', domain)
        
        finalUrl.searchParams.set('force_transparent', 'true')
        finalUrl.searchParams.set('tracking_source', 'tracking_system')
        finalUrl.searchParams.set('session_id', userSession.sessionId)

        console.log('🎯 Final redirect URL:', finalUrl.toString())

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
  }, [searchParams])

  const getPreviewUrl = async (campaignId) => {
    if (!campaignId) return null
    
    try {
      console.log('🔍 Looking for campaign:', campaignId)
      
      // Try to find campaign by campaignId field in all campaigns
      const campaignsQuery = collection(firestore, "campaigns")
      const campaignsSnapshot = await getDocs(campaignsQuery)
      let previewUrl = null
      let campaignTitle = ''
      
      campaignsSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.campaignId === campaignId) {
          previewUrl = data.previewUrl
          campaignTitle = data.title
          console.log('✅ Found campaign by campaignId:', data.title)
        }
      })

      // If not found by campaignId, try by document ID
      if (!previewUrl) {
        try {
          const campaignDoc = await getDoc(doc(firestore, "campaigns", campaignId))
          if (campaignDoc.exists()) {
            const data = campaignDoc.data()
            previewUrl = data.previewUrl
            campaignTitle = data.title
            console.log('✅ Found campaign by document ID:', data.title)
          }
        } catch (error) {
          console.log('❌ Campaign not found by document ID:', campaignId)
        }
      }

      // Update the click document with campaign title
      if (campaignTitle) {
        const clickId = searchParams.get('click_id')
        if (clickId) {
          const clickDocRef = doc(firestore, "affiliateLinks", clickId)
          await updateDoc(clickDocRef, {
            campaignTitle: campaignTitle
          })
        }
      }

      return previewUrl
    } catch (error) {
      console.error('❌ Error fetching preview URL:', error)
      return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing your request...</p>
          <p className="text-sm text-gray-500">Please wait while we redirect you...</p>
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