"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, orderBy, query, doc, getDoc, setDoc } from "firebase/firestore"
import { firestore } from "@/lib/firestore"
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { generateClickId } from "@/lib/affiliateUtils"
import AddDomain from "./AddDomain"
import AddSource from "./AddSource"
import LinkConfiguration from "./LinkConfiguration"
import CampaignsTable from "./CampaignsTable"
import { toast } from "react-hot-toast"
import { Copy, X } from "lucide-react"

export default function CreateCampaignLink() {
  const [campaigns, setCampaigns] = useState([])
  const [advertisers, setAdvertisers] = useState([])
  const [domains, setDomains] = useState([])
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [links, setLinks] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [showAddDomain, setShowAddDomain] = useState(false)
  const [showAddSource, setShowAddSource] = useState(false)
  
  // 🔹 Move selectedPublisherIds to parent component
  const [selectedPublisherIds, setSelectedPublisherIds] = useState({})
  
  // Form state
  const [formData, setFormData] = useState({
    domainUrl: "",
    campaignId: "",
    advertiserId: "all",
    source: ""
  })

  // Get current authenticated user
  useEffect(() => {
    const auth = getAuth()
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user)
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
      } else {
        console.log("No user profile found")
        toast.error("User profile not found")
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      toast.error("Error loading user profile")
    }
  }

  // Fetch campaigns, advertisers, domains, and sources from Firestore
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

        // Fetch domains and sources
        await fetchDomains()
        await fetchSources()

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

  // Fetch sources separately to refresh after adding new source
  const fetchSources = async () => {
    try {
      const sourceDocRef = doc(firestore, "dropdownMenu", "source")
      const sourceDoc = await getDoc(sourceDocRef)
      
      if (sourceDoc.exists()) {
        const sourceData = sourceDoc.data()
        setSources(sourceData.sources || [])
      } else {
        setSources([])
      }
    } catch (error) {
      console.error("Error fetching sources:", error)
    }
  }

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle publisher ID changes from child component
  const handlePublisherChange = (campaignId, value) => {
    setSelectedPublisherIds((prev) => ({
      ...prev,
      [campaignId]: value,
    }));
  };

  // Generate campaign link with user profileId
  // In your CampaignsTable component, update the generateLink function:
// In your CampaignsTable component, update the generateLink function:
const generateLink = (campaign) => {
  const { domainUrl, advertiserId, source } = formData
  const campaignId = campaign.campaignId
  const publisherId = selectedPublisherIds[campaign.id]
  
  if (!domainUrl || !campaignId) {
    toast.error("Please select a domain and campaign")
    return
  }

  if (!userProfile) {
    toast.error("User profile not found. Please log in again.")
    return
  }

  // Store campaign data in Firebase first
  const storeCampaignData = async () => {
    try {
      const sessionId = generateClickId(); // Generate a unique session ID
      
      // Store all parameters in Firebase under the sessionId
      const sessionDocRef = doc(firestore, "campaignSessions", sessionId)
      await setDoc(sessionDocRef, {
        sessionId,
        affiliateId: userProfile.profileId,
        campaignId: campaignId,
        advertiserId: advertiserId !== "all" ? advertiserId : null,
        publisherId: publisherId || null,
        source: source || null,
        domain: domainUrl,
        campaignTitle: campaign.title,
        previewUrl: campaign.previewUrl || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        generatedBy: userProfile.name || userProfile.email
      })

      console.log('✅ Campaign data stored with sessionId:', sessionId)

      // Create the base demo URL with only sessionId
      const baseDemoLink = `${domainUrl}/demo?session_id=${sessionId}`

      // Add to links list
      const newLink = {
        id: Date.now().toString(),
        domainUrl: domainUrl,
        campaignId: campaignId,
        campaignTitle: campaign.title,
        advertiserId: advertiserId !== "all" ? advertiserId : null,
        publisherId: publisherId || null,
        source: source || null,
        profileId: userProfile.profileId,
        sessionId: sessionId,
        trackingLink: baseDemoLink, // Only base URL with session_id
        createdAt: new Date(),
        generatedBy: userProfile.name || userProfile.email
      }

      setLinks(prev => [newLink, ...prev])
      toast.success("Link generated successfully!")

    } catch (error) {
      console.error('Error storing campaign data:', error)
      toast.error("Failed to generate link")
    }
  }

  storeCampaignData()
}

  // Handle domain added successfully
  const handleDomainAdded = () => {
    setShowAddDomain(false)
    toast.success("Domain added successfully!")
    fetchDomains()
  }

  // Handle source added successfully
  const handleSourceAdded = () => {
    setShowAddSource(false)
    toast.success("Source added successfully!")
    fetchSources()
  }

  if (loading) {
    return <LoadingState />
  }

  if (!currentUser) {
    return <NotLoggedInState />
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header userProfile={userProfile} />
        
        <div className="container mx-auto py-8 px-4">
          {/* Configuration Card */}
          <LinkConfiguration
            formData={formData}
            domains={domains}
            sources={sources}
            advertisers={advertisers}
            onInputChange={handleInputChange}
            onAddDomain={() => setShowAddDomain(true)}
            onAddSource={() => setShowAddSource(true)}
          />

          {/* Campaigns Table */}
          <CampaignsTable
            campaigns={campaigns}
            formData={formData}
            selectedPublisherIds={selectedPublisherIds}
            onPublisherChange={handlePublisherChange}
            onGenerateLink={generateLink}
          />

          {/* Generated Links */}
          <GeneratedLinks links={links} />
        </div>

        {/* Add Domain Popup */}
        {showAddDomain && (
          <AddDomainPopup
            onSuccess={handleDomainAdded}
            onCancel={() => setShowAddDomain(false)}
          />
        )}
        
        {/* Add Source Popup */}
        {showAddSource && (
          <AddSourcePopup
            onSuccess={handleSourceAdded}
            onCancel={() => setShowAddSource(false)}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}

// Sub-components for different states
function LoadingState() {
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

function NotLoggedInState() {
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

function Header({ userProfile }) {
  return (
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
  )
}

function GeneratedLinks({ links }) {
  const copyToClipboard = (link) => {
    navigator.clipboard.writeText(link)
    toast.success("Link copied to clipboard!")
  }

  if (links.length === 0) return null

  return (
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
                    {link.advertiserId && <div>Advertiser ID: {link.advertiserId}</div>}
                    {link.profileId && <div>Affiliate ID: {link.profileId}</div>}
                    {link.clickId && <div>Click ID: {link.clickId}</div>}
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
  )
}

function AddDomainPopup({ onSuccess, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Add New Domain</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6">
          <AddDomain 
            onSuccess={onSuccess}
            onCancel={onCancel}
          />
        </div>
      </div>
    </div>
  )
}

function AddSourcePopup({ onSuccess, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Add New Source</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6">
          <AddSource 
            onSuccess={onSuccess}
            onCancel={onCancel}
          />
        </div>
      </div>
    </div>
  )
}