"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { UserUIDResponse } from "@/types/api";
import { Trash2, AlertCircle, CheckCircle, Clock, Shield, Key } from "lucide-react";
import { format } from "date-fns";

export function UIDManager() {
    const [uidData, setUidData] = useState<UserUIDResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [inputUid, setInputUid] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchUid = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/user/uid");
            const data = await res.json();
            if (data.success) {
                setUidData(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUid();
    }, []);

    const handleAddUid = async () => {
        if (!inputUid.trim()) return;
        setError("");
        setSuccess("");

        try {
            const res = await fetch("/api/user/uid", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid: inputUid }),
            });
            const data = await res.json();

            if (data.success) {
                setSuccess("UID added successfully!");
                fetchUid();
            } else {
                setError(data.message || "Failed to add UID");
            }
        } catch (err) {
            setError("An error occurred");
        }
    };

    const handleDeleteUid = async () => {
        if (!confirm("Are you sure you want to delete your UID?")) return;
        setError("");
        setSuccess("");

        try {
            const res = await fetch("/api/user/uid", {
                method: "DELETE",
            });
            const data = await res.json();

            if (data.success) {
                setUidData(null);
                setInputUid("");
                setSuccess("UID deleted successfully");
            } else {
                setError(data.message || "Failed to delete UID");
            }
        } catch (err) {
            setError("An error occurred");
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading secure data...</div>;
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-3 border border-destructive/20">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}
            {success && (
                <div className="bg-green-500/10 text-green-600 p-4 rounded-lg flex items-center gap-3 border border-green-500/20">
                    <CheckCircle className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-medium">{success}</p>
                </div>
            )}

            {!uidData ? (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Key className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-xl">Link Device</CardTitle>
                        </div>
                        <CardDescription className="text-base">
                            Enter your unique device identifier to activate your license.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Input
                                placeholder="Enter UID (e.g. DEVICE-XY-88)"
                                value={inputUid}
                                onChange={(e) => setInputUid(e.target.value)}
                                className="h-12 font-mono"
                            />
                            <Button
                                onClick={handleAddUid}
                                className="h-12 px-8"
                            >
                                Activate License
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4 flex items-center gap-2">
                            <Shield className="h-3 w-3" />
                            Secure connection active. Your UID is encrypted.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                    <Shield className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Active License</CardTitle>
                                    <CardDescription>Securely linked to your Discord</CardDescription>
                                </div>
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${uidData.status === 'active'
                                ? 'bg-green-500/10 border-green-500/20 text-green-600'
                                : 'bg-destructive/10 border-destructive/20 text-destructive'
                                }`}>
                                <div className={`w-2 h-2 rounded-full ${uidData.status === 'active' ? 'bg-green-500' : 'bg-destructive'}`} />
                                {uidData.status}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="p-6 rounded-xl bg-card border">
                            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-semibold">Device UID</p>
                            <p className="text-2xl sm:text-3xl font-mono font-bold tracking-widest text-foreground">
                                {uidData.uid}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-card border">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <Clock className="h-4 w-4" />
                                    <span className="text-xs font-medium uppercase">Expires On</span>
                                </div>
                                <p className="text-lg font-semibold">
                                    {format(new Date(uidData.expiry_date), "PP")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {Math.ceil((new Date(uidData.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-card border flex flex-col justify-between">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium uppercase text-muted-foreground">Manage Expiry</span>
                                </div>
                                <Input
                                    type="date"
                                    className="h-9 text-sm bg-background"
                                    onChange={(e) => {
                                        const date = e.target.value;
                                        if (date && confirm("Update expiry date to " + date + "?")) {
                                            fetch("/api/user/uid", {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ expiry_date: date })
                                            })
                                                .then(async res => {
                                                    if (res.ok) {
                                                        setSuccess("Expiry updated");
                                                        fetchUid();
                                                    } else {
                                                        const d = await res.json();
                                                        setError(d.message || "Failed to update");
                                                    }
                                                })
                                                .catch(() => setError("Error updating"));
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="pt-4 border-t">
                        <Button
                            variant="ghost"
                            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={handleDeleteUid}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Unlink Device
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
