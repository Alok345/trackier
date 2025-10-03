"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, orderBy, query, where, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { firestore } from "@/lib/firestore"
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Copy, Link, Search, X } from "lucide-react"
import { toast } from "react-hot-toast"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { generateClickId } from "@/lib/affiliateUtils"
import AddDomain from "./AddDomain";

export default function CreateCampaignLink() {
  const [campaigns, setCampaigns] = useState([])
  const [advertisers, setAdvertisers] = useState([])
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [links, setLinks] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [showAddDomain, setShowAddDomain] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    domainUrl: "",
    campaignId: "",
    advertiserId: "all"
  })

  // Get current authenticated user
  useEffect(() => {
    const auth = getAuth()
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user)
        // Fetch user profile from Firestore
        await fetchUserProfile(user.uid)
      } else {
        setCurrentUser(null)
        setUserProfile(null)
        toast.error("Please log in to access this page")
      }
    })

    return () => unsubscribe()
  }, [])

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid) => {
    try {
      const userDocRef = doc(firestore, "users", uid)
      const userDoc = await getDoc(userDocRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setUserProfile(userData)
        console.log("User Profile:", userData)
      } else {
        console.log("No user profile found")
        toast.error("User profile not found")
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      toast.error("Error loading user profile")
    }
  }

  // Fetch campaigns, advertisers, and domains from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch campaigns
        const campaignsQuery = query(collection(firestore, "campaigns"), orderBy("createdAt", "desc"))
        const campaignsSnapshot = await getDocs(campaignsQuery)
        const campaignsData = []
        campaignsSnapshot.forEach((doc) => {
          const data = doc.data()
          campaignsData.push({
            id: doc.id,
            ...data
          })
        })
        setCampaigns(campaignsData)

        // Fetch advertisers
        const advertisersQuery = query(collection(firestore, "advertisers"), orderBy("createdAt", "desc"))
        const advertisersSnapshot = await getDocs(advertisersQuery)
        const advertisersData = []
        advertisersSnapshot.forEach((doc) => {
          const data = doc.data()
          advertisersData.push({
            id: doc.id,
            ...data
          })
        })
        setAdvertisers(advertisersData)

        // Fetch domains from dropdownMenu collection
        const domainDocRef = doc(firestore, "dropdownMenu", "domain")
        const domainDoc = await getDoc(domainDocRef)
        
        if (domainDoc.exists()) {
          const domainData = domainDoc.data()
          setDomains(domainData.domains || [])
        } else {
          setDomains([])
        }

      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Error loading data")
      } finally {
        setLoading(false)
      }
    }

    if (currentUser) {
      fetchData()
    }
  }, [currentUser])

  // Filter campaigns based on search
  const filteredCampaigns = campaigns.filter(campaign => {
    return campaign.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           campaign.campaignId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           campaign.advertiser?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Generate campaign link with user profileId
  const generateLink = (campaign) => {
    const { domainUrl, advertiserId } = formData
    const campaignId = campaign.campaignId
    
    if (!domainUrl || !campaignId) {
      toast.error("Please select a domain and campaign")
      return
    }

    if (!userProfile) {
      toast.error("User profile not found. Please log in again.")
      return
    }

    // Generate click_id
    const clickId = generateClickId()
    
    // Create SHORT tracking link - just the click_id as path parameter
    const shortTrackingLink = `api/track-click/${clickId}`
    const fullTrackingLink = `${domainUrl}${shortTrackingLink}`

    // Store tracking data immediately in Firestore (pre-create the document)
    const trackingData = {
      clickId: clickId,
      campaignId: campaignId,
      campaignTitle: campaign.title,
      previewUrl: campaign.previewUrl || '',
      advertiserId: advertiserId !== "all" ? advertiserId : null,
      affiliateId: userProfile.profileId,
      domainUrl: domainUrl,
      status: 'pending', // Will be updated to 'clicked' when actually clicked
      createdAt: new Date().toISOString(),
      generatedBy: userProfile.name || userProfile.email,
      // These will be updated when the link is clicked
      ipAddress: null,
      userAgent: null,
      clickedAt: null
    }

    // Pre-create the document in affiliateLinks collection
    const createTrackingDocument = async () => {
      try {
        const docRef = doc(firestore, "affiliateLinks", clickId)
        await setDoc(docRef, trackingData)
        console.log("Pre-created tracking document:", clickId)
      } catch (error) {
        console.error("Error pre-creating tracking document:", error)
      }
    }
    
    createTrackingDocument()

    // Add to links list
    const newLink = {
      id: Date.now().toString(),
      domainUrl: domainUrl,
      campaignId: campaignId,
      campaignTitle: campaign.title,
      advertiserId: advertiserId !== "all" ? advertiserId : null,
      profileId: userProfile.profileId,
      clickId: clickId,
      trackingLink: fullTrackingLink, // This is the SHORT link users will click
      createdAt: new Date(),
      generatedBy: userProfile.name || userProfile.email
    }

    setLinks(prev => [newLink, ...prev])
    toast.success("Link generated successfully!")
  }

  // Copy link to clipboard
  const copyToClipboard = (link) => {
    navigator.clipboard.writeText(link)
    toast.success("Link copied to clipboard!")
  }

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800"
      case "paused": return "bg-yellow-100 text-yellow-800"
      case "pending": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  // Handle domain added successfully
  const handleDomainAdded = () => {
    setShowAddDomain(false)
    toast.success("Domain added successfully!")
    // Refresh domains list
    fetchDomains()
  }

  // Fetch domains separately to refresh after adding new domain
  const fetchDomains = async () => {
    try {
      const domainDocRef = doc(firestore, "dropdownMenu", "domain")
      const domainDoc = await getDoc(domainDocRef)
      
      if (domainDoc.exists()) {
        const domainData = domainDoc.data()
        setDomains(domainData.domains || [])
      } else {
        setDomains([])
      }
    } catch (error) {
      console.error("Error fetching domains:", error)
    }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 items-center px-4 bg-gray-50 shadow-sm">
            <SidebarTrigger className="-ml-1" />
            <h1 className="ml-4 text-lg font-semibold">Create Campaign Link</h1>
          </header>
          <div className="container mx-auto py-8 px-4">
            <div className="flex justify-center items-center h-64">
              <div className="text-lg">Loading data...</div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!currentUser) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 items-center px-4 bg-gray-50 shadow-sm">
            <SidebarTrigger className="-ml-1" />
            <h1 className="ml-4 text-lg font-semibold">Create Campaign Link</h1>
          </header>
          <div className="container mx-auto py-8 px-4">
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-red-600">Please log in to access this page</div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center px-4 bg-gray-50 shadow-sm">
          <SidebarTrigger className="-ml-1" />
          <h1 className="ml-4 text-lg font-semibold">Create Campaign Link</h1>
          {userProfile && (
            <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              <span>Welcome, {userProfile.name || userProfile.email}</span>
              <Badge variant="outline">{userProfile.userType}</Badge>
              {userProfile.profileId && (
                <Badge variant="secondary">ID: {userProfile.profileId}</Badge>
              )}
            </div>
          )}
        </header>

        <div className="container mx-auto py-8 px-4">
          {/* Configuration Card */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Link Configuration</CardTitle>
              <Button onClick={() => setShowAddDomain(true)}>Add Domain</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Domain URL Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="domainUrl">Domain URL</Label>
                  <Select 
                    value={formData.domainUrl} 
                    onValueChange={(value) => handleInputChange("domainUrl", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {domains.length === 0 ? (
                        <SelectItem value="" disabled>No domains available</SelectItem>
                      ) : (
                        domains.map((domain, index) => (
                          <SelectItem key={index} value={domain.name}>
                            {domain.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Select a domain to generate tracking links
                  </p>
                </div>

                {/* Advertiser Select */}
                <div className="space-y-2">
                  <Label htmlFor="advertiserId">Advertiser (Optional)</Label>
                  <Select 
                    value={formData.advertiserId} 
                    onValueChange={(value) => handleInputChange("advertiserId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select advertiser" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Advertisers</SelectItem>
                      {advertisers.map((advertiser) => (
                        <SelectItem key={advertiser.id} value={advertiser.advertiserId}>
                          {advertiser.name} ({advertiser.advertiserId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns Table */}
          <Card>
            <CardHeader>
              <CardTitle>Available Campaigns ({filteredCampaigns.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredCampaigns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {campaigns.length === 0 ? "No campaigns found." : "No campaigns match your search."}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Preview URL</TableHead>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Advertiser</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCampaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell>
                            <div className="max-w-xs">
                              {campaign.previewUrl ? (
                                <a 
                                  href={campaign.previewUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm truncate block"
                                  title={campaign.previewUrl}
                                >
                                  {campaign.previewUrl}
                                </a>
                              ) : (
                                <span className="text-sm text-muted-foreground">No preview URL</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{campaign.title}</div>
                              <div className="text-sm text-muted-foreground font-mono">
                                ID: {campaign.campaignId}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{campaign.advertiser}</div>
                              <div className="text-muted-foreground font-mono">
                                {campaign.advertiserId}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(campaign.status)}>
                              {campaign.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              onClick={() => generateLink(campaign)}
                              disabled={!formData.domainUrl}
                              size="sm"
                            >
                              <Link className="h-4 w-4 mr-2" />
                              Create Link
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generated Links */}
          {links.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Generated Links ({links.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {links.map((link) => (
                    <div key={link.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{link.campaignId}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {link.campaignTitle}
                            </span>
                          </div>
                          <div className="bg-muted p-3 rounded-md">
                            <code className="text-sm break-all">{link.trackingLink}</code>
                          </div>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <div>Domain: {link.domainUrl}</div>
                            {link.advertiserId && (
                              <div>Advertiser ID: {link.advertiserId}</div>
                            )}
                            {link.profileId && (
                              <div>Affiliate ID: {link.profileId}</div>
                            )}
                            {link.clickId && (
                              <div>Click ID: {link.clickId}</div>
                            )}
                            <div>Generated by: {link.generatedBy}</div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(link.trackingLink)}
                          className="ml-4"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Add Domain Popup */}
        {showAddDomain && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">Add New Domain</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddDomain(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6">
                <AddDomain 
                  onSuccess={handleDomainAdded}
                  onCancel={() => setShowAddDomain(false)}
                />
              </div>
            </div>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}