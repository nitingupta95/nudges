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
import { Loader2, AlertTriangle, CheckCircle, Upload, FileText, X } from "lucide-react";
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
  
  // New states for post-submission resume upload
  const [step, setStep] = useState<"form" | "success">("form");
  const [submittedReferral, setSubmittedReferral] = useState<ReferralSubmission | null>(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  
  // Resume file upload state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setStep("form");
    setSubmittedReferral(null);
    setResumeUploaded(false);
    setResumeFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];
      if (!validTypes.includes(selectedFile.type)) {
        toast.error("Please upload a PDF, Word document, or text file");
        return;
      }
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setResumeFile(selectedFile);
    }
  };

  const removeFile = () => {
    setResumeFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadResume = async (referralId: string) => {
    if (!resumeFile) return;
    
    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      
      const response = await fetch(`/api/referrals/${referralId}/resume`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload resume");
      }
      
      setResumeUploaded(true);
      toast.success("Resume uploaded and analyzed successfully!");
    } catch (error) {
      console.error("Resume upload error:", error);
      toast.error("Failed to upload resume. You can upload it later from your referrals page.");
    } finally {
      setUploadingResume(false);
    }
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
      
      // Store the referral and show success step with resume upload option
      setSubmittedReferral(referral);
      
      // If resume file was attached, upload it automatically
      if (resumeFile) {
        await uploadResume(referral.id);
      }
      
      setStep("success");
      onSuccess(referral);
      toast.success(t("submit.success"));
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

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg" aria-describedby="submit-desc">
        {step === "form" ? (
          <>
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

              {/* Resume Upload Section */}
              <div className="space-y-2">
                <Label htmlFor="resume">
                  Candidate Resume <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="resume"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {!resumeFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload resume (PDF, Word, or TXT)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{resumeFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(resumeFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload the candidate&apos;s resume to help recruiters evaluate them faster with AI-powered matching.
                </p>
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
                disabled={submitting || uploadingResume}
                className="w-full sm:w-auto"
              >
                {(submitting || uploadingResume) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {uploadingResume ? "Uploading Resume..." : submitting ? "Submitting..." : resumeFile ? "Submit with Resume" : t("submit.submit")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {/* Success Step */}
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Referral Submitted!
              </DialogTitle>
              <DialogDescription id="submit-desc">
                {submittedReferral?.candidateName} has been referred for {job.title}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">All Done!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {resumeUploaded 
                      ? "Resume has been analyzed and match score calculated."
                      : "Your referral has been submitted successfully."}
                  </p>
                  {resumeUploaded && (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-sm text-green-600">
                      <FileText className="h-4 w-4" />
                      Resume uploaded & analyzed
                    </div>
                  )}
                </div>
                <Button onClick={handleClose}>
                  Close
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
