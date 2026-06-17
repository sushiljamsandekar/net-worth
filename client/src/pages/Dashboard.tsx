import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { TrendingUp, TrendingDown, Target, AlertCircle } from "lucide-react";
import { useMemo } from "react";

const COLORS = ["#0052CC", "#0066FF", "#3385FF", "#6699FF", "#99BBFF"];

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const netWorthQuery = trpc.analytics.netWorth.useQuery(undefined, {
    enabled: !!user,
  });

  const historyQuery = trpc.analytics.netWorthHistory.useQuery(undefined, {
    enabled: !!user,
  });

  const portfolioQuery = trpc.analytics.portfolioBreakdown.useQuery(undefined, {
    enabled: !!user,
  });

  const riskQuery = trpc.analytics.riskMeter.useQuery(undefined, {
    enabled: !!user,
  });

  const assetsQuery = trpc.assets.list.useQuery(undefined, {
    enabled: !!user,
  });

  const liabilitiesQuery = trpc.liabilities.list.useQuery(undefined, {
    enabled: !!user,
  });

  const goalsQuery = trpc.goals.list.useQuery(undefined, {
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isLoading = netWorthQuery.isLoading || historyQuery.isLoading;
  const netWorth = netWorthQuery.data;
  const history = historyQuery.data || [];
  const portfolio = portfolioQuery.data || {};
  const risk = riskQuery.data;

  const portfolioData = useMemo(() => {
    return Object.entries(portfolio).map(([category, amount]) => ({
      name: category.replace(/_/g, " ").toUpperCase(),
      value: Number(amount),
    }));
  }, [portfolio]);

  const netWorthChange = useMemo(() => {
    if (history.length < 2) return 0;
    const latest = Number(history[history.length - 1]?.netWorth || 0);
    const previous = Number(history[history.length - 2]?.netWorth || 0);
    return latest - previous;
  }, [history]);

  const chartData = useMemo(() => {
    return history.map((item) => ({
      date: new Date(item.snapshotDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      netWorth: Number(item.netWorth),
      assets: Number(item.totalAssets),
      liabilities: Number(item.totalLiabilities),
    }));
  }, [history]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case "very_low":
        return "#10B981";
      case "low":
        return "#3B82F6";
      case "medium":
        return "#F59E0B";
      case "high":
        return "#EF4444";
      case "very_high":
        return "#7F1D1D";
      default:
        return "#6B7280";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Net Worth Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.name || "User"}</p>
          </div>
        </div>

        {/* Net Worth Overview */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Total Net Worth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-5xl font-bold text-primary mb-2">
                  {isLoading ? <Skeleton className="h-12 w-48" /> : formatCurrency(netWorth?.netWorth || 0)}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {netWorthChange > 0 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 font-semibold">
                        +{formatCurrency(netWorthChange)} this period
                      </span>
                    </>
                  ) : netWorthChange < 0 ? (
                    <>
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      <span className="text-red-600 font-semibold">
                        {formatCurrency(netWorthChange)} this period
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">No change this period</span>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Assets</p>
                  <p className="text-2xl font-bold text-green-600">
                    {isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(netWorth?.totalAssets || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Liabilities</p>
                  <p className="text-2xl font-bold text-red-600">
                    {isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(netWorth?.totalLiabilities || 0)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Net Worth Trend */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Net Worth Trend</CardTitle>
              <CardDescription>Historical net worth progression</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-80" />
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: `1px solid var(--border)`,
                        borderRadius: "var(--radius)",
                      }}
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="netWorth" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No data available yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Asset Allocation */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Asset Allocation</CardTitle>
              <CardDescription>Portfolio breakdown by category</CardDescription>
            </CardHeader>
            <CardContent>
              {portfolioQuery.isLoading ? (
                <Skeleton className="h-80" />
              ) : portfolioData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={portfolioData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                      {portfolioData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  Add assets to see allocation
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Risk Meter & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Meter */}
          <Card className="border-0 shadow-lg lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Risk Assessment</CardTitle>
              <CardDescription>Portfolio risk profile</CardDescription>
            </CardHeader>
            <CardContent>
              {riskQuery.isLoading ? (
                <Skeleton className="h-40" />
              ) : risk ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="8" />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke={getRiskColor(risk.riskLevel)}
                          strokeWidth="8"
                          strokeDasharray={`${(risk.riskScore / 100) * 282.7} 282.7`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <div className="text-3xl font-bold text-foreground">{risk.riskScore}</div>
                        <div className="text-xs text-muted-foreground">Risk Score</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground capitalize">{risk.riskLevel.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground mt-1">Portfolio risk level</p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assets Card */}
            <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => navigate("/assets")}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Total Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-green-600">
                    {assetsQuery.isLoading ? <Skeleton className="h-8 w-32" /> : (assetsQuery.data?.length || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {assetsQuery.isLoading ? "" : `${assetsQuery.data?.length || 0} asset${(assetsQuery.data?.length || 0) !== 1 ? "s" : ""}`}
                  </p>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Manage Assets
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Liabilities Card */}
            <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => navigate("/liabilities")}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Total Liabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-red-600">
                    {liabilitiesQuery.isLoading ? <Skeleton className="h-8 w-32" /> : (liabilitiesQuery.data?.length || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {liabilitiesQuery.isLoading ? "" : `${liabilitiesQuery.data?.length || 0} liabilit${(liabilitiesQuery.data?.length || 0) !== 1 ? "ies" : "y"}`}
                  </p>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Manage Liabilities
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Goals Card */}
            <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow md:col-span-2" onClick={() => navigate("/goals")}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Financial Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-primary">
                    {goalsQuery.isLoading ? <Skeleton className="h-8 w-32" /> : (goalsQuery.data?.length || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {goalsQuery.isLoading ? "" : `${goalsQuery.data?.length || 0} goal${(goalsQuery.data?.length || 0) !== 1 ? "s" : ""}`}
                  </p>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Track Goals
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
