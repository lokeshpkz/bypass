"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Calendar,
  Activity,
} from "lucide-react";
import { GetActivityLogsResponse } from "@/types/api";
import { ActivityAction } from "@/types/activity-log";

interface ActivityLogPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const actionConfig: Record<
  ActivityAction,
  { icon: typeof Plus; color: string; bgColor: string; label: string }
> = {
  create: {
    icon: Plus,
    color: "text-success",
    bgColor: "bg-success/10",
    label: "Created",
  },
  update: {
    icon: Pencil,
    color: "text-primary",
    bgColor: "bg-primary/10",
    label: "Updated",
  },
  delete: {
    icon: Trash2,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    label: "Deleted",
  },
  bulk_update: {
    icon: Users,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    label: "Bulk Updated",
  },
  bulk_delete: {
    icon: Trash2,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    label: "Bulk Deleted",
  },
};

export function ActivityLogPanel({
  open,
  onOpenChange,
}: ActivityLogPanelProps) {
  const { data, isLoading } = useQuery<GetActivityLogsResponse>({
    queryKey: ["activity-logs"],
    queryFn: async () => {
      const response = await fetch("/api/activity-logs?limit=50");
      if (!response.ok) throw new Error("Failed to fetch activity logs");
      return response.json();
    },
    enabled: open,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
          </SheetTitle>
          <SheetDescription>
            Recent changes and actions performed on subscriptions
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isLoading ? (
            // Loading skeleton
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.logs && data.logs.length > 0 ? (
            // Activity timeline
            <div className="relative space-y-6">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

              {data.logs.map((log) => {
                const config = actionConfig[log.action];
                const Icon = config.icon;
                const targetUids = Array.isArray(log.target_uid)
                  ? log.target_uid
                  : [log.target_uid];

                return (
                  <div key={log._id.toString()} className="relative flex gap-3">
                    {/* Icon */}
                    <div
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}
                    >
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1 pb-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {config.label}
                            {targetUids.length > 1
                              ? ` ${targetUids.length} subscriptions`
                              : " subscription"}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {targetUids.slice(0, 3).map((uid, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="font-mono text-xs"
                              >
                                {uid}
                              </Badge>
                            ))}
                            {targetUids.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{targetUids.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Changes */}
                      {log.changes && log.changes.length > 0 && (
                        <div className="mt-2 space-y-1 rounded-md bg-muted/50 p-2 text-xs">
                          {log.changes.map((change, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="font-medium">{change.field}:</span>
                              <span className="text-muted-foreground">
                                {String(change.old_value)}
                              </span>
                              <span>→</span>
                              <span className="font-medium">
                                {String(change.new_value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(log.timestamp), {
                            addSuffix: true,
                          })}
                        </span>
                        <span>by {log.admin_user}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Empty state
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm font-medium">No activity yet</p>
              <p className="text-xs text-muted-foreground">
                Actions will appear here as they happen
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
