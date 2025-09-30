import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { firestore } from "@/lib/firestore"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from "@/components/ui/dialog"

const AdvertiserDropdown = ({ value, onValueChange, className }) => {
  const [advertisers, setAdvertisers] = useState([])
  const [newAdvertiser, setNewAdvertiser] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [showModal, setShowModal] = useState(false) // State to control modal visibility

  // Fetch advertisers from Firestore
  useEffect(() => {
    const fetchAdvertisers = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "advertisers"))
        const advertisersData = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          advertisersData.push({
            id: doc.id,
            ...data
          })
        })
        setAdvertisers(advertisersData)
      } catch (error) {
        console.error("Error fetching advertisers:", error)
      }
    }

    fetchAdvertisers()
  }, [])

  // Generate advertiser ID
  const generateAdvertiserId = (name) => {
    const cleanName = name
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 20)
    
    const timestamp = Date.now().toString().slice(-4)
    const randomStr = Math.random().toString(36).substring(2, 5)
    
    return `adv-${cleanName}-${timestamp}${randomStr}`
  }

  const handleAddAdvertiser = async () => {
    if (!newAdvertiser.trim()) return

    try {
      setIsAdding(true)
      const advertiserId = generateAdvertiserId(newAdvertiser)
      const displayValue = `${newAdvertiser.trim()} (${advertiserId})`

      // Save to Firestore
      const advertiserData = {
        name: newAdvertiser.trim(),
        advertiserId: advertiserId,
        displayName: displayValue,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const advertiserDocRef = doc(collection(firestore, "advertisers"), advertiserId)
      await setDoc(advertiserDocRef, advertiserData)

      // Update local state
      setAdvertisers(prev => [...prev, advertiserData])

      // Set the selected value
      onValueChange(displayValue)

      // Close the modal and reset form after successful submission
      setShowModal(false)
      setNewAdvertiser("")
    } catch (error) {
      console.error("Error adding advertiser:", error)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Select advertiser" />
        </SelectTrigger>
        <SelectContent>
          {advertisers.map((advertiser) => (
            <SelectItem 
              key={advertiser.advertiserId} 
              value={`${advertiser.name} (${advertiser.advertiserId})`}
            >
              {advertiser.name} ({advertiser.advertiserId})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Add New Advertiser Button */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogTrigger asChild>
          <Button size="sm">Add Advertiser</Button>
        </DialogTrigger>

        {/* Modal Content */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a New Advertiser</DialogTitle>
          </DialogHeader>

          {/* Input for new advertiser */}
          <Input
            placeholder="Enter advertiser name"
            value={newAdvertiser}
            onChange={(e) => setNewAdvertiser(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddAdvertiser()}
          />

          {/* Submit Button */}
          <div className="mt-4 flex gap-2">
            <Button 
              onClick={handleAddAdvertiser} 
              disabled={!newAdvertiser.trim() || isAdding}
              size="sm"
            >
              {isAdding ? "Adding..." : "Submit"}
            </Button>
            <DialogClose asChild>
              <Button variant="secondary" size="sm">Cancel</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdvertiserDropdown
