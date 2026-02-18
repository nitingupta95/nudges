import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { t } from "@/lib/i18n";
import { submitReferral, trackEvent } from "@/lib/api";
import { useAuth } from "@/contexts/auth-contex";
import type { Job, ReferralSubmission, RelationType } from "@/types";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ReferralSubmissionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
  onSuccess: (referral: ReferralSubmission) => void;
}

export function ReferralSubmissionForm({
  open,
  onOpenChange,
  job,
  onSuccess,
}: ReferralSubmissionFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [relation, setRelation] = useState<RelationType | "">("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const hasTrackedOpen = useRef(false);

  // Track REFERRAL_STARTED when dialog opens
  useEffect(() => {
    if (open && user && !hasTrackedOpen.current) {
      hasTrackedOpen.current = true;
      trackEvent({
        type: "REFERRAL_STARTED",
        userId: user.id,
        jobId: job.id,
        metadata: {
          source: "referral_submission_form",
          jobTitle: job.title,
        },
      });
    }
    if (!open) {
      hasTrackedOpen.current = false;
    }
  }, [open, user, job]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setProfileUrl("");
    setRelation("");
    setNote("");
    setValidationError("");
    setDuplicateWarning(false);
  };

  const validate = (): boolean => {
    if (!name.trim() || !email.trim() || !relation) {
      setValidationError(t("submit.validation") || "Name, email, and relation are required");
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setValidationError("Please enter a valid email address");
      return false;
    }
    setValidationError("");
    return true;
  };

  const handleSubmit = async (force = false) => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        jobId: job.id,
        jobTitle: job.title,
        companyName: typeof job.company === 'string' ? job.company : job.company.name,
        candidateName: name.trim(),
        candidateEmail: email.trim(), // Added email
        candidateProfileUrl: profileUrl.trim() || undefined,
        relationType: relation as RelationType,
        note: note.trim() || undefined,
      };
      // @ts-ignore - API signature mismatch in local vs updated lib/api.ts
      const referral = await submitReferral(payload);
      
      // Track successful referral submission
      if (user) {
        trackEvent({
          type: "REFERRAL_SUBMITTED",
          userId: user.id,
          jobId: job.id,
          referralId: referral.id,
          metadata: {
            source: "referral_submission_form",
            jobTitle: job.title,
            relationType: relation,
          },
        });
      }
      
      onSuccess(referral);
      toast.success(t("submit.success"));
      resetForm();
      onOpenChange(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("unknown");
      if (error.message === "duplicate" && !force) {
        setDuplicateWarning(true);
      } else {
        toast.error(error.message || t("error.network"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md" aria-describedby="submit-desc">
        <DialogHeader>
          <DialogTitle>{t("submit.title")}</DialogTitle>
          <DialogDescription id="submit-desc">
            {job.title} at {typeof job.company === 'string' ? job.company : job.company.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="candidate-name">{t("submit.candidateName")}</Label>
            <Input
              id="candidate-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="candidate-email">Candidate Email</Label>
            <Input
              id="candidate-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              type="email"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-url">{t("submit.profileUrl")}</Label>
            <Input
              id="profile-url"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              placeholder="https://linkedin.com/in/..."
              type="url"
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relation">{t("submit.relation")}</Label>
            <Select
              value={relation}
              onValueChange={(v) => setRelation(v as RelationType)}
            >
              <SelectTrigger id="relation">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FRIEND">Friend</SelectItem>
                <SelectItem value="EX_COLLEAGUE">Ex-colleague</SelectItem>
                <SelectItem value="COLLEGE_ALUMNI">College Alumni</SelectItem>
                <SelectItem value="FAMILY">Family</SelectItem>
                <SelectItem value="RELATIVE">Relative</SelectItem>
                <SelectItem value="BOOTCAMP_CONNECTION">Bootcamp Connection</SelectItem>
                <SelectItem value="LINKEDIN_CONNECTION">LinkedIn Connection</SelectItem>
                <SelectItem value="CLASSMATE">Classmate</SelectItem>
                <SelectItem value="MENTOR">Mentor</SelectItem>
                <SelectItem value="MENTEE">Mentee</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">{t("submit.note")}</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              className="resize-none"
              placeholder="Why are they a good fit?"
            />
          </div>

          {validationError && (
            <p className="text-sm text-destructive" role="alert">
              {validationError}
            </p>
          )}

          {duplicateWarning && (
            <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 p-3 text-sm">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <div>
                <p className="text-foreground">{t("submit.duplicate")}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => handleSubmit(true)}
                  disabled={submitting}
                >
                  {t("submit.confirmDuplicate")}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="default"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("submit.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
