import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function ProfilePage() {
    const session = await getIronSession<SessionData>(
        await cookies(),
        sessionOptions
    );

    const user = session.user;

    if (!user) return null;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                <p className="text-muted-foreground">
                    View your account details.
                </p>
            </div>

            <Card className="max-w-xl">
                <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={user.avatar} alt={user.username} />
                        <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-2xl">{user.username}</CardTitle>
                        <CardDescription>Discord User</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Role</p>
                            <p>{user.role?.toUpperCase()}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">User ID</p>
                            <p className="text-sm font-mono truncate">{user.id}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
