"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJob, trackEvent } from "@/lib/api";
import { t } from "@/lib/i18n";
import { format, parseISO, differenceInDays, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  MapPin,
  Building2,
  Calendar,
  Clock,
  MessageSquare,
  UserPlus,
  Share2,
  Sparkles,
  TrendingUp,
  Briefcase,
  DollarSign,
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { PageLayout } from "@/components/layout/page-layout";
import { ReferralNudgePanel } from "@/components/referrals/referral-nudges";
import { ReferralComposer } from "@/components/referrals/referral-composer";
import { ReferralSubmissionForm } from "@/components/referrals/referral-submission";
import { ContactInsightsPanel } from "@/components/referrals/contact-insights-panel";
import { useAuth } from "@/contexts/auth-contex";
import {
  calculateFitScore,
  generateSmartNudge,
  getFitBadgeLabel,
} from "@/lib/referral-fit";

const DESC_COLLAPSE_LENGTH = 400;

export default function JobDetail() {
  const params = useParams();
  const jobId = params?.jobId as string;
  const { user, profile } = useAuth();
  
  const { data: job, loading, error, refetch } = useApi(
    () => fetchJob(jobId!),
    [jobId]
  );

  const [composerOpen, setComposerOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const hasTrackedView = useRef(false);

  // Track job view event
  useEffect(() => {
    if (job && user && !hasTrackedView.current) {
      hasTrackedView.current = true;
      trackEvent({
        type: "JOB_VIEWED",
        userId: user.id,
        jobId: job.id,
        metadata: {
          source: "job_detail_page",
          jobTitle: job.title,
          company: typeof job.company === "string" ? job.company : job.company?.name,
        },
      });
    }
  }, [job, user]);

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
    if (!job?.closingDate) return false;
    return differenceInDays(parseISO(job.closingDate), new Date()) <= 7;
  }, [job]);

  const daysUntilClosing = useMemo(() => {
    if (!job?.closingDate) return null;
    return differenceInDays(parseISO(job.closingDate), new Date());
  }, [job]);

  // Calculate fit score for the user
  const fitScore = useMemo(() => {
    if (!job || !profile) return null;
    return calculateFitScore(job, profile);
  }, [job, profile]);

  const smartNudge = useMemo(() => {
    if (!job || !profile || !fitScore) return null;
    return generateSmartNudge(job, profile, fitScore);
  }, [job, profile, fitScore]);

  // Get company name (handle both string and object)
  const companyName = useMemo(() => {
    if (!job) return "";
    return typeof job.company === "string" ? job.company : job.company?.name || "";
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
          <Link href="/dashboard/member">
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
        <Link href="/dashboard/member">
          <Button variant="ghost" size="sm" className="gap-1.5 mb-6">
            <ArrowLeft className="h-4 w-4" />
            {t("job.backToJobs")}
          </Button>
        </Link>

        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg"
              aria-hidden="true"
            >
              {companyName.charAt(0) || "J"}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                {job.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {companyName}
                </span>
                {job.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {job.postedAt
                    ? t("job.postedOn", {
                        date: format(parseISO(job.postedAt), "MMM d, yyyy"),
                      })
                    : t("job.postedOn", { date: "Unknown" })}
                </span>
                {job.closingDate && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {t("job.closesOn", {
                      date: format(parseISO(job.closingDate), "MMM d, yyyy"),
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {job.experienceLevel && (
              <Badge variant="secondary" className="capitalize">
                {job.experienceLevel}
              </Badge>
            )}
            {job.domain && <Badge variant="secondary">{job.domain}</Badge>}
            {job.isRemote && <Badge variant="outline">Remote</Badge>}
            {isClosingSoon && daysUntilClosing !== null && (
              <Badge variant="destructive">
                {daysUntilClosing === 0
                  ? "Closes today"
                  : daysUntilClosing === 1
                    ? "Closes tomorrow"
                    : `${daysUntilClosing} days left`}
              </Badge>
            )}
          </div>

          {/* Salary Info */}
          {(job.salaryMin || job.salaryMax) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>
                {job.salaryMin && job.salaryMax
                  ? `$${(job.salaryMin / 1000).toFixed(0)}k - $${(job.salaryMax / 1000).toFixed(0)}k`
                  : job.salaryMax
                    ? `Up to $${(job.salaryMax / 1000).toFixed(0)}k`
                    : `From $${(job.salaryMin! / 1000).toFixed(0)}k`}
                {job.salaryCurrency && job.salaryCurrency !== "USD" && ` ${job.salaryCurrency}`}
              </span>
            </div>
          )}

          {/* Fit Score Badge */}
          {profile && fitScore && fitScore.level !== "low" && (
            <div className="flex items-center gap-2">
              <Badge
                variant={fitScore.level === "good" ? "default" : "secondary"}
                className={`text-sm ${
                  fitScore.level === "good"
                    ? "bg-green-500/10 text-green-700 border-green-500/20"
                    : "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5 mr-1" />
                {getFitBadgeLabel(fitScore.level)} ({fitScore.score}% match)
              </Badge>
            </div>
          )}
        </header>

        {/* AI Smart Nudge */}
        {smartNudge && (
          <div className="mt-6 flex items-start gap-3 rounded-lg bg-primary/5 border border-primary/10 p-4">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">AI Insight</p>
              <p className="text-sm text-muted-foreground mt-1">{smartNudge.message}</p>
            </div>
          </div>
        )}

        {/* AI-Generated Summary */}
        {job.aiSummary?.bullets && job.aiSummary.bullets.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Key Highlights
            </h2>
            <ul className="space-y-2">
              {job.aiSummary.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

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

        {/* Contact Insights */}
        <div className="mt-8">
          <ContactInsightsPanel
            jobId={job.id}
            jobTitle={job.title}
            jobDescription={job.description}
            company={companyName}
          />
        </div>

        {/* Referral Nudge */}
        <div className="mt-6">
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
          <Button
            variant="ghost"
            onClick={() => {
              navigator.share?.({
                title: job.title,
                text: `Check out this job: ${job.title} at ${companyName}`,
                url: window.location.href,
              }).catch(() => {
                navigator.clipboard.writeText(window.location.href);
              });
            }}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
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
          // Could refetch referrals list or show success message
        }}
      />
    </PageLayout>
  );
}
