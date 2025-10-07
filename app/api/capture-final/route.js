import { NextResponse } from 'next/server';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/lib/firestore";

export async function POST(request) {
  try {
    const body = await request.json();
    
    const { affiliateId, clickId, finalUrl, parameters, campaignId, publisherId } = body;

    console.log('🎯 Capturing final URL from client:', finalUrl);
    console.log('📊 Client parameters:', parameters);

    if (!affiliateId || !clickId || !finalUrl) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Store in clientFinalUrls collection
    const clientDocRef = doc(firestore, "clientFinalUrls", affiliateId);
    const clientDocSnap = await getDoc(clientDocRef);

    const captureData = {
      clickId,
      finalUrl,
      parameters,
      capturedAt: new Date().toISOString(),
      metadata: {
        campaignId,
        publisherId,
        source: 'client_side',
        hasClickref: !!parameters.clickref,
        clickrefValue: parameters.clickref || '',
        userAgent: body.userAgent,
        referrer: body.referrer
      }
    };

    if (clientDocSnap.exists()) {
      await updateDoc(clientDocRef, {
        captures: arrayUnion(captureData),
        totalCaptures: (clientDocSnap.data().totalCaptures || 0) + 1,
        lastCapture: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(clientDocRef, {
        affiliateId,
        captures: [captureData],
        totalCaptures: 1,
        firstCapture: new Date().toISOString(),
        lastCapture: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    // Also update the finalUrls collection with the client-side data
    await updateFinalUrlsWithClientData(affiliateId, clickId, finalUrl, parameters, {
      campaignId,
      publisherId
    });

    console.log('✅ Client-side final URL stored with clickref:', parameters.clickref);

    return new Response(JSON.stringify({ 
      success: true,
      clickref: parameters.clickref 
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('Error capturing final URL:', error);
    return new Response(JSON.stringify({ error: 'Capture failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}

async function updateFinalUrlsWithClientData(affiliateId, clickId, finalUrl, parameters, metadata) {
  try {
    const finalDocRef = doc(firestore, "finalUrls", affiliateId);
    const finalDocSnap = await getDoc(finalDocRef);

    if (finalDocSnap.exists()) {
      const finalUrls = finalDocSnap.data().finalUrls || [];
      
      // Find and update the existing entry with the same clickId
      const updatedFinalUrls = finalUrls.map(entry => {
        if (entry.clickId === clickId) {
          return {
            ...entry,
            finalUrl: finalUrl, // Update with client-side URL
            parameters: parameters, // Update with client-side parameters
            clientCaptured: true,
            clientCapturedAt: new Date().toISOString(),
            metadata: {
              ...entry.metadata,
              clickref: parameters.clickref || '',
              hasClickref: !!parameters.clickref,
              clientVerified: true
            }
          };
        }
        return entry;
      });

      await updateDoc(finalDocRef, {
        finalUrls: updatedFinalUrls,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Updated finalUrls with client-side data');
    }
  } catch (error) {
    console.error('Error updating finalUrls:', error);
  }
}