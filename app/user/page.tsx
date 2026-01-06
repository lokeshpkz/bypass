import { UIDManager } from "@/components/user/uid-manager";

export default function UserDashboard() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Manage your UID and subscription status.
                </p>
            </div>

            <div className="max-w-2xl">
                <UIDManager />
            </div>
        </div>
    );
}
