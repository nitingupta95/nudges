"use client";

import { t } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/auth-contex";
import { PageLayout } from "@/components/layout/page-layout";

export default function Settings() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <PageLayout>
      <div className="container max-w-2xl py-8 space-y-8">
        <h1 className="text-3xl font-bold text-foreground">
          {t("settings.title")}
        </h1>

        {/* Privacy */}
        <section className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-success" />
            <h2 className="text-lg font-semibold text-foreground">
              {t("settings.privacy")}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("settings.privacyNote")}
          </p>

          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">
              {t("settings.dataUsed")}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-md border bg-secondary/30 p-3">
                <span className="text-sm text-foreground">Skills</span>
                <div className="flex gap-1.5">
                  {user?.memberProfile?.skills?.slice(0, 3).map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                  {user?.memberProfile?.skills && user.memberProfile.skills.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{user.memberProfile.skills.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border bg-secondary/30 p-3">
                <span className="text-sm text-foreground">Past companies</span>
                <div className="flex gap-1.5">
                  {user?.memberProfile?.pastCompanies?.map((c) => (
                    <Badge key={c} variant="secondary" className="text-xs">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border bg-secondary/30 p-3">
                <span className="text-sm text-foreground">
                  Network preferences
                </span>
                <div className="flex gap-1.5">
                  {user?.memberProfile?.domains &&
                    user.memberProfile.domains.length > 0 ? (
                    user.memberProfile.domains.map((p: string) => (
                      <Badge key={p} variant="secondary" className="text-xs">
                        {p.replace(/_/g, " ")}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">None set</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <a
            href="#"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            {t("settings.policyLink")}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </section>
      </div>
    </PageLayout>
  );
}
