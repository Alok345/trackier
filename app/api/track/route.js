import { NextResponse } from 'next/server'
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { firestore } from '@/lib/firestore'
import { generateClickId } from '@/lib/affiliateUtils'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const forceTransparent = searchParams.get('force_transparent')
  let clickId = searchParams.get('click_id')

  console.log('🎯 TRACK API Route Called - Params:', { forceTransparent, clickId })

  // Make force_transparent optional; generate clickId when missing
  if (!clickId) {
    clickId = generateClickId()
    console.log('🆕 Generated clickId:', clickId)
    // Create a placeholder document so subsequent updates work even if none exists yet
    try {
      await setDoc(doc(firestore, 'affiliateLinks', clickId), {
        clickId,
        status: 'generated',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true })
    } catch (e) {
      console.error('Failed to create placeholder affiliateLinks doc:', e)
    }
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

    // Redirect directly to the preview URL (do not append tracking params)
    return NextResponse.redirect(previewUrl, 302)

  } catch (error) {
    console.error('💥 Error in TRACK API route:', error)
    return NextResponse.redirect('https://example.com')
  }
}