"use client";

import { useEffect, useState, useCallback } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { useAuth } from "@/contexts/auth-contex";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Eye,
  Users,
  MessageSquare,
  UserPlus,
  Send,
  Trophy,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface FunnelMetrics {
  jobViews: number;
  uniqueJobViewers: number;
  nudgesShown: number;
  nudgesClicked: number;
  referralsStarted: number;
  referralsSubmitted: number;
  hiresMade: number;
  viewToNudgeRate: number;
  nudgeClickRate: number;
  clickToStartRate: number;
  startToSubmitRate: number;
  overallConversionRate: number;
  period: { startDate: string; endDate: string };
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<FunnelMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState("30");

  const fetchMetrics = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/analytics/funnel?days=${days}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          setError("You don't have permission to view this dashboard.");
          return;
        }
        throw new Error("Failed to fetch metrics");
      }
      
      const data = await response.json();
      setMetrics(data.metrics);
    } catch (err) {
      console.error("Error fetching metrics:", err);
      setError("Failed to load analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, days]);

  useEffect(() => {
    if (user && (user.role === "ADMIN" || user.role === "RECRUITER")) {
      fetchMetrics();
    } else if (user) {
      setError("You don't have permission to view this dashboard.");
      setLoading(false);
    }
  }, [user, fetchMetrics]);

  // Redirect if not admin/recruiter
  useEffect(() => {
    if (!authLoading && user && user.role === "MEMBER") {
      router.push("/dashboard/member");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <PageLayout>
        <div className="container py-8 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;
  const formatNumber = (value: number) => value.toLocaleString();

  return (
    <PageLayout>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitor referral funnel performance and conversion metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchMetrics} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="py-4">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : metrics ? (
          <>
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Job Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(metrics.jobViews)}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(metrics.uniqueJobViewers)} unique viewers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Nudges Shown</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(metrics.nudgesShown)}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatPercent(metrics.nudgeClickRate)} click rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Referrals Submitted</CardTitle>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(metrics.referralsSubmitted)}</div>
                  <p className="text-xs text-muted-foreground">
                    from {formatNumber(metrics.referralsStarted)} started
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Overall Conversion</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPercent(metrics.overallConversionRate)}</div>
                  <p className="text-xs text-muted-foreground">
                    views → referrals
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Funnel Visualization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Referral Funnel
                </CardTitle>
                <CardDescription>
                  Conversion rates at each stage of the referral process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Funnel stages */}
                  <FunnelStage
                    label="Job Views"
                    count={metrics.jobViews}
                    percentage={100}
                    color="bg-blue-500"
                    icon={<Eye className="h-4 w-4" />}
                  />
                  
                  <FunnelArrow rate={metrics.viewToNudgeRate} />
                  
                  <FunnelStage
                    label="Nudges Shown"
                    count={metrics.nudgesShown}
                    percentage={metrics.viewToNudgeRate}
                    color="bg-indigo-500"
                    icon={<MessageSquare className="h-4 w-4" />}
                  />
                  
                  <FunnelArrow rate={metrics.nudgeClickRate} />
                  
                  <FunnelStage
                    label="Nudges Clicked"
                    count={metrics.nudgesClicked}
                    percentage={(metrics.nudgesClicked / Math.max(metrics.jobViews, 1)) * 100}
                    color="bg-violet-500"
                    icon={<UserPlus className="h-4 w-4" />}
                  />
                  
                  <FunnelArrow rate={metrics.clickToStartRate} />
                  
                  <FunnelStage
                    label="Referrals Started"
                    count={metrics.referralsStarted}
                    percentage={(metrics.referralsStarted / Math.max(metrics.jobViews, 1)) * 100}
                    color="bg-purple-500"
                    icon={<Users className="h-4 w-4" />}
                  />
                  
                  <FunnelArrow rate={metrics.startToSubmitRate} />
                  
                  <FunnelStage
                    label="Referrals Submitted"
                    count={metrics.referralsSubmitted}
                    percentage={(metrics.referralsSubmitted / Math.max(metrics.jobViews, 1)) * 100}
                    color="bg-green-500"
                    icon={<Send className="h-4 w-4" />}
                  />

                  {metrics.hiresMade > 0 && (
                    <>
                      <FunnelArrow rate={(metrics.hiresMade / Math.max(metrics.referralsSubmitted, 1)) * 100} />
                      <FunnelStage
                        label="Hires Made"
                        count={metrics.hiresMade}
                        percentage={(metrics.hiresMade / Math.max(metrics.jobViews, 1)) * 100}
                        color="bg-emerald-500"
                        icon={<Trophy className="h-4 w-4" />}
                      />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Conversion Rate Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <ConversionCard
                title="View → Nudge"
                rate={metrics.viewToNudgeRate}
                target={40}
              />
              <ConversionCard
                title="Nudge → Click"
                rate={metrics.nudgeClickRate}
                target={8}
              />
              <ConversionCard
                title="Click → Start"
                rate={metrics.clickToStartRate}
                target={50}
              />
              <ConversionCard
                title="Start → Submit"
                rate={metrics.startToSubmitRate}
                target={70}
              />
            </div>
          </>
        ) : null}
      </div>
    </PageLayout>
  );
}

function FunnelStage({
  label,
  count,
  percentage,
  color,
  icon,
}: {
  label: string;
  count: number;
  percentage: number;
  color: string;
  icon: React.ReactNode;
}) {
  const width = Math.max(percentage, 5); // Minimum 5% width for visibility
  
  return (
    <div className="relative">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${color} text-white`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium">{label}</span>
            <span className="text-muted-foreground">{count.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className="h-3 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function FunnelArrow({ rate }: { rate: number }) {
  return (
    <div className="flex items-center justify-center py-1">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowRight className="h-4 w-4" />
        <span>{rate.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function ConversionCard({
  title,
  rate,
  target,
}: {
  title: string;
  rate: number;
  target: number;
}) {
  const isAboveTarget = rate >= target;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{rate.toFixed(1)}%</span>
          {isAboveTarget ? (
            <Badge variant="default" className="bg-green-500">
              <TrendingUp className="h-3 w-3 mr-1" />
              Above target
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
              <TrendingDown className="h-3 w-3 mr-1" />
              Below {target}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
