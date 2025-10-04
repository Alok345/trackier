"use client";

import { useEffect, useState } from "react";
import { collection, getDoc, doc } from "firebase/firestore";
import { firestore } from "@/lib/firestore";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import AddPublisher from "./AddPublisher";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CampaignsTable({
  campaigns,
  formData,
  selectedPublisherIds, // Receive from parent
  onPublisherChange, // Receive from parent
  onGenerateLink,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Remove local state for selectedPublisherIds since it's now from parent
  // const [selectedPublisherIds, setSelectedPublisherIds] = useState({});

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
                  <TableHead>Publisher ID</TableHead>
                  <TableHead>Advertiser</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                  <TableHead className="text-right">Action 2</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => (
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
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Select ID" />
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

                    {/* Action button now also sends publisherId */}
                    <TableCell className="text-right">
                      <Button
                        onClick={() =>
                          onGenerateLink({
                            ...campaign,
                            publisherId: selectedPublisherIds[campaign.id] || null,
                          })
                        }
                        disabled={!formData.domainUrl}
                        size="sm"
                      >
                        <Link className="h-4 w-4 mr-2" />
                        Create Link
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button>
                        <Link className="h-4 w-4 mr-2" />
                        Create Google Link
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}