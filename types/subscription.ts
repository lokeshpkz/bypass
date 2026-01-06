import { ObjectId } from "mongodb";

export interface Subscription {
  _id: ObjectId;
  uid: string;
  discord_id?: string; // Optional, links to Discord User
  expiry_date: string; // YYYY-MM-DD format
  status: "active" | "inactive";
  created_at: Date;
  updated_at: Date;
}

export interface CreateSubscriptionInput {
  uid: string;
  expiry_date: string;
  status: "active" | "inactive";
}

export interface UpdateSubscriptionInput {
  expiry_date?: string;
  status?: "active" | "inactive";
}

export interface SubscriptionStats {
  total: number;
  active: number;
  inactive: number;
  expired: number;
  expiring_soon: number;
}

export interface SubscriptionFilters {
  search?: string;
  status?: "all" | "active" | "inactive";
  dateFrom?: string;
  dateTo?: string;
}
