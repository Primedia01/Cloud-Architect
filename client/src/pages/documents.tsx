/**
 * Document Management page for uploading and tracking campaign artwork, proof-of-flighting
 * photos (with GPS geotag data), and compliance documents (SBD/CSO). Organised into three
 * tabs. Each tab has an upload form and a table listing existing documents with status badges.
 */
import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Document, Campaign } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, MapPin, Shield, Download, Loader2 } from "lucide-react";

/** Maximum allowed upload file size in bytes (5 MB). */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const statusColors: Record<string, string> = {
  uploaded: "bg-gray-100 text-gray-700 border-gray-200",
  validated: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const statusLabels: Record<string, string> = {
  uploaded: "Uploaded",
  validated: "Validated",
  rejected: "Rejected",
};

const formatDate = (date: string | Date | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-ZA");
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function DocumentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: documents = [], isLoading: docsLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const artworkDocs = documents.filter((d) => d.type === "artwork");
  const proofDocs = documents.filter((d) => d.type === "proof_of_flighting");
  const complianceDocs = documents.filter((d) => d.type === "compliance_sbd" || d.type === "compliance_cso");

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900" data-testid="text-page-title">
            Document Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Upload and manage campaign artwork, proof of flighting, and compliance documents</p>
        </div>

        <Tabs defaultValue="artwork">
          <TabsList data-testid="tabs-documents">
            <TabsTrigger value="artwork" data-testid="tab-artwork">
              <FileText className="h-4 w-4 mr-1" /> Artwork
            </TabsTrigger>
            <TabsTrigger value="proof" data-testid="tab-proof">
              <MapPin className="h-4 w-4 mr-1" /> Proof of Flighting
            </TabsTrigger>
            <TabsTrigger value="compliance" data-testid="tab-compliance">
              <Shield className="h-4 w-4 mr-1" /> Compliance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="artwork">
            <ArtworkTab
              documents={artworkDocs}
              campaigns={campaigns}
              loading={docsLoading}
              userId={user?.id || ""}
            />
          </TabsContent>

          <TabsContent value="proof">
            <ProofTab
              documents={proofDocs}
              campaigns={campaigns}
              loading={docsLoading}
              userId={user?.id || ""}
            />
          </TabsContent>

          <TabsContent value="compliance">
            <ComplianceTab
              documents={complianceDocs}
              campaigns={campaigns}
              loading={docsLoading}
              userId={user?.id || ""}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/** Handles artwork file uploads linked to campaigns and displays a table of existing artwork documents. */
function ArtworkTab({ documents, campaigns, loading, userId }: {
  documents: Document[];
  campaigns: Campaign[];
  loading: boolean;
  userId: string;
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [campaignId, setCampaignId] = useState("");

  const uploadMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post<Document>("/api/documents", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({ title: "Document uploaded", description: "Artwork document record created successfully." });
      setSelectedFile(null);
      setCampaignId("");
      if (fileRef.current) fileRef.current.value = "";
    },
    onError: (err: Error) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Maximum file size is 5MB.", variant: "destructive" });
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile || !campaignId) {
      toast({ title: "Missing fields", description: "Please select a file and campaign.", variant: "destructive" });
      return;
    }
    uploadMutation.mutate({
      type: "artwork",
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      mimeType: selectedFile.type,
      campaignId,
      uploadedBy: userId,
      status: "uploaded",
    });
  };

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Artwork</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="artwork-file">File (max 5MB)</Label>
              <Input
                id="artwork-file"
                type="file"
                ref={fileRef}
                onChange={handleFileSelect}
                data-testid="input-artwork-file"
              />
              {selectedFile && (
                <p className="text-xs text-slate-500" data-testid="text-file-meta">
                  {selectedFile.name} — {formatFileSize(selectedFile.size)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Campaign</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger data-testid="select-artwork-campaign">
                  <SelectValue placeholder="Select campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpload} disabled={uploadMutation.isPending} data-testid="button-upload-artwork">
              {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
              Upload
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : documents.length === 0 ? (
            <p className="text-center py-8 text-slate-500" data-testid="text-empty-artwork">No artwork documents uploaded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id} data-testid={`row-artwork-${doc.id}`}>
                    <TableCell className="font-medium">{doc.fileName}</TableCell>
                    <TableCell>{campaigns.find((c) => c.id === doc.campaignId)?.name || doc.campaignId || "—"}</TableCell>
                    <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[doc.status] || ""} variant="outline" data-testid={`status-artwork-${doc.id}`}>
                        {statusLabels[doc.status] || doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{doc.uploadedBy}</TableCell>
                    <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Handles proof-of-flighting photo uploads with GPS coordinates and capture timestamp metadata. */
function ProofTab({ documents, campaigns, loading, userId }: {
  documents: Document[];
  campaigns: Campaign[];
  loading: boolean;
  userId: string;
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [campaignId, setCampaignId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [capturedAt, setCapturedAt] = useState("");

  const uploadMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post<Document>("/api/documents", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({ title: "Document uploaded", description: "Proof of flighting record created successfully." });
      setSelectedFile(null);
      setCampaignId("");
      setLatitude("");
      setLongitude("");
      setCapturedAt("");
      if (fileRef.current) fileRef.current.value = "";
    },
    onError: (err: Error) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Maximum file size is 5MB.", variant: "destructive" });
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile || !campaignId) {
      toast({ title: "Missing fields", description: "Please select a file and campaign.", variant: "destructive" });
      return;
    }
    uploadMutation.mutate({
      type: "proof_of_flighting",
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      mimeType: selectedFile.type,
      campaignId,
      uploadedBy: userId,
      status: "uploaded",
      gpsLatitude: latitude || null,
      gpsLongitude: longitude || null,
      capturedAt: capturedAt ? new Date(capturedAt).toISOString() : null,
    });
  };

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Proof of Flighting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proof-file">File (max 5MB)</Label>
              <Input
                id="proof-file"
                type="file"
                ref={fileRef}
                onChange={handleFileSelect}
                data-testid="input-proof-file"
              />
              {selectedFile && (
                <p className="text-xs text-slate-500" data-testid="text-proof-file-meta">
                  {selectedFile.name} — {formatFileSize(selectedFile.size)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Campaign</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger data-testid="select-proof-campaign">
                  <SelectValue placeholder="Select campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="proof-lat">GPS Latitude</Label>
              <Input
                id="proof-lat"
                placeholder="-33.9249"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                data-testid="input-proof-latitude"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proof-lng">GPS Longitude</Label>
              <Input
                id="proof-lng"
                placeholder="18.4241"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                data-testid="input-proof-longitude"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proof-captured">Captured At</Label>
              <Input
                id="proof-captured"
                type="datetime-local"
                value={capturedAt}
                onChange={(e) => setCapturedAt(e.target.value)}
                data-testid="input-proof-captured"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleUpload} disabled={uploadMutation.isPending} data-testid="button-upload-proof" className="w-full">
                {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                Upload
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : documents.length === 0 ? (
            <p className="text-center py-8 text-slate-500" data-testid="text-empty-proof">No proof of flighting documents uploaded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>GPS Location</TableHead>
                  <TableHead>Captured At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id} data-testid={`row-proof-${doc.id}`}>
                    <TableCell className="font-medium">{doc.fileName}</TableCell>
                    <TableCell>{campaigns.find((c) => c.id === doc.campaignId)?.name || doc.campaignId || "—"}</TableCell>
                    <TableCell>
                      {doc.gpsLatitude && doc.gpsLongitude
                        ? `${doc.gpsLatitude}, ${doc.gpsLongitude}`
                        : "—"}
                    </TableCell>
                    <TableCell>{doc.capturedAt ? formatDate(doc.capturedAt) : "—"}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[doc.status] || ""} variant="outline" data-testid={`status-proof-${doc.id}`}>
                        {statusLabels[doc.status] || doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Handles SBD and CSO compliance document uploads and lists existing compliance records. */
function ComplianceTab({ documents, campaigns, loading, userId }: {
  documents: Document[];
  campaigns: Campaign[];
  loading: boolean;
  userId: string;
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [campaignId, setCampaignId] = useState("");
  const [docType, setDocType] = useState<string>("");

  const uploadMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post<Document>("/api/documents", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({ title: "Document uploaded", description: "Compliance document record created successfully." });
      setSelectedFile(null);
      setCampaignId("");
      setDocType("");
      if (fileRef.current) fileRef.current.value = "";
    },
    onError: (err: Error) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Maximum file size is 5MB.", variant: "destructive" });
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile || !campaignId || !docType) {
      toast({ title: "Missing fields", description: "Please select a file, campaign, and document type.", variant: "destructive" });
      return;
    }
    uploadMutation.mutate({
      type: docType,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      mimeType: selectedFile.type,
      campaignId,
      uploadedBy: userId,
      status: "uploaded",
    });
  };

  const handleDownload = () => {
    toast({ title: "Download", description: "Download functionality will connect to Azure Blob Storage" });
  };

  const docTypeLabels: Record<string, string> = {
    compliance_sbd: "SBD",
    compliance_cso: "CSO",
  };

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Compliance Document</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="compliance-file">File (max 5MB)</Label>
              <Input
                id="compliance-file"
                type="file"
                ref={fileRef}
                onChange={handleFileSelect}
                data-testid="input-compliance-file"
              />
              {selectedFile && (
                <p className="text-xs text-slate-500" data-testid="text-compliance-file-meta">
                  {selectedFile.name} — {formatFileSize(selectedFile.size)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger data-testid="select-compliance-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compliance_sbd">SBD</SelectItem>
                  <SelectItem value="compliance_cso">CSO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Campaign</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger data-testid="select-compliance-campaign">
                  <SelectValue placeholder="Select campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpload} disabled={uploadMutation.isPending} data-testid="button-upload-compliance">
              {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
              Upload
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : documents.length === 0 ? (
            <p className="text-center py-8 text-slate-500" data-testid="text-empty-compliance">No compliance documents uploaded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id} data-testid={`row-compliance-${doc.id}`}>
                    <TableCell className="font-medium">{doc.fileName}</TableCell>
                    <TableCell>{docTypeLabels[doc.type] || doc.type}</TableCell>
                    <TableCell>{campaigns.find((c) => c.id === doc.campaignId)?.name || doc.campaignId || "—"}</TableCell>
                    <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[doc.status] || ""} variant="outline" data-testid={`status-compliance-${doc.id}`}>
                        {statusLabels[doc.status] || doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={handleDownload} data-testid={`button-download-${doc.id}`}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
