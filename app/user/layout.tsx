import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { UserSidebar, MobileSidebar } from "@/components/user/user-sidebar";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";

export default async function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getIronSession<SessionData>(
        await cookies(),
        sessionOptions
    );

    if (!session.user || !session.user.isLoggedIn || session.user.role !== 'user') {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-background">
            <UserSidebar user={{ username: session.user.username, avatar: session.user.avatar }} />

            <main className="pl-0 md:pl-72 transition-all">
                {/* Mobile Header / Desktop Header */}
                <div className="h-16 flex items-center justify-between md:justify-end px-4 md:px-8 border-b md:border-none sticky top-0 z-40 bg-background/80 backdrop-blur-md">

                    {/* Mobile Menu Trigger */}
                    <div className="md:hidden">
                        <MobileSidebar user={{ username: session.user.username, avatar: session.user.avatar }} />
                    </div>

                    <ThemeToggle />
                </div>

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
