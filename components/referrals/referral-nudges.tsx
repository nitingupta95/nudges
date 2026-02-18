"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchNudges, fetchPersonalizedNudge } from "@/lib/api";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Lightbulb, Copy, HelpCircle, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-contex";
import { useNudges } from "@/hooks/use-nudges";
import { Badge } from "@/components/ui/badge";

interface ReferralNudgePanelProps {
  jobId: string;
  onOpenComposer?: () => void;
}

export function ReferralNudgePanel({
  jobId,
  onOpenComposer,
}: ReferralNudgePanelProps) {
  const { user, profile } = useAuth();
  const { logInteraction } = useNudges();
  
  const [nudgeData, setNudgeData] = useState<{
    nudges: string[];
    explain: string;
    matchScore: number;
    matchTier: string;
    reasons: Array<{ type: string; explanation: string }>;
  } | null>(null);
  const [personalizedNudge, setPersonalizedNudge] = useState<{
    id: string;
    headline: string;
    body: string;
    cta: string;
    matchScore: number;
    matchTier: string;
    inferences: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNudges = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch standard nudges
      const data = await fetchNudges(jobId);
      setNudgeData(data);

      // If user is logged in, also fetch personalized nudge
      if (user && profile) {
        const personalizedResult = await fetchPersonalizedNudge(jobId, profile.id);
        setPersonalizedNudge(personalizedResult.nudge);
      }

      // Log that nudges were shown
      logInteraction({
        jobId,
        action: "VIEWED",
        metadata: { source: "job_detail_page" },
      });
    } catch (err) {
      console.error("Error loading nudges:", err);
      setError("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  }, [jobId, user, profile, logInteraction]);

  useEffect(() => {
    loadNudges();
  }, [loadNudges]);

  const handleCopyNudge = async (nudge: string, index: number) => {
    try {
      await navigator.clipboard.writeText(nudge);
      toast.success("Copied to clipboard!");
      
      // Log interaction
      logInteraction({
        jobId,
        action: "COPY_MESSAGE",
        metadata: { nudgeIndex: index, source: "nudge_panel" },
      });
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleNudgeClick = (index: number) => {
    logInteraction({
      jobId,
      action: "CLICKED",
      metadata: { nudgeIndex: index, source: "nudge_panel" },
    });
    onOpenComposer?.();
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "HIGH":
        return "bg-green-100 text-green-800 border-green-200";
      case "MEDIUM":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "LOW":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="ghost" size="sm" onClick={loadNudges}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-accent" />
          <h3 className="font-semibold text-foreground">
            {t("nudges.title")}
          </h3>
          {nudgeData?.matchScore && (
            <Badge variant="outline" className={getTierColor(nudgeData.matchTier)}>
              {nudgeData.matchScore}% match
            </Badge>
          )}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground">
              <HelpCircle className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-sm">
              {nudgeData?.explain || t("nudges.helpText")}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Personalized Nudge (if available) */}
      {personalizedNudge && (
        <div className="rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">Personalized for you</span>
          </div>
          <p className="font-medium text-foreground">{personalizedNudge.headline}</p>
          <p className="text-sm text-muted-foreground">{personalizedNudge.body}</p>
          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => handleNudgeClick(-1)}
            >
              {personalizedNudge.cta}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyNudge(personalizedNudge.body, -1)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {personalizedNudge.inferences.length > 0 && (
            <div className="pt-2 border-t border-primary/10 mt-2">
              <p className="text-xs text-muted-foreground">Based on:</p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                {personalizedNudge.inferences.map((inference, i) => (
                  <li key={i}>• {inference}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Standard Nudges */}
      {nudgeData?.nudges && nudgeData.nudges.length > 0 && (
        <div className="space-y-2">
          {!personalizedNudge && (
            <p className="text-sm text-muted-foreground">
              {t("nudges.suggestions")}
            </p>
          )}
          <ul className="space-y-2">
            {nudgeData.nudges.map((nudge, index) => (
              <li
                key={index}
                className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 group hover:bg-muted transition-colors"
              >
                <span className="flex-1 text-sm text-foreground cursor-pointer" 
                      onClick={() => handleNudgeClick(index)}>
                  {nudge}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopyNudge(nudge, index)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy</TooltipContent>
                </Tooltip>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Match Reasons */}
      {nudgeData?.reasons && nudgeData.reasons.length > 0 && (
        <div className="pt-2 border-t space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Why you might know someone:</p>
          <ul className="space-y-1">
            {nudgeData.reasons.slice(0, 3).map((reason, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                <span className="text-primary">•</span>
                {reason.explanation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      {onOpenComposer && (
        <Button
          className="w-full"
          onClick={() => handleNudgeClick(-2)}
        >
          {t("nudges.cta")}
        </Button>
      )}
    </div>
  );
}