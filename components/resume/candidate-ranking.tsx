"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Trophy,
  Medal,
  Award,
  Users,
  TrendingUp,
  Filter,
  Search,
  ChevronUp,
  ChevronDown,
  Eye,
  Download,
  RefreshCw,
  Star,
  AlertCircle,
  Check,
  X,
  ArrowUpDown,
  Sparkles,
  Briefcase,
  GraduationCap,
  Code,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// Types
// ============================================

interface CandidateRanking {
  rank: number;
  referralId: string;
  candidateName: string;
  candidateLinkedIn?: string;
  referrerName: string;
  referrerId: string;
  status: string;
  fitScore: number;
  overallMatchScore: number;
  skillMatchScore: number;
  experienceMatchScore: number;
  recommendation: "STRONG_FIT" | "GOOD_FIT" | "POTENTIAL_FIT" | "NOT_RECOMMENDED";
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  concerns: string[];
  currentTitle?: string;
  currentCompany?: string;
  yearsOfExperience: number;
  experienceLevel: string;
  parsedAt: string;
  submittedAt: string;
}

interface RankingStats {
  totalCandidates: number;
  candidatesWithResume: number;
  avgMatchScore: number;
  topScore: number;
  recommendationBreakdown: {
    strongFit: number;
    goodFit: number;
    potentialFit: number;
    notRecommended: number;
  };
}

interface CandidateRankingProps {
  jobId: string;
  jobTitle: string;
}

// ============================================
// Component
// ============================================

