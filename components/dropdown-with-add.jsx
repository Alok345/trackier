"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AddNewModal } from "./add-new-modal"
import { doc, getDoc } from "firebase/firestore"
import { firestore } from "@/lib/firestore"

export function DropdownWithAdd({ 
  collectionName, 
  placeholder, 
  value, 
  onValueChange, 
  staticOptions = [], 
  className,
  isMultiSelect = false 
}) {
  const [options, setOptions] = useState(staticOptions)
  const [loading, setLoading] = useState(false)

  const loadOptions = async () => {
    if (!collectionName) return

    setLoading(true)
    try {
      const docRef = doc(firestore, "dropdownMenu", collectionName)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        const firestoreOptions = data.items || []
        
        // Merge static options with Firestore options, avoiding duplicates
        const mergedOptions = [...staticOptions]
        firestoreOptions.forEach(item => {
          if (!mergedOptions.some(opt => 
            (typeof opt === 'string' ? opt : opt.value) === 
            (typeof item === 'string' ? item : item.value)
          )) {
            mergedOptions.push(item)
          }
        })
        
        setOptions(mergedOptions)
      } else {
        setOptions(staticOptions)
      }
    } catch (error) {
      console.error("Error loading options:", error)
      setOptions(staticOptions)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOptions()
  }, [collectionName])

  const handleItemAdded = (newItem) => {
    setOptions((prev) => {
      // Check if item already exists to avoid duplicates
      const exists = prev.some(opt => 
        (typeof opt === 'string' ? opt : opt.value) === 
        (typeof newItem === 'string' ? newItem : newItem.value)
      )
      
      if (exists) return prev
      return [...prev, newItem]
    })
    
    // Auto-select the newly added item
    if (isMultiSelect) {
      // For multi-select, add to existing values
      const currentValues = Array.isArray(value) ? value : (value ? [value] : [])
      if (!currentValues.includes(newItem.value || newItem)) {
        onValueChange([...currentValues, newItem.value || newItem])
      }
    } else {
      // For single select, set as value
      onValueChange(newItem.value || newItem)
    }
  }

  const handleValueChange = (newValue) => {
    if (isMultiSelect) {
      // For multi-select, handle array of values
      const valuesArray = Array.isArray(newValue) ? newValue : [newValue]
      onValueChange(valuesArray)
    } else {
      // For single select
      onValueChange(newValue)
    }
  }

  // Format display value for multi-select
  const getDisplayValue = () => {
    if (isMultiSelect && Array.isArray(value) && value.length > 0) {
      return `${value.length} selected`
    }
    if (!isMultiSelect && value) {
      // Find the label for the value
      const selectedOption = options.find(opt => 
        (typeof opt === 'string' ? opt : opt.value) === value
      )
      return typeof selectedOption === 'string' ? selectedOption : (selectedOption?.label || value)
    }
    return ""
  }

  return (
    <div className="flex items-center space-x-2">
      <Select 
        value={isMultiSelect ? undefined : value} 
        onValueChange={handleValueChange}
        disabled={loading}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={loading ? "Loading..." : placeholder}>
            {getDisplayValue()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option, index) => {
            const optionValue = typeof option === "string" ? option : option.value
            const optionLabel = typeof option === "string" ? option : option.label
            
            return (
              <SelectItem 
                key={index} 
                value={optionValue}
              >
                {optionLabel}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
      {collectionName && <AddNewModal collectionName={collectionName} onItemAdded={handleItemAdded} />}
    </div>
  )
}