"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; 
import { fetchReferrals } from "@/lib/api";
import { t } from "@/lib/i18n";
import { format, parseISO } from "date-fns";
import {
  Building2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useApi } from "@/hooks/use-api";
import { PageLayout } from "@/components/layout/page-layout";
import { ReferralStatusBadge } from "@/components/referrals/referral-staus";

export default function Referrals() {
  const { data: referrals, loading, error, refetch } = useApi(
    () => fetchReferrals(),
    []
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <PageLayout>
      <div className="container max-w-3xl py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          {t("referrals.title")}
        </h1>

        {/* Loading */}
        {loading && !referrals && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <span className="text-destructive">{error}</span>
            <Button variant="outline" size="sm" onClick={refetch}>
              Retry
            </Button>
          </div>
        )}

        {/* Empty */}
        {!loading && referrals && referrals.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed bg-card p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="font-medium text-foreground">No referrals yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("referrals.empty")}
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="default" size="sm">
                Browse open roles
              </Button>
            </Link>
          </div>
        )}

        {/* Referral list */}
        {referrals && referrals.length > 0 && (
          <div className="space-y-4">
            {referrals.map((ref) => {
              const isExpanded = expandedId === ref.id;
              return (
                <article
                  key={ref.id}
                  className="rounded-lg border bg-card p-5 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">
                        {ref.candidateName || "Anonymous referral"}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {ref.jobTitle} at {ref.companyName}
                        </span>
                        <span className="capitalize">{ref.relationType}</span>
                      </div>
                      {ref.note && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {ref.note}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <ReferralStatusBadge status={ref.status} />
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : ref.id)
                        }
                        aria-label={isExpanded ? "Collapse" : "Expand activity"}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Activity feed */}
                  {isExpanded && ref.activity && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        {t("referrals.activity")}
                      </h4>
                      <ol className="space-y-2">
                        {ref.activity.map((entry, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-sm"
                          >
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent/60" />
                            <div>
                              <p className="text-foreground">{entry.action}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(
                                  parseISO(entry.timestamp),
                                  "MMM d, yyyy 'at' h:mm a"
                                )}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
                      <div className="mt-4 flex gap-2">
                        <Link href={`/jobs/${ref.jobId}`}>
                          <Button variant="outline" size="sm" className="gap-1.5">
                            <ExternalLink className="h-3.5 w-3.5" />
                            {t("referrals.viewJob")}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