export function CandidateRanking({ jobId, jobTitle }: CandidateRankingProps) {
  const [candidates, setCandidates] = useState<CandidateRanking[]>([]);
  const [stats, setStats] = useState<RankingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRanking | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [minScore, setMinScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"score" | "date" | "experience">("score");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (minScore > 0) params.append("minScore", minScore.toString());
      params.append("sortBy", sortBy);

      const response = await fetch(`/api/jobs/${jobId}/candidates?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch candidates");

      const data = await response.json();
      setCandidates(data.candidates);
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      toast.error("Failed to load candidate rankings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [jobId, statusFilter, minScore, sortBy]);

  const filteredCandidates = candidates.filter((c) =>
    searchQuery
      ? c.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.referrerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.currentTitle?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground font-medium">#{rank}</span>;
    }
  };

  const getRecommendationBadge = (recommendation: string) => {
    const configs = {
      STRONG_FIT: { label: "Strong Fit", className: "bg-green-100 text-green-800 border-green-200" },
      GOOD_FIT: { label: "Good Fit", className: "bg-blue-100 text-blue-800 border-blue-200" },
      POTENTIAL_FIT: { label: "Potential", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      NOT_RECOMMENDED: { label: "Not Recommended", className: "bg-red-100 text-red-800 border-red-200" },
    };
    const config = configs[recommendation as keyof typeof configs] || configs.NOT_RECOMMENDED;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
      DRAFT: { variant: "outline", label: "Draft" },
      SUBMITTED: { variant: "secondary", label: "Submitted" },
      UNDER_REVIEW: { variant: "default", label: "Under Review" },
      CONTACTED: { variant: "default", label: "Contacted" },
      INTERVIEWING: { variant: "default", label: "Interviewing" },
      HIRED: { variant: "default", label: "Hired" },
      REJECTED: { variant: "outline", label: "Rejected" },
    };
    const config = statusConfig[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Candidates</p>
                  <p className="text-2xl font-bold">{stats.totalCandidates ?? 0}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.candidatesWithResume ?? 0} with parsed resumes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Match Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(stats.avgMatchScore ?? 0)}`}>
                    {stats.avgMatchScore ?? 0}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <Progress value={stats.avgMatchScore ?? 0} className="h-1.5 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Top Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(stats.topScore ?? 0)}`}>
                    {stats.topScore ?? 0}%
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Strong Fits</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(stats.recommendationBreakdown?.strongFit ?? 0)}
                  </p>
                </div>
                <Star className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                +{(stats.recommendationBreakdown?.goodFit ?? 0)} good fits
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Candidate Rankings
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchCandidates}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          <CardDescription>
            AI-powered candidate comparison for {jobTitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search candidates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="CONTACTED">Contacted</SelectItem>
                <SelectItem value="INTERVIEWING">Interviewing</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Match Score</SelectItem>
                <SelectItem value="date">Submission Date</SelectItem>
                <SelectItem value="experience">Experience</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={minScore.toString()}
              onValueChange={(v) => setMinScore(parseInt(v))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Min Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Any Score</SelectItem>
                <SelectItem value="40">40%+</SelectItem>
                <SelectItem value="60">60%+</SelectItem>
                <SelectItem value="80">80%+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Candidate Table */}
          {filteredCandidates.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Rank</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Match Score</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recommendation</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map((candidate) => (
                    <TableRow key={candidate.referralId} className="group">
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {getRankIcon(candidate.rank ?? 999)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{candidate.candidateName ?? "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">
                            {candidate.currentTitle ?? ""}
                            {candidate.currentCompany && ` at ${candidate.currentCompany}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Referred by {candidate.referrerName ?? "Unknown"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold ${getScoreColor(candidate.overallMatchScore ?? 0)}`}>
                              {candidate.overallMatchScore ?? 0}%
                            </span>
                          </div>
                          <Progress value={candidate.overallMatchScore ?? 0} className="h-1.5 w-20" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1">
                                <Check className="h-3.5 w-3.5 text-green-600" />
                                <span className="text-sm">{Array.isArray(candidate.matchedSkills) ? candidate.matchedSkills.length : 0}</span>
                                <span className="text-muted-foreground">/</span>
                                <X className="h-3.5 w-3.5 text-red-600" />
                                <span className="text-sm">{Array.isArray(candidate.missingSkills) ? candidate.missingSkills.length : 0}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs font-medium text-green-600">Matched:</p>
                                  <p className="text-xs">{Array.isArray(candidate.matchedSkills) && candidate.matchedSkills.length > 0 ? candidate.matchedSkills.join(", ") : "None"}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-red-600">Missing:</p>
                                  <p className="text-xs">{Array.isArray(candidate.missingSkills) && candidate.missingSkills.length > 0 ? candidate.missingSkills.join(", ") : "None"}</p>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{candidate.yearsOfExperience ?? 0}</span> years
                          <p className="text-xs text-muted-foreground capitalize">
                            {(candidate.experienceLevel ?? "unknown").toLowerCase().replace(/_/g, " ")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(candidate.status ?? "SUBMITTED")}</TableCell>
                      <TableCell>{getRecommendationBadge(candidate.recommendation ?? "NOT_RECOMMENDED")}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCandidate(candidate)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                {candidate.candidateName} - Detailed Analysis
                              </DialogTitle>
                              <DialogDescription>
                                Match score breakdown and AI insights
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 py-4">
                              {/* Score Overview */}
                              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                <div>
                                  <p className="text-sm text-muted-foreground">Overall Match</p>
                                  <p className={`text-3xl font-bold ${getScoreColor(candidate.overallMatchScore ?? 0)}`}>
                                    {candidate.overallMatchScore ?? 0}%
                                  </p>
                                </div>
                                <div className="text-right">
                                  {getRecommendationBadge(candidate.recommendation ?? "NOT_RECOMMENDED")}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Rank #{candidate.rank ?? "N/A"}
                                  </p>
                                </div>
                              </div>

                              {/* Score Breakdown */}
                              <div className="grid gap-3 grid-cols-2">
                                <div className="p-3 rounded-lg border">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Code className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Skill Match</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Progress value={candidate.skillMatchScore ?? 0} className="flex-1 h-2" />
                                    <span className={`text-sm font-medium ${getScoreColor(candidate.skillMatchScore ?? 0)}`}>
                                      {candidate.skillMatchScore ?? 0}%
                                    </span>
                                  </div>
                                </div>
                                <div className="p-3 rounded-lg border">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Experience Match</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Progress value={candidate.experienceMatchScore ?? 0} className="flex-1 h-2" />
                                    <span className={`text-sm font-medium ${getScoreColor(candidate.experienceMatchScore ?? 0)}`}>
                                      {candidate.experienceMatchScore ?? 0}%
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Candidate Info */}
                              <div className="grid gap-4 grid-cols-2">
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium flex items-center gap-2">
                                    <Briefcase className="h-4 w-4" />
                                    Current Role
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {candidate.currentTitle || "Not specified"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {candidate.currentCompany || ""}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4" />
                                    Experience
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {candidate.yearsOfExperience ?? 0} years
                                  </p>
                                  <p className="text-sm text-muted-foreground capitalize">
                                    {(candidate.experienceLevel ?? "unknown").toLowerCase().replace(/_/g, " ")}
                                  </p>
                                </div>
                              </div>

                              {/* Skills */}
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium">Skill Analysis</h4>
                                <div className="grid gap-3 grid-cols-2">
                                  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                                    <p className="text-xs font-medium text-green-800 mb-2 flex items-center gap-1">
                                      <Check className="h-3 w-3" /> Matched Skills
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {Array.isArray(candidate.matchedSkills) && candidate.matchedSkills.length > 0 ? (
                                        candidate.matchedSkills.map((skill) => (
                                          <Badge key={skill} variant="secondary" className="text-xs bg-green-100">
                                            {skill}
                                          </Badge>
                                        ))
                                      ) : (
                                        <span className="text-xs text-green-700">No direct matches</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                                    <p className="text-xs font-medium text-red-800 mb-2 flex items-center gap-1">
                                      <X className="h-3 w-3" /> Missing Skills
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {Array.isArray(candidate.missingSkills) && candidate.missingSkills.length > 0 ? (
                                        candidate.missingSkills.map((skill) => (
                                          <Badge key={skill} variant="outline" className="text-xs border-red-200">
                                            {skill}
                                          </Badge>
                                        ))
                                      ) : (
                                        <span className="text-xs text-red-700">All required skills present</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Strengths & Concerns */}
                              <div className="grid gap-4 grid-cols-2">
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium text-green-700">Strengths</h4>
                                  <ul className="space-y-1">
                                    {Array.isArray(candidate.strengths) && candidate.strengths.length > 0 ? (
                                      candidate.strengths.map((s, i) => (
                                        <li key={i} className="text-xs flex items-start gap-1.5">
                                          <Check className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                                          {s}
                                        </li>
                                      ))
                                    ) : (
                                      <li className="text-xs text-muted-foreground">No strengths identified</li>
                                    )}
                                  </ul>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium text-yellow-700">Concerns</h4>
                                  <ul className="space-y-1">
                                    {Array.isArray(candidate.concerns) && candidate.concerns.length > 0 ? (
                                      candidate.concerns.map((c, i) => (
                                        <li key={i} className="text-xs flex items-start gap-1.5">
                                          <AlertCircle className="h-3 w-3 text-yellow-600 mt-0.5 shrink-0" />
                                          {c}
                                        </li>
                                      ))
                                    ) : (
                                      <li className="text-xs text-muted-foreground">No concerns identified</li>
                                    )}
                                  </ul>
                                </div>
                              </div>

                              {/* Metadata */}
                              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                                <span>Submitted: {candidate.submittedAt ? new Date(candidate.submittedAt).toLocaleDateString() : "N/A"}</span>
                                <span>Parsed: {candidate.parsedAt ? new Date(candidate.parsedAt).toLocaleDateString() : "N/A"}</span>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No candidates found</h3>
              <p className="text-muted-foreground">
                {candidates.length === 0
                  ? "No referrals have been submitted with parsed resumes yet."
                  : "No candidates match your current filters."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CandidateRanking;
