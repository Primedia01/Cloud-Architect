import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Booking, Campaign, Supplier, InsertBooking } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Plus, Search } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  in_progress: "In Progress",
  completed: "Completed",
};

const formatCurrency = (value: string | number | null) => {
  if (!value) return "—";
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(Number(value));
};

const formatDate = (date: string | Date | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-ZA");
};

export default function BookingsPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formData, setFormData] = useState({
    campaignId: "", supplierId: "", siteDescription: "", location: "",
    mediaType: "", cost: "", startDate: "", endDate: "",
  });

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: campaigns } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<InsertBooking>) => api.post<Booking>("/api/bookings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Booking created successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create booking", description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      campaignId: "", supplierId: "", siteDescription: "", location: "",
      mediaType: "", cost: "", startDate: "", endDate: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      campaignId: formData.campaignId,
      supplierId: formData.supplierId,
      siteDescription: formData.siteDescription,
      location: formData.location || undefined,
      mediaType: formData.mediaType || undefined,
      cost: formData.cost || undefined,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
    });
  };

  const handleRowClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setSheetOpen(true);
  };

  const campaignMap = new Map((campaigns ?? []).map((c) => [c.id, c.name]));
  const supplierMap = new Map((suppliers ?? []).map((s) => [s.id, s.name]));

  const filteredBookings = (bookings ?? []).filter((b) => {
    const matchesSearch =
      !searchQuery ||
      b.siteDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.location ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.mediaType ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Bookings</h1>
          <p className="text-slate-500 mt-1">Manage site bookings for your campaigns</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-new-booking">
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-bookings"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading bookings...</div>
          ) : !filteredBookings.length ? (
            <div className="p-8 text-center text-slate-500" data-testid="text-empty-state">
              No bookings found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Media Type</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow
                    key={booking.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(booking)}
                    data-testid={`row-booking-${booking.id}`}
                  >
                    <TableCell className="font-medium">{booking.siteDescription}</TableCell>
                    <TableCell>{campaignMap.get(booking.campaignId) ?? booking.campaignId}</TableCell>
                    <TableCell>{supplierMap.get(booking.supplierId) ?? booking.supplierId}</TableCell>
                    <TableCell>{booking.mediaType ?? "—"}</TableCell>
                    <TableCell>{formatCurrency(booking.cost)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[booking.status] ?? ""}
                        data-testid={`badge-status-${booking.id}`}
                      >
                        {statusLabels[booking.status] ?? booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(booking.startDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Booking Details</SheetTitle>
            <SheetDescription>View booking information</SheetDescription>
          </SheetHeader>
          {selectedBooking && (
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm text-slate-500">Site Description</p>
                <p className="text-sm font-medium" data-testid="text-detail-site">{selectedBooking.siteDescription}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Campaign</p>
                <p className="text-sm font-medium">{campaignMap.get(selectedBooking.campaignId) ?? selectedBooking.campaignId}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Supplier</p>
                <p className="text-sm font-medium">{supplierMap.get(selectedBooking.supplierId) ?? selectedBooking.supplierId}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Location</p>
                <p className="text-sm font-medium">{selectedBooking.location ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Media Type</p>
                <p className="text-sm font-medium">{selectedBooking.mediaType ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Cost</p>
                <p className="text-sm font-medium">{formatCurrency(selectedBooking.cost)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <Badge variant="outline" className={statusColors[selectedBooking.status] ?? ""}>
                  {statusLabels[selectedBooking.status] ?? selectedBooking.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Start Date</p>
                  <p className="text-sm font-medium">{formatDate(selectedBooking.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">End Date</p>
                  <p className="text-sm font-medium">{formatDate(selectedBooking.endDate)}</p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Booking</DialogTitle>
            <DialogDescription>Add a new site booking for a campaign.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Campaign</Label>
                <Select value={formData.campaignId} onValueChange={(v) => setFormData({ ...formData, campaignId: v })}>
                  <SelectTrigger data-testid="select-booking-campaign">
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {(campaigns ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={formData.supplierId} onValueChange={(v) => setFormData({ ...formData, supplierId: v })}>
                  <SelectTrigger data-testid="select-booking-supplier">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {(suppliers ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-site">Site Description</Label>
              <Input
                id="booking-site"
                value={formData.siteDescription}
                onChange={(e) => setFormData({ ...formData, siteDescription: e.target.value })}
                required
                data-testid="input-booking-site"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="booking-location">Location</Label>
                <Input
                  id="booking-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  data-testid="input-booking-location"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-media">Media Type</Label>
                <Input
                  id="booking-media"
                  value={formData.mediaType}
                  onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                  placeholder="e.g. Billboard, Digital"
                  data-testid="input-booking-media-type"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-cost">Cost (ZAR)</Label>
              <Input
                id="booking-cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                data-testid="input-booking-cost"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="booking-start">Start Date</Label>
                <Input
                  id="booking-start"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  data-testid="input-booking-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-end">End Date</Label>
                <Input
                  id="booking-end"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  data-testid="input-booking-end-date"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-booking">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || !formData.campaignId || !formData.supplierId || !formData.siteDescription}
                data-testid="button-submit-booking"
              >
                {createMutation.isPending ? "Creating..." : "Create Booking"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
