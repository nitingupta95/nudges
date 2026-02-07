import { t } from "@/lib/i18n";

export function Footer() {
  return (
    <footer className="border-t bg-card py-8">
      <div className="container flex flex-col items-center gap-4 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-accent text-accent-foreground text-xs font-extrabold">
            P
          </span>
          Pieworks
        </div>
        <p>{t("landing.privacy")}</p>
        <p>© {new Date().getFullYear()} Pieworks. All rights reserved.</p>
      </div>
    </footer>
  );
}
