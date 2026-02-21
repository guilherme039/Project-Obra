import { activityLogService } from "./api";
import { ActivityLog } from "@/types/erp";

export type { ActivityLog };

export function addLog(log: Omit<ActivityLog, "id" | "timestamp">): void {
  // Fire and forget - backend handles ID and timestamp
  activityLogService.create(log).catch(() => {});
}

// Re-export async service if needed
export const activityLogServiceAsync = activityLogService;
