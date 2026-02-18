"use client";

import { useEffect, useState, useCallback } from "react";
import { JobList } from "@/components/jobs/job-list";
import { PageLayout } from "@/components/layout/page-layout";
import { t } from "@/lib/i18n";
import { useAuth } from "@/contexts/auth-contex";
import { fetchDashboardStats } from "@/lib/api";
import { Briefcase, Clock, TrendingUp, RefreshCw, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface DashboardStats {
  totalJobs: number;
  closingSoon: number;
  goodFit: number;
}

export default function MemberDashboard() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    closingSoon: 0,
    goodFit: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Fetch dashboard stats
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);

    try {
      const data = await fetchDashboardStats(user?.id);
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setStatsError("Failed to load statistics");
    } finally {
      setStatsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) {
      loadStats();
    }
  }, [authLoading, loadStats]);

  const statCards = [
    {
      icon: Briefcase,
      label: t("dashboard.stats.total"),
      value: stats.totalJobs,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Clock,
      label: t("dashboard.stats.closing"),
      value: stats.closingSoon,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      icon: TrendingUp,
      label: t("dashboard.stats.goodFit"),
      value: stats.goodFit,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ];

  return (
    <PageLayout>
      <div className="container py-8 space-y-8">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {user ? `Welcome back, ${user.name}!` : t("dashboard.title")}
              </h1>
              <p className="mt-2 text-muted-foreground">
                Discover opportunities and help your network find their next role
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadStats}
              disabled={statsLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {statsLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </>
            ) : statsError ? (
              <div className="col-span-3 text-center py-4 text-muted-foreground">
                {statsError}
              </div>
            ) : (
              statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}>
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {stat.value}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Profile Completeness Warning */}
          {profile && profile.profileCompleteness < 50 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                <strong>Complete your profile</strong> to get better job matches! 
                Your profile is {profile.profileCompleteness}% complete.
              </p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-3">
            <Link href="/referrals">
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                My Referrals
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline" size="sm">
                Complete Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Job List */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            {t("dashboard.jobs.title")}
          </h2>
          <JobList memberProfile={profile} />
        </div>
      </div>
    </PageLayout>
  );
}
