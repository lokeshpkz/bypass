import { ObjectId } from "mongodb";

export type ActivityAction =
  | "create"
  | "update"
  | "delete"
  | "bulk_update"
  | "bulk_delete";

export interface ActivityLogChange {
  field: string;
  old_value: any;
  new_value: any;
}

export interface ActivityLog {
  _id: ObjectId;
  timestamp: Date;
  admin_user: string;
  action: ActivityAction;
  target_uid: string | string[];
  changes?: ActivityLogChange[];
  ip_address: string;
}

export interface CreateActivityLogInput {
  admin_user: string;
  action: ActivityAction;
  target_uid: string | string[];
  changes?: ActivityLogChange[];
  ip_address: string;
}
