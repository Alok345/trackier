"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore"
import { firestore } from "@/lib/firestore"
// import { useToast } from "@/hooks/use-toast"
import { toast } from "react-hot-toast";

export function AddNewModal({ collectionName, onItemAdded, triggerText = "Add New" }) {
  const [open, setOpen] = useState(false)
  const [newItem, setNewItem] = useState("")
  const [isLoading, setIsLoading] = useState(false)
//   const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newItem.trim()) return

    setIsLoading(true)
    try {
      const docRef = doc(firestore, "dropdownMenu", collectionName)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        // Document exists, update the array
        await updateDoc(docRef, {
          items: arrayUnion(newItem.trim()),
        })
      } else {
        // Document doesn't exist, create it
        await setDoc(docRef, {
          items: [newItem.trim()],
        })
      }

    //   toast({
    //     title: "Success",
    //     description: `${newItem} has been added to ${collectionName}`,
    //   })
    toast.success(`${newItem} has been added to ${collectionName}`);

      onItemAdded?.(newItem.trim())
      setNewItem("")
      setOpen(false)
    } catch (error) {
      console.error("Error adding item:", error)
    //   toast({
    //     title: "Error",
    //     description: "Failed to add item. Please try again.",
    //     variant: "destructive",
    //   })
    toast.error("Failed to add item. Please try again.");
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2 bg-transparent">
          <Plus className="h-4 w-4 mr-1" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New {collectionName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newItem">Name</Label>
            <Input
              id="newItem"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder={`Enter new ${collectionName.toLowerCase()}`}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
