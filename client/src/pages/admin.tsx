/**
 * Administration page accessible only to department_admin users. Contains three tabs:
 * Users (create accounts and toggle active/inactive status), Suppliers (register OOH
 * suppliers and toggle status), and Settings (placeholder cards for system configuration,
 * audit log, data export, and integration settings).
 */
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { User, Supplier, InsertUser, InsertSupplier } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Users, Building2, Settings, Loader2, Database, ScrollText, Download, Plug } from "lucide-react";

/** All six system roles: department_admin, campaign_planner, finance_officer, supplier_admin, supplier_user, auditor. */
const ROLES = [
  { value: "department_admin", label: "Department Admin" },
  { value: "campaign_planner", label: "Campaign Planner" },
  { value: "finance_officer", label: "Finance Officer" },
  { value: "supplier_admin", label: "Supplier Admin" },
  { value: "supplier_user", label: "Supplier User" },
  { value: "auditor", label: "Auditor" },
];

/** Colour-coded Tailwind classes for role badges, giving each role a distinct visual identity. */
const roleColors: Record<string, string> = {
  department_admin: "bg-purple-50 text-purple-700 border-purple-200",
  campaign_planner: "bg-blue-50 text-blue-700 border-blue-200",
  finance_officer: "bg-emerald-50 text-emerald-700 border-emerald-200",
  supplier_admin: "bg-orange-50 text-orange-700 border-orange-200",
  supplier_user: "bg-yellow-50 text-yellow-700 border-yellow-200",
  auditor: "bg-slate-100 text-slate-700 border-slate-200",
};

const roleLabels: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.value, r.label]));

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900" data-testid="text-page-title">
            Administration
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage users, suppliers, and system settings</p>
        </div>

        <Tabs defaultValue="users">
          <TabsList data-testid="tabs-admin">
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="h-4 w-4 mr-1" /> Users
            </TabsTrigger>
            <TabsTrigger value="suppliers" data-testid="tab-suppliers">
              <Building2 className="h-4 w-4 mr-1" /> Suppliers
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="h-4 w-4 mr-1" /> Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>

          <TabsContent value="suppliers">
            <SuppliersTab />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/** Manages user accounts: lists all users, allows creating new accounts, and toggling active/inactive status. */
function UsersTab() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post<User>("/api/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User created", description: "New user account has been created." });
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch<User>(`/api/users/${id}`, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Status updated", description: "User status has been updated." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFullName("");
    setUsername("");
    setEmail("");
    setPassword("");
    setRole("");
  };

  const handleCreate = () => {
    if (!fullName || !username || !email || !password || !role) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    createMutation.mutate({ fullName, username, email, password, role });
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-slate-800">System Users</h2>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-user">
          <Plus className="h-4 w-4 mr-1" /> Add User
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-8 text-slate-500" data-testid="text-empty-users">No users found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                    <TableCell className="font-medium">{u.fullName}</TableCell>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge className={roleColors[u.role] || ""} variant="outline" data-testid={`badge-role-${u.id}`}>
                        {roleLabels[u.role] || u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={u.active}
                          onCheckedChange={(checked) => toggleMutation.mutate({ id: u.id, active: checked })}
                          data-testid={`switch-user-status-${u.id}`}
                        />
                        <span className={`text-xs ${u.active ? "text-green-600" : "text-slate-400"}`}>
                          {u.active ? "Active" : "Inactive"}
                        </span>
                      </div>
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
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Create a new user account for the system.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-fullname">Full Name *</Label>
              <Input
                id="user-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                data-testid="input-user-fullname"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-username">Username *</Label>
              <Input
                id="user-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                data-testid="input-user-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email *</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@gov.za"
                data-testid="input-user-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">Password *</Label>
              <Input
                id="user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                data-testid="input-user-password"
              />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger data-testid="select-user-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-user">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-submit-user">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Manages supplier registrations: lists registered suppliers, allows adding new ones, and toggling status. */
function SuppliersTab() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post<Supplier>("/api/suppliers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ title: "Supplier added", description: "New supplier has been registered." });
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch<Supplier>(`/api/suppliers/${id}`, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ title: "Status updated", description: "Supplier status has been updated." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setName("");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setAddress("");
  };

  const handleCreate = () => {
    if (!name || !contactPerson || !email) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    createMutation.mutate({ name, contactPerson, email, phone: phone || null, address: address || null });
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-slate-800">Registered Suppliers</h2>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-supplier">
          <Plus className="h-4 w-4 mr-1" /> Add Supplier
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : suppliers.length === 0 ? (
            <p className="text-center py-8 text-slate-500" data-testid="text-empty-suppliers">No suppliers registered yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.id} data-testid={`row-supplier-${s.id}`}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.contactPerson}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.phone || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={s.active}
                          onCheckedChange={(checked) => toggleMutation.mutate({ id: s.id, active: checked })}
                          data-testid={`switch-supplier-status-${s.id}`}
                        />
                        <span className={`text-xs ${s.active ? "text-green-600" : "text-slate-400"}`}>
                          {s.active ? "Active" : "Inactive"}
                        </span>
                      </div>
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
            <DialogTitle>Add Supplier</DialogTitle>
            <DialogDescription>Register a new supplier in the system.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplier-name">Company Name *</Label>
              <Input
                id="supplier-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="OOH Media Solutions"
                data-testid="input-supplier-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-contact">Contact Person *</Label>
              <Input
                id="supplier-contact"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Jane Smith"
                data-testid="input-supplier-contact"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-email">Email *</Label>
              <Input
                id="supplier-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@supplier.co.za"
                data-testid="input-supplier-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-phone">Phone</Label>
              <Input
                id="supplier-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+27 11 234 5678"
                data-testid="input-supplier-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-address">Address</Label>
              <Input
                id="supplier-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main Street, Johannesburg"
                data-testid="input-supplier-address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-supplier">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-submit-supplier">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Add Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Placeholder settings cards for system configuration, audit log, data export, and integration settings. */
function SettingsTab() {
  const settingsCards = [
    {
      title: "System Configuration",
      description: "Manage global system parameters, default values, and application behaviour settings.",
      icon: Settings,
    },
    {
      title: "Audit Log",
      description: "View system audit trail including user actions, data changes, and access logs.",
      icon: ScrollText,
    },
    {
      title: "Data Export",
      description: "Export system data in various formats for reporting and archival purposes.",
      icon: Download,
    },
    {
      title: "Integration Settings",
      description: "Configure external integrations including Azure Blob Storage, email, and notification services.",
      icon: Plug,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
      {settingsCards.map((card) => (
        <Card key={card.title}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <card.icon className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <CardTitle className="text-base">{card.title}</CardTitle>
                <CardDescription className="mt-1">{card.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled data-testid={`button-configure-${card.title.toLowerCase().replace(/\s+/g, "-")}`}>
              Configure
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
