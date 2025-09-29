"use client"

import { useState, useRef } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownWithAdd } from "@/components/dropdown-with-add"
import { toast } from "react-hot-toast"
import { ChevronDown, ChevronUp } from "lucide-react"
import { firestore } from "@/lib/firestore"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"

const fetcher = (url) => fetch(url).then((r) => r.json())

export default function CreateCampaign() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const hasSubmitted = useRef(false)
  
  // Initial form state with proper array initialization
  const [formData, setFormData] = useState({
    model: "cpa",
    advertiser: "",
    title: "",
    description: "",
    kpi: "",
    trafficChannels: [], // Array for multiple selection
    previewUrl: "",
    conversionTracking: "postback",
    primaryTrackingDomain: "",
    conversionTrackingDomain: "",
    defaultCampaignUrl: "",
    termsConditions: "",
    requireTerms: false,
    status: "active",
    note: "",
    commissionType: "default",
    currency: "USD",
    revenue: "",
    geoCoverage: "ALL",
    payout: "",
    visibility: "public",
    defaultGoalName: "",
    defaultLandingPageName: "Default",
    appName: "",
    conversionFlow: "",
    unsubscribeUrl: "",
    suppressionUrl: "",
    appId: "",
    externalOfferId: "",
    publisherNotifyTime: "",
    publisherEmailNotify: "false",
    scheduleStatus: "false",
    uniqueClickSession: "",
    duplicateClickAction: "none",
    conversionHoldPeriod: "",
    conversionStatusAfterHold: "approved",
    devices: ["all"], // Array for multiple selection
    operatingSystem: "all",
    redirectType: "302",
    scheduledStatusToSet: "active",
    scheduledDate: "",
    scheduledTime: "",
    timeZone: "UTC",
    carrierTargeting: "",
    deepLink: "1",
    hasTimeTargeting: false,
    timezone: "UTC",
    startHour: 0,
    endHour: 0,
    enableInactiveHours: false,
    activeDays: [], // Array for multiple selection
  })

  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [showTimeTargeting, setShowTimeTargeting] = useState(false)
  const [showAllTokens, setShowAllTokens] = useState(false)
  const defaultUrlRef = useRef(null)

  const { data: tokens = [] } = useSWR("/pasted-text.json", fetcher)

  // Enhanced input change handler to handle different value types
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Special handler for array fields to ensure they remain arrays
  const handleArrayInputChange = (field, value) => {
    // If value is already an array, use it directly
    if (Array.isArray(value)) {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    } 
    // If value is a string, convert to array (for single selection compatibility)
    else if (typeof value === 'string') {
      setFormData((prev) => ({
        ...prev,
        [field]: [value],
      }))
    }
    // For other types, ensure it's an array
    else {
      setFormData((prev) => ({
        ...prev,
        [field]: value ? [value] : [],
      }))
    }
  }

  // Handler for multi-select fields
  const handleMultiSelectChange = (field, selectedValues) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Array.isArray(selectedValues) ? selectedValues : [selectedValues],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (isSubmitting || hasSubmitted.current) return
    
    setIsSubmitting(true)
    hasSubmitted.current = true

    try {
      // Basic validation
      if (!formData.title || !formData.advertiser || !formData.defaultCampaignUrl) {
        toast.error("Please fill in all required fields")
        hasSubmitted.current = false
        setIsSubmitting(false)
        return
      }

      // Prepare data for Firestore with proper type conversion
      const campaignData = {
        ...formData,
        // Ensure arrays are properly formatted
        trafficChannels: Array.isArray(formData.trafficChannels) ? formData.trafficChannels : [],
        devices: Array.isArray(formData.devices) ? formData.devices : ["all"],
        activeDays: Array.isArray(formData.activeDays) ? formData.activeDays : [],
        
        // Convert numeric fields
        revenue: formData.revenue ? parseFloat(formData.revenue) : 0,
        payout: formData.payout ? parseFloat(formData.payout) : 0,
        startHour: Number.parseInt(formData.startHour) || 0,
        endHour: Number.parseInt(formData.endHour) || 0,
        
        // Convert boolean fields
        requireTerms: Boolean(formData.requireTerms),
        hasTimeTargeting: Boolean(formData.hasTimeTargeting),
        enableInactiveHours: Boolean(formData.enableInactiveHours),
        
        // Ensure string fields
        scheduleStatus: String(formData.scheduleStatus),
        publisherEmailNotify: String(formData.publisherEmailNotify),
        
        // Add timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      console.log("Submitting campaign data:", campaignData)

      // Add to Firestore
      const docRef = await addDoc(collection(firestore, 'campaigns'), campaignData)
      
      console.log("Campaign created with ID: ", docRef.id)
      toast.success("Campaign created successfully!")
      
    } catch (error) {
      console.error("Error adding campaign to Firestore: ", error)
      toast.error("Error creating campaign: " + (error.message || "Unknown error"))
      hasSubmitted.current = false
    } finally {
      setIsSubmitting(false)
    }
  }

  const currencyOptions = [
    { value: "USD", label: "$ USD" },
    { value: "EUR", label: "€ EUR" },
    { value: "GBP", label: "£ GBP" },
    { value: "INR", label: "₹ INR" },
    { value: "JPY", label: "¥ JPY" },
    { value: "CAD", label: "$ CAD" },
    { value: "AUD", label: "$ AUD" },
  ]

  const trackingDomainOptions = [
    "sgs.gotrackier.com - HTTPS (Secure)",
    "ad2click.gotrackier.com - HTTPS (Secure)",
    "trk.rythmworld.in - HTTPS (Secure)",
  ]

  const deviceOptions = [
    { value: "all", label: "ALL" },
    { value: "desktop", label: "Desktop" },
    { value: "mobile", label: "Mobile" },
    { value: "tablet", label: "Tablet" },
  ]

  const insertToken = (token) => {
    const textarea = defaultUrlRef.current
    const current = formData.defaultCampaignUrl || ""

    if (!textarea) {
      handleInputChange("defaultCampaignUrl", current + (current && !/\s$/.test(current) ? " " : "") + token)
      return
    }

    const start = textarea.selectionStart ?? current.length
    const end = textarea.selectionEnd ?? current.length

    const before = current.slice(0, start)
    const after = current.slice(end)

    const needsSpaceBefore = before && !/\s$/.test(before) && !/[?&]$/.test(before)
    const needsSpaceAfter = after && !/^\s/.test(after)

    const insert = (needsSpaceBefore ? " " : "") + token + (needsSpaceAfter ? " " : "")
    const next = before + insert + after

    handleInputChange("defaultCampaignUrl", next)

    requestAnimationFrame(() => {
      const pos = (before + insert).length
      if (textarea.setSelectionRange) {
        textarea.setSelectionRange(pos, pos)
      }
      textarea.focus()
    })
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center px-4 bg-gray-50 shadow-sm">
          <SidebarTrigger className="-ml-1" />
          <h1 className="ml-4 text-lg font-semibold">Create Campaign</h1>
        </header>

        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Details Section */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Campaign Objective */}
                <div className="space-y-3">
                  <Label htmlFor="campaign-objective">Choose an Objective</Label>
                  <Select value={formData.model} onValueChange={(value) => handleInputChange("model", value)}>
                    <SelectTrigger id="campaign-objective" className="w-full">
                      <SelectValue placeholder="Select campaign objective" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpa">Conversions (CPA)</SelectItem>
                      <SelectItem value="cps">Sale (CPS)</SelectItem>
                      <SelectItem value="cpi">App Installs (CPI)</SelectItem>
                      <SelectItem value="cpl">Leads (CPL)</SelectItem>
                      <SelectItem value="cpm">Impressions (CPM)</SelectItem>
                      <SelectItem value="cpc">Clicks (CPC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Advertiser */}
                <div className="space-y-2">
                  <Label htmlFor="advertiser">Advertiser</Label>
                  <DropdownWithAdd
                    collectionName="advertisers"
                    placeholder="Select advertiser"
                    value={formData.advertiser}
                    onValueChange={(value) => handleInputChange("advertiser", value)}
                    className="w-full"
                  />
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    maxLength={250}
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={4}
                  />
                </div>

                {/* KPI */}
                <div className="space-y-2">
                  <Label htmlFor="kpi">KPI (Optional)</Label>
                  <Textarea
                    id="kpi"
                    value={formData.kpi}
                    onChange={(e) => handleInputChange("kpi", e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Traffic Channels - Updated for array handling */}
                <div className="space-y-2">
                  <Label>Allowed Traffic Channels</Label>
                  <DropdownWithAdd
                    collectionName="trafficChannels"
                    placeholder="Choose one or more traffic channels"
                    value={formData.trafficChannels}
                    onValueChange={(value) => handleMultiSelectChange("trafficChannels", value)}
                    isMultiSelect={true}
                    className="w-full"
                  />
                </div>

                {/* Preview URL */}
                <div className="space-y-2">
                  <Label htmlFor="previewUrl">Preview URL</Label>
                  <Input
                    id="previewUrl"
                    type="url"
                    value={formData.previewUrl}
                    onChange={(e) => handleInputChange("previewUrl", e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">Link to preview landing page which publishers can see</p>
                </div>

                {/* Conversion Tracking */}
                <div className="space-y-2">
                  <Label>Conversion Tracking</Label>
                  <Select
                    value={formData.conversionTracking}
                    onValueChange={(value) => handleInputChange("conversionTracking", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postback">Server Postback</SelectItem>
                      <SelectItem value="iframe_https">HTTPS IFrame Pixel</SelectItem>
                      <SelectItem value="image_https">HTTPS Image Pixel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Primary Tracking Domain */}
                <div className="space-y-2">
                  <Label>Primary Tracking Domain (Optional)</Label>
                  <DropdownWithAdd
                    collectionName="trackingDomains"
                    placeholder="Select tracking domain"
                    value={formData.primaryTrackingDomain}
                    onValueChange={(value) => handleInputChange("primaryTrackingDomain", value)}
                    staticOptions={trackingDomainOptions}
                    className="w-full"
                  />
                </div>

                {/* Default Campaign URL */}
                <div className="space-y-2">
                  <Label htmlFor="defaultCampaignUrl">Default Campaign URL</Label>
                  <Textarea
                    id="defaultCampaignUrl"
                    ref={defaultUrlRef}
                    value={formData.defaultCampaignUrl}
                    onChange={(e) => handleInputChange("defaultCampaignUrl", e.target.value)}
                    required
                    rows={3}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(showAllTokens ? tokens : tokens.slice(0, 20)).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => insertToken(t)}
                        className="border rounded px-2 py-1 text-xs bg-background hover:bg-muted text-foreground"
                        aria-label={`Insert token ${t}`}
                        title={`Insert ${t}`}
                      >
                        {t}
                      </button>
                    ))}
                    {tokens.length > 20 && (
                      <button
                        type="button"
                        onClick={() => setShowAllTokens(!showAllTokens)}
                        className="text-sm underline text-primary"
                        aria-expanded={showAllTokens}
                      >
                        {showAllTokens ? "View less" : "View more"}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The campaign URL where traffic will redirect to. Optional variables can be used in URL.
                  </p>
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-2">
                  <Label htmlFor="termsConditions">Terms and Conditions</Label>
                  <Textarea
                    id="termsConditions"
                    value={formData.termsConditions}
                    onChange={(e) => handleInputChange("termsConditions", e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Require Terms and Conditions */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requireTerms"
                    checked={formData.requireTerms}
                    onCheckedChange={(checked) => handleInputChange("requireTerms", checked)}
                  />
                  <Label htmlFor="requireTerms">Require Terms and Conditions</Label>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="deleted">Deleted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Note */}
                <div className="space-y-2">
                  <Label htmlFor="note">Note (Optional)</Label>
                  <Textarea
                    id="note"
                    value={formData.note}
                    onChange={(e) => handleInputChange("note", e.target.value)}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    The content will not be displayed to advertiser or publisher
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Revenue and Payout Section */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue and Payout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Currency */}
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <DropdownWithAdd
                    collectionName="currencies"
                    placeholder="Select currency"
                    value={formData.currency}
                    onValueChange={(value) => handleInputChange("currency", value)}
                    staticOptions={currencyOptions}
                    className="w-full"
                  />
                </div>

                {/* Revenue */}
                <div className="space-y-2">
                  <Label htmlFor="revenue">Revenue</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                      {formData.currency}
                    </span>
                    <Input
                      id="revenue"
                      type="number"
                      value={formData.revenue}
                      onChange={(e) => handleInputChange("revenue", e.target.value)}
                      placeholder="Charged from advertiser. Eg: 0.3"
                      min="0"
                      step="0.000001"
                      required
                      className="rounded-l-none"
                    />
                  </div>
                </div>

                {/* Geo Coverage */}
                <div className="space-y-2">
                  <Label htmlFor="geoCoverage">Geo Coverage</Label>
                  <DropdownWithAdd
                    collectionName="geoCoverage"
                    placeholder="Start typing GEOs..."
                    value={formData.geoCoverage}
                    onValueChange={(value) => handleInputChange("geoCoverage", value)}
                    staticOptions={["ALL"]}
                    className="w-full"
                  />
                </div>

                {/* Payout */}
                <div className="space-y-2">
                  <Label htmlFor="payout">Payout</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                      {formData.currency}
                    </span>
                    <Input
                      id="payout"
                      type="number"
                      value={formData.payout}
                      onChange={(e) => handleInputChange("payout", e.target.value)}
                      placeholder="Pay to publisher"
                      min="0"
                      step="0.000001"
                      required
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card>
              <CardHeader>
                <CardTitle
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                >
                  Advanced Settings
                  {showAdvancedSettings ? <ChevronUp /> : <ChevronDown />}
                </CardTitle>
              </CardHeader>
              {showAdvancedSettings && (
                <CardContent className="space-y-6">
                  {/* Visibility */}
                  <div className="space-y-3">
                    <Label>Visibility (Optional)</Label>
                    <RadioGroup
                      value={formData.visibility}
                      onValueChange={(value) => handleInputChange("visibility", value)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="public" id="public" />
                        <Label htmlFor="public">Public</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="private" id="private" />
                        <Label htmlFor="private">Private</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="permission" id="permission" />
                        <Label htmlFor="permission">Ask for Permission</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Default Goal Name */}
                  <div className="space-y-2">
                    <Label htmlFor="defaultGoalName">Default Goal Name</Label>
                    <Input
                      id="defaultGoalName"
                      value={formData.defaultGoalName}
                      onChange={(e) => handleInputChange("defaultGoalName", e.target.value)}
                    />
                  </div>

                  {/* App Name */}
                  <div className="space-y-2">
                    <Label htmlFor="appName">App Name (Optional)</Label>
                    <Input
                      id="appName"
                      value={formData.appName}
                      onChange={(e) => handleInputChange("appName", e.target.value)}
                    />
                  </div>

                  {/* Devices - Updated for array handling */}
                  <div className="space-y-2">
                    <Label>Devices</Label>
                    <DropdownWithAdd
                      collectionName="devices"
                      placeholder="Choose one or more devices"
                      value={formData.devices}
                      onValueChange={(value) => handleMultiSelectChange("devices", value)}
                      isMultiSelect={true}
                      staticOptions={deviceOptions}
                      className="w-full"
                    />
                  </div>

                  {/* Operating System */}
                  <div className="space-y-2">
                    <Label>Operating System</Label>
                    <DropdownWithAdd
                      collectionName="operatingSystems"
                      placeholder="Select operating system"
                      value={formData.operatingSystem}
                      onValueChange={(value) => handleInputChange("operatingSystem", value)}
                      staticOptions={[
                        { value: "all", label: "ALL" },
                        { value: "android", label: "Android" },
                        { value: "ios", label: "iOS" },
                        { value: "windows", label: "Windows OS" },
                        { value: "macOs", label: "Mac OS" },
                      ]}
                      className="w-full"
                    />
                  </div>

                  {/* Carrier Targeting */}
                  <div className="space-y-2">
                    <Label htmlFor="carrierTargeting">Carrier Targeting</Label>
                    <DropdownWithAdd
                      collectionName="carriers"
                      placeholder="Start typing ISPs..."
                      value={formData.carrierTargeting}
                      onValueChange={(value) => handleInputChange("carrierTargeting", value)}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Redirect Type</Label>
                    <Select
                      value={formData.redirectType}
                      onValueChange={(value) => handleInputChange("redirectType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="302">302</SelectItem>
                        <SelectItem value="302 with Hide Reffer">302 with Hide Reffer</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                        <SelectItem value="200 with Hide Reffer">200 with Hide Reffer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Schedule Status</Label>
                    <Select
                      value={formData.scheduleStatus}
                      onValueChange={(value) => handleInputChange("scheduleStatus", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select schedule status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">True</SelectItem>
                        <SelectItem value="false">False</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.scheduleStatus === "true" && (
                    <div className="space-y-4 mt-4">
                      {/* Status Dropdown */}
                      <div className="space-y-2">
                        <Label>Status to be set</Label>
                        <Select
                          value={formData.scheduledStatusToSet}
                          onValueChange={(value) => handleInputChange("scheduledStatusToSet", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                            <SelectItem value="deleted">Deleted</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Schedule Date */}
                      <div className="space-y-2">
                        <Label>Schedule Date</Label>
                        <Input
                          type="datetime-local"
                          value={formData.scheduleDate}
                          onChange={(e) => handleInputChange("scheduleDate", e.target.value)}
                        />
                      </div>

                      {/* Publisher Email Notify Time (Manual) */}
                      <div className="space-y-2">
                        <Label>Publisher Email Notify (Manual)</Label>
                        <Select
                          value={formData.publisherEmailNotify}
                          onValueChange={(value) => handleInputChange("publisherEmailNotify", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Publisher Notify Time */}
                      <div className="space-y-2">
                        <Label>Publisher Notify Time</Label>
                        <Input
                          type="datetime-local"
                          value={formData.publisherNotifyTime}
                          onChange={(e) => handleInputChange("publisherNotifyTime", e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Time Targeting */}
            <Card>
              <CardHeader>
                <CardTitle
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setShowTimeTargeting(!showTimeTargeting)}
                >
                  Time Targeting
                  {showTimeTargeting ? <ChevronUp /> : <ChevronDown />}
                </CardTitle>
              </CardHeader>
              {showTimeTargeting && (
                <CardContent className="space-y-6">
                  {/* Enable Time Targeting */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasTimeTargeting"
                      checked={formData.hasTimeTargeting}
                      onCheckedChange={(checked) => handleInputChange("hasTimeTargeting", checked)}
                    />
                    <Label htmlFor="hasTimeTargeting">Enable Time Targeting</Label>
                  </div>

                  {formData.hasTimeTargeting && (
                    <>
                      {/* Timezone */}
                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <DropdownWithAdd
                          collectionName="timezones"
                          placeholder="Select timezone"
                          value={formData.timezone}
                          onValueChange={(value) => handleInputChange("timezone", value)}
                          staticOptions={[
                            { value: "UTC", label: "(GMT) UTC" },
                            {
                              value: "America/New_York",
                              label: "(GMT-05:00) Eastern Time (US & Canada)",
                            },
                            {
                              value: "America/Chicago",
                              label: "(GMT-06:00) Central Time (US & Canada)",
                            },
                            {
                              value: "America/Denver",
                              label: "(GMT-07:00) Mountain Time (US & Canada)",
                            },
                            {
                              value: "America/Los_Angeles",
                              label: "(GMT-08:00) Pacific Time (US & Canada)",
                            },
                            {
                              value: "Asia/Kolkata",
                              label: "(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi",
                            },
                          ]}
                          className="w-full"
                        />
                      </div>

                      {/* Start Hour */}
                      <div className="space-y-2">
                        <Label htmlFor="startHour">Start Hour (24 Hour format)</Label>
                        <Input
                          id="startHour"
                          type="number"
                          min="0"
                          max="23"
                          value={formData.startHour}
                          onChange={(e) => handleInputChange("startHour", Number.parseInt(e.target.value) || 0)}
                        />
                      </div>

                      {/* End Hour */}
                      <div className="space-y-2">
                        <Label htmlFor="endHour">End Hour (24 Hour format)</Label>
                        <Input
                          id="endHour"
                          type="number"
                          min="0"
                          max="23"
                          value={formData.endHour}
                          onChange={(e) => handleInputChange("endHour", Number.parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Campaign"}
              </Button>
            </div>
          </form>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}