"use client";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label"; 
import { t } from "@/lib/i18n";
import { useState } from "react";
import { ShieldCheck, Briefcase, Code } from "lucide-react";
import { useAuth } from "@/contexts/auth-contex";
import { PageLayout } from "@/components/layout/page-layout";

const preferenceFlags = [
  { key: "relatives_in_tech", label: t("profile.relativesInTech") },
  { key: "college_juniors", label: t("profile.collegeJuniors") },
  { key: "bootcamp_grads", label: t("profile.bootcampGrads") },
];

export default function Profile() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<string[]>(
    user?.profile.preferences || []
  );

  const togglePref = (key: string) => {
    setPreferences((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  if (!user) return null;

  return (
    <PageLayout>
      <div className="container max-w-2xl py-8 space-y-8">
        <h1 className="text-3xl font-bold text-foreground">
          {t("profile.title")}
        </h1>

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
            <div className="flex flex-wrap gap-2">
              {user.profile.skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Companies */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
              <Briefcase className="h-4 w-4" />
              {t("profile.companies")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {user.profile.pastCompanies.map((company) => (
                <Badge key={company} variant="secondary">
                  {company}
                </Badge>
              ))}
            </div>
          </div>

          {/* Experience */}
          {user.profile.experienceYears && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                {t("profile.experience")}
              </h3>
              <p className="text-sm text-foreground">
                {t("profile.years", {
                  count: String(user.profile.experienceYears),
                })}
              </p>
            </div>
          )}
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
