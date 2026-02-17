/**
 * @fileoverview Dashboard page displaying an overview of campaign and booking
 * statistics. Shows six stat cards (total campaigns, active campaigns, total
 * bookings, pending bookings, completed bookings, total spend in ZAR), a
 * campaign status distribution bar chart, and a recent activity feed.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, FileText, Clock, CheckCircle, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

/** Formats a numeric value as South African Rand (ZAR) currency. */
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(value);

/** Sample data for the campaign status distribution bar chart. */
const chartData = [
  { name: "Draft", value: 3 },
  { name: "Pending", value: 5 },
  { name: "Approved", value: 8 },
  { name: "In Progress", value: 4 },
  { name: "Completed", value: 12 },
  { name: "Cancelled", value: 1 },
];

/** Shape of the dashboard statistics returned by the API. */
interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalSpend: number;
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  /** Configuration for the six summary stat cards rendered on the dashboard. */
  const statCards = [
    { title: "Total Campaigns", value: stats?.totalCampaigns ?? 0, icon: FileText, id: "total-campaigns" },
    { title: "Active Campaigns", value: stats?.activeCampaigns ?? 0, icon: TrendingUp, id: "active-campaigns" },
    { title: "Total Bookings", value: stats?.totalBookings ?? 0, icon: BarChart3, id: "total-bookings" },
    { title: "Pending Bookings", value: stats?.pendingBookings ?? 0, icon: Clock, id: "pending-bookings" },
    { title: "Completed Bookings", value: stats?.completedBookings ?? 0, icon: CheckCircle, id: "completed-bookings" },
    { title: "Total Spend", value: formatCurrency(stats?.totalSpend ?? 0), icon: DollarSign, id: "total-spend", isCurrency: true },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900" data-testid="text-welcome">
          Welcome back, {user?.fullName ?? "User"}
        </h1>
        <p className="text-slate-500 mt-1">Here's an overview of your OOH campaigns and bookings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.id} data-testid={`card-stat-${stat.id}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold text-slate-900" data-testid={`text-stat-${stat.id}`}>
                  {stat.isCurrency ? stat.value : stat.value}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Campaign Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#334155" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="list-recent-activity">
              {[
                { text: "Campaign 'Joburg Billboard Q1' was approved", time: "2 hours ago" },
                { text: "New booking created for Cape Town digital signage", time: "4 hours ago" },
                { text: "Invoice #INV-2026-001 submitted for review", time: "6 hours ago" },
                { text: "Proof of flighting uploaded for Durban campaign", time: "1 day ago" },
                { text: "Budget allocation updated for Gauteng region", time: "2 days ago" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-slate-700">{item.text}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
