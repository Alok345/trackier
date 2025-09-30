"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/firestore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

function View() {
  const [publishers, setPublishers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublishers = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "publishers"));
        const data = querySnapshot.docs.map((doc) => doc.data());
        setPublishers(data);
      } catch (error) {
        console.error("Error fetching publishers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublishers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-600">Loading publishers...</span>
      </div>
    );
  }

  if (publishers.length === 0) {
    return (
      <div className="text-center py-10 text-gray-600">
        No publishers found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
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
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {publishers.map((publisher) => (
            <TableRow key={publisher.publisherId}>
              <TableCell className="font-medium">{publisher.publisherId}</TableCell>
              <TableCell>{publisher.fullName}</TableCell>
              <TableCell>{publisher.email}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    publisher.status === "active"
                      ? "bg-green-100 text-green-600"
                      : publisher.status === "pending"
                      ? "bg-yellow-100 text-yellow-600"
                      : publisher.status === "disabled"
                      ? "bg-gray-200 text-gray-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {publisher.status}
                </span>
              </TableCell>
              <TableCell>{publisher.country}</TableCell>
              <TableCell>{publisher.company || "-"}</TableCell>
              <TableCell>{publisher.referenceId || "-"}</TableCell>
              <TableCell>
                {publisher.createdAt
                  ? new Date(publisher.createdAt).toLocaleString()
                  : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default View;
