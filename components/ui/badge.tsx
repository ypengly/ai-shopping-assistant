import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "outline" | "success" | "destructive" | "accent" }) {
  const styles: Record<string, string> = {
    default: "bg-primary text-primary-foreground",
    outline: "border border-input bg-background text-foreground",
    success: "bg-emerald-600 text-white dark:bg-emerald-500",
    destructive: "bg-destructive text-destructive-foreground",
    accent: "bg-accent text-accent-foreground",
  };
  return (
    <span
      className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", styles[variant], className)}
      {...props}
    />
  );
}
