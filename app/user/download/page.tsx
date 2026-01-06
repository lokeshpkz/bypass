"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download as DownloadIcon, ShieldCheck } from "lucide-react";
import { ResourceResponse } from "@/types/api";

export default function DownloadPage() {
    const [data, setData] = useState<ResourceResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/user/resources")
            .then((res) => res.json())
            .then((res) => {
                if (res.success) setData(res.data);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Downloads</h1>
                <p className="text-muted-foreground">
                    Securely download the latest version of the tool.
                </p>
            </div>

            <Card className="max-w-xl border-green-500/20 bg-green-500/5">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="text-green-500 h-6 w-6" />
                        <span className="text-sm font-medium text-green-500">Secure Download</span>
                    </div>
                    <CardTitle>Hybrid Kodr v1.0</CardTitle>
                    <CardDescription>
                        Latest stable release. Verified and safe.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Please ensure you have linked your UID in the dashboard before running the tool.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button className="w-full sm:w-auto" asChild>
                        <a href={data?.downloadUrl || "#"} target="_blank" rel="noopener noreferrer">
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            Download Now
                        </a>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
