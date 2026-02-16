import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Inventory, Supplier } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Monitor,
  MapPin,
  Sun,
  Zap,
  Eye,
  Plus,
  Search,
  Filter,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Wrench,
} from "lucide-react";

const ZAR = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" });

const regions = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
];

const screenTypes = ["Billboard", "Digital Screen", "LED Wall", "Mega Billboard", "Street Furniture", "Transit", "Mall"];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  available: { label: "Available", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle },
  booked: { label: "Booked", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock },
  maintenance: { label: "Maintenance", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Wrench },
  reserved: { label: "Reserved", color: "bg-purple-100 text-purple-700 border-purple-200", icon: AlertTriangle },
};

export default function InventoryPage() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const isSupplierUser = hasRole("supplier_admin", "supplier_user");
  const canManage = hasRole("department_admin", "supplier_admin", "supplier_user");

  const { data: items = [], isLoading } = useQuery<Inventory[]>({
    queryKey: ["inventory", user?.id],
    queryFn: () => api.get("/api/inventory"),
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: () => api.get("/api/suppliers"),
  });

  const supplierMap = Object.fromEntries(suppliers.map((s) => [s.id, s.name]));

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post("/api/inventory", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setAddOpen(false);
      toast({ title: "Screen added", description: "Inventory item created successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/api/inventory/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: "Updated", description: "Screen status updated." });
    },
  });

  const filtered = items.filter((item) => {
    const matchSearch =
      !search ||
      item.screenName.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase());
    const matchRegion = regionFilter === "all" || item.region === regionFilter;
    const matchStatus = statusFilter === "all" || item.status === statusFilter;
    const matchType = typeFilter === "all" || item.screenType === typeFilter;
    return matchSearch && matchRegion && matchStatus && matchType;
  });

  const stats = {
    total: items.length,
    available: items.filter((i) => i.status === "available").length,
    booked: items.filter((i) => i.status === "booked").length,
    maintenance: items.filter((i) => i.status === "maintenance").length,
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {
      supplierId: isSupplierUser && user?.supplierId ? user.supplierId : fd.get("supplierId"),
      screenName: fd.get("screenName"),
      screenType: fd.get("screenType"),
      location: fd.get("location"),
      region: fd.get("region"),
      dimensions: fd.get("dimensions") || undefined,
      resolution: fd.get("resolution") || undefined,
      facing: fd.get("facing") || undefined,
      dailyRate: fd.get("dailyRate"),
      weeklyRate: fd.get("weeklyRate") || undefined,
      monthlyRate: fd.get("monthlyRate") || undefined,
      illuminated: fd.get("illuminated") === "true",
      digital: fd.get("digital") === "true",
      trafficCount: fd.get("trafficCount") ? Number(fd.get("trafficCount")) : undefined,
      notes: fd.get("notes") || undefined,
      active: true,
    };
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6" data-testid="inventory-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Live Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSupplierUser
              ? "Manage your organisation's screen inventory"
              : "Real-time screen availability across all suppliers"}
          </p>
        </div>
        {canManage && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-screen">
                <Plus className="mr-2 h-4 w-4" />
                Add Screen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Screen to Inventory</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="screenName">Screen Name</Label>
                    <Input id="screenName" name="screenName" required data-testid="input-screen-name" />
                  </div>
                  {isSupplierUser && user?.supplierId ? (
                    <div className="space-y-2">
                      <Label>Supplier</Label>
                      <Input value={supplierMap[user.supplierId] || "Your Organisation"} disabled className="bg-muted" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="supplierId">Supplier</Label>
                      <select name="supplierId" required className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" data-testid="select-supplier">
                        <option value="">Select supplier</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="screenType">Screen Type</Label>
                    <select name="screenType" required className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" data-testid="select-screen-type">
                      <option value="">Select type</option>
                      {screenTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <select name="region" required className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" data-testid="select-region">
                      <option value="">Select region</option>
                      {regions.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" required placeholder="e.g. N1 Highway, Midrand" data-testid="input-location" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dimensions">Dimensions</Label>
                    <Input id="dimensions" name="dimensions" placeholder="e.g. 6m x 3m" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facing">Facing</Label>
                    <Input id="facing" name="facing" placeholder="e.g. North-facing" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dailyRate">Daily Rate (ZAR)</Label>
                    <Input id="dailyRate" name="dailyRate" type="number" step="0.01" required data-testid="input-daily-rate" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weeklyRate">Weekly Rate (ZAR)</Label>
                    <Input id="weeklyRate" name="weeklyRate" type="number" step="0.01" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyRate">Monthly Rate (ZAR)</Label>
                    <Input id="monthlyRate" name="monthlyRate" type="number" step="0.01" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trafficCount">Daily Traffic Count</Label>
                    <Input id="trafficCount" name="trafficCount" type="number" placeholder="e.g. 45000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resolution">Resolution (digital only)</Label>
                    <Input id="resolution" name="resolution" placeholder="e.g. 1920x1080" />
                  </div>
                  <div className="space-y-2">
                    <Label>Illuminated</Label>
                    <select name="illuminated" className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Digital</Label>
                    <select name="digital" className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input id="notes" name="notes" placeholder="Any additional details" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-screen">
                    {createMutation.isPending ? "Adding..." : "Add Screen"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card data-testid="stat-total-screens">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Monitor className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Screens</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-available">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.available}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-booked">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.booked}</p>
                <p className="text-xs text-muted-foreground">Booked</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-maintenance">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Wrench className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.maintenance}</p>
                <p className="text-xs text-muted-foreground">Maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search screens or locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-inventory"
              />
            </div>
            <div className="flex gap-2">
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-[160px]" data-testid="filter-region">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]" data-testid="filter-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]" data-testid="filter-type">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {screenTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Loading inventory...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Monitor className="h-10 w-10 mb-2 opacity-40" />
              <p>No screens found</p>
              <p className="text-xs">Try adjusting your filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Screen</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Daily Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Features</TableHead>
                  <TableHead className="text-right">Traffic</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => {
                  const st = statusConfig[item.status] || statusConfig.available;
                  const StatusIcon = st.icon;
                  return (
                    <TableRow key={item.id} data-testid={`row-inventory-${item.id}`}>
                      <TableCell className="font-medium">{item.screenName}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {supplierMap[item.supplierId] || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{item.screenType}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {item.location}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{item.region}</TableCell>
                      <TableCell className="text-right font-medium">{ZAR.format(Number(item.dailyRate))}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${st.color} border text-xs gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {st.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          {item.illuminated && (
                            <span title="Illuminated" className="inline-flex h-6 w-6 items-center justify-center rounded bg-yellow-100 text-yellow-700">
                              <Sun className="h-3 w-3" />
                            </span>
                          )}
                          {item.digital && (
                            <span title="Digital" className="inline-flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-blue-700">
                              <Zap className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {item.trafficCount ? `${(item.trafficCount / 1000).toFixed(0)}k/day` : "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedItem(item)}
                          data-testid={`button-view-${item.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          {selectedItem && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedItem.screenName}</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-2">
                  {(() => {
                    const st = statusConfig[selectedItem.status] || statusConfig.available;
                    const StatusIcon = st.icon;
                    return (
                      <Badge variant="outline" className={`${st.color} border text-sm gap-1 py-1 px-3`}>
                        <StatusIcon className="h-4 w-4" />
                        {st.label}
                      </Badge>
                    );
                  })()}
                  {canManage && (
                    <Select
                      value={selectedItem.status}
                      onValueChange={(val) => {
                        updateMutation.mutate({ id: selectedItem.id, data: { status: val } });
                        setSelectedItem({ ...selectedItem, status: val as Inventory["status"] });
                      }}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs" data-testid="select-update-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="booked">Booked</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Location Details</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Supplier</p>
                      <p className="font-medium">{supplierMap[selectedItem.supplierId] || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Region</p>
                      <p className="font-medium">{selectedItem.region}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Address</p>
                      <p className="font-medium">{selectedItem.location}</p>
                    </div>
                    {selectedItem.gpsLatitude && selectedItem.gpsLongitude && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">GPS Coordinates</p>
                        <p className="font-medium font-mono text-xs">{selectedItem.gpsLatitude}, {selectedItem.gpsLongitude}</p>
                      </div>
                    )}
                    {selectedItem.facing && (
                      <div>
                        <p className="text-muted-foreground">Facing</p>
                        <p className="font-medium">{selectedItem.facing}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Screen Specifications</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium">{selectedItem.screenType}</p>
                    </div>
                    {selectedItem.dimensions && (
                      <div>
                        <p className="text-muted-foreground">Dimensions</p>
                        <p className="font-medium">{selectedItem.dimensions}</p>
                      </div>
                    )}
                    {selectedItem.resolution && (
                      <div>
                        <p className="text-muted-foreground">Resolution</p>
                        <p className="font-medium">{selectedItem.resolution}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Illuminated</p>
                      <p className="font-medium">{selectedItem.illuminated ? "Yes" : "No"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Digital</p>
                      <p className="font-medium">{selectedItem.digital ? "Yes" : "No"}</p>
                    </div>
                    {selectedItem.trafficCount && (
                      <div>
                        <p className="text-muted-foreground">Daily Traffic</p>
                        <p className="font-medium">{selectedItem.trafficCount.toLocaleString("en-ZA")}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pricing</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-xs text-muted-foreground">Daily</p>
                        <p className="text-sm font-semibold">{ZAR.format(Number(selectedItem.dailyRate))}</p>
                      </CardContent>
                    </Card>
                    {selectedItem.weeklyRate && (
                      <Card>
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">Weekly</p>
                          <p className="text-sm font-semibold">{ZAR.format(Number(selectedItem.weeklyRate))}</p>
                        </CardContent>
                      </Card>
                    )}
                    {selectedItem.monthlyRate && (
                      <Card>
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">Monthly</p>
                          <p className="text-sm font-semibold">{ZAR.format(Number(selectedItem.monthlyRate))}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                {selectedItem.notes && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Notes</h3>
                      <p className="text-sm">{selectedItem.notes}</p>
                    </div>
                  </>
                )}

                <Separator />

                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(selectedItem.updatedAt).toLocaleString("en-ZA")}
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
