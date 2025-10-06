"use client"

import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { firestore } from "@/lib/firestore"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AffiliateLinksPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])

  useEffect(() => {
    const fetchRows = async () => {
      setLoading(true)
      try {
        const col = collection(firestore, 'affiliateClicks')
        const snap = await getDocs(col)
        const list = []
        snap.forEach(d => {
          const data = d.data()
          const affiliateId = data.affiliateId || d.id
          const clicks = Array.isArray(data.clicks) ? data.clicks : []
          clicks.forEach(c => {
            list.push({
              id: `${affiliateId}-${c.clickId || c.timestamp}`,
              affiliateId,
              clickId: c.clickId || null,
              campaignId: c.campaignId || null,
              publisherId: c.publisherId || null,
              source: c.source || null,
              advertiserId: c.advertiserId || null,
              ipAddress: c.ipAddress || null,
              userAgent: c.userAgent || null,
              previewUrl: c.previewUrl || null,
              timestamp: c.timestamp || null,
            })
          })
        })
        list.sort((a,b)=>{
          const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0
          const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0
          return tb - ta
        })
        setRows(list)
      } catch (e) {
        console.error('Failed to load affiliateClicks:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchRows()
  }, [])

  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 items-center px-4 bg-gray-50 shadow-sm">
            <SidebarTrigger className="-ml-1" />
            <h1 className="ml-4 text-lg font-semibold">Affiliate Links</h1>
          </header>
          <div className="container mx-auto py-8 px-4">
            <Card>
              <CardHeader>
                <CardTitle>Affiliate Clicks ({rows.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading…</div>
                ) : rows.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No data.</div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Affiliate ID</TableHead>
                          <TableHead>Publisher ID</TableHead>
                          {/* <TableHead>Advertiser ID</TableHead> */}
                          <TableHead>Campaign ID</TableHead>
                          <TableHead>Click ID</TableHead>
                          <TableHead>IP</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Preview URL</TableHead>
                          <TableHead>Timestamp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map(row => (
                          <TableRow key={row.id}>
                            <TableCell>{row.affiliateId}</TableCell>
                            <TableCell>{row.publisherId || '—'}</TableCell>
                            {/* <TableCell>{row.advertiserId || '—'}</TableCell> */}
                            <TableCell>{row.campaignId || '—'}</TableCell>
                            <TableCell className="font-mono text-xs">{row.clickId || '—'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{row.ipAddress || '—'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{row.source || '—'}</TableCell>
                            <TableCell className="break-all">
                              {row.previewUrl ? (
                                <a href={row.previewUrl} className="text-blue-600 underline" target="_blank" rel="noreferrer">{row.previewUrl}</a>
                              ) : '—'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{row.timestamp ? new Date(row.timestamp).toLocaleString() : '—'}</TableCell>
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
    </>
  )
}


