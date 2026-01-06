import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBaseUrl(requestUrl?: string): string {
  // Use the BASE_URL environment variable if set
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  
  // Fallback to the request URL if provided
  if (requestUrl) {
    return requestUrl;
  }
  
  // Default to localhost for development
  return "http://localhost:3000";
}
