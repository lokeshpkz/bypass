"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Youtube, FileText, Link as LinkIcon } from "lucide-react";
import { ResourceResponse } from "@/types/api";

export default function TutorialsPage() {
    const [tutorials, setTutorials] = useState<ResourceResponse['tutorials']>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/user/resources")
            .then((res) => res.json())
            .then((res) => {
                if (res.success && res.data) setTutorials(res.data.tutorials);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Loading...</div>;

    const getIcon = (type: string) => {
        switch (type) {
            case 'youtube': return <Youtube className="h-5 w-5 text-red-500" />;
            case 'pdf': return <FileText className="h-5 w-5 text-orange-500" />;
            default: return <LinkIcon className="h-5 w-5 text-blue-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Tutorials</h1>
                <p className="text-muted-foreground">
                    Learn how to use the tool and troubleshoot issues.
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {tutorials.map((tutorial) => (
                    <Card key={tutorial.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                                {getIcon(tutorial.type)}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <p className="text-sm text-muted-foreground">
                                {tutorial.type === 'youtube' ? 'Video Tutorial' : tutorial.type.toUpperCase() + ' Guide'}
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full" asChild>
                                <a href={tutorial.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    View Tutorial
                                </a>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
                {tutorials.length === 0 && (
                    <p className="text-muted-foreground">No tutorials available at the moment.</p>
                )}
            </div>
        </div>
    );
}
