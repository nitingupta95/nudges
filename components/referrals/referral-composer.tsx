import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";
import { messageTemplates } from "@/mock/data";
import type { Job } from "@/types";
import { Copy, ExternalLink, CheckCircle, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReferralComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
  onSubmitReferral: () => void;
}

const MAX_LENGTH = 500;

export function ReferralComposer({
  open,
  onOpenChange,
  job,
  onSubmitReferral,
}: ReferralComposerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(
    messageTemplates[0].id
  );
  const [contacted, setContacted] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [isAIMessage, setIsAIMessage] = useState(false);


  const template = messageTemplates.find((t) => t.id === selectedTemplate)!;

  const fillTemplate = (body: string) => {
    const companyName = typeof job.company === 'string' ? job.company : job.company.name;
    return body
      .replace("{role}", job.title)
      .replace("{company}", companyName)
      .replace("{skills}", job.skills?.slice(0, 3).join(", ") || "relevant skills");
  };

  const [message, setMessage] = useState(fillTemplate(template.body));

  const handleTemplateChange = (id: string) => {
    setSelectedTemplate(id);
    setIsAIMessage(false);
    const tmpl = messageTemplates.find((t) => t.id === id)!;
    setMessage(fillTemplate(tmpl.body));
  };

  const generateAIMessage = async () => {
    setGeneratingAI(true);
    try {
      const companyName = typeof job.company === 'string' ? job.company : job.company.name;
      const response = await fetch('/api/ai/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          jobTitle: job.title,
          company: companyName,
          skills: job.skills || [],
          matchReason: 'You might know someone perfect for this role',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate message');
      }

      const data = await response.json();
      if (data.success && data.data?.body) {
        setMessage(data.data.body);
        setIsAIMessage(true);
        toast.success('AI message generated!');
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error('AI message generation failed:', error);
      toast.error('Failed to generate AI message. Try again or use a template.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success(t("composer.copied"));
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="composer-desc">
        <DialogHeader>
          <DialogTitle>{t("composer.title")}</DialogTitle>
          <DialogDescription id="composer-desc">
            {job.title} at {typeof job.company === 'string' ? job.company : job.company.name}
          </DialogDescription>
        </DialogHeader>

        {/* Template selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            {t("composer.template")}
          </label>
          <div className="flex flex-wrap gap-2">
            {messageTemplates.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => handleTemplateChange(tmpl.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${selectedTemplate === tmpl.id && !isAIMessage
                    ? "border-accent bg-accent/10 text-accent-foreground"
                    : "border-border text-muted-foreground hover:border-accent/50"
                  }`}
              >
                {tmpl.label}
              </button>
            ))}
            <button
              onClick={generateAIMessage}
              disabled={generatingAI}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                isAIMessage
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/50 text-primary hover:border-primary hover:bg-primary/5"
              }`}
            >
              {generatingAI ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              AI Generate
            </button>
          </div>
        </div>

        {/* Message editor */}
        <div className="space-y-2">
          <Textarea
            value={message}
            onChange={(e) =>
              setMessage(e.target.value.slice(0, MAX_LENGTH))
            }
            rows={6}
            className="resize-none"
            aria-label="Referral message"
          />
          <p className="text-xs text-muted-foreground text-right">
            {t("composer.charLimit", {
              count: String(message.length),
              max: String(MAX_LENGTH),
            })}
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="gap-1.5"
          >
            <Copy className="h-4 w-4" />
            {t("composer.copy")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="gap-1.5 inline-flex items-center"
            >
              <ExternalLink className="h-4 w-4" />
              {t("composer.openLinkedIn")}
            </a>
          </Button>
          <Button
            variant={contacted ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setContacted(!contacted)}
            className="gap-1.5"
          >
            <CheckCircle
              className={`h-4 w-4 ${contacted ? "text-success" : ""}`}
            />
            {t("composer.markContacted")}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onSubmitReferral();
            }}
          >
            {t("composer.submitReferral")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
