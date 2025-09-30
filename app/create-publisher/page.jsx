"use client";

import React, { useState } from "react";
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
import { doc, setDoc } from "firebase/firestore";
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

import { X } from "lucide-react";
import View from "./view";

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
    } catch (error) {
      console.error("Error creating publisher:", error);
      toast.error("Error creating publisher: " + error.message);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* HEADER */}
        <header className="flex h-16 items-center justify-between px-4 bg-gray-50 border-b shadow-sm">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-lg font-semibold">Add Publisher</h1>
          </div>

          {/* Align View button to right */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="default">View Publishers</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-6">
              {/* <DialogHeader className="flex justify-between items-center">
                <DialogTitle className="text-lg font-bold">
                  View Publishers
                </DialogTitle>
                
                <DialogClose asChild>
                  <button className="rounded-full p-1 hover:bg-gray-200">
                    <X className="h-5 w-5" />
                  </button>
                </DialogClose>
              </DialogHeader> */}

              {/* Render your view component here */}
              <div className="mt-4">
                <View />
              </div>
            </DialogContent>
          </Dialog>
        </header>

        {/* MAIN CONTENT */}
        <main className="p-6">
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-6">
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
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default Page;
