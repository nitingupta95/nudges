import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";
import type { ReferralStatus } from "@/types";

const statusVariantMap: Record<ReferralStatus, "default" | "destructive" | "outline" | "secondary" | "ghost"> = {
  pending: "outline",
  viewed: "secondary",
  shortlisted: "default",
  hired: "default",
  rejected: "destructive",
};

interface ReferralStatusBadgeProps {
  status: ReferralStatus;
}

export function ReferralStatusBadge({ status }: ReferralStatusBadgeProps) {
  return (
    <Badge variant={statusVariantMap[status]}>
      {t(`status.${status}`)}
    </Badge>
  );
}
