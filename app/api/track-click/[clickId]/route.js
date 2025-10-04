// app/api/track-click/[clickId]/route.js

import { NextResponse } from 'next/server'
import { doc, getDoc } from 'firebase/firestore'
import { firestore } from '@/lib/firestore'

export async function GET(request, { params }) {
  const { clickId } = params

  if (!clickId) {
    return NextResponse.json({ error: 'Missing click ID' }, { status: 400 })
  }

  try {
    // Find the tracking document
    const docRef = doc(firestore, "affiliateLinks", clickId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      console.log('Tracking document not found for clickId:', clickId)
      return NextResponse.redirect('https://example.com')
    }

    const trackingData = docSnap.data()
    
    // Redirect to demo page with all parameters
    const demoUrl = new URL('/demo', request.url)
    demoUrl.searchParams.set('click_id', clickId)
    demoUrl.searchParams.set('affiliate_id', trackingData.affiliateId || '')
    demoUrl.searchParams.set('campaign_id', trackingData.campaignId || '')
    demoUrl.searchParams.set('advertiser_id', trackingData.advertiserId || '')
    demoUrl.searchParams.set('publisher_id', trackingData.publisherId || '')
    demoUrl.searchParams.set('source', trackingData.source || '')
    demoUrl.searchParams.set('domain', trackingData.domainUrl || '')

    return NextResponse.redirect(demoUrl.toString())

  } catch (error) {
    console.error('Error tracking click:', error)
    return NextResponse.redirect('https://example.com')
  }
}