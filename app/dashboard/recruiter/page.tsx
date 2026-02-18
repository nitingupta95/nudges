"use client";

import { useEffect, useState } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { useAuth } from "@/contexts/auth-contex";
import { useJobs } from "@/hooks/use-jobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Briefcase,
  Plus,
  Users,
  Eye,
  Clock,
  RefreshCw,
  Trash2,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import type { Job } from "@/types";

const EXPERIENCE_LEVELS = [
  { value: "INTERN", label: "Intern" },
  { value: "ENTRY", label: "Entry Level" },
  { value: "MID", label: "Mid Level" },
  { value: "SENIOR", label: "Senior" },
  { value: "STAFF", label: "Staff" },
  { value: "PRINCIPAL", label: "Principal" },
  { value: "EXECUTIVE", label: "Executive" },
];

interface JobFormData {
  title: string;
  company: string;
  description: string;
  location: string;
  isRemote: boolean;
  salaryMin: string;
  salaryMax: string;
  experienceLevel: string;
  closingDate: string;
}

const initialFormData: JobFormData = {
  title: "",
  company: "",
  description: "",
  location: "",
  isRemote: false,
  salaryMin: "",
  salaryMax: "",
  experienceLevel: "MID",
  closingDate: "",
};

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const { jobs, loading, error, createJob, deleteJob, fetchJobs } = useJobs();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [totalViews, setTotalViews] = useState(0);

  // Fetch jobs for this recruiter
  const loadRecruiterJobs = async () => {
    if (!user?.id) return;
    try {
      const allJobs = await fetchJobs();
      const recruiterJobs = allJobs.filter((job) => job.createdById === user.id);
      setMyJobs(recruiterJobs);
      setActiveJobs(recruiterJobs.filter((job) => job.isActive));
      setTotalReferrals(recruiterJobs.reduce((sum, job) => sum + (job.referralCount || 0), 0));
      setTotalViews(recruiterJobs.reduce((sum, job) => sum + (job.viewCount || 0), 0));
    } catch (err) {
      // Optionally handle error
    }
  };

  // Load jobs on mount and when user changes
  useEffect(() => {
    loadRecruiterJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // After job creation, reload jobs
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      let closingDateISO: string | undefined;
      if (formData.closingDate) {
        closingDateISO = new Date(formData.closingDate + "T23:59:59").toISOString();
      }

      await createJob({
        title: formData.title,
        company: formData.company,
        description: formData.description,
        location: formData.location || undefined,
        isRemote: formData.isRemote,
        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
        experienceLevel: formData.experienceLevel as any,
        closingDate: closingDateISO,
      });
      setIsCreateDialogOpen(false);
      setFormData(initialFormData);
      await loadRecruiterJobs();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    try {
      await deleteJob(jobId);
      await loadRecruiterJobs();
    } catch (err) {
      console.error("Failed to delete job:", err);
    }
  };

  const statCards = [
    {
      icon: Briefcase,
      label: "Active Jobs",
      value: activeJobs.length,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Users,
      label: "Total Referrals",
      value: totalReferrals,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      icon: Eye,
      label: "Total Views",
      value: totalViews,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: TrendingUp,
      label: "Total Jobs",
      value: myJobs.length,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <PageLayout>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Recruiter Dashboard
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage your job postings and track referrals
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={loadRecruiterJobs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Job Posting</DialogTitle>
                  <DialogDescription>
                    Fill in the details below. The system will automatically extract skills and requirements.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateJob} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Senior Frontend Engineer"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        maxLength={200}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company *</Label>
                      <Input
                        id="company"
                        placeholder="e.g., Acme Inc"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        required
                        maxLength={200}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Job Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the role, responsibilities, requirements, and qualifications..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      rows={8}
                      minLength={50}
                      maxLength={50000}
                    />
                    <p className="text-xs text-muted-foreground">
                      Min 50 characters. Include skills, tech stack, and requirements for better matching.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="e.g., San Francisco, CA"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experienceLevel">Experience Level</Label>
                      <Select
                        value={formData.experienceLevel}
                        onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPERIENCE_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salaryMin">Min Salary (USD)</Label>
                      <Input
                        id="salaryMin"
                        type="number"
                        placeholder="e.g., 100000"
                        value={formData.salaryMin}
                        onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                        min={0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salaryMax">Max Salary (USD)</Label>
                      <Input
                        id="salaryMax"
                        type="number"
                        placeholder="e.g., 150000"
                        value={formData.salaryMax}
                        onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="closingDate">Closing Date</Label>
                      <Input
                        id="closingDate"
                        type="date"
                        value={formData.closingDate}
                        onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-8">
                      <input
                        id="isRemote"
                        type="checkbox"
                        checked={formData.isRemote}
                        onChange={(e) => setFormData({ ...formData, isRemote: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="isRemote" className="font-normal">
                        Remote position
                      </Label>
                    </div>
                  </div>

                  {formError && (
                    <p className="text-sm text-destructive">{formError}</p>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={formLoading}>
                      {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Job
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Post New Job
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard/recruiter/referrals">
                <Users className="h-4 w-4 mr-2" />
                View All Referrals
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard/recruiter/profile">
                <Building2 className="h-4 w-4 mr-2" />
                Edit Profile
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Job List */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            My Job Postings
          </h2>

          {loading && !jobs.length && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading && myJobs.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground/40" />
                <div className="text-center">
                  <p className="font-medium text-foreground">No jobs posted yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create your first job posting to start receiving referrals
                  </p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Post Your First Job
                </Button>
              </CardContent>
            </Card>
          )}

          {myJobs.length > 0 && (
            <div className="space-y-4">
              {myJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onDelete={() => handleDeleteJob(job.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

// Recruiter Job Card Component
function JobCard({ job, onDelete }: { job: Job; onDelete: () => void }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{job.title}</CardTitle>
            <CardDescription className="flex items-center gap-3 mt-1">
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {typeof job.company === 'string' ? job.company : job.company?.name}
              </span>
              {job.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.location}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={job.isActive ? "default" : "secondary"}>
              {job.isActive ? "Active" : "Inactive"}
            </Badge>
            {job.isRemote && <Badge variant="outline">Remote</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {(job.salaryMin || job.salaryMax) && (
            <span className="inline-flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              {job.salaryMin && job.salaryMax
                ? `$${(job.salaryMin / 1000).toFixed(0)}k - $${(job.salaryMax / 1000).toFixed(0)}k`
                : job.salaryMax
                ? `Up to $${(job.salaryMax / 1000).toFixed(0)}k`
                : `From $${(job.salaryMin! / 1000).toFixed(0)}k`}
            </span>
          )}
          {job.closingDate && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Closes {format(new Date(job.closingDate), "MMM d, yyyy")}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {job.viewCount || 0} views
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {job.referralCount || 0} referrals
          </span>
        </div>

        {/* Job Tags */}
        {job.tags && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {job.tags.skills?.slice(0, 5).map((skill: string) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {(job.tags.skills?.length ?? 0) > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{(job.tags.skills?.length ?? 0) - 5} more
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          <Button variant="default" size="sm" asChild>
            <a href={`/dashboard/recruiter/jobs/${job.id}`}>
              <Eye className="h-4 w-4 mr-1" />
              View & Manage
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
