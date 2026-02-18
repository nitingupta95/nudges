"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-contex";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  Bell,
  Shield,
  Briefcase,
  Settings2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Check,
  AlertCircle,
  ExternalLink,
  UserCog,
  Building2,
  Globe,
  Clock,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// Types
// ============================================

interface NotificationSettings {
  emailNewReferrals: boolean;
  emailStatusUpdates: boolean;
  emailWeeklyDigest: boolean;
  emailJobRecommendations: boolean;
  emailSystemAnnouncements: boolean;
}

interface PrivacySettings {
  profileVisible: boolean;
  showSkillsToRecruiters: boolean;
  showCompanyHistory: boolean;
  allowJobRecommendations: boolean;
}

interface AccountSettings {
  name: string;
  email: string;
  timezone: string;
}

// ============================================
// Constants
// ============================================

const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Central European Time" },
  { value: "Asia/Kolkata", label: "India Standard Time" },
  { value: "Asia/Singapore", label: "Singapore Time" },
  { value: "Asia/Tokyo", label: "Japan Standard Time" },
  { value: "Australia/Sydney", label: "Australian Eastern Time" },
];

const EXPERIENCE_LEVELS = [
  { value: "INTERN", label: "Intern" },
  { value: "ENTRY", label: "Entry Level (0-2 years)" },
  { value: "MID", label: "Mid Level (2-5 years)" },
  { value: "SENIOR", label: "Senior (5-10 years)" },
  { value: "STAFF", label: "Staff/Principal (10+ years)" },
  { value: "EXECUTIVE", label: "Executive" },
];

// ============================================
// Component
// ============================================

