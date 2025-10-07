"use client";

import { useEffect } from 'react';

export default function FinalUrlTracker({ affiliateId, clickId, campaignId, publisherId }) {
  useEffect(() => {
    const trackFinalUrl = async () => {
      try {
        // Get the final URL after all redirects
        const finalUrl = window.location.href;
        
        console.log('🎯 Client-side final URL:', finalUrl);
        
        // Send to tracking API
        const trackUrl = new URL('/api/track-final', window.location.origin);
        trackUrl.searchParams.set('final_url', finalUrl);
        trackUrl.searchParams.set('click_id', clickId);
        trackUrl.searchParams.set('affiliate_id', affiliateId);
        trackUrl.searchParams.set('campaign_id', campaignId || '');
        trackUrl.searchParams.set('pub_id', publisherId || '');

        await fetch(trackUrl.toString());
        
        console.log('✅ Final URL tracked from client');
        
      } catch (error) {
        console.error('Client-side tracking error:', error);
      }
    };

    // Track after page loads
    if (window.location.href !== 'about:blank') {
      trackFinalUrl();
    }
  }, [affiliateId, clickId, campaignId, publisherId]);

  return null;
}