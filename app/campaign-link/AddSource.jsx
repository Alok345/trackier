"use client"

import { useState } from "react"
import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore"
import { firestore } from "@/lib/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "react-hot-toast"

export default function AddSource({ onSuccess, onCancel }) {
  const [sourceName, setSourceName] = useState("") // Fixed: setSourceName not setsourceName
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!sourceName.trim()) {
      toast.error("Please enter a source name")
      return
    }

    setIsSubmitting(true)

    try {
      // Reference to the source document in dropdownMenu collection
      const sourceDocRef = doc(firestore, "dropdownMenu", "source")
      
      // Check if the document exists
      const sourceDoc = await getDoc(sourceDocRef)
      
      const sourceData = {
        name: sourceName.trim(),
        status: "active",
        type: "tracking_source",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (sourceDoc.exists()) {
        // Document exists, update the sources array
        await updateDoc(sourceDocRef, {
          sources: arrayUnion(sourceData),
          updatedAt: serverTimestamp()
        })
      } else {
        // Document doesn't exist, create it with the first source
        await setDoc(sourceDocRef, {
          sources: [sourceData],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      }

      console.log("Source added to array successfully!")
      toast.success("Source added successfully!")
      
      // Reset form
      setSourceName("")
      
      // Call success callback
      if (onSuccess) {
        onSuccess()
      }

    } catch (error) {
      console.error("Error adding source:", error)
      toast.error("Error adding source: " + (error.message || "Unknown error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Source</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sourceName">Source Name</Label>
            <Input
              id="sourceName"
              placeholder="Enter source name (e.g., facebook, google, email)"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              Enter the source name you want to add to the tracking system.
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
              disabled={!sourceName.trim() || isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Source"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}