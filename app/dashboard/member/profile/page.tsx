"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagInput } from "@/components/ui/tag-input";
import { t } from "@/lib/i18n";
import { useState } from "react";
import { ShieldCheck, Briefcase, Code, Edit2, Save, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-contex";
import { PageLayout } from "@/components/layout/page-layout";
import { toast } from "sonner";


const preferenceFlags = [
  { key: "relatives_in_tech", label: t("profile.relativesInTech") },
  { key: "college_juniors", label: t("profile.collegeJuniors") },
  { key: "bootcamp_grads", label: t("profile.bootcampGrads") },
];

const domainOptions = [
  "Fintech",
  "Productivity",
  "Consumer",
  "Enterprise",
  "Healthcare",
  "Education",
  "E-commerce",
  "Social",
  "Gaming",
  "AI/ML",
];

export default function Profile() {
  const { user, profile, refreshUser, refreshProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);
  const [pastCompanies, setPastCompanies] = useState<string[]>(
    profile?.pastCompanies || []
  );
  const [domains, setDomains] = useState<string[]>(profile?.domains || []);
  const [experienceLevel, setExperienceLevel] = useState<string>(
    profile?.experienceLevel || "mid"
  );
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(
    profile?.yearsOfExperience || 0
  );
  const [preferences, setPreferences] = useState<string[]>([]);

  const togglePref = (key: string) => {
    setPreferences((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const toggleDomain = (domain: string) => {
    setDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );
  };

  const handleCancel = () => {
    // Reset form to original values
    setSkills(profile?.skills || []);
    setPastCompanies(profile?.pastCompanies || []);
    setDomains(profile?.domains || []);
    setExperienceLevel(profile?.experienceLevel || "mid");
    setYearsOfExperience(profile?.yearsOfExperience || 0);
    setPreferences([]);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/users/me/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          skills,
          pastCompanies,
          domains,
          experienceLevel,
          yearsOfExperience,
          preferredDomains: domains,
          preferredRoles: [],
          isOpenToRefer: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully!");
      setIsEditing(false);

      // Refresh user data from the server
      await refreshUser();
    } catch (error) {
      console.error("Save profile error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <PageLayout>
      <div className="container max-w-2xl py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">
            {t("profile.title")}
          </h1>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>

        {/* Profile info */}
        <section className="rounded-lg border bg-card p-6 space-y-6">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold text-lg">
                {user.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {user.name}
                </h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
              <Code className="h-4 w-4" />
              {t("profile.skills")}
            </h3>
            {isEditing ? (
              <TagInput
                tags={skills}
                onChange={setSkills}
                placeholder="Add skill (press Enter)"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile?.skills?.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                )) || (
                    <p className="text-sm text-muted-foreground">
                      No skills added yet
                    </p>
                  )}
              </div>
            )}
          </div>

          {/* Companies */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
              <Briefcase className="h-4 w-4" />
              {t("profile.companies")}
            </h3>
            {isEditing ? (
              <TagInput
                tags={pastCompanies}
                onChange={setPastCompanies}
                placeholder="Add company (press Enter)"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile?.pastCompanies?.map((company) => (
                  <Badge key={company} variant="secondary">
                    {company}
                  </Badge>
                )) || (
                    <p className="text-sm text-muted-foreground">
                      No companies added yet
                    </p>
                  )}
              </div>
            )}
          </div>

          {/* Domains */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Domains
            </h3>
            {isEditing ? (
              <div className="flex flex-wrap gap-2">
                {domainOptions.map((domain) => (
                  <Badge
                    key={domain}
                    variant={domains.includes(domain) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleDomain(domain)}
                  >
                    {domain}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile?.domains?.map((domain) => (
                  <Badge key={domain} variant="secondary">
                    {domain}
                  </Badge>
                )) || (
                    <p className="text-sm text-muted-foreground">
                      No domains selected
                    </p>
                  )}
              </div>
            )}
          </div>

          {/* Experience Level */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Experience Level
            </h3>
            {isEditing ? (
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="mid">Mid-Level</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-foreground capitalize">
                {profile?.experienceLevel || "Not set"}
              </p>
            )}
          </div>

          {/* Years of Experience */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Years of Experience
            </h3>
            {isEditing ? (
              <Input
                type="number"
                min="0"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(parseInt(e.target.value) || 0)}
                className="w-full"
              />
            ) : (
              <p className="text-sm text-foreground">
                {profile?.yearsOfExperience || 0} years
              </p>
            )}
          </div>
        </section>

        {/* Preferences */}
        <section className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            {t("profile.preferences")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("profile.prefExplain")}
          </p>
          <div className="space-y-4">
            {preferenceFlags.map((pref) => (
              <div
                key={pref.key}
                className="flex items-center justify-between"
              >
                <Label
                  htmlFor={pref.key}
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  {pref.label}
                </Label>
                <Switch
                  id={pref.key}
                  checked={preferences.includes(pref.key)}
                  onCheckedChange={() => togglePref(pref.key)}
                  disabled={!isEditing}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            These flags are optional and help suggest better referral prompts.
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
