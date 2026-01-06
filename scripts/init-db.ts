import dotenv from "dotenv";

// Load environment variables FIRST before any other imports
dotenv.config({ path: ".env.local" });

import { getDatabase, COLLECTIONS } from "../lib/mongodb";
import bcrypt from "bcryptjs";

async function initializeDatabase() {
  try {
    console.log("Starting database initialization...");

    const db = await getDatabase();

    // Create subscriptions collection with indexes
    console.log("Creating subscriptions collection...");
    const subscriptionsExists = await db
      .listCollections({ name: COLLECTIONS.SUBSCRIPTIONS })
      .hasNext();

    if (!subscriptionsExists) {
      await db.createCollection(COLLECTIONS.SUBSCRIPTIONS);
    }

    // Create indexes for subscriptions
    await db.collection(COLLECTIONS.SUBSCRIPTIONS).createIndex(
      { uid: 1 },
      { unique: true }
    );
    await db.collection(COLLECTIONS.SUBSCRIPTIONS).createIndex({
      expiry_date: 1,
    });
    await db.collection(COLLECTIONS.SUBSCRIPTIONS).createIndex({ status: 1 });
    await db.collection(COLLECTIONS.SUBSCRIPTIONS).createIndex({
      created_at: -1,
    });

    console.log("✓ Subscriptions collection and indexes created");

    // Create activityLogs collection with indexes
    console.log("Creating activityLogs collection...");
    const activityLogsExists = await db
      .listCollections({ name: COLLECTIONS.ACTIVITY_LOGS })
      .hasNext();

    if (!activityLogsExists) {
      await db.createCollection(COLLECTIONS.ACTIVITY_LOGS);
    }

    // Create index for activity logs
    await db.collection(COLLECTIONS.ACTIVITY_LOGS).createIndex({
      timestamp: -1,
    });
    await db.collection(COLLECTIONS.ACTIVITY_LOGS).createIndex({
      admin_user: 1,
    });

    console.log("✓ ActivityLogs collection and indexes created");

    // Create adminUsers collection with indexes
    console.log("Creating adminUsers collection...");
    const adminUsersExists = await db
      .listCollections({ name: COLLECTIONS.ADMIN_USERS })
      .hasNext();

    if (!adminUsersExists) {
      await db.createCollection(COLLECTIONS.ADMIN_USERS);
    }

    // Create unique index on username
    await db.collection(COLLECTIONS.ADMIN_USERS).createIndex(
      { username: 1 },
      { unique: true }
    );

    console.log("✓ AdminUsers collection and indexes created");

    // Create default admin user if not exists
    console.log("Checking for admin user...");
    const existingAdmin = await db
      .collection(COLLECTIONS.ADMIN_USERS)
      .findOne({ username: "nsggolu" });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash("coderyn8989", 10);

      await db.collection(COLLECTIONS.ADMIN_USERS).insertOne({
        username: "nsggolu",
        password_hash: passwordHash,
        created_at: new Date(),
        last_login: new Date(),
      });

      console.log("✓ Admin user created");
      console.log("  Username: nsggolu");
      console.log("  Password: coderyn8989");
    } else {
      console.log("✓ Admin user already exists");
    }

    console.log("\n✅ Database initialization completed successfully!");
    console.log("\nYou can now start the application with: npm run dev");

    process.exit(0);
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

initializeDatabase();
