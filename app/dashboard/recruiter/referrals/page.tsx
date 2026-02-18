"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Search,
  Filter,
  Eye,
  Mail,
  Phone,
  Linkedin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  UserCheck,
  MoreVertical,
  RefreshCw,
  Briefcase,
  Calendar,
  Building2,
  FileText,
  Star,
  Loader2,
} from "lucide-react";
import { format, parseISO } from "date-fns";

// Referral status configuration
const REFERRAL_STATUSES = [
  { value: "SUBMITTED", label: "Submitted", color: "bg-blue-100 text-blue-800" },
  { value: "VIEWED", label: "Viewed", color: "bg-gray-100 text-gray-800" },
  { value: "UNDER_REVIEW", label: "Under Review", color: "bg-yellow-100 text-yellow-800" },
  { value: "SHORTLISTED", label: "Shortlisted", color: "bg-purple-100 text-purple-800" },
  { value: "INTERVIEWING", label: "Interviewing", color: "bg-indigo-100 text-indigo-800" },
  { value: "OFFERED", label: "Offered", color: "bg-emerald-100 text-emerald-800" },
  { value: "HIRED", label: "Hired", color: "bg-green-100 text-green-800" },
  { value: "REJECTED", label: "Rejected", color: "bg-red-100 text-red-800" },
  { value: "WITHDRAWN", label: "Withdrawn", color: "bg-orange-100 text-orange-800" },
];

interface Referral {
  id: string;
  candidateName: string;
  candidateEmail?: string;
  candidatePhone?: string;
  candidateLinkedIn?: string;
  resumeUrl?: string;
  note?: string;
  relation: string;
  status: string;
  reviewNotes?: string;
  fitScore?: number;
  jobId: string;
  jobTitle: string;
  companyName: string;
  referrerName: string;
  referrerId: string;
  createdAt: string;
  updatedAt: string;
  activity?: { action: string; timestamp: string }[];
}

