"use client"

import { useState } from "react"
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { firestore } from "@/lib/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "react-hot-toast"

export default function AddPublisher({ onSuccess, onCancel }) {
  const [publisherIdStart, setPublisherIdStart] = useState("")
  const [publisherIdEnd, setPublisherIdEnd] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!publisherIdStart.trim() || !publisherIdEnd.trim()) {
      toast.error("Please enter both start and end publisher IDs")
      return
    }

    setIsSubmitting(true)

    try {
      // Reference to dropdownMenu collection with auto-generated ID
      const newDocRef = doc(firestore, "dropdownMenu","publisherId")

      const publisherData = {
        publisherIdStart: publisherIdStart.trim(),
        publisherIdEnd: publisherIdEnd.trim(),
        status: "active",
        type: "publisher_range",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      await setDoc(newDocRef, publisherData)

      console.log("Publisher range added successfully:", newDocRef.id)
      toast.success("Publisher range added successfully!")

      // Reset form
      setPublisherIdStart("")
      setPublisherIdEnd("")

      // Call success callback
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error adding publisher range:", error)
      toast.error("Error: " + (error.message || "Unknown error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      {/* <CardHeader>
        <CardTitle>Add Publisher Range</CardTitle>
      </CardHeader> */}
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="publisherIdStart">Publisher ID Start</Label>
            <Input
              id="publisherIdStart"
              placeholder="Enter starting publisher ID"
              value={publisherIdStart}
              onChange={(e) => setPublisherIdStart(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="publisherIdEnd">Publisher ID End</Label>
            <Input
              id="publisherIdEnd"
              placeholder="Enter ending publisher ID"
              value={publisherIdEnd}
              onChange={(e) => setPublisherIdEnd(e.target.value)}
              required
            />
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
              disabled={!publisherIdStart.trim() || !publisherIdEnd.trim() || isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Publisher Range"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
