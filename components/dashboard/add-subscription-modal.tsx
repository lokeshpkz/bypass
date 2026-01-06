"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createSubscriptionSchema } from "@/lib/validation";

type FormData = z.infer<typeof createSubscriptionSchema>;

interface AddSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddSubscriptionModal({
  open,
  onOpenChange,
  onSuccess,
}: AddSubscriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUID, setIsCheckingUID] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(createSubscriptionSchema),
    defaultValues: {
      status: "active",
    },
  });

  const status = watch("status");

  const checkUIDUniqueness = async (uid: string) => {
    if (!uid) return;

    setIsCheckingUID(true);
    try {
      const response = await fetch(
        `/api/subscriptions?search=${encodeURIComponent(uid)}&limit=1`
      );
      const data = await response.json();

      if (data.subscriptions && data.subscriptions.length > 0) {
        const exactMatch = data.subscriptions.find(
          (sub: { uid: string }) => sub.uid === uid
        );
        if (exactMatch) {
          toast({
            title: "UID already exists",
            description: "This UID is already in use. Please use a different one.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error checking UID:", error);
    } finally {
      setIsCheckingUID(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Subscription created successfully",
        });
        reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: result.error?.message || "Failed to create subscription",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while creating the subscription",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Subscription</DialogTitle>
          <DialogDescription>
            Create a new subscription by filling out the form below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="uid">
              UID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="uid"
              placeholder="Enter unique user ID"
              {...register("uid")}
              onBlur={(e) => checkUIDUniqueness(e.target.value)}
              disabled={isLoading}
            />
            {isCheckingUID && (
              <p className="text-sm text-muted-foreground">Checking UID...</p>
            )}
            {errors.uid && (
              <p className="text-sm text-destructive">{errors.uid.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry_date">
              Expiry Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="expiry_date"
              type="date"
              {...register("expiry_date")}
              disabled={isLoading}
            />
            {errors.expiry_date && (
              <p className="text-sm text-destructive">
                {errors.expiry_date.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">
              Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={status}
              onValueChange={(value) =>
                setValue("status", value as "active" | "inactive")
              }
              disabled={isLoading}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Subscription"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
