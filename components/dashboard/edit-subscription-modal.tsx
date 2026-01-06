"use client";

import { useState, useEffect } from "react";
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
import { updateSubscriptionSchema } from "@/lib/validation";
import { Subscription } from "@/types/subscription";

type FormData = z.infer<typeof updateSubscriptionSchema>;

interface EditSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
  onSuccess: () => void;
}

export function EditSubscriptionModal({
  open,
  onOpenChange,
  subscription,
  onSuccess,
}: EditSubscriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(updateSubscriptionSchema),
  });

  const status = watch("status");

  useEffect(() => {
    if (subscription) {
      setValue("expiry_date", subscription.expiry_date);
      setValue("status", subscription.status);
    }
  }, [subscription, setValue]);

  const onSubmit = async (data: FormData) => {
    if (!subscription) return;

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/subscriptions/${subscription._id.toString()}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Subscription updated successfully",
        });
        reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: result.error?.message || "Failed to update subscription",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating the subscription",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!subscription) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Subscription</DialogTitle>
          <DialogDescription>
            Update the subscription details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="uid">UID</Label>
            <Input
              id="uid"
              value={subscription.uid}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              UID cannot be changed
            </p>
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
              className={dirtyFields.expiry_date ? "border-primary" : ""}
            />
            {errors.expiry_date && (
              <p className="text-sm text-destructive">
                {errors.expiry_date.message}
              </p>
            )}
            {dirtyFields.expiry_date && (
              <p className="text-sm text-primary">Field has been modified</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">
              Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={status}
              onValueChange={(value) =>
                setValue("status", value as "active" | "inactive", {
                  shouldDirty: true,
                })
              }
              disabled={isLoading}
            >
              <SelectTrigger
                id="status"
                className={dirtyFields.status ? "border-primary" : ""}
              >
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
            {dirtyFields.status && (
              <p className="text-sm text-primary">Field has been modified</p>
            )}
          </div>

          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="text-muted-foreground">
              Last updated:{" "}
              {new Date(subscription.updated_at).toLocaleString()}
            </p>
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
              {isLoading ? "Updating..." : "Update Subscription"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
