 
import { JobList } from "@/components/jobs/job-list";
import { PageLayout } from "@/components/layout/page-layout";
import { t } from "@/lib/i18n";

export default function Dashboard() {
  return (
    <PageLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          {t("dashboard.title")}
        </h1>
        <JobList />
      </div>
    </PageLayout>
  );
}
