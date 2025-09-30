import { NextResponse } from 'next/server'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { firestore } from '@/lib/firestore'

export async function GET(request, { params }) {
  const { clickId } = params

  if (!clickId) {
    return NextResponse.json({ error: 'Missing click ID' }, { status: 400 })
  }

  try {
    // Get client IP
    let ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             request.connection?.remoteAddress || 
             'unknown'
    
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim()
    }

    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Find the tracking document
    const docRef = doc(firestore, "affiliateLinks", clickId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      console.log('Tracking document not found for clickId:', clickId)
      return NextResponse.redirect('https://example.com') // Fallback URL
    }

    const trackingData = docSnap.data()
    
    // Update the document with click information
    await updateDoc(docRef, {
      status: 'clicked',
      ipAddress: ip,
      userAgent: userAgent,
      clickedAt: serverTimestamp(),
      clickCount: 1
    })

    console.log('Click tracked successfully:', clickId)

    // Get the preview URL from the campaign data
    const previewUrl = trackingData.previewUrl
    
    if (!previewUrl) {
      console.log('No preview URL found for clickId:', clickId)
      return NextResponse.redirect('https://example.com') // Fallback URL
    }

    // Construct the final redirect URL with all parameters
    const finalUrl = new URL(previewUrl)
    
    // Add all tracking parameters
    finalUrl.searchParams.set('click_id', clickId)
    finalUrl.searchParams.set('campaign_id', trackingData.campaignId || '')
    finalUrl.searchParams.set('affiliate_id', trackingData.affiliateId || '')
    
    if (trackingData.advertiserId) {
      finalUrl.searchParams.set('advertiser_id', trackingData.advertiserId)
    }
    
    finalUrl.searchParams.set('force_transparent', 'true')
    finalUrl.searchParams.set('source', 'tracking_system')

    // Redirect to the final URL
    return NextResponse.redirect(finalUrl.toString())

  } catch (error) {
    console.error('Error tracking click:', error)
    // Fallback redirect
    return NextResponse.redirect('https://example.com')
  }
}