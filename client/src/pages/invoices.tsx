import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Invoice, Campaign, Supplier } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileDown, FileSpreadsheet, DollarSign, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  sent: "bg-blue-50 text-blue-700 border-blue-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
};

const formatCurrency = (value: string | number | null) => {
  if (!value) return "—";
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(Number(value));
};

const formatDate = (date: string | Date | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-ZA");
};

const monthlySpendData = [
  { month: "Jul", amount: 245000 },
  { month: "Aug", amount: 312000 },
  { month: "Sep", amount: 198000 },
  { month: "Oct", amount: 425000 },
  { month: "Nov", amount: 367000 },
  { month: "Dec", amount: 289000 },
  { month: "Jan", amount: 410000 },
  { month: "Feb", amount: 356000 },
];

const pieData = [
  { name: "Paid", value: 1250000, color: "#16a34a" },
  { name: "Outstanding", value: 480000, color: "#2563eb" },
  { name: "Overdue", value: 120000, color: "#dc2626" },
];

export default function InvoicesPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900" data-testid="text-page-title">
            Invoices & Reporting
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage invoices, track payments, and view financial reports</p>
        </div>

        <Tabs defaultValue="invoices">
          <TabsList data-testid="tabs-invoices">
            <TabsTrigger value="invoices" data-testid="tab-invoices">Invoices</TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices">
            <InvoicesTab
              invoices={invoices}
              campaigns={campaigns}
              suppliers={suppliers}
              loading={invoicesLoading}
              dialogOpen={dialogOpen}
              setDialogOpen={setDialogOpen}
            />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab invoices={invoices} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function InvoicesTab({ invoices, campaigns, suppliers, loading, dialogOpen, setDialogOpen }: {
  invoices: Invoice[];
  campaigns: Campaign[];
  suppliers: Supplier[];
  loading: boolean;
  dialogOpen: boolean;
  setDialogOpen: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const [campaignId, setCampaignId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post<Invoice>("/api/invoices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Invoice created", description: "Invoice has been generated successfully." });
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setCampaignId("");
    setSupplierId("");
    setInvoiceNumber("");
    setAmount("");
    setDueDate("");
  };

  const handleCreate = () => {
    if (!campaignId || !invoiceNumber || !amount) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      campaignId,
      supplierId: supplierId || null,
      invoiceNumber,
      amount,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      status: "draft",
      issuedAt: new Date().toISOString(),
    });
  };

  const handleDownloadPdf = () => {
    toast({ title: "Download PDF", description: "PDF download functionality will be connected in production." });
  };

  const handleExportExcel = () => {
    toast({ title: "Export to Excel", description: "Excel export functionality will be connected in production." });
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-slate-800">All Invoices</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel} data-testid="button-export-excel">
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Export to Excel
          </Button>
          <Button onClick={() => setDialogOpen(true)} data-testid="button-generate-invoice">
            <Plus className="h-4 w-4 mr-1" /> Generate Invoice
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-center py-8 text-slate-500" data-testid="text-empty-invoices">No invoices created yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id} data-testid={`row-invoice-${inv.id}`}>
                    <TableCell className="font-medium" data-testid={`text-invoice-number-${inv.id}`}>{inv.invoiceNumber}</TableCell>
                    <TableCell>{campaigns.find((c) => c.id === inv.campaignId)?.name || inv.campaignId}</TableCell>
                    <TableCell>{suppliers.find((s) => s.id === inv.supplierId)?.name || inv.supplierId || "—"}</TableCell>
                    <TableCell>{formatCurrency(inv.amount)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[inv.status] || ""} variant="outline" data-testid={`status-invoice-${inv.id}`}>
                        {statusLabels[inv.status] || inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(inv.issuedAt)}</TableCell>
                    <TableCell>{formatDate(inv.dueDate)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={handleDownloadPdf} data-testid={`button-download-pdf-${inv.id}`}>
                        <FileDown className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>Create a new invoice for a campaign booking.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Campaign *</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger data-testid="select-invoice-campaign">
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
              <Label>Supplier</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger data-testid="select-invoice-supplier">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-number">Invoice Number *</Label>
              <Input
                id="invoice-number"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-2026-001"
                data-testid="input-invoice-number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-amount">Amount (ZAR) *</Label>
              <Input
                id="invoice-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                data-testid="input-invoice-amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-due">Due Date</Label>
              <Input
                id="invoice-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                data-testid="input-invoice-due"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-invoice">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-submit-invoice">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReportsTab({ invoices }: { invoices: Invoice[] }) {
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  const totalPaid = invoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  const outstanding = invoices.filter((inv) => inv.status === "sent" || inv.status === "draft").reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  const overdueCount = invoices.filter((inv) => inv.status === "overdue").length;

  const summaryCards = [
    { title: "Total Invoiced", value: formatCurrency(totalInvoiced), icon: DollarSign, color: "text-slate-700" },
    { title: "Total Paid", value: formatCurrency(totalPaid), icon: TrendingUp, color: "text-green-600" },
    { title: "Outstanding", value: formatCurrency(outstanding), icon: DollarSign, color: "text-blue-600" },
    { title: "Overdue Count", value: overdueCount.toString(), icon: AlertCircle, color: "text-red-600" },
  ];

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.title}</p>
                  <p className={`text-2xl font-semibold mt-1 ${card.color}`} data-testid={`text-summary-${card.title.toLowerCase().replace(/\s+/g, "-")}`}>
                    {card.value}
                  </p>
                </div>
                <card.icon className={`h-8 w-8 ${card.color} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlySpendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="amount" fill="#1e40af" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
