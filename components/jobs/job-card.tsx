import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Building2, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Job, MemberProfile } from "@/types";
import { formatDistanceToNow, differenceInDays, parseISO } from "date-fns";
import {
  calculateFitScore,
  generateSmartNudge,
  getFitBadgeLabel,
} from "@/lib/referral-fit";

interface JobCardProps {
  job: Job;
  memberProfile?: MemberProfile | null;
}

export function JobCard({ job, memberProfile }: JobCardProps) {
  const isClosingSoon =
    job.closingDate && differenceInDays(parseISO(job.closingDate), new Date()) <= 7;

  const daysUntilClosing = job.closingDate
    ? differenceInDays(parseISO(job.closingDate), new Date())
    : null;

  // Calculate fit score
  const fitScore = calculateFitScore(job, memberProfile || null);
  const smartNudge = generateSmartNudge(job, memberProfile || null, fitScore);

  // Get company name (handle both string and object)
  const companyName = typeof job.company === "string" ? job.company : job.company.name;

  return (
    <article className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-accent/30">
      <div className="flex items-start gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground font-bold text-sm"
          aria-hidden="true"
        >
          {companyName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground leading-tight">
              {job.title}
            </h3>
            {isClosingSoon && daysUntilClosing !== null && (
              <Badge variant="destructive" className="shrink-0 text-xs">
                {daysUntilClosing === 0
                  ? "Closes today"
                  : daysUntilClosing === 1
                    ? "Closes tomorrow"
                    : `${daysUntilClosing} days left`}
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {companyName}
            </span>
            {job.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
            )}
            {job.experienceLevel && (
              <Badge variant="outline" className="text-xs capitalize">
                {job.experienceLevel}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* AI-Generated Summary or Description Fallback */}
      <div className="mt-3 space-y-1.5">
        {job.aiSummary?.bullets && job.aiSummary.bullets.length > 0 ? (
          job.aiSummary.bullets.map((bullet, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary" />
              <p className="leading-relaxed">{bullet}</p>
            </div>
          ))
        ) : job.description ? (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {job.description.slice(0, 150)}{job.description.length > 150 ? '...' : ''}
          </p>
        ) : null}
      </div>

      {/* Referral Readiness Badge */}
      {memberProfile && fitScore.level !== "low" && (
        <div className="mt-3">
          <Badge
            variant={
              fitScore.level === "good"
                ? "default"
                : fitScore.level === "medium"
                  ? "secondary"
                  : "outline"
            }
            className={`text-xs font-medium ${fitScore.level === "good"
              ? "bg-green-500/10 text-green-700 border-green-500/20"
              : fitScore.level === "medium"
                ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                : ""
              }`}
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            {getFitBadgeLabel(fitScore.level)} ({fitScore.score}% match)
          </Badge>
        </div>
      )}

      {job.skills && job.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 4).map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs font-medium">
              {skill}
            </Badge>
          ))}
          {job.skills.length > 4 && (
            <Badge variant="secondary" className="text-xs">
              +{job.skills.length - 4}
            </Badge>
          )}
        </div>
      )}

      {/* Smart Nudge Preview */}
      {smartNudge && (
        <div className="mt-3 flex items-start gap-2 rounded-md bg-primary/5 border border-primary/10 p-2.5 text-xs text-primary">
          <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{smartNudge.message}</p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {job.postedAt ? formatDistanceToNow(parseISO(job.postedAt), { addSuffix: true }) : "Date unknown"}
        </span>
        <Link href={`/dashboard/member/jobs/${job.id}`}>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 group-hover:text-accent"
          >
            View role
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
      </div>
    </article>
  );
}
