"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, orderBy, query, doc, getDoc, deleteDoc, getCountFromServer, updateDoc } from "firebase/firestore"
import { firestore } from "@/lib/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Eye, Trash2, Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function ManageCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [generatedCount, setGeneratedCount] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingCampaignId, setEditingCampaignId] = useState(null)
  const [editingStatus, setEditingStatus] = useState("")

  // Fetch campaigns from Firestore
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true)
        const q = query(collection(firestore, "campaigns"), orderBy("createdAt", "desc"))
        const querySnapshot = await getDocs(q)
        
        const campaignsData = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          campaignsData.push({
            id: doc.id,
            ...data
          })
        })
        setCampaigns(campaignsData)
      } catch (error) {
        console.error("Error fetching campaigns:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, [])

  // Filter campaigns based on search and status
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.advertiser?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.campaignId?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800"
      case "paused": return "bg-yellow-100 text-yellow-800"
      case "pending": return "bg-blue-100 text-blue-800"
      case "deleted": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  // Format currency
  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount || 0)
  }

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A"
    const date = timestamp.toDate()
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Open details dialog and fetch generated links count
  const handleViewDetails = async (campaign) => {
    setSelectedCampaign(campaign)
    setGeneratedCount(null)
    setDetailsOpen(true)
    try {
      const docId = (campaign.title || campaign.campaignId || '').toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 200) || campaign.campaignId
      if (!docId) return
      const urlsCol = collection(firestore, 'campaignUrl', docId, 'urls')
      const snapshot = await getCountFromServer(urlsCol)
      setGeneratedCount(snapshot.data().count || 0)
    } catch (e) {
      console.error('Failed to load generated URLs:', e)
      setGeneratedCount(0)
    }
  }

  // Open delete confirm dialog
  const handleConfirmDelete = (campaign) => {
    setSelectedCampaign(campaign)
    setDeleteOpen(true)
  }

  // Delete the campaign document
  const handleDelete = async () => {
    if (!selectedCampaign) return
    try {
      await deleteDoc(doc(firestore, 'campaigns', selectedCampaign.id))
      setCampaigns(prev => prev.filter(c => c.id !== selectedCampaign.id))
    } catch (e) {
      console.error('Failed to delete campaign:', e)
    } finally {
      setDeleteOpen(false)
      setSelectedCampaign(null)
    }
  }

  const startEditStatus = (campaign) => {
    setEditingCampaignId(campaign.id)
    setEditingStatus(campaign.status || "active")
  }

  const saveEditStatus = async (campaign) => {
    try {
      await updateDoc(doc(firestore, 'campaigns', campaign.id), { status: editingStatus })
      setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, status: editingStatus } : c))
    } catch (e) {
      console.error('Failed to update status:', e)
    } finally {
      setEditingCampaignId(null)
      setEditingStatus("")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading campaigns...</div>
        </div>
      </div>
    )
  }

  return (
<>
    <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <header className="flex h-16 items-center px-4 bg-gray-50 shadow-sm">
                  <SidebarTrigger className="-ml-1" />
                  <h1 className="ml-4 text-lg font-semibold">Manage Campaigns</h1>
                </header>
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Campaigns</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all your advertising campaigns
          </p>
        </div>
        {/* <Button>
          Create New Campaign
        </Button> */}
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns by title, advertiser, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

     
      <Card>
        <CardHeader>
          <CardTitle>Campaigns ({filteredCampaigns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {campaigns.length === 0 ? "No campaigns found. Create your first campaign!" : "No campaigns match your filters."}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Advertiser</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Payout</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-mono text-sm">
                        {campaign.campaignId}
                      </TableCell>
                      <TableCell className="font-medium">
                        {campaign.title}
                      </TableCell>
                      <TableCell>
                        {campaign.advertiser}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase">
                          {campaign.model}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {editingCampaignId === campaign.id ? (
                          <div className="flex items-center gap-2">
                            <Select value={editingStatus} onValueChange={setEditingStatus}>
                              <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="paused">Paused</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(campaign.revenue, campaign.currency)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(campaign.payout, campaign.currency)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(campaign.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(campaign)} title="View Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {editingCampaignId === campaign.id ? (
                            <>
                              <Button size="sm" onClick={() => saveEditStatus(campaign)} title="Save Status">Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingCampaignId(null)} title="Cancel Edit">Cancel</Button>
                            </>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => startEditStatus(campaign)} title="Edit Status">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleConfirmDelete(campaign)} title="Delete Campaign">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>

     </SidebarInset>
            </SidebarProvider>

  
  <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>Campaign Details</DialogTitle>
        <DialogDescription>Full details and generated links count</DialogDescription>
      </DialogHeader>
      {selectedCampaign && (
        <div className="space-y-3 text-sm">
          <div><span className="font-medium">Title:</span> {selectedCampaign.title || 'N/A'}</div>
          <div><span className="font-medium">Campaign ID:</span> {selectedCampaign.campaignId || 'N/A'}</div>
          <div><span className="font-medium">Advertiser:</span> {selectedCampaign.advertiser || 'N/A'}</div>
          <div><span className="font-medium">Status:</span> {selectedCampaign.status || 'N/A'}</div>
          <div><span className="font-medium">Model:</span> {selectedCampaign.model || 'N/A'}</div>
          <div><span className="font-medium">Revenue:</span> {formatCurrency(selectedCampaign.revenue, selectedCampaign.currency)}</div>
          <div><span className="font-medium">Payout:</span> {formatCurrency(selectedCampaign.payout, selectedCampaign.currency)}</div>
          <div><span className="font-medium">Created:</span> {formatDate(selectedCampaign.createdAt)}</div>
          <div><span className="font-medium">Preview URL:</span> {selectedCampaign.previewUrl ? (<a href={selectedCampaign.previewUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">{selectedCampaign.previewUrl}</a>) : 'N/A'}</div>
          <div><span className="font-medium">Generated Links:</span> {generatedCount === null ? 'Loading…' : generatedCount}</div>
        </div>
      )}
    </DialogContent>
  </Dialog>

 
  <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>Delete Campaign</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete this campaign? This action cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  </>
  )
}