export default function RecruiterReferrals() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  // Fetch referrals for recruiter's jobs
  const fetchReferrals = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      
      const response = await fetch(`/api/referrals?${params.toString()}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch referrals");
      }
      
      const data = await response.json();
      setReferrals(data.referrals || data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load referrals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Filter referrals based on search
  const filteredReferrals = useMemo(() => {
    if (!searchQuery.trim()) return referrals;
    const query = searchQuery.toLowerCase();
    return referrals.filter(
      (ref) =>
        ref.candidateName?.toLowerCase().includes(query) ||
        ref.jobTitle?.toLowerCase().includes(query) ||
        ref.companyName?.toLowerCase().includes(query) ||
        ref.referrerName?.toLowerCase().includes(query)
    );
  }, [referrals, searchQuery]);

  // Group referrals by status for pipeline view
  const pipelineStats = useMemo(() => {
    const stats: Record<string, number> = {};
    referrals.forEach((ref) => {
      stats[ref.status] = (stats[ref.status] || 0) + 1;
    });
    return stats;
  }, [referrals]);

  // Update referral status
  const handleStatusUpdate = async () => {
    if (!selectedReferral || !newStatus) return;
    
    setUpdating(true);
    try {
      const response = await fetch("/api/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          referralId: selectedReferral.id,
          status: newStatus,
          reviewNotes: reviewNotes || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update referral");
      }

      await fetchReferrals();
      setUpdateDialogOpen(false);
      setSelectedReferral(null);
      setNewStatus("");
      setReviewNotes("");
    } catch (err) {
      console.error("Failed to update referral:", err);
    } finally {
      setUpdating(false);
    }
  };

  const openUpdateDialog = (referral: Referral) => {
    setSelectedReferral(referral);
    setNewStatus(referral.status);
    setReviewNotes(referral.reviewNotes || "");
    setUpdateDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const config = REFERRAL_STATUSES.find((s) => s.value === status);
    return (
      <Badge className={`${config?.color || "bg-gray-100 text-gray-800"} font-medium`}>
        {config?.label || status}
      </Badge>
    );
  };

  return (
    <PageLayout>
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Referral Pipeline</h1>
            <p className="mt-1 text-muted-foreground">
              Manage and track candidates referred for your job postings
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchReferrals} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Pipeline Stats */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-5">
          {REFERRAL_STATUSES.slice(0, 5).map((status) => (
            <button
              key={status.value}
              onClick={() => setStatusFilter(statusFilter === status.value ? "all" : status.value)}
              className={`rounded-lg border p-3 text-left transition-all hover:shadow-sm ${
                statusFilter === status.value ? "ring-2 ring-primary border-primary" : ""
              }`}
            >
              <p className="text-2xl font-bold text-foreground">
                {pipelineStats[status.value] || 0}
              </p>
              <p className="text-xs text-muted-foreground">{status.label}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by candidate, job, or referrer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {REFERRAL_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-center gap-3 py-4">
              <XCircle className="h-5 w-5 text-destructive" />
              <span className="text-destructive">{error}</span>
              <Button variant="outline" size="sm" onClick={fetchReferrals} className="ml-auto">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && filteredReferrals.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <Users className="h-12 w-12 text-muted-foreground/40" />
              <div className="text-center">
                <p className="font-medium text-foreground">No referrals found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Referrals will appear here when members refer candidates to your jobs"}
                </p>
              </div>
              {(searchQuery || statusFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Referral Cards */}
        {!loading && filteredReferrals.length > 0 && (
          <div className="space-y-4">
            {filteredReferrals.map((referral) => {
              const isExpanded = expandedId === referral.id;
              return (
                <Card key={referral.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">
                            {referral.candidateName || "Anonymous Candidate"}
                          </CardTitle>
                          {referral.fitScore && (
                            <Badge variant="outline" className="gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {referral.fitScore}% fit
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="inline-flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" />
                            {referral.jobTitle}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {referral.companyName}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <UserCheck className="h-3.5 w-3.5" />
                            Referred by {referral.referrerName}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(referral.status)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openUpdateDialog(referral)}>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Update Status
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/jobs/${referral.jobId}`}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Job
                              </Link>
                            </DropdownMenuItem>
                            {referral.candidateEmail && (
                              <DropdownMenuItem asChild>
                                <a href={`mailto:${referral.candidateEmail}`}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Email Candidate
                                </a>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {referral.relation && (
                        <span className="capitalize">
                          Relationship: {referral.relation.replace("_", " ")}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(parseISO(referral.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>

                    {referral.note && !isExpanded && (
                      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                        {referral.note}
                      </p>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 w-full justify-center gap-1"
                      onClick={() => setExpandedId(isExpanded ? null : referral.id)}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          View Details
                        </>
                      )}
                    </Button>

                    {isExpanded && (
                      <div className="mt-4 space-y-4 border-t pt-4">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          {referral.candidateEmail && (
                            <a
                              href={`mailto:${referral.candidateEmail}`}
                              className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted/50"
                            >
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate">{referral.candidateEmail}</span>
                            </a>
                          )}
                          {referral.candidatePhone && (
                            <a
                              href={`tel:${referral.candidatePhone}`}
                              className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted/50"
                            >
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{referral.candidatePhone}</span>
                            </a>
                          )}
                          {referral.candidateLinkedIn && (
                            <a
                              href={referral.candidateLinkedIn}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted/50"
                            >
                              <Linkedin className="h-4 w-4 text-muted-foreground" />
                              <span>LinkedIn Profile</span>
                            </a>
                          )}
                          {referral.resumeUrl && (
                            <a
                              href={referral.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted/50"
                            >
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span>View Resume</span>
                            </a>
                          )}
                        </div>

                        {referral.note && (
                          <div>
                            <h4 className="text-sm font-medium text-foreground mb-1">
                              Referrer's Note
                            </h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                              {referral.note}
                            </p>
                          </div>
                        )}

                        {referral.reviewNotes && (
                          <div>
                            <h4 className="text-sm font-medium text-foreground mb-1">
                              Your Review Notes
                            </h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                              {referral.reviewNotes}
                            </p>
                          </div>
                        )}

                        {referral.activity && referral.activity.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-foreground mb-2">
                              Activity Timeline
                            </h4>
                            <ol className="space-y-2">
                              {referral.activity.map((entry, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm">
                                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/60" />
                                  <div>
                                    <p className="text-foreground">{entry.action}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(parseISO(entry.timestamp), "MMM d, yyyy 'at' h:mm a")}
                                    </p>
                                  </div>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button size="sm" onClick={() => openUpdateDialog(referral)}>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Update Status
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/jobs/${referral.jobId}`}>
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View Job
                            </Link>
                          </Button>
                          {referral.candidateEmail && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={`mailto:${referral.candidateEmail}`}>
                                <Mail className="h-4 w-4 mr-1" />
                                Contact Candidate
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Status Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Referral Status</DialogTitle>
            <DialogDescription>
              Change the status for {selectedReferral?.candidateName || "this candidate"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {REFERRAL_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Review Notes (optional)</label>
              <Textarea
                placeholder="Add notes about this candidate..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setUpdateDialogOpen(false);
                  setSelectedReferral(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate} disabled={updating || !newStatus}>
                {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
