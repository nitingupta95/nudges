 
import { fetchNudges } from "@/lib/api";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Lightbulb, Copy, HelpCircle, RefreshCw } from "lucide-react"; 
import { useApi } from "@/hooks/use-api";
import { toast } from "sonner";

interface ReferralNudgePanelProps {
  jobId: string;
  onOpenComposer: () => void;
}

export function ReferralNudgePanel({
  jobId,
  onOpenComposer,
}: ReferralNudgePanelProps) {
  const { data, loading, error, refetch } = useApi(
    () => fetchNudges(jobId),
    [jobId]
  ); 
  const copyNudge = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <section
      className="rounded-lg border bg-card p-6"
      aria-labelledby="nudge-heading"
    >
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-accent" />
        <h3 id="nudge-heading" className="font-semibold text-foreground">
          {t("nudge.title")}
        </h3>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-md" />
          <Skeleton className="h-16 w-full rounded-md" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm">
          <span className="text-muted-foreground">{t("nudge.error")}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t("nudge.retry")}
          </Button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && data && data.nudges.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">
          {t("nudge.empty")}
        </p>
      )}

      {/* Nudges */}
      {!loading && !error && data && data.nudges.length > 0 && (
        <div className="space-y-3">
          {data.nudges.map((nudge, i) => (
            <div
              key={i}
              className="group flex items-start gap-3 rounded-md border bg-secondary/30 p-3 text-sm"
            >
              <span className="flex-1 text-foreground/90 leading-relaxed">
                {nudge}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => copyNudge(nudge)}
                    className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus:opacity-100"
                    aria-label="Copy nudge text"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Copy text</TooltipContent>
              </Tooltip>
            </div>
          ))}

          {data.explain && (
            <div className="flex items-start gap-2 pt-1 text-xs text-muted-foreground">
              <HelpCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{data.explain}</span>
            </div>
          )}

          <div className="pt-2">
            <Button
              variant="default"
              size="sm"
              onClick={onOpenComposer}
              className="w-full sm:w-auto"
            >
              {t("job.copyMessage")}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
