"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendIndicator } from "./trend-indicator";

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: LucideIcon;
    trend?: number;
    trendLabel?: string;
    className?: string;
    description?: string;
}

export function StatCard({ title, value, icon: Icon, trend, trendLabel, className, description }: StatCardProps) {
    return (
        <div className={cn("bg-card border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300", className)}>
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
                </div>
                {Icon && (
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>

            {(trend !== undefined || description) && (
                <div className="mt-4 flex items-center gap-2">
                    {trend !== undefined && (
                        <TrendIndicator value={trend} label={trendLabel} />
                    )}
                    {description && (
                        <p className="text-xs text-muted-foreground">{description}</p>
                    )}
                </div>
            )}
        </div>
    );
}
