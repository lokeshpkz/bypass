"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, CheckCircle, XCircle, Calendar, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BulkActionsBarProps {
  selectedCount: number;
  selectedIds: string[];
  onSuccess: () => void;
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedCount,
  selectedIds,
  onSuccess,
  onClearSelection,
}: BulkActionsBarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();

  const handleBulkDelete = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/subscriptions/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: `Deleted ${result.deletedCount} subscription(s)`,
        });
        setShowDeleteConfirm(false);
        onClearSelection();
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete subscriptions",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting subscriptions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkUpdate = async (
    updates: { status?: "active" | "inactive"; extend_days?: number }
  ) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/subscriptions/bulk-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedIds, updates }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: `Updated ${result.updatedCount} subscription(s)`,
        });
        onClearSelection();
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update subscriptions",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating subscriptions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between sm:justify-start">
              <span className="text-sm font-medium">
                {selectedCount} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                disabled={isLoading}
                className="sm:hidden"
              >
                Clear
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkUpdate({ status: "active" })}
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                <CheckCircle className="mr-1 h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Set Active</span>
                <span className="sm:hidden">Active</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkUpdate({ status: "inactive" })}
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                <XCircle className="mr-1 h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Set Inactive</span>
                <span className="sm:hidden">Inactive</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isLoading} className="flex-1 sm:flex-none">
                    <Calendar className="mr-1 h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Extend Expiry</span>
                    <span className="sm:hidden">Extend</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleBulkUpdate({ extend_days: 30 })}
                  >
                    Extend by 30 days
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBulkUpdate({ extend_days: 90 })}
                  >
                    Extend by 90 days
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBulkUpdate({ extend_days: 365 })}
                  >
                    Extend by 1 year
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                <Trash2 className="mr-1 h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Delete Selected</span>
                <span className="sm:hidden">Delete</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                disabled={isLoading}
                className="hidden sm:inline-flex"
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>Delete Multiple Subscriptions</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Are you sure you want to delete {selectedCount} subscription(s)?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm font-medium">
              {selectedCount} subscription(s) will be permanently deleted.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
