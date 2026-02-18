"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CandidateRanking } from "@/components/resume";
import { fetchJob } from "@/lib/api";
import { t } from "@/lib/i18n";
import { format, parseISO, differenceInDays } from "date-fns";
import {
  ArrowLeft,
  MapPin,
  Building2,
  Calendar,
  Clock,
  Users,
  Eye,
  Edit2,
  Save,
  X,
  MoreVertical,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  UserPlus,
  Mail,
  Phone,
  Briefcase,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Star,
  Trophy,
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { EmailComposerDialog } from "@/components/email/email-composer-dialog";
import { PageLayout } from "@/components/layout/page-layout";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-contex";

// Referral status configuration
const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  SUBMITTED: { label: "Submitted", color: "text-blue-600", bgColor: "bg-blue-100" },
  VIEWED: { label: "Viewed", color: "text-purple-600", bgColor: "bg-purple-100" },
  UNDER_REVIEW: { label: "Under Review", color: "text-orange-600", bgColor: "bg-orange-100" },
  SHORTLISTED: { label: "Shortlisted", color: "text-cyan-600", bgColor: "bg-cyan-100" },
  INTERVIEWING: { label: "Interviewing", color: "text-indigo-600", bgColor: "bg-indigo-100" },
  OFFERED: { label: "Offered", color: "text-emerald-600", bgColor: "bg-emerald-100" },
  HIRED: { label: "Hired", color: "text-green-600", bgColor: "bg-green-100" },
  REJECTED: { label: "Rejected", color: "text-red-600", bgColor: "bg-red-100" },
  WITHDRAWN: { label: "Withdrawn", color: "text-gray-600", bgColor: "bg-gray-100" },
};

interface Referral {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  whyFit?: string;
  status: string;
  createdAt: string;
  referrer?: {
    id: string;
    name: string;
    email: string;
  };
  fitScore?: number;
}

