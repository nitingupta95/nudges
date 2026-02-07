import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Building2, ArrowRight } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Job } from "@/types";
import { formatDistanceToNow, differenceInDays, parseISO } from "date-fns";

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const isClosingSoon =
    job.closingAt && differenceInDays(parseISO(job.closingAt), new Date()) <= 7;

  return (
    <article className="group rounded-lg border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-accent/30">
      <div className="flex items-start gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground font-bold text-sm"
          aria-hidden="true"
        >
          {job.company.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground leading-tight truncate">
            {job.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {job.company.name}
            </span>
            {job.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
            )}
          </div>
        </div>
        {isClosingSoon && (
          <Badge variant="destructive" className="shrink-0">
            {t("dashboard.closingSoon")}
          </Badge>
        )}
      </div>

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

      <div className="mt-4 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {formatDistanceToNow(parseISO(job.postedAt), { addSuffix: true })}
        </span>
        <Link href={`/jobs/${job.id}`}>
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
