"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { firestore } from "@/lib/firestore";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function MemberTable() {
  const [members, setMembers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editUserType, setEditUserType] = useState("");
  const [editStatus, setEditStatus] = useState("");

  // Fetch members from Firestore
  useEffect(() => {
    const fetchMembers = async () => {
      const querySnapshot = await getDocs(collection(firestore, "users"));
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      setMembers(users);
    };

    fetchMembers();
  }, []);

  const handleEdit = (member) => {
    setEditingId(member.id);
    setEditUserType(member.userType || "user");
    setEditStatus(member.status || "Active");
  };

  const handleSave = async (id) => {
    try {
      const memberRef = doc(firestore, "users", id);
      await updateDoc(memberRef, {
        userType: editUserType,
        status: editStatus,
      });

      setMembers((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, userType: editUserType, status: editStatus } : m
        )
      );
      setEditingId(null);
      toast.success("Member updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Error updating member: " + err.message);
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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>User Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>{member.name}</TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>{member.phone}</TableCell>
              <TableCell>
                {editingId === member.id ? (
                  <Select value={editUserType} onValueChange={setEditUserType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  member.userType
                )}
              </TableCell>
              <TableCell>
                {editingId === member.id ? (
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="InActive">InActive</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  member.status || "Active"
                )}
              </TableCell>
              <TableCell>
                {editingId === member.id ? (
                  <Button size="sm" onClick={() => handleSave(member.id)}>
                    Save
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(member)}>
                    <Pencil />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
     </SidebarInset>
        </SidebarProvider>
  );
}