export default function RecruiterJobDetail() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const jobId = params?.jobId as string;
  
  const { data: job, loading, error, refetch } = useApi(
    () => fetchJob(jobId!),
    [jobId]
  );

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [expandedReferral, setExpandedReferral] = useState<string | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTargetReferral, setEmailTargetReferral] = useState<Referral | null>(null);

  const openEmailDialog = (referral: Referral) => {
    setEmailTargetReferral(referral);
    setEmailDialogOpen(true);
  };

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
    experienceLevel: "mid",
    domain: "",
    skills: "",
    closingDate: "",
    isActive: true,
  });

  // Initialize form when job loads
  useEffect(() => {
    if (job) {
      setEditForm({
        title: job.title || "",
        company: typeof job.company === "string" ? job.company : job.company?.name || "",
        location: job.location || "",
        description: job.description || "",
        experienceLevel: job.experienceLevel || "mid",
        domain: job.domain || "",
        skills: job.skills?.join(", ") || "",
        closingDate: job.closingDate ? format(parseISO(job.closingDate), "yyyy-MM-dd") : "",
        isActive: job.isActive ?? true,
      });
    }
  }, [job]);

  // Load referrals for this job
  useEffect(() => {
    const loadReferrals = async () => {
      if (!jobId) return;
      setLoadingReferrals(true);
      try {
        const response = await fetch(`/api/referrals?jobId=${jobId}`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setReferrals(data.referrals || data || []);
        }
      } catch (err) {
        console.error("Failed to load referrals:", err);
      } finally {
        setLoadingReferrals(false);
      }
    };
    loadReferrals();
  }, [jobId]);

  const isClosingSoon = useMemo(() => {
    if (!job?.closingDate) return false;
    return differenceInDays(parseISO(job.closingDate), new Date()) <= 7;
  }, [job]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...editForm,
          skills: editForm.skills.split(",").map((s) => s.trim()).filter(Boolean),
          closingDate: editForm.closingDate
            ? new Date(editForm.closingDate + "T23:59:59").toISOString()
            : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update job");
      }

      toast.success("Job updated successfully!");
      setIsEditing(false);
      refetch();
    } catch (err) {
      console.error("Save job error:", err);
      toast.error("Failed to update job");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete job");
      }

      toast.success("Job deleted successfully!");
      router.push("/dashboard/recruiter");
    } catch (err) {
      console.error("Delete job error:", err);
      toast.error("Failed to delete job");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !job?.isActive }),
      });

      if (!response.ok) {
        throw new Error("Failed to update job status");
      }

      toast.success(`Job ${job?.isActive ? "deactivated" : "activated"} successfully!`);
      refetch();
    } catch (err) {
      console.error("Toggle active error:", err);
      toast.error("Failed to update job status");
    }
  };

  const handleStatusUpdate = async (referralId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/referrals/${referralId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setReferrals((prev) =>
        prev.map((r) =>
          r.id === referralId ? { ...r, status: newStatus } : r
        )
      );
      toast.success("Status updated!");
    } catch (err) {
      console.error("Status update error:", err);
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="container max-w-4xl py-8 space-y-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </PageLayout>
    );
  }

  if (error || !job) {
    return (
      <PageLayout>
        <div className="container max-w-4xl py-8">
          <Link href="/dashboard/recruiter">
            <Button variant="ghost" size="sm" className="gap-1.5 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
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
      <div className="container max-w-4xl py-8">
        {/* Back & Actions */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard/recruiter">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleToggleActive}>
                      {job.isActive ? (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Deactivate Job
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Activate Job
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Job
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} size="sm" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xl"
              aria-hidden="true"
            >
              {typeof job.company === "string"
                ? job.company.charAt(0)
                : job.company?.name?.charAt(0) || "J"}
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="text-2xl font-bold"
                  placeholder="Job title"
                />
              ) : (
                <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                  {job.title}
                </h1>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {typeof job.company === "string"
                    ? job.company
                    : job.company?.name || "Company"}
                </span>
                {job.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Posted {job.postedAt
                    ? format(parseISO(job.postedAt), "MMM d, yyyy")
                    : "recently"}
                </span>
                {job.closingDate && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Closes {format(parseISO(job.closingDate), "MMM d, yyyy")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={job.isActive ? "default" : "secondary"}>
              {job.isActive ? "Active" : "Inactive"}
            </Badge>
            {job.experienceLevel && (
              <Badge variant="secondary" className="capitalize">
                {job.experienceLevel}
              </Badge>
            )}
            {job.domain && <Badge variant="secondary">{job.domain}</Badge>}
            {isClosingSoon && (
              <Badge variant="destructive">Closing Soon</Badge>
            )}
          </div>
        </header>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mt-8">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{job.viewCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{referrals.length}</p>
                  <p className="text-xs text-muted-foreground">Referrals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100">
                  <Briefcase className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {referrals.filter((r) => r.status === "SHORTLISTED" || r.status === "INTERVIEWING").length}
                  </p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {referrals.filter((r) => r.status === "HIRED").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Hired</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Form or Job Details */}
        {isEditing ? (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Edit Job</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    placeholder="Company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="City, Country or Remote"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Experience Level</Label>
                  <Select
                    value={editForm.experienceLevel}
                    onValueChange={(v) => setEditForm({ ...editForm, experienceLevel: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="junior">Junior</SelectItem>
                      <SelectItem value="mid">Mid-Level</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Domain</Label>
                  <Input
                    value={editForm.domain}
                    onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                    placeholder="e.g., Fintech, Healthcare"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Closing Date</Label>
                  <Input
                    type="date"
                    value={editForm.closingDate}
                    onChange={(e) => setEditForm({ ...editForm, closingDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Skills (comma-separated)</Label>
                  <Input
                    value={editForm.skills}
                    onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                    placeholder="React, TypeScript, Node.js"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={6}
                  placeholder="Job description..."
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editForm.isActive}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
                />
                <Label>Job is active and accepting referrals</Label>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                <p className="text-sm text-foreground whitespace-pre-line">
                  {job.description || "No description provided."}
                </p>
              </div>
              {job.skills && job.skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Referrals & Candidate Rankings */}
        <div className="mt-8">
          <Tabs defaultValue="referrals">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="referrals" className="gap-2">
                <Users className="h-4 w-4" />
                Referrals ({referrals.length})
              </TabsTrigger>
              <TabsTrigger value="rankings" className="gap-2">
                <Trophy className="h-4 w-4" />
                Candidate Rankings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="referrals">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Referrals ({referrals.length})
                  </CardTitle>
                  <CardDescription>
                    Candidates referred for this position
                  </CardDescription>
                </CardHeader>
                <CardContent>
            {loadingReferrals ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No referrals yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Share this job to start receiving referrals
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {referrals.map((referral) => {
                  const config = statusConfig[referral.status] || statusConfig.SUBMITTED;
                  const isExpanded = expandedReferral === referral.id;
                  
                  return (
                    <div
                      key={referral.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <div
                        className="p-4 cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          setExpandedReferral(isExpanded ? null : referral.id)
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                              {referral.candidateName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground flex items-center gap-2">
                                {referral.candidateName}
                                {referral.fitScore && referral.fitScore >= 80 && (
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                )}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {referral.candidateEmail}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={`${config.bgColor} ${config.color}`}>
                              {config.label}
                            </Badge>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Referred {format(parseISO(referral.createdAt), "MMM d, yyyy")}
                          </span>
                          {referral.referrer && (
                            <span>by {referral.referrer.name}</span>
                          )}
                          {referral.fitScore && (
                            <span className="font-medium">
                              Fit Score: {referral.fitScore}%
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="border-t p-4 bg-muted/30 space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <a
                                href={`mailto:${referral.candidateEmail}`}
                                className="text-primary hover:underline"
                              >
                                {referral.candidateEmail}
                              </a>
                            </div>
                            {referral.candidatePhone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <a
                                  href={`tel:${referral.candidatePhone}`}
                                  className="text-primary hover:underline"
                                >
                                  {referral.candidatePhone}
                                </a>
                              </div>
                            )}
                          </div>
                          
                          {referral.whyFit && (
                            <div>
                              <h5 className="text-sm font-medium text-foreground mb-1">
                                Why they're a fit
                              </h5>
                              <p className="text-sm text-muted-foreground">
                                {referral.whyFit}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">Update Status:</Label>
                              <Select
                                value={referral.status}
                                onValueChange={(v) => handleStatusUpdate(referral.id, v)}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(statusConfig).map(([key, cfg]) => (
                                    <SelectItem key={key} value={key}>
                                      {cfg.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => openEmailDialog(referral)}
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Email
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
            </TabsContent>
            
            <TabsContent value="rankings">
              <CandidateRanking 
                jobId={jobId} 
                jobTitle={job?.title || ""} 
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this job? This action cannot be undone
              and all referrals for this job will also be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Composer Dialog */}
      <EmailComposerDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        referralId={emailTargetReferral?.id || ""}
        candidateName={emailTargetReferral?.candidateName || ""}
        candidateEmail={emailTargetReferral?.candidateEmail || ""}
        jobTitle={job?.title || ""}
        companyName={typeof job?.company === "string" ? job.company : job?.company?.name || ""}
        currentStatus={emailTargetReferral?.status}
      />
    </PageLayout>
  );
}
