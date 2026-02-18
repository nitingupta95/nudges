"use client";

import { cn } from "@/lib/utils";
import { Bell, Info, CheckCircle, AlertTriangle, XCircle, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export type NotificationType = "default" | "info" | "success" | "warning" | "error";

interface NotificationItemProps {
    title: string;
    message: string;
    type?: NotificationType;
    timestamp?: string;
    read?: boolean;
    onRead?: () => void;
    onDismiss?: () => void;
    actions?: {
        label: string;
        onClick: () => void;
        variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
    }[];
    className?: string;
}

export function NotificationItem({
    title,
    message,
    type = "default",
    timestamp,
    read = false,
    onRead,
    onDismiss,
    actions,
    className
}: NotificationItemProps) {

    const typeConfig = {
        default: { icon: Bell, color: "text-foreground", bg: "bg-background" },
        info: { icon: Info, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/20" },
        success: { icon: CheckCircle, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/20" },
        warning: { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/20" },
        error: { icon: XCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/20" },
    };

    const config = typeConfig[type];
    const Icon = config.icon;

    return (
        <div
            className={cn(
                "relative flex gap-4 p-4 rounded-lg border transition-all duration-200",
                read ? "bg-background opacity-70" : "bg-card shadow-sm border-l-4",
                !read && type === "default" ? "border-l-primary" :
                    !read && type === "info" ? "border-l-blue-500" :
                        !read && type === "success" ? "border-l-green-500" :
                            !read && type === "warning" ? "border-l-amber-500" :
                                !read && type === "error" ? "border-l-red-500" : "",
                className
            )}
            onClick={onRead}
        >
            <div className={cn("mt-1", config.color)}>
                <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                    <h4 className={cn("text-sm font-semibold", read ? "text-muted-foreground" : "text-foreground")}>
                        {title}
                    </h4>
                    {timestamp && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {timestamp}
                        </span>
                    )}
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                    {message}
                </p>

                {actions && actions.length > 0 && (
                    <div className="flex gap-2 mt-3">
                        {actions.map((action, index) => (
                            <Button
                                key={index}
                                variant={action.variant || "outline"}
                                size="sm"
                                className="h-8 text-xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick();
                                }}
                            >
                                {action.label}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            {!read && (
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            )}
        </div>
    );
}
