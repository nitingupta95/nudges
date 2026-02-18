"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  Mail,
  User,
  Briefcase,
  Edit2,
  Save,
  X,
  Loader2,
  Globe,
  Phone,
  MapPin,
  CheckCircle,
  Calendar,
  TrendingUp,
  Users,
  Eye,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-contex";
import { PageLayout } from "@/components/layout/page-layout";
import { toast } from "sonner";
import { useJobs } from "@/hooks/use-jobs";

interface RecruiterStats {
  totalJobs: number;
  activeJobs: number;
  totalReferrals: number;
  totalViews: number;
  hiredCount: number;
}

export default function RecruiterProfile() {
  const { user, refreshUser } = useAuth();
  const { jobs, fetchJobs } = useJobs();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState<RecruiterStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalReferrals: 0,
    totalViews: 0,
    hiredCount: 0,
  });

  // Form state for recruiter profile
  const [formData, setFormData] = useState({
    name: user?.name || "",
    company: "",
    title: "",
    phone: "",
    location: "",
    bio: "",
    website: "",
  });

  // Load recruiter stats
  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return;
      try {
        const allJobs = await fetchJobs();
        const myJobs = allJobs.filter((job) => job.createdById === user.id);
        
        setStats({
          totalJobs: myJobs.length,
          activeJobs: myJobs.filter((j) => j.isActive).length,
          totalReferrals: myJobs.reduce((sum, j) => sum + (j.referralCount || 0), 0),
          totalViews: myJobs.reduce((sum, j) => sum + (j.viewCount || 0), 0),
          hiredCount: 0, // Would come from referrals API
        });
      } catch (err) {
        console.error("Failed to load stats:", err);
      }
    };
    loadStats();
  }, [user?.id, fetchJobs]);

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      company: "",
      title: "",
      phone: "",
      location: "",
      bio: "",
      website: "",
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Update user profile (name, etc.)
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          // Additional recruiter fields would go here
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      await refreshUser();
    } catch (error) {
      console.error("Save profile error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <PageLayout>
        <div className="container max-w-3xl py-8 space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container max-w-3xl py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Recruiter Profile</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your recruiter account and view performance
            </p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>

        {/* Performance Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalJobs}</p>
                  <p className="text-xs text-muted-foreground">Total Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeJobs}</p>
                  <p className="text-xs text-muted-foreground">Active Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                  <p className="text-xs text-muted-foreground">Referrals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Eye className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalViews}</p>
                  <p className="text-xs text-muted-foreground">Job Views</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your account details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar and Basic Info */}
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 space-y-1">
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
                    className="text-lg font-semibold"
                  />
                ) : (
                  <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>
                <Badge variant="default" className="mt-2">
                  {user.role}
                </Badge>
              </div>
            </div>

            {/* Additional Fields (Editing mode) */}
            {isEditing && (
              <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Your company"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Talent Acquisition Manager"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="City, Country"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="website">Website / LinkedIn</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell candidates about yourself and your company..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Account Details (View mode) */}
            {!isEditing && (
              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Member since:</span>
                  <span className="text-foreground">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Hiring rate:</span>
                  <span className="text-foreground">
                    {stats.totalReferrals > 0
                      ? `${((stats.hiredCount / stats.totalReferrals) * 100).toFixed(1)}%`
                      : "No data yet"}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <a href="/dashboard/recruiter">
                <Briefcase className="h-4 w-4 mr-2" />
                View Jobs
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/dashboard/recruiter/referrals">
                <Users className="h-4 w-4 mr-2" />
                View Referrals
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/settings">
                <Mail className="h-4 w-4 mr-2" />
                Email Settings
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
