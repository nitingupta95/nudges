"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TimelineItemProps {
    title: string;
    description?: string;
    timestamp: string;
    icon?: LucideIcon;
    avatarSrc?: string;
    status?: "default" | "success" | "warning" | "error";
    isLast?: boolean;
    className?: string;
}

export function TimelineItem({
    title,
    description,
    timestamp,
    icon: Icon,
    avatarSrc,
    status = "default",
    isLast = false,
    className
}: TimelineItemProps) {
    const statusColors = {
        default: "bg-muted text-muted-foreground border-border",
        success: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
        warning: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
        error: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    };

    return (
        <div className={cn("relative flex gap-4 pb-8", isLast && "pb-0", className)}>
            {!isLast && (
                <span
                    className="absolute top-8 left-5 -ml-px h-full w-0.5 bg-border"
                    aria-hidden="true"
                />
            )}

            <div className="relative flex h-10 w-10 flex-none items-center justify-center rounded-full bg-background ring-1 ring-border shadow-sm z-10">
                {avatarSrc ? (
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={avatarSrc} />
                        <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                ) : Icon ? (
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full border", statusColors[status])}>
                        <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                ) : (
                    <div className="h-2 w-2 rounded-full bg-muted-foreground ring-4 ring-background" />
                )}
            </div>

            <div className="flex-auto py-0.5">
                <div className="flex justify-between gap-x-4">
                    <h3 className="text-sm font-medium leading-6 text-foreground">{title}</h3>
                    <time className="flex-none text-xs text-muted-foreground self-center">{timestamp}</time>
                </div>
                {description && (
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                )}
            </div>
        </div>
    );
}
