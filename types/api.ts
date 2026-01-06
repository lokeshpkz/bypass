import { Subscription, SubscriptionStats } from "./subscription";
import { ActivityLog } from "./activity-log";

// Common API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Authentication API types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    username: string;
  };
}

export interface SessionResponse {
  isAuthenticated: boolean;
  user?: {
    username: string;
  };
}

// Subscription API types
export interface GetSubscriptionsRequest {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "inactive" | "all";
  dateFrom?: string;
  dateTo?: string;
}

export interface GetSubscriptionsResponse {
  subscriptions: Subscription[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateSubscriptionRequest {
  uid: string;
  expiry_date: string;
  status: "active" | "inactive";
}

export interface UpdateSubscriptionRequest {
  expiry_date?: string;
  status?: "active" | "inactive";
}

export interface BulkDeleteRequest {
  ids: string[];
}

export interface BulkDeleteResponse {
  success: boolean;
  deletedCount: number;
  message?: string;
}

export interface BulkUpdateRequest {
  ids: string[];
  updates: {
    status?: "active" | "inactive";
    extend_days?: number;
  };
}

export interface BulkUpdateResponse {
  success: boolean;
  updatedCount: number;
  message?: string;
}

export interface ExportRequest {
  format: "csv" | "excel";
  filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

export interface ImportResponse {
  success: boolean;
  imported: number;
  errors?: {
    row: number;
    message: string;
  }[];
}

// Activity Log API types
export interface GetActivityLogsRequest {
  limit?: number;
}

export interface GetActivityLogsResponse {
  logs: ActivityLog[];
}

// Stats API types
export type GetStatsResponse = SubscriptionStats;

// User UID API Types
export interface UserUIDResponse {
  uid: string;
  expiry_date: string;
  status: "active" | "inactive";
  created_at: Date;
}

export interface AddUIDRequest {
  uid: string;
}

export interface ResourceResponse {
  downloadUrl: string;
  tutorials: {
    id: string;
    title: string;
    url: string;
    type: "youtube" | "pdf" | "link";
  }[];
}
