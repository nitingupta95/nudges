"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-contex";
import { PageLayout } from "@/components/layout/page-layout";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Main dashboard page - redirects to role-specific dashboard
 */
export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect based on user role
      if (user.role === "RECRUITER" || user.role === "ADMIN") {
        router.replace("/dashboard/recruiter");
      } else {
        router.replace("/dashboard/member");
      }
    }
  }, [user, isLoading, router]);

  // Show loading state while determining role
  return (
    <PageLayout>
      <div className="container py-8 space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </PageLayout>
  );
}