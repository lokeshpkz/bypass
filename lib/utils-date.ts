export function calculateDaysRemaining(expiryDate: string): number {
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function isExpired(expiryDate: string): boolean {
  return calculateDaysRemaining(expiryDate) < 0;
}

export function isExpiringSoon(expiryDate: string): boolean {
  const days = calculateDaysRemaining(expiryDate);
  return days >= 0 && days <= 7;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getDaysRemainingColor(days: number): string {
  if (days < 0) return "text-destructive";
  if (days <= 7) return "text-orange-500";
  if (days <= 30) return "text-yellow-500";
  return "text-success";
}
