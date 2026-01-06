"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { Subscription } from "@/types/subscription";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pencil,
  Trash2,
  MoreVertical,
  ArrowUpDown,
  Calendar,
} from "lucide-react";
import { calculateDaysRemaining, getDaysRemainingColor } from "@/lib/utils-date";

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onEdit: (subscription: Subscription) => void;
  onDelete: (subscription: Subscription) => void;
  onExtend: (subscription: Subscription, days: number) => void;
}

export function SubscriptionTable({
  subscriptions,
  selectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
  onExtend,
}: SubscriptionTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Subscription>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "uid",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            UID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue("uid")}</div>
      ),
    },
    {
      accessorKey: "expiry_date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Expiry Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("expiry_date") as string;
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{date}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            variant={status === "active" ? "default" : "destructive"}
            className={
              status === "active"
                ? "bg-success hover:bg-success/80"
                : ""
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      id: "days_remaining",
      header: "Days Remaining",
      cell: ({ row }) => {
        const expiryDate = row.getValue("expiry_date") as string;
        const days = calculateDaysRemaining(expiryDate);
        const colorClass = getDaysRemainingColor(days);

        return (
          <div className={`font-semibold ${colorClass}`}>
            {days < 0 ? `Expired ${Math.abs(days)} days ago` : `${days} days`}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const subscription = row.original;

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(subscription)}
              aria-label="Edit subscription"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(subscription)}
              aria-label="Delete subscription"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="More actions">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onExtend(subscription, 30)}>
                  Extend by 30 days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExtend(subscription, 90)}>
                  Extend by 90 days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExtend(subscription, 365)}>
                  Extend by 1 year
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: subscriptions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
      rowSelection: subscriptions.reduce(
        (acc, sub) => {
          acc[sub._id.toString()] = selectedIds.includes(sub._id.toString());
          return acc;
        },
        {} as Record<string, boolean>
      ),
    },
    onRowSelectionChange: (updater) => {
      const newSelection =
        typeof updater === "function"
          ? updater(
              subscriptions.reduce(
                (acc, sub) => {
                  acc[sub._id.toString()] = selectedIds.includes(
                    sub._id.toString()
                  );
                  return acc;
                },
                {} as Record<string, boolean>
              )
            )
          : updater;

      const newSelectedIds = Object.keys(newSelection).filter(
        (key) => newSelection[key]
      );
      onSelectionChange(newSelectedIds);
    },
    getRowId: (row) => row._id.toString(),
  });

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden w-full rounded-md border md:block">
        <div className="w-full overflow-x-auto">
          <Table className="w-full min-w-[800px]">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No subscriptions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-4 md:hidden">
        {subscriptions.length > 0 ? (
          subscriptions.map((subscription) => {
            const days = calculateDaysRemaining(subscription.expiry_date);
            const colorClass = getDaysRemainingColor(days);
            const isSelected = selectedIds.includes(
              subscription._id.toString()
            );

            return (
              <div
                key={subscription._id.toString()}
                className={`rounded-lg border p-4 ${isSelected ? "border-primary bg-primary/5" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onSelectionChange([
                            ...selectedIds,
                            subscription._id.toString(),
                          ]);
                        } else {
                          onSelectionChange(
                            selectedIds.filter(
                              (id) => id !== subscription._id.toString()
                            )
                          );
                        }
                      }}
                      aria-label="Select subscription"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="font-mono text-sm font-semibold">
                        {subscription.uid}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            subscription.status === "active"
                              ? "default"
                              : "destructive"
                          }
                          className={
                            subscription.status === "active"
                              ? "bg-success hover:bg-success/80"
                              : ""
                          }
                        >
                          {subscription.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          <Calendar className="mr-1 inline h-3 w-3" />
                          {subscription.expiry_date}
                        </span>
                      </div>
                      <div className={`text-sm font-semibold ${colorClass}`}>
                        {days < 0
                          ? `Expired ${Math.abs(days)} days ago`
                          : `${days} days remaining`}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="More actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(subscription)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(subscription)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onExtend(subscription, 30)}
                      >
                        Extend by 30 days
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onExtend(subscription, 90)}
                      >
                        Extend by 90 days
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onExtend(subscription, 365)}
                      >
                        Extend by 1 year
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            No subscriptions found.
          </div>
        )}
      </div>
    </>
  );
}
