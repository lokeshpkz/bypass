"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { StatisticsCards } from "@/components/dashboard/statistics-cards";
import { SearchAndFilters } from "@/components/dashboard/search-and-filters";
import { SubscriptionTable } from "@/components/dashboard/subscription-table";
import { AddSubscriptionModal } from "@/components/dashboard/add-subscription-modal";
import { EditSubscriptionModal } from "@/components/dashboard/edit-subscription-modal";
import { DeleteConfirmDialog } from "@/components/dashboard/delete-confirm-dialog";
import { BulkActionsBar } from "@/components/dashboard/bulk-actions-bar";
import { ActivityLogPanel } from "@/components/dashboard/activity-log-panel";
import { Plus, RefreshCw, Activity } from "lucide-react";
import { Subscription, SubscriptionFilters } from "@/types/subscription";
import { GetSubscriptionsResponse } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const [filters, setFilters] = useState<SubscriptionFilters>({
    search: "",
    status: "all",
    dateFrom: "",
    dateTo: "",
  });
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubscription, setEditingSubscription] =
    useState<Subscription | null>(null);
  const [deletingSubscription, setDeletingSubscription] =
    useState<Subscription | null>(null);
  const [showActivityLog, setShowActivityLog] = useState(false);

  const { toast } = useToast();

  const {
    data: subscriptionsData,
    isLoading,
    refetch,
  } = useQuery<GetSubscriptionsResponse>({
    queryKey: ["subscriptions", filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (filters.search) params.append("search", filters.search);
      if (filters.status && filters.status !== "all")
        params.append("status", filters.status);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);

      const response = await fetch(`/api/subscriptions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch subscriptions");
      return response.json();
    },
  });

  const handleExtend = async (subscription: Subscription, days: number) => {
    try {
      const response = await fetch(
        `/api/subscriptions/${subscription._id.toString()}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            expiry_date: new Date(
              new Date(subscription.expiry_date).getTime() +
                days * 24 * 60 * 60 * 1000
            )
              .toISOString()
              .split("T")[0],
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: `Extended subscription by ${days} days`,
        });
        refetch();
      } else {
        toast({
          title: "Error",
          description: "Failed to extend subscription",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleSuccess = () => {
    refetch();
    setSelectedIds([]);
  };

  return (
    <div className="w-full space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Manage and monitor subscription data
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowActivityLog(true)}
            aria-label="View activity log"
            className="shrink-0"
          >
            <Activity className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            aria-label="Refresh data"
            className="shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Subscription</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <StatisticsCards />

      {/* Search and Filters */}
      <SearchAndFilters filters={filters} onFiltersChange={setFilters} />

      {/* Table */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Loading subscriptions...
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground sm:text-sm">
                Showing {subscriptionsData?.subscriptions.length || 0} of{" "}
                {subscriptionsData?.total || 0} subscriptions
              </p>
              {subscriptionsData && subscriptionsData.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-2 text-xs sm:px-3 sm:text-sm">
                    Page {page} of {subscriptionsData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= subscriptionsData.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>

            <SubscriptionTable
              subscriptions={subscriptionsData?.subscriptions || []}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onEdit={setEditingSubscription}
              onDelete={setDeletingSubscription}
              onExtend={handleExtend}
            />
          </>
        )}
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        selectedIds={selectedIds}
        onSuccess={handleSuccess}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* Modals */}
      <AddSubscriptionModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={handleSuccess}
      />

      <EditSubscriptionModal
        open={!!editingSubscription}
        onOpenChange={(open) => !open && setEditingSubscription(null)}
        subscription={editingSubscription}
        onSuccess={handleSuccess}
      />

      <DeleteConfirmDialog
        open={!!deletingSubscription}
        onOpenChange={(open) => !open && setDeletingSubscription(null)}
        subscription={deletingSubscription}
        onSuccess={handleSuccess}
      />

      <ActivityLogPanel
        open={showActivityLog}
        onOpenChange={setShowActivityLog}
      />
    </div>
  );
}
