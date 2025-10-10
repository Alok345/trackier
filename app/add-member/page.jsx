"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { doc, setDoc } from "firebase/firestore";
import { auth, firestore } from "@/lib/firestore";
import { toast } from "react-hot-toast"; 

export default function Page() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState("admin");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("InActive");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

   
try {
  

  
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    phone
  );
  const uid = userCredential.user.uid;

  // 2️⃣ Generate profileId (first 7 chars of name + random 3-digit number)
  const cleanName = name.replace(/\s+/g, ""); // remove spaces
  const profileId = Math.floor(100 + Math.random() * 900);

  // 3️⃣ Create Firestore document
  await setDoc(doc(firestore, "users", uid), {
    uId: uid,
    email,
    name,
    phone,
    userType,
    status,
    profileId, // ✅ new field
    createdAt: new Date(),
  });

  toast.success("Member created successfully!");

  // Reset form
  setEmail("");
  setName("");
  setPhone("");
  setUserType("admin");
  setStatus("InActive");
} catch (err) {
  console.error(err);
  toast.error("Error creating member: " + err.message);
} finally {
  setLoading(false);
}

  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center px-4 bg-gray-50 shadow-sm">
          <SidebarTrigger className="-ml-1" />
          <h1 className="ml-4 text-lg font-semibold">Add Member</h1>
        </header>

        <main className="p-4">
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Create Member</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-1">
                  <Label>Name</Label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    required
                  />
                </div>

                <div className="grid gap-1">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="member@example.com"
                    required
                  />
                </div>

                <div className="grid gap-1">
                  <Label>Phone</Label>
                  <Input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="1234567890"
                    required
                  />
                </div>

                <div className="grid gap-1">
                  <Label>User Type</Label>
                  <Select value={userType} onValueChange={setUserType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="InActive">InActive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Member"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
