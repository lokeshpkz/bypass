import { z } from "zod";

// Login validation
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Subscription validation
export const createSubscriptionSchema = z.object({
  uid: z
    .string()
    .min(1, "UID is required")
    .max(100, "UID must be less than 100 characters"),
  expiry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  status: z
    .enum(["active", "inactive"])
    .refine((val) => val === "active" || val === "inactive", {
      message: "Status must be active or inactive",
    }),
});

export const updateSubscriptionSchema = z.object({
  expiry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

// Bulk operations validation
export const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID is required"),
});

export const bulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID is required"),
  updates: z.object({
    status: z.enum(["active", "inactive"]).optional(),
    extend_days: z.number().int().positive().optional(),
  }),
});

// Export/Import validation
export const exportSchema = z.object({
  format: z.enum(["csv", "excel"]),
  filters: z
    .object({
      status: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    })
    .optional(),
});