export default function SettingsPage() {
  const { user, profile, refreshUser, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [saving, setSaving] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Account settings state
  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    name: "",
    email: "",
    timezone: "UTC",
  });

  // Member profile settings
  const [profileSettings, setProfileSettings] = useState({
    currentTitle: "",
    currentCompany: "",
    location: "",
    yearsOfExperience: 0,
    experienceLevel: "MID",
    isOpenToRefer: true,
    linkedinUrl: "",
  });

  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNewReferrals: true,
    emailStatusUpdates: true,
    emailWeeklyDigest: false,
    emailJobRecommendations: true,
    emailSystemAnnouncements: true,
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisible: true,
    showSkillsToRecruiters: true,
    showCompanyHistory: true,
    allowJobRecommendations: true,
  });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Initialize settings from user/profile
  useEffect(() => {
    if (user) {
      setAccountSettings({
        name: user.name || "",
        email: user.email || "",
        timezone: "UTC",
      });
    }
    if (profile) {
      setProfileSettings({
        currentTitle: profile.currentTitle || "",
        currentCompany: profile.currentCompany || "",
        location: profile.location || "",
        yearsOfExperience: profile.yearsOfExperience || 0,
        experienceLevel: profile.experienceLevel || "MID",
        isOpenToRefer: profile.isOpenToRefer ?? true,
        linkedinUrl: "",
      });
    }
  }, [user, profile]);

  // Load saved preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const res = await fetch("/api/users/preferences");
        if (res.ok) {
          const data = await res.json();
          if (data.preferences?.notifications) {
            setNotifications(data.preferences.notifications);
          }
          if (data.preferences?.privacy) {
            setPrivacy(data.preferences.privacy);
          }
          if (data.profile?.timezone) {
            setAccountSettings(prev => ({ ...prev, timezone: data.profile.timezone }));
          }
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
      }
    };
    if (user) {
      loadPreferences();
    }
  }, [user]);

  if (!user) return null;

  const isMember = user.role === "MEMBER";
  const isRecruiter = user.role === "RECRUITER";

  // ============================================
  // Handlers
  // ============================================

  const handleSaveAccount = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: accountSettings.name,
        }),
      });

      if (!res.ok) throw new Error("Failed to update account");

      await refreshUser();
      toast.success("Account settings saved");
    } catch (error) {
      toast.error("Failed to save account settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentTitle: profileSettings.currentTitle,
          currentCompany: profileSettings.currentCompany,
          location: profileSettings.location,
          yearsOfExperience: profileSettings.yearsOfExperience,
          experienceLevel: profileSettings.experienceLevel,
          isOpenToRefer: profileSettings.isOpenToRefer,
          timezone: accountSettings.timezone,
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      await refreshProfile();
      toast.success("Profile settings saved");
    } catch (error) {
      toast.error("Failed to save profile settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: { notifications },
        }),
      });

      if (!res.ok) throw new Error("Failed to update notifications");

      toast.success("Notification settings saved");
    } catch (error) {
      toast.error("Failed to save notification settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: { privacy },
        }),
      });

      if (!res.ok) throw new Error("Failed to update privacy settings");

      toast.success("Privacy settings saved");
    } catch (error) {
      toast.error("Failed to save privacy settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/users/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to change password");
      }

      toast.success("Password changed successfully");
      setShowPasswordDialog(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // Render
  // ============================================

  return (
    <PageLayout>
      <div className="container max-w-4xl py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account, preferences, and privacy settings
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="account" className="gap-2">
              <User className="h-4 w-4 hidden sm:inline" />
              Account
            </TabsTrigger>
            {isMember && (
              <TabsTrigger value="profile" className="gap-2">
                <UserCog className="h-4 w-4 hidden sm:inline" />
                Profile
              </TabsTrigger>
            )}
            {isRecruiter && (
              <TabsTrigger value="recruiter" className="gap-2">
                <Building2 className="h-4 w-4 hidden sm:inline" />
                Recruiter
              </TabsTrigger>
            )}
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4 hidden sm:inline" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Shield className="h-4 w-4 hidden sm:inline" />
              Privacy
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Manage your account details and credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={accountSettings.name}
                      onChange={(e) =>
                        setAccountSettings({ ...accountSettings, name: e.target.value })
                      }
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={accountSettings.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Contact support to change your email
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={accountSettings.timezone}
                    onValueChange={(v) =>
                      setAccountSettings({ ...accountSettings, timezone: v })
                    }
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button onClick={handleSaveAccount} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Security Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security
                </CardTitle>
                <CardDescription>
                  Manage your password and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-muted-foreground">
                      Last changed: Unknown
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
                    Change Password
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Role</p>
                    <p className="text-sm text-muted-foreground">
                      Your account type
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {user.role.toLowerCase()}
                  </Badge>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Account Created</p>
                    <p className="text-sm text-muted-foreground">
                      When you joined Nudges
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions for your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Delete Account</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Member Profile Tab */}
          {isMember && (
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Professional Profile
                  </CardTitle>
                  <CardDescription>
                    Your professional information used for job matching
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="currentTitle">Current Job Title</Label>
                      <Input
                        id="currentTitle"
                        value={profileSettings.currentTitle}
                        onChange={(e) =>
                          setProfileSettings({
                            ...profileSettings,
                            currentTitle: e.target.value,
                          })
                        }
                        placeholder="e.g. Senior Software Engineer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentCompany">Current Company</Label>
                      <Input
                        id="currentCompany"
                        value={profileSettings.currentCompany}
                        onChange={(e) =>
                          setProfileSettings({
                            ...profileSettings,
                            currentCompany: e.target.value,
                          })
                        }
                        placeholder="e.g. Google"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={profileSettings.location}
                        onChange={(e) =>
                          setProfileSettings({
                            ...profileSettings,
                            location: e.target.value,
                          })
                        }
                        placeholder="e.g. San Francisco, CA"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                      <Input
                        id="yearsOfExperience"
                        type="number"
                        min="0"
                        max="50"
                        value={profileSettings.yearsOfExperience}
                        onChange={(e) =>
                          setProfileSettings({
                            ...profileSettings,
                            yearsOfExperience: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experienceLevel">Experience Level</Label>
                    <Select
                      value={profileSettings.experienceLevel}
                      onValueChange={(v) =>
                        setProfileSettings({ ...profileSettings, experienceLevel: v })
                      }
                    >
                      <SelectTrigger id="experienceLevel">
                        <SelectValue placeholder="Select level" />
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

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Your Skills & Experience</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
                        <span className="text-sm">Skills</span>
                        <div className="flex flex-wrap gap-1.5 justify-end max-w-[60%]">
                          {profile?.skills?.slice(0, 5).map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs">
                              {s}
                            </Badge>
                          ))}
                          {profile?.skills && profile.skills.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{profile.skills.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
                        <span className="text-sm">Past Companies</span>
                        <div className="flex flex-wrap gap-1.5 justify-end max-w-[60%]">
                          {profile?.pastCompanies?.map((c) => (
                            <Badge key={c} variant="secondary" className="text-xs">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
                        <span className="text-sm">Domains</span>
                        <div className="flex flex-wrap gap-1.5 justify-end max-w-[60%]">
                          {profile?.domains?.map((d) => (
                            <Badge key={d} variant="secondary" className="text-xs">
                              {d.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Skills and experience are synced from your LinkedIn profile.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Referral Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5" />
                    Referral Preferences
                  </CardTitle>
                  <CardDescription>
                    Control how you participate in the referral network
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="openToRefer">Open to Refer</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow the system to suggest you as a potential referrer
                      </p>
                    </div>
                    <Switch
                      id="openToRefer"
                      checked={profileSettings.isOpenToRefer}
                      onCheckedChange={(checked) =>
                        setProfileSettings({ ...profileSettings, isOpenToRefer: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Recruiter Tab */}
          {isRecruiter && (
            <TabsContent value="recruiter" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Recruiter Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your recruiter profile and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        placeholder="Your company"
                        defaultValue=""
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        placeholder="e.g. Engineering"
                        defaultValue=""
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedinCompany">Company LinkedIn Page</Label>
                    <Input
                      id="linkedinCompany"
                      placeholder="https://linkedin.com/company/..."
                      defaultValue=""
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Default Job Settings</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="defaultLocation">Default Location</Label>
                        <Input
                          id="defaultLocation"
                          placeholder="e.g. Remote / Hybrid"
                          defaultValue=""
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="defaultCurrency">Default Currency</Label>
                        <Select defaultValue="USD">
                          <SelectTrigger id="defaultCurrency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="INR">INR (₹)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Button disabled={saving}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save Recruiter Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Hiring Pipeline Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5" />
                    Pipeline Settings
                  </CardTitle>
                  <CardDescription>
                    Customize your hiring workflow
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-acknowledge Referrals</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically send acknowledgment emails when referrals are received
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Status Update Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify candidates when their referral status changes
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Choose what updates you want to receive via email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Referrals</Label>
                    <p className="text-sm text-muted-foreground">
                      {isMember
                        ? "Get notified when someone refers you"
                        : "Get notified when you receive new referrals"}
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailNewReferrals}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, emailNewReferrals: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Referral Status Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      {isMember
                        ? "Know when your referral status changes"
                        : "Track status changes in your pipeline"}
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailStatusUpdates}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, emailStatusUpdates: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a weekly summary of activity
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailWeeklyDigest}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, emailWeeklyDigest: checked })
                    }
                  />
                </div>
                <Separator />
                {isMember && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Job Recommendations</Label>
                        <p className="text-sm text-muted-foreground">
                          Get personalized job suggestions based on your profile
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailJobRecommendations}
                        onCheckedChange={(checked) =>
                          setNotifications({
                            ...notifications,
                            emailJobRecommendations: checked,
                          })
                        }
                      />
                    </div>
                    <Separator />
                  </>
                )}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Announcements</Label>
                    <p className="text-sm text-muted-foreground">
                      Important updates about Nudges platform
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailSystemAnnouncements}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        emailSystemAnnouncements: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button onClick={handleSaveNotifications} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Notification Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>
                  Control how your information is used and shared
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isMember && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Profile Visibility</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow recruiters to view your profile
                        </p>
                      </div>
                      <Switch
                        checked={privacy.profileVisible}
                        onCheckedChange={(checked) =>
                          setPrivacy({ ...privacy, profileVisible: checked })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Skills to Recruiters</Label>
                        <p className="text-sm text-muted-foreground">
                          Display your skills in job matching
                        </p>
                      </div>
                      <Switch
                        checked={privacy.showSkillsToRecruiters}
                        onCheckedChange={(checked) =>
                          setPrivacy({ ...privacy, showSkillsToRecruiters: checked })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Company History</Label>
                        <p className="text-sm text-muted-foreground">
                          Display your past companies to enhance matching
                        </p>
                      </div>
                      <Switch
                        checked={privacy.showCompanyHistory}
                        onCheckedChange={(checked) =>
                          setPrivacy({ ...privacy, showCompanyHistory: checked })
                        }
                      />
                    </div>
                    <Separator />
                  </>
                )}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Job Recommendations</Label>
                    <p className="text-sm text-muted-foreground">
                      Use your data for personalized suggestions
                    </p>
                  </div>
                  <Switch
                    checked={privacy.allowJobRecommendations}
                    onCheckedChange={(checked) =>
                      setPrivacy({ ...privacy, allowJobRecommendations: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button onClick={handleSavePrivacy} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Privacy Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Data Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Your Data
                </CardTitle>
                <CardDescription>
                  Information about how we use your data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border bg-muted/30 p-4 space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your data is used solely to match you with relevant job opportunities
                    and connect you with potential referrers. We never sell your personal
                    information to third parties.
                  </p>
                  <a
                    href="#"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    Read our Privacy Policy
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" size="sm">
                    Download My Data
                  </Button>
                  <Button variant="outline" size="sm">
                    Request Data Deletion
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() =>
                    setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                  }
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() =>
                    setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                  }
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() =>
                    setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                  }
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Password must be at least 8 characters long
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={
                saving ||
                !passwordForm.currentPassword ||
                !passwordForm.newPassword ||
                !passwordForm.confirmPassword
              }
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete your account? This will remove:
            </p>
            <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Your profile and all settings</li>
              <li>All referrals you&apos;ve made or received</li>
              <li>Your job history and preferences</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                toast.error("Account deletion is not available yet");
                setShowDeleteDialog(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete My Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
