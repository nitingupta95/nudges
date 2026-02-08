"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Users, Building2 } from "lucide-react";
import { t } from "@/lib/i18n";
import type { ContactInsights } from "@/services/ai/ai.service";

interface ContactInsightsPanelProps {
  jobId: string;
  jobTitle: string;
  jobDescription: string;
  company?: string;
}

export function ContactInsightsPanel({
  jobId,
  jobTitle,
  jobDescription,
  company,
}: ContactInsightsPanelProps) {
  const [insights, setInsights] = useState<ContactInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/jobs/contact-insights", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jobTitle,
            jobDescription,
            company,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch contact insights");
        }

        const data = await response.json();
        setInsights(data.insights);
      } catch (err) {
        console.error("Error fetching contact insights:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (jobTitle && jobDescription) {
      fetchInsights();
    }
  }, [jobId, jobTitle, jobDescription, company]);

  if (loading) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-40" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-amber-200 bg-amber-50">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900">
              {t("job.contactInsights") || "Who should you reach out to?"}
            </h3>
            <p className="text-sm text-amber-800 mt-1">
              {error || "Unable to generate insights at this time"}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <Card className="p-6 space-y-4 border-blue-200 bg-blue-50">
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          {"Who should you reach out to?"}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {insights.description}
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            { "Key Roles"}
          </h4>
          <div className="flex flex-wrap gap-2">
            {insights.roles.map((role) => (
              <Badge key={role} variant="outline" className="bg-blue-100 text-blue-900 border-blue-300">
                {role}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            { "Departments"}
          </h4>
          <div className="flex flex-wrap gap-2">
            {insights.departments.map((dept) => (
              <Badge key={dept} variant="secondary">
                {dept}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        {insights.source === "ai"
          ? "Powered by AI analysis"
          : "Based on job description analysis"}
      </p>
    </Card>
  );
}
