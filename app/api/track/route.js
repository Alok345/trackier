import { NextResponse } from 'next/server'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { firestore } from '@/lib/firestore'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const forceTransparent = searchParams.get('force_transparent')
  const clickId = searchParams.get('click_id')

  console.log('🎯 TRACK API Route Called - Params:', { forceTransparent, clickId })

  // Check required parameters
  if (forceTransparent !== 'true' || !clickId) {
    console.log('❌ Missing required parameters')
    return NextResponse.redirect('https://example.com')
  }

  try {
    // Get client information
    let ip = request.headers.get('x-forwarded-for') || 'unknown'
    if (ip.includes(',')) ip = ip.split(',')[0].trim()
    
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const host = request.headers.get('host') || ''

    console.log('👤 Client Info:', { ip, host, clickId })

    // Find the tracking document by clickId
    const docRef = doc(firestore, "affiliateLinks", clickId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      console.log('❌ Tracking document not found for clickId:', clickId)
      return NextResponse.redirect('https://example.com')
    }

    const trackingData = docSnap.data()
    console.log('✅ Found tracking data:', {
      previewUrl: trackingData.previewUrl,
      campaignId: trackingData.campaignId,
      status: trackingData.status
    })

    // Check if we have a previewUrl
    const previewUrl = trackingData.previewUrl
    if (!previewUrl) {
      console.log('❌ No previewUrl found in tracking data')
      return NextResponse.redirect('https://example.com')
    }

    console.log('📍 Preview URL:', previewUrl)

    // Update the document with click information
    await updateDoc(docRef, {
      status: 'clicked',
      ipAddress: ip,
      userAgent: userAgent,
      clickedAt: serverTimestamp(),
      clickCount: 1,
      clickDomain: host,
      updatedAt: new Date().toISOString()
    })

    console.log('✅ Click tracked successfully - Firestore updated')

    // Build the final destination URL with all parameters
    const finalUrl = new URL(previewUrl)
    
    // Add all tracking parameters
    finalUrl.searchParams.set('click_id', clickId)
    finalUrl.searchParams.set('campaign_id', trackingData.campaignId || '')
    finalUrl.searchParams.set('affiliate_id', trackingData.affiliateId || '')
    finalUrl.searchParams.set('force_transparent', 'true')
    finalUrl.searchParams.set('source', 'tracking_system')
    finalUrl.searchParams.set('tracking_domain', host)
    
    if (trackingData.advertiserId) {
      finalUrl.searchParams.set('advertiser_id', trackingData.advertiserId)
    }

    console.log('🎯 Final Redirect URL:', finalUrl.toString())

    // Perform the redirect
    return NextResponse.redirect(finalUrl.toString(), 302)

  } catch (error) {
    console.error('💥 Error in TRACK API route:', error)
    return NextResponse.redirect('https://example.com')
  }
}