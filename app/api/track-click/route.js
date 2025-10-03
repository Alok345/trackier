import { NextResponse } from 'next/server'
import { doc, setDoc, getDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore'
import { firestore } from '@/lib/firestore'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract parameters from your URL format
    const clickId = searchParams.get('click_id')
    const campaignId = searchParams.get('campaign_id')
    const advertiserId = searchParams.get('advertiser_id')
    const affiliateId = searchParams.get('affiliate_id')
    
    console.log('Received parameters:', { clickId, campaignId, advertiserId, affiliateId })

    if (!clickId) {
      console.error('Missing click_id parameter')
      return NextResponse.redirect('https://example.com')
    }

    // Check if this click_id already exists
    try {
      const affiliateLinksRef = collection(firestore, 'affiliateLinks')
      const q = query(affiliateLinksRef, where('clickId', '==', clickId))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        console.log('Click already tracked for click_id:', clickId)
        // Get the original URL to redirect to
        const originalUrl = constructOriginalUrl(searchParams)
        return NextResponse.redirect(originalUrl)
      }

      // Get client IP
      let ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
      
      if (ip.includes(',')) {
        ip = ip.split(',')[0].trim()
      }

      // Create affiliate data
      const affiliateData = {
        clickId,
        campaignId: campaignId || 'unknown',
        advertiserId: advertiserId || 'unknown',
        affiliateId: affiliateId || 'unknown',
        baseUrl: constructOriginalUrl(searchParams),
        affiliateLink: request.url,
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        timestamp: serverTimestamp(),
        status: 'clicked',
        clickCount: 1,
        createdAt: serverTimestamp()
      }

      console.log('Storing affiliate data:', affiliateData)

      // Store in Firestore
      const docRef = doc(firestore, 'affiliateLinks', clickId)
      await setDoc(docRef, affiliateData)

      console.log('Successfully created affiliate link document for click_id:', clickId)

      // Redirect to original URL (without tracking parameters)
      const originalUrl = constructOriginalUrl(searchParams)
      return NextResponse.redirect(originalUrl)

    } catch (firestoreError) {
      console.error('Firestore error:', firestoreError)
      const originalUrl = constructOriginalUrl(searchParams)
      return NextResponse.redirect(originalUrl)
    }

  } catch (error) {
    console.error('General error in track-click:', error)
    return NextResponse.redirect('https://example.com')
  }
}
// Helper function to reconstruct original URL without tracking parameters
function constructOriginalUrl(searchParams) {
  const url = new URL('https://ad2click.com/')
  
  // Add all parameters except tracking ones
  for (const [key, value] of searchParams.entries()) {
    if (!['click_id', 'campaign_id', 'advertiser_id', 'affiliate_id', 'source'].includes(key)) {
      url.searchParams.set(key, value)
    }
  }
  
  return url.toString()
}
