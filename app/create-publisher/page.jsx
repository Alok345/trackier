"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { firestore } from "@/lib/firestore";
import { collection, getDocs, doc, setDoc, orderBy, query, updateDoc } from "firebase/firestore";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import toast from "react-hot-toast";

// ✅ shadcn dialog imports
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

import { X, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function Page() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    status: "active",
    country: "IN",
    company: "",
    referenceId: "",
  });

  const [open, setOpen] = useState(false); // dialog state
  const [publishers, setPublishers] = useState([]);
  const [loading, setLoading] = useState(true);

  const generatePublisherId = (name) => {
    const cleanName = name.trim().toLowerCase().replace(/\s+/g, "-");
    const rand = Math.random().toString(36).substring(2, 8);
    return `${cleanName}-${rand}`;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const publisherId = generatePublisherId(formData.fullName);

    try {
      await setDoc(doc(firestore, "publishers", publisherId), {
        ...formData,
        publisherId,
        createdAt: new Date().toISOString(),
      });
      toast.success("Publisher created successfully!");
      setFormData({
        fullName: "",
        email: "",
        status: "active",
        country: "IN",
        company: "",
        referenceId: "",
      });
      setOpen(false);
      // refresh list
      fetchPublishers();
    } catch (error) {
      console.error("Error creating publisher:", error);
      toast.error("Error creating publisher: " + error.message);
    }
  };

  const fetchPublishers = async () => {
    try {
      setLoading(true);
      const q = query(collection(firestore, "publishers"));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({ id: d.id, ...data });
      });
      // sort by createdAt desc if iso string
      list.sort((a,b)=>{
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
      setPublishers(list);
    } catch (e) {
      console.error("Failed to load publishers:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublishers();
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* HEADER */}
        <header className="flex h-16 items-center justify-between px-4 bg-gray-50 border-b shadow-sm">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-lg font-semibold">Publishers</h1>
          </div>

          {/* Add Publisher button */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="default">Add Publisher</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-6">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">Add Publisher</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter email"
                      required
                    />
                  </div>

                  <div>
                    <Label>Account Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(val) =>
                        setFormData({ ...formData, status: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Country</Label>
                    <Select
                      value={formData.country}
                      onValueChange={(val) =>
                        setFormData({ ...formData, country: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IN">🇮🇳 India</SelectItem>
                        <SelectItem value="USA">🇺🇸 America</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Company (Optional)</Label>
                    <Input
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="Enter company"
                    />
                  </div>

                  <div>
                    <Label>Reference ID</Label>
                    <Input
                      name="referenceId"
                      value={formData.referenceId}
                      onChange={handleChange}
                      placeholder="Enter reference ID"
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Create Publisher
                  </Button>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        {/* MAIN CONTENT */}
        <main className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>All Publishers ({publishers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading…</div>
              ) : publishers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No publishers found.</div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Publisher ID</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Reference ID</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        <TableHead>Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {publishers.map((p) => (
                        <PublisherRow key={p.id} p={p} onStatusChange={async (next) => {
                          try {
                            await updateDoc(doc(firestore, 'publishers', p.id), { status: next })
                            setPublishers(prev => prev.map(x => x.id === p.id ? { ...x, status: next } : x))
                          } catch (e) {
                            console.error('Failed to update publisher status:', e)
                          }
                        }} />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function PublisherRow({ p, onStatusChange }) {
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState(p.status || 'active')
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{p.publisherId || p.id}</TableCell>
      <TableCell>{p.fullName}</TableCell>
      <TableCell>{p.email}</TableCell>
      <TableCell>
        {editing ? (
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <>{p.status}</>
        )}
      </TableCell>
      <TableCell>{p.country}</TableCell>
      <TableCell>{p.company || "—"}</TableCell>
      <TableCell>{p.referenceId || "—"}</TableCell>
      <TableCell className="text-right">
        {editing ? (
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => { onStatusChange(status); setEditing(false) }}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} title="Edit Status">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{p.createdAt ? new Date(p.createdAt).toLocaleString() : "—"}</TableCell>
    </TableRow>
  )
}

export default Page;
