"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, doc, getDoc, deleteDoc } from "firebase/firestore"
import { firestore } from "@/lib/firestore"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Eye, Trash2, Search } from "lucide-react"

export default function AccessCampaignPage() {
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState([]) 
  const [links, setLinks] = useState([]) 
  const [filter, setFilter] = useState("")
  const [campaignFilter, setCampaignFilter] = useState("ALL")
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedLink, setSelectedLink] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const parentCol = collection(firestore, "campaignUrl")
        const parentSnap = await getDocs(parentCol)
        const parentDocs = parentSnap.docs.map(d => ({
          id: d.id,
          campaignTitle: d.data().campaignTitle || null,
          campaignId: d.data().campaignId || null,
        }))
        setCampaigns(parentDocs)

        const allLinks = []
        for (const parent of parentDocs) {
          const urlsCol = collection(firestore, "campaignUrl", parent.id, "urls")
          const urlsSnap = await getDocs(urlsCol)
          urlsSnap.forEach(u => {
            const data = u.data()
            allLinks.push({
              id: `${parent.id}__${u.id}`,
              campaignDocId: parent.id,
              campaignTitle: parent.campaignTitle,
              campaignId: parent.campaignId,
              urlId: u.id,
              url: data.url,
              createdAt: data.createdAt || null,
              domain: data.domain || null,
              source: data.source || null,
              affiliateId: data.affiliateId || null,
              publisherId: data.publisherId || null,
              advertiserId: data.advertiserId || null,
            })
          })
        }
        
        allLinks.sort((a, b) => {
          const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0
          const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0
          return tb - ta
        })
        setLinks(allLinks)
      } catch (e) {
        console.error("Failed to load campaign links:", e)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  const filteredLinks = links.filter(l => {
    if (campaignFilter && campaignFilter !== 'ALL') {
      return l.campaignDocId === campaignFilter
    }
    if (filter) {
      const name = (l.campaignTitle || l.campaignId || "").toString().toLowerCase()
      return name.includes(filter.toLowerCase())
    }
    return true
  })

  const formatDate = (ts) => {
    if (!ts) return "N/A"
    try {
      const d = ts.toDate()
      return d.toLocaleString()
    } catch {
      return "N/A"
    }
  }

  const handleView = (link) => {
    setSelectedLink(link)
    setViewOpen(true)
  }

  const handleConfirmDelete = (link) => {
    setSelectedLink(link)
    setDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedLink) return
    try {
      await deleteDoc(doc(firestore, "campaignUrl", selectedLink.campaignDocId, "urls", selectedLink.urlId))
      setLinks(prev => prev.filter(l => !(l.campaignDocId === selectedLink.campaignDocId && l.urlId === selectedLink.urlId)))
    } catch (e) {
      console.error("Failed to delete link:", e)
    } finally {
      setDeleteOpen(false)
      setSelectedLink(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading generated links...</div>
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
            <h1 className="ml-4 text-lg font-semibold">Access Campaign Links</h1>
            <div className="ml-auto w-full sm:w-80">
              <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All campaigns</SelectItem>
                  {campaigns.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.campaignTitle || c.campaignId || c.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </header>

          <div className="container mx-auto py-8 px-4">
            <Card>
              <CardHeader>
                <CardTitle>Generated Links ({filteredLinks.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredLinks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No links found.</div>
                  ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campaign</TableHead>
                          <TableHead>URL</TableHead>
                          <TableHead>Created At</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLinks.map(link => (
                          <TableRow key={link.id}>
                            <TableCell className="whitespace-nowrap">
                              <div className="font-medium">{link.campaignTitle || link.campaignId}</div>
                              {link.campaignTitle && link.campaignId && (
                                <div className="text-xs text-muted-foreground">ID: {link.campaignId}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <a href={link.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 break-all">
                                {link.url}
                              </a>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(link.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleView(link)} title="View">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleConfirmDelete(link)} title="Delete">
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

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Link Details</DialogTitle>
            <DialogDescription>Generated link information</DialogDescription>
          </DialogHeader>
          {selectedLink && (
            <div className="space-y-3 text-sm">
              <div><span className="font-medium">Campaign:</span> {selectedLink.campaignTitle || selectedLink.campaignId}</div>
              <div className="break-all"><span className="font-medium">URL:</span> <a href={selectedLink.url} className="text-blue-600 underline" target="_blank" rel="noreferrer">{selectedLink.url}</a></div>
              <div><span className="font-medium">Created At:</span> {formatDate(selectedLink.createdAt)}</div>
              {selectedLink.domain && (<div><span className="font-medium">Domain:</span> {selectedLink.domain}</div>)}
              {selectedLink.source && (<div><span className="font-medium">Source:</span> {selectedLink.source}</div>)}
              {selectedLink.affiliateId && (<div><span className="font-medium">Affiliate ID:</span> {selectedLink.affiliateId}</div>)}
              {selectedLink.publisherId && (<div><span className="font-medium">Publisher ID:</span> {selectedLink.publisherId}</div>)}
              {selectedLink.advertiserId && (<div><span className="font-medium">Advertiser ID:</span> {selectedLink.advertiserId}</div>)}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Link</DialogTitle>
            <DialogDescription>This cannot be undone. Delete this generated link?</DialogDescription>
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


