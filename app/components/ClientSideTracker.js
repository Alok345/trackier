"use client";

import { useEffect } from 'react';

export default function ClientSideTracker({ affiliateId, clickId, campaignId, publisherId }) {
  useEffect(() => {
    const captureFinalUrl = async () => {
      try {
        // Wait a bit for all redirects to complete
        setTimeout(async () => {
          const finalUrl = window.location.href;
          
          console.log('🎯 Client-side final URL captured:', finalUrl);
          
          // Extract parameters
          const urlObj = new URL(finalUrl);
          const params = {};
          urlObj.searchParams.forEach((value, key) => {
            params[key] = value;
          });
          
          // Send to API
          const response = await fetch('/api/capture-final', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              affiliateId,
              clickId,
              campaignId,
              publisherId,
              finalUrl,
              parameters: params,
              userAgent: navigator.userAgent,
              referrer: document.referrer
            })
          });
          
          if (response.ok) {
            console.log('✅ Final URL captured and stored');
          }
        }, 2000); // Wait 2 seconds for redirects to complete
        
      } catch (error) {
        console.error('Client-side tracking error:', error);
      }
    };

    captureFinalUrl();
  }, [affiliateId, clickId, campaignId, publisherId]);

  return null;
}