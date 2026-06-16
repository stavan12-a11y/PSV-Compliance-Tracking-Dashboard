import type { Priority, TrapStatus, IssueType } from "@/lib/types";
import { priorityColor } from "@/lib/format";

export function Badge({
  color,
  children,
}: {
  color: "red" | "amber" | "blue" | "green" | "gray";
  children: React.ReactNode;
}) {
  return (
    <span className={`badge ${color}`}>
      <span className="swatch" />
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge color={priorityColor(priority)}>{priority}</Badge>;
}

export function StatusBadge({
  status,
  issueType,
}: {
  status: TrapStatus | null;
  issueType?: IssueType | null;
}) {
  if (status === null) return <Badge color="gray">No PM</Badge>;
  if (status === "Issue")
    return <Badge color="red">{issueType ? `Issue · ${issueType}` : "Issue"}</Badge>;
  return <Badge color="green">Working</Badge>;
}
