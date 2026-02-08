"use client";
import { useEffect, useState } from "react";
import { JobList } from "@/components/jobs/job-list";
import { PageLayout } from "@/components/layout/page-layout";
import { t } from "@/lib/i18n";
import { useAuth } from "@/contexts/auth-contex";
import type { MemberProfile } from "@/types";
import { Briefcase, Clock, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
  const [stats, setStats] = useState({
    totalJobs: 0,
    closingSoon: 0,
    goodFit: 0,
  });

  // Fetch member profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const response = await fetch("/api/users/me/profile");
        if (response.ok) {
          const data = await response.json();
          setMemberProfile(data);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    fetchProfile();
  }, [user]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const url = user
          ? `/api/jobs/stats?userId=${user.id}`
          : "/api/jobs/stats";
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <PageLayout>
      <div className="container py-8 space-y-8">
        {/* Hero Section */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {user ? `Welcome back, ${user.name}!` : t("dashboard.title")}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Discover opportunities and help your network find their next role
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalJobs}</p>
                  <p className="text-sm text-muted-foreground">Active roles</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <Clock className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.closingSoon}</p>
                  <p className="text-sm text-muted-foreground">Closing soon</p>
                </div>
              </div>
            </div>

            {memberProfile && (
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.goodFit}</p>
                    <p className="text-sm text-muted-foreground">Good fit for you</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Job List */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Browse Opportunities
          </h2>
          <JobList memberProfile={memberProfile} />
        </div>
      </div>
    </PageLayout>
  );
}
