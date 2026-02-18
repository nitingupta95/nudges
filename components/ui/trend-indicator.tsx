"use client";

import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendIndicatorProps {
    value: number;
    direction?: "up" | "down" | "neutral";
    label?: string;
    className?: string;
}

export function TrendIndicator({ value, direction, label, className }: TrendIndicatorProps) {
    // Auto-detect direction if not provided
    const derivedDirection = direction || (value > 0 ? "up" : value < 0 ? "down" : "neutral");
    const absValue = Math.abs(value);

    const styles = {
        up: "text-[var(--success)] bg-[var(--success)]/10",
        down: "text-[var(--destructive)] bg-[var(--destructive)]/10",
        neutral: "text-[var(--muted-foreground)] bg-[var(--muted)]",
    };

    const Icon = {
        up: ArrowUp,
        down: ArrowDown,
        neutral: Minus,
    }[derivedDirection];

    return (
        <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium", styles[derivedDirection], className)}>
            <Icon className="w-3 h-3" />
            <span>{derivedDirection === "neutral" ? "0%" : `${absValue}%`}</span>
            {label && <span className="opacity-80 ml-0.5">{label}</span>}
        </div>
    );
}
