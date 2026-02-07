"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; 
import { fetchJob } from "@/lib/api";
import { t } from "@/lib/i18n";
import { format, parseISO, differenceInDays } from "date-fns";
import {
  ArrowLeft,
  MapPin,
  Building2,
  Calendar,
  Clock,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { PageLayout } from "@/components/layout/page-layout";
import { ReferralNudgePanel } from "@/components/referrals/referral-nudges";
import { ReferralComposer } from "@/components/referrals/referral-composer";
import { ReferralSubmissionForm } from "@/components/referrals/referral-submission";

const DESC_COLLAPSE_LENGTH = 400;

export default function JobDetail() {
  const params = useParams();
  const jobId = params?.jobId as string;
  const { data: job, loading, error, refetch } = useApi(
    () => fetchJob(jobId!),
    [jobId]
  );

  const [composerOpen, setComposerOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const isLongDesc = useMemo(
    () => (job?.description?.length || 0) > DESC_COLLAPSE_LENGTH,
    [job]
  );

  const displayDesc = useMemo(() => {
    if (!job?.description) return "";
    if (!isLongDesc || descExpanded) return job.description;
    return job.description.slice(0, DESC_COLLAPSE_LENGTH) + "…";
  }, [job, isLongDesc, descExpanded]);

  const isClosingSoon = useMemo(() => {
    if (!job?.closingAt) return false;
    return differenceInDays(parseISO(job.closingAt), new Date()) <= 7;
  }, [job]);

  if (loading) {
    return (
      <PageLayout>
        <div className="container max-w-3xl py-8 space-y-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </PageLayout>
    );
  }

  if (error || !job) {
    return (
      <PageLayout>
        <div className="container max-w-3xl py-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1.5 mb-4">
              <ArrowLeft className="h-4 w-4" />
              {t("job.backToJobs")}
            </Button>
          </Link>
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-muted-foreground">
              {error || "This job could not be found."}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={refetch}>
              Retry
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container max-w-3xl py-8">
        {/* Back */}
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-1.5 mb-6">
            <ArrowLeft className="h-4 w-4" />
            {t("job.backToJobs")}
          </Button>
        </Link>

        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground font-bold"
              aria-hidden="true"
            >
              {job.company.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                {job.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {job.company.name}
                </span>
                {job.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {t("job.postedOn", {
                    date: format(parseISO(job.postedAt), "MMM d, yyyy"),
                  })}
                </span>
                {job.closingAt && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {t("job.closesOn", {
                      date: format(parseISO(job.closingAt), "MMM d, yyyy"),
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {job.experienceLevel && (
              <Badge variant="secondary" className="capitalize">
                {job.experienceLevel}
              </Badge>
            )}
            {job.domain && <Badge variant="secondary">{job.domain}</Badge>}
            {isClosingSoon && (
              <Badge variant="destructive">{t("dashboard.closingSoon")}</Badge>
            )}
          </div>
        </header>

        {/* Description */}
        <section className="mt-8 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              {t("job.description")}
            </h2>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {displayDesc}
            </div>
            {isLongDesc && (
              <Button
                variant="link"
                size="sm"
                onClick={() => setDescExpanded(!descExpanded)}
                className="mt-1 px-0"
              >
                {descExpanded ? t("job.readLess") : t("job.readMore")}
              </Button>
            )}
          </div>

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                {t("job.responsibilities")}
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {job.responsibilities.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                {t("job.requirements")}
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {job.requirements.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              {t("job.skills")}
            </h2>
            {job.skills && job.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {job.skills.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("job.noSkills")}
              </p>
            )}
          </div>
        </section>

        {/* Referral Nudge */}
        <div className="mt-8">
          <ReferralNudgePanel
            jobId={job.id}
            onOpenComposer={() => setComposerOpen(true)}
          />
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant="default"
            onClick={() => setComposerOpen(true)}
            className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            {t("job.copyMessage")}
          </Button>
          <Button
            variant="outline"
            onClick={() => setSubmitOpen(true)}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            {t("job.referSomeone")}
          </Button>
        </div>
      </div>

      {/* Modals */}
      <ReferralComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        job={job}
        onSubmitReferral={() => setSubmitOpen(true)}
      />
      <ReferralSubmissionForm
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        job={job}
        onSuccess={() => {
          // In production, would refetch referrals list
        }}
      />
    </PageLayout>
  );
}
