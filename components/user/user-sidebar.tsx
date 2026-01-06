"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Download,
    BookOpen,
    User,
    LogOut,
    Menu,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SidebarProps {
    user: {
        username: string;
        avatar?: string;
    };
}

function SidebarContent({ user, onClick }: SidebarProps & { onClick?: () => void }) {
    const pathname = usePathname();

    const routes = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: "/user",
            active: pathname === "/user",
        },
        {
            label: "Profile",
            icon: User,
            href: "/user/profile",
            active: pathname === "/user/profile",
        },
        {
            label: "Download",
            icon: Download,
            href: "/user/download",
            active: pathname === "/user/download",
        },
        {
            label: "Tutorials",
            icon: BookOpen,
            href: "/user/tutorials",
            active: pathname === "/user/tutorials",
        },
    ];

    return (
        <div className="flex bg-card h-full flex-col border-r border-border">
            {/* Logo / Header */}
            <div className="p-8 pb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
                        <span className="text-xl font-bold text-primary-foreground">X</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-xl tracking-tight text-foreground">Hybrid Kodr</h1>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Subscription Tool</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-none">
                <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Menu</p>
                {routes.map((route) => (
                    <Link
                        key={route.href}
                        href={route.href}
                        onClick={onClick}
                        className={cn(
                            "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                            route.active
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        <route.icon className={cn(
                            "h-5 w-5 transition-colors",
                            route.active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )} />
                        {route.label}
                    </Link>
                ))}
            </div>

            {/* User Profile */}
            <div className="p-4 border-t border-border bg-muted/30">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border hover:bg-muted transition-colors group cursor-pointer">
                    <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={user.avatar} alt={user.username} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                            {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold text-foreground truncate">
                            {user.username}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <p className="text-xs text-muted-foreground">Online</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            fetch("/api/auth/logout", { method: "POST" }).then(() => {
                                window.location.href = "/login";
                            });
                        }}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                        title="Logout"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export function UserSidebar({ user }: SidebarProps) {
    return (
        <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-72 z-50 transition-all duration-300">
            <SidebarContent user={user} />
        </div>
    );
}

export function MobileSidebar({ user }: SidebarProps) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden" size="icon">
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-r w-72">
                <SidebarContent user={user} onClick={() => setOpen(false)} />
            </SheetContent>
        </Sheet>
    );
}
