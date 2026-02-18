"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Send, Loader2, Copy, ExternalLink, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface EmailComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  currentStatus?: string;
  onEmailSent?: () => void;
}

const STATUS_OPTIONS = [
  { value: "SUBMITTED", label: "Application Received" },
  { value: "VIEWED", label: "Application Viewed" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "INTERVIEWING", label: "Interview Scheduled" },
  { value: "OFFERED", label: "Job Offer" },
  { value: "HIRED", label: "Welcome/Hired" },
  { value: "REJECTED", label: "Not Selected" },
];

export function EmailComposerDialog({
  open,
  onOpenChange,
  referralId,
  candidateName,
  candidateEmail,
  jobTitle,
  companyName,
  currentStatus,
  onEmailSent,
}: EmailComposerProps) {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [templateType, setTemplateType] = useState(currentStatus || "SHORTLISTED");
  const [formData, setFormData] = useState({
    to: candidateEmail,
    subject: "",
    body: "",
    interviewDate: "",
    interviewTime: "",
    interviewLocation: "",
  });

  // Fetch template when dialog opens or template type changes
  useEffect(() => {
    if (open && referralId) {
      fetchTemplate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, templateType, referralId]);

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/email/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          referralId,
          status: templateType,
          interviewDate: formData.interviewDate,
          interviewTime: formData.interviewTime,
          interviewLocation: formData.interviewLocation,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({
          ...prev,
          to: data.template.to,
          subject: data.template.subject,
          body: data.template.body,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch template:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!formData.to || !formData.subject || !formData.body) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          to: formData.to,
          subject: formData.subject,
          body: formData.body,
          referralId,
        }),
      });

      if (response.ok) {
        toast.success("Email sent successfully!");
        onEmailSent?.();
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to send email");
      }
    } catch (error) {
      toast.error("Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const handleCopyToClipboard = async () => {
    const emailContent = `To: ${formData.to}\nSubject: ${formData.subject}\n\n${formData.body}`;
    await navigator.clipboard.writeText(emailContent);
    setCopied(true);
    toast.success("Email content copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenMailClient = () => {
    const mailtoSubject = encodeURIComponent(formData.subject);
    const mailtoBody = encodeURIComponent(formData.body);
    window.open(`mailto:${formData.to}?subject=${mailtoSubject}&body=${mailtoBody}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email to Candidate
          </DialogTitle>
          <DialogDescription>
            Composing email for {candidateName} regarding {jobTitle} at {companyName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Type Selector */}
          <div className="space-y-2">
            <Label>Email Template</Label>
            <Select value={templateType} onValueChange={setTemplateType}>
              <SelectTrigger>
                <SelectValue placeholder="Select template type" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interview Details (show only for INTERVIEWING status) */}
          {templateType === "INTERVIEWING" && (
            <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <Label className="text-xs">Interview Date</Label>
                <Input
                  type="date"
                  value={formData.interviewDate}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, interviewDate: e.target.value }));
                  }}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Interview Time</Label>
                <Input
                  type="time"
                  value={formData.interviewTime}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, interviewTime: e.target.value }));
                  }}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Location/Link</Label>
                <Input
                  placeholder="Office or Zoom link"
                  value={formData.interviewLocation}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, interviewLocation: e.target.value }));
                  }}
                  className="h-8 text-sm"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="col-span-3"
                onClick={fetchTemplate}
              >
                Update Template with Details
              </Button>
            </div>
          )}

          {/* To Field */}
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="email"
              value={formData.to}
              onChange={(e) => setFormData((p) => ({ ...p, to: e.target.value }))}
              placeholder="candidate@email.com"
            />
          </div>

          {/* Subject Field */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
              placeholder="Email subject"
            />
          </div>

          {/* Body Field */}
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            {loading ? (
              <div className="h-64 flex items-center justify-center bg-muted rounded-md">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData((p) => ({ ...p, body: e.target.value }))}
                placeholder="Write your message..."
                className="min-h-[250px] font-mono text-sm"
              />
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyToClipboard}
              className="gap-2"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Copy
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenMailClient}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in Mail App
            </Button>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSendEmail}
              disabled={sending || loading}
              className="gap-2"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Email
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
