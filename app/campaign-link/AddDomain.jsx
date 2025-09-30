"use client"

import { useState } from "react"
import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore"
import { firestore } from "@/lib/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "react-hot-toast"

function AddDomain({ onSuccess, onCancel }) {
  const [domainName, setDomainName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!domainName.trim()) {
      toast.error("Please enter a domain name")
      return
    }

    setIsSubmitting(true)

    try {
      // Reference to the domain document in dropdownMenu collection
      const domainDocRef = doc(firestore, "dropdownMenu", "domain")
      
      // Check if the document exists
      const domainDoc = await getDoc(domainDocRef)
      
      const domainData = {
        name: domainName.trim(),
        status: "active",
        type: "tracking_domain",
        createdAt: new Date().toISOString(), // Store as ISO string
        updatedAt: new Date().toISOString()  // Store as ISO string
      }

      if (domainDoc.exists()) {
        // Document exists, update the domains array
        await updateDoc(domainDocRef, {
          domains: arrayUnion(domainData),
          updatedAt: serverTimestamp()
        })
      } else {
        // Document doesn't exist, create it with the first domain
        await setDoc(domainDocRef, {
          domains: [domainData],
          createdAt: serverTimestamp(),
        //   updatedAt: serverTimestamp()
        })
      }

      console.log("Domain added to array successfully!")
      toast.success("Domain added successfully!")
      
      // Reset form
      setDomainName("")
      
      // Call success callback
      if (onSuccess) {
        onSuccess()
      }

    } catch (error) {
      console.error("Error adding domain:", error)
      toast.error("Error adding domain: " + (error.message || "Unknown error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Domain</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domainName">Domain Name</Label>
            <Input
              id="domainName"
              placeholder="Enter domain name (e.g., example.com)"
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              Enter the domain name you want to add to the tracking system.
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!domainName.trim() || isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Domain"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default AddDomain