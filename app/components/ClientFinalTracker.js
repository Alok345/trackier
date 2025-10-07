"use client";

import { useEffect } from 'react';

export default function ClientFinalTracker({ affiliateId, clickId, campaignId, publisherId }) {
  useEffect(() => {
    const captureFinalUrl = async () => {
      try {
        // Wait for the page to fully load and any JS to execute
        setTimeout(async () => {
          const finalUrl = window.location.href;
          
          console.log('🎯 Client-side final URL captured:', finalUrl);
          
          // Extract parameters from the actual browser URL
          const urlObj = new URL(finalUrl);
          const params = {};
          urlObj.searchParams.forEach((value, key) => {
            params[key] = value;
          });
          
          console.log('📊 Client-side parameters:', params);
          
          // Only send if we have meaningful data (not just the initial redirect)
          if (params.clickref && params.clickref !== '') {
            await fetch('/api/capture-final', {
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
                referrer: document.referrer,
                timestamp: new Date().toISOString()
              })
            });
            console.log('✅ Final URL with clickref captured and stored');
          }
        }, 3000); // Wait 3 seconds for all JS to execute and clickref to be generated
        
      } catch (error) {
        console.error('Client-side tracking error:', error);
      }
    };

    captureFinalUrl();
  }, [affiliateId, clickId, campaignId, publisherId]);

  return null;
}