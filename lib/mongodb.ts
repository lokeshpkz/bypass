import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

if (!process.env.MONGODB_DB_NAME) {
  throw new Error("Please add your MongoDB database name to .env.local");
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;

interface MongoDBConnection {
  client: MongoClient;
  db: Db;
}

let cachedConnection: MongoDBConnection | null = null;

export async function connectToDatabase(): Promise<MongoDBConnection> {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const client = await MongoClient.connect(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    const db = client.db(dbName);

    cachedConnection = { client, db };

    console.log("Successfully connected to MongoDB");

    return cachedConnection;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw new Error("Database connection failed");
  }
}

export async function getDatabase(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}

export const COLLECTIONS = {
  SUBSCRIPTIONS: "subscriptions",
  ACTIVITY_LOGS: "activityLogs",
  ADMIN_USERS: "adminUsers",
  DISCORD_USERS: "discordUsers",
} as const;
