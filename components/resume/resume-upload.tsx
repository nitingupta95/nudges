"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Upload,
  FileText,
  Check,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  Briefcase,
  GraduationCap,
  Code,
  Target,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// Types
// ============================================

interface ParsedResume {
  personalInfo: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  summary?: string;
  skills: string[];
  primarySkills: string[];
  technicalSkills: string[];
  experience: Array<{
    company: string;
    title: string;
    duration?: string;
    isCurrent: boolean;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    graduationYear?: string;
  }>;
  totalYearsOfExperience: number;
  currentTitle?: string;
  currentCompany?: string;
  experienceLevel: string;
  source: "ai" | "static";
  confidence: number;
}

interface ResumeMatchScore {
  overall: number;
  breakdown: {
    skillMatch: number;
    experienceMatch: number;
    industryMatch: number;
    domainMatch: number;
    seniorityMatch: number;
    educationMatch: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  concerns: string[];
  recommendation: "STRONG_FIT" | "GOOD_FIT" | "POTENTIAL_FIT" | "NOT_RECOMMENDED";
}

interface ResumeUploadProps {
  referralId: string;
  jobTitle: string;
  onUploadComplete?: (data: { parsedResume: ParsedResume; matchScore: ResumeMatchScore }) => void;
  existingResume?: boolean;
}

// ============================================
// Component
// ============================================

export function ResumeUpload({
  referralId,
  jobTitle,
  onUploadComplete,
  existingResume = false,
}: ResumeUploadProps) {
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    parsedResume: ParsedResume;
    matchScore: ResumeMatchScore;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (mode === "upload" && !file) {
      toast.error("Please select a file to upload");
      return;
    }
    if (mode === "paste" && resumeText.length < 100) {
      toast.error("Please paste more resume content (at least 100 characters)");
      return;
    }

    setUploading(true);

    try {
      let response: Response;

      if (mode === "upload" && file) {
        // Read file as text for now
        const text = await file.text();
        response = await fetch(`/api/referrals/${referralId}/resume`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText: text }),
        });
      } else {
        response = await fetch(`/api/referrals/${referralId}/resume`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText }),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process resume");
      }

      const data = await response.json();
      setResult(data);
      setShowPreview(true);
      toast.success("Resume parsed and scored successfully!");
      onUploadComplete?.(data);
    } catch (error) {
      console.error("Resume upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process resume");
    } finally {
      setUploading(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "STRONG_FIT":
        return "bg-green-100 text-green-800 border-green-200";
      case "GOOD_FIT":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "POTENTIAL_FIT":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "NOT_RECOMMENDED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume Upload & Analysis
          </CardTitle>
          <CardDescription>
            Upload a resume to get AI-powered skill extraction and job match scoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "upload" | "paste")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="paste">
                <FileText className="h-4 w-4 mr-2" />
                Paste Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC, DOCX or TXT (max 5MB)
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="paste" className="space-y-4">
              <div className="space-y-2">
                <Label>Paste Resume Content</Label>
                <Textarea
                  placeholder="Paste the resume text here... Include work experience, skills, education, etc."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {resumeText.length} characters
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <Button
            onClick={handleUpload}
            disabled={uploading || (mode === "upload" && !file) || (mode === "paste" && resumeText.length < 100)}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Resume...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Parse & Score Resume
              </>
            )}
          </Button>

          {existingResume && (
            <p className="text-sm text-muted-foreground text-center">
              A resume has already been uploaded. Uploading a new one will replace it.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Resume Analysis Results
            </DialogTitle>
            <DialogDescription>
              AI-powered analysis for {jobTitle}
            </DialogDescription>
          </DialogHeader>

          {result && (
            <div className="space-y-6">
              {/* Overall Score */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Overall Match Score</h3>
                      <Badge className={getRecommendationColor(result.matchScore.recommendation)}>
                        {result.matchScore.recommendation.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className={`text-4xl font-bold ${getScoreColor(result.matchScore.overall)}`}>
                      {result.matchScore.overall}%
                    </div>
                  </div>
                  <Progress value={result.matchScore.overall} className="h-2" />
                </CardContent>
              </Card>

              {/* Score Breakdown */}
              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(result.matchScore.breakdown).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                    <span className={`font-semibold ${getScoreColor(value)}`}>{value}%</span>
                  </div>
                ))}
              </div>

              {/* Matched & Missing Skills */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Matched Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {result.matchScore.matchedSkills.length > 0 ? (
                        result.matchScore.matchedSkills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="bg-green-50 text-green-700">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No direct skill matches</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <X className="h-4 w-4 text-red-600" />
                      Missing Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {result.matchScore.missingSkills.length > 0 ? (
                        result.matchScore.missingSkills.map((skill) => (
                          <Badge key={skill} variant="outline" className="border-red-200 text-red-700">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">All required skills present</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Strengths & Concerns */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {result.matchScore.strengths.map((s, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      Concerns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {result.matchScore.concerns.length > 0 ? (
                        result.matchScore.concerns.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <AlertCircle className="h-3.5 w-3.5 text-yellow-600 mt-0.5 shrink-0" />
                            {c}
                          </li>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No major concerns identified</span>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Parsed Resume Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Extracted Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Current Role</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {result.parsedResume.currentTitle || "Not specified"} at{" "}
                        {result.parsedResume.currentCompany || "Not specified"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Experience</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {result.parsedResume.totalYearsOfExperience} years ({result.parsedResume.experienceLevel})
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Skills Extracted</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.parsedResume.skills.slice(0, 15).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {result.parsedResume.skills.length > 15 && (
                        <Badge variant="outline" className="text-xs">
                          +{result.parsedResume.skills.length - 15} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {result.parsedResume.education.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Education</span>
                      </div>
                      {result.parsedResume.education.map((edu, i) => (
                        <p key={i} className="text-sm text-muted-foreground">
                          {edu.degree} {edu.field && `in ${edu.field}`} from {edu.institution}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {result.parsedResume.source === "ai" ? "AI Parsed" : "Static Parser"}
                    </Badge>
                    <span>Confidence: {Math.round(result.parsedResume.confidence * 100)}%</span>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={() => setShowPreview(false)} className="w-full">
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ResumeUpload;
