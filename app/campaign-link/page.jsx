"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, orderBy, query, doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp, addDoc } from "firebase/firestore"
import { firestore } from "@/lib/firestore"
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { generateClickId } from "@/lib/affiliateUtils"
import AddDomain from "./AddDomain"
import AddSource from "./AddSource"
import AddPublisher from "./AddPublisher"
import LinkConfiguration from "./LinkConfiguration"
import { toast } from "react-hot-toast"
import { Copy, ExternalLink, Link, Search, X } from "lucide-react"

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
  

  const [selectedPublisherIds, setSelectedPublisherIds] = useState({})
  
 
  const [generatedLinks, setGeneratedLinks] = useState({})
  
 
  const [formData, setFormData] = useState({
    domainUrl: "",
    campaignId: "",
    advertiserId: "all",
    source: ""
  })

  
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


  const fetchUserProfile = async (uid) => {
    try {
      const userDocRef = doc(firestore, "users", uid)
      const userDoc = await getDoc(userDocRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setUserProfile(userData)
      } else {
        
        toast.error("User profile not found")
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      toast.error("Error loading user profile")
    }
  }

  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
      
        const campaignsQuery = query(collection(firestore, "campaigns"), orderBy("createdAt", "desc"))
        const campaignsSnapshot = await getDocs(campaignsQuery)
        const campaignsData = []
        campaignsSnapshot.forEach((doc) => {
          const data = doc.data()
         
          if ((data.status || '').toLowerCase() !== 'inactive') {
            campaignsData.push({
              id: doc.id,
              ...data
            })
          }
        })
        setCampaigns(campaignsData)

      
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

  // Verify selected publisher is active; if not, block link creation
  const isPublisherActive = async (publisherId) => {
    try {
      // Try to find publisher doc by referenceId field equals selected value
      // If you store publishers by generated `publisherId`, you may need a dedicated mapping
      // For now, treat presence of id as permitted; implement stricter check if a mapping exists
      return true
    } catch {
      return true
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

  // Generate the tracking link that points to demo page
  // Generate the tracking link that points to demo page
// Generate the tracking link that points to demo page
// In your campaign link generation function
const generateTrackingLink = (campaign) => {
  const { domainUrl, advertiserId, source } = formData
  const campaignId = campaign.campaignId
  const publisherId = selectedPublisherIds[campaign.id]
  const affiliateId = userProfile?.profileId

  if (!domainUrl || !campaignId || !affiliateId) {
    toast.error("Please select a domain, campaign and ensure user profile is loaded")
    return null
  }

  // Create tracking URL that points to server redirect (no final URL exposed)
  const trackingUrl = new URL(`${window.location.origin}/api/redirect`)

  // 🔹 ALL PARAMETERS TO PASS THROUGH THE ENTIRE CHAIN
  const trackingParams = {
    // Click tracking (generated server-side; do not include here)
    
    // Core identifiers
    campaign_id: campaignId,
    affiliate_id: affiliateId,
    
    // Publisher parameters
    ...(publisherId && { 
      pub_id: publisherId,
    }),
    
    // Source parameters
    ...(source && { 
      source: source,
    }),
    
    // URL parameter: pass previewUrl at generation time
    ...(campaign.previewUrl && {
      url: campaign.previewUrl,
    }),
    
    // Advertiser parameters
    ...(advertiserId && advertiserId !== "all" && { 
      advertiser_id: advertiserId 
    }),

    // Additional tracking parameters (optional)
    force_transparent: 'true'
  }

  // Add all parameters to tracking URL
  Object.entries(trackingParams).forEach(([key, value]) => {
    if (value) {
      trackingUrl.searchParams.set(key, value.toString())
    }
  })

  return {
    fullLink: trackingUrl.toString(),
    parameters: trackingParams,
    campaignData: {
      campaignId,
      campaignTitle: campaign.title,
      affiliateId,
      publisherId,
      advertiserId: advertiserId !== "all" ? advertiserId : null,
      source,
      domain: domainUrl,
      finalUrl: campaign.previewUrl || domainUrl,
    }
  }
}

  // Generate and store link for a campaign
  const generateAndStoreLink = (campaign) => {
    const linkData = generateTrackingLink(campaign)
    if (linkData) {
      // Prevent link generation if publisher is inactive (placeholder, replace with real check when mapping is available)
      // If you later store a mapping of publisherId->status, call isPublisherActive here
      // Store in generatedLinks state
      setGeneratedLinks(prev => ({
        ...prev,
        [campaign.id]: linkData
      }))

      // Also save to links list for history
      const newLink = {
        id: Date.now().toString(),
        domainUrl: linkData.campaignData.domain,
        campaignId: linkData.campaignData.campaignId,
        campaignTitle: linkData.campaignData.campaignTitle,
        advertiserId: linkData.campaignData.advertiserId,
        publisherId: linkData.campaignData.publisherId,
        source: linkData.campaignData.source,
        profileId: linkData.campaignData.affiliateId,
        trackingLink: linkData.fullLink,
        parameters: linkData.parameters,
        createdAt: new Date(),
        generatedBy: userProfile.name || userProfile.email
      }

      setLinks(prev => [newLink, ...prev])
      toast.success("Tracking link generated successfully!")

      // Helper to produce a Firestore-safe document id from campaign title
      const toSafeDocId = (value) => {
        if (!value) return null
        return value
          .toString()
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumerics with hyphen
          .replace(/^-+|-+$/g, '')      // trim leading/trailing hyphens
          .slice(0, 200)                // keep under a reasonable length
      }

      // Persist generated link per campaign name
      ;(async () => {
        try {
          const preferred = toSafeDocId(linkData.campaignData.campaignTitle)
          const fallback = linkData.campaignData.campaignId
          const campaignDocId = preferred || fallback
          if (!campaignDocId) return
          const parentRef = doc(firestore, "campaignUrl", campaignDocId)
          // Ensure parent document exists
          await setDoc(parentRef, {
            campaignTitle: linkData.campaignData.campaignTitle || null,
            campaignId: linkData.campaignData.campaignId || null,
            createdAt: serverTimestamp(),
            lastUpdatedAt: serverTimestamp()
          }, { merge: true })
          // Add generated URL as a sub-document under urls subcollection
          await addDoc(collection(firestore, "campaignUrl", campaignDocId, "urls"), {
            url: linkData.fullLink,
            createdAt: serverTimestamp(),
            domain: linkData.campaignData.domain || null,
            source: linkData.campaignData.source || null,
            affiliateId: linkData.campaignData.affiliateId || null,
            publisherId: linkData.campaignData.publisherId || null,
            advertiserId: linkData.campaignData.advertiserId || null
          })
        } catch (e) {
          console.error("Failed to persist campaign URL:", e?.message || e)
          toast.error("Saved link locally, but failed to store in campaignUrl")
        }
      })()
    }
  }

  // Copy link to clipboard
  const copyLinkToClipboard = (campaignId) => {
    const linkData = generatedLinks[campaignId]
    if (linkData) {
      navigator.clipboard.writeText(linkData.fullLink)
      toast.success("Tracking link copied to clipboard!")
    }
  }

  // Test link (open in new tab)
  const testLink = (campaignId) => {
    const linkData = generatedLinks[campaignId]
    if (linkData) {
      window.open(linkData.fullLink, '_blank')
    }
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

  // Loading State Component
  const LoadingState = () => (
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

  // Not Logged In State Component
  const NotLoggedInState = () => (
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
            onGenerateLink={generateAndStoreLink}
            generatedLinks={generatedLinks}
            onCopyLink={copyLinkToClipboard}
            onTestLink={testLink}
          />

          {/* Generated Links History */}
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

// Header Component
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

// Campaigns Table Component
function CampaignsTable({
  campaigns,
  formData,
  selectedPublisherIds,
  onPublisherChange,
  onGenerateLink,
  generatedLinks,
  onCopyLink,
  onTestLink,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 🔹 Store publisher ranges from Firestore
  const [publisherRanges, setPublisherRanges] = useState([]);

  useEffect(() => {
    const fetchPublisherRanges = async () => {
      try {
        const docRef = doc(firestore, "dropdownMenu", "publisherId");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setPublisherRanges([data]); // store as array for mapping
        } else {
          console.warn("No publisherId document found!");
        }
      } catch (error) {
        console.error("Error fetching publisher ranges:", error);
      }
    };

    fetchPublisherRanges();
  }, []);

  // Filter campaigns
  const filteredCampaigns = campaigns.filter((campaign) => {
    return (
      campaign.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.campaignId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.advertiser?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Generate number range
  const generateRange = (start, end) => {
    const range = [];
    for (let i = parseInt(start); i <= parseInt(end); i++) {
      range.push(i.toString());
    }
    return range;
  };

  // Handle dropdown change - call parent handler
  const handlePublisherChange = (campaignId, value) => {
    onPublisherChange(campaignId, value);
  };

  // 🔹 Check if all mandatory fields are selected for a specific campaign
  const isCreateLinkDisabled = (campaignId) => {
    const isPublisherSelected = !!selectedPublisherIds[campaignId];
    const isDomainSelected = !!formData.domainUrl;
    const isSourceSelected = !!formData.source;
    
    return !(isPublisherSelected && isDomainSelected && isSourceSelected);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <CardTitle>Available Campaigns ({filteredCampaigns.length})</CardTitle>

        <div className="flex items-center gap-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Add Publisher Button */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                Add Publisher ID
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Publisher</DialogTitle>
              </DialogHeader>
              <AddPublisher
                onSuccess={() => setIsDialogOpen(false)}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {/* 🔹 Mandatory Fields Warning */}
        {(!formData.domainUrl || !formData.source) && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center text-yellow-800 text-sm">
              <span className="font-medium">⚠️ Required Fields:</span>
              <span className="ml-2">
                {!formData.domainUrl && "Domain URL, "}
                {!formData.source && "Source"}
                {!formData.domainUrl && !formData.source && " must be selected"}
              </span>
            </div>
          </div>
        )}

        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {campaigns.length === 0
              ? "No campaigns found."
              : "No campaigns match your search."}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview URL</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Publisher ID *</TableHead>
                  <TableHead>Advertiser</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => {
                  const hasGeneratedLink = !!generatedLinks[campaign.id];
                  return (
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
                            <span className="text-sm text-muted-foreground">
                              No preview URL
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <div className="font-medium">{campaign.title}</div>
                        </div>
                      </TableCell>

                      {/* Publisher ID Dropdown */}
                      <TableCell>
                        <Select
                          value={selectedPublisherIds[campaign.id] || ""}
                          onValueChange={(val) =>
                            handlePublisherChange(campaign.id, val)
                          }
                        >
                          <SelectTrigger className={`w-[120px] ${
                            !selectedPublisherIds[campaign.id] ? 'border-red-300 bg-red-50' : ''
                          }`}>
                            <SelectValue placeholder="Select ID *" />
                          </SelectTrigger>
                          <SelectContent>
                            {publisherRanges.length > 0 ? (
                              publisherRanges.map((range, idx) =>
                                generateRange(
                                  range.publisherIdStart,
                                  range.publisherIdEnd
                                ).map((id) => (
                                  <SelectItem key={id + idx} value={id}>
                                    {id}
                                  </SelectItem>
                                ))
                              )
                            ) : (
                              <SelectItem disabled>No IDs</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {!selectedPublisherIds[campaign.id] && (
                          <p className="text-xs text-red-500 mt-1">Required</p>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div>{campaign.advertiser}</div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </TableCell>

                      {/* Create Link button */}
                      <TableCell className="text-right">
                        <Button
                          onClick={() => onGenerateLink(campaign)}
                          disabled={isCreateLinkDisabled(campaign.id)}
                          size="sm"
                          className={
                            isCreateLinkDisabled(campaign.id) 
                              ? "bg-gray-300 cursor-not-allowed" 
                              : "bg-slate-800 hover:bg-slate-900"
                          }
                        >
                          <Link className="h-4 w-4 mr-2" />
                          Create Link
                        </Button>
                        {isCreateLinkDisabled(campaign.id) && (
                          <p className="text-xs text-red-500 mt-1 text-center">
                            Select all required fields
                          </p>
                        )}
                      </TableCell>

                      {/* Copy and Test buttons - only show when link is generated */}
                      <TableCell className="text-right">
                        {hasGeneratedLink ? (
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onCopyLink(campaign.id)}
                              className="flex items-center gap-1"
                            >
                              <Copy className="h-3 w-3" />
                              Copy
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onTestLink(campaign.id)}
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Test
                            </Button>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground text-right">
                            Generate link first
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Generated Links Component
function GeneratedLinks({ links }) {
  const copyToClipboard = (link) => {
    navigator.clipboard.writeText(link)
    toast.success("Link copied to clipboard!")
  }

  if (links.length === 0) return null

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Generated Links History ({links.length})</CardTitle>
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
                    {link.publisherId && <div>Publisher ID: {link.publisherId}</div>}
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

// Add Domain Popup Component
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

// Add Source Popup Component
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