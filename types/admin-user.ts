import { ObjectId } from "mongodb";

export interface AdminUser {
  _id: ObjectId;
  username: string;
  password_hash: string;
  created_at: Date;
  last_login: Date;
}

export interface CreateAdminUserInput {
  username: string;
  password: string;
}
