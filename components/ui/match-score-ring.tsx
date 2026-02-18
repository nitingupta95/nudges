"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MatchScoreRingProps {
    score: number;
    size?: number;
    strokeWidth?: number;
    className?: string;
    showLabel?: boolean;
}

export function MatchScoreRing({
    score,
    size = 60,
    strokeWidth = 6,
    className,
    showLabel = true,
}: MatchScoreRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(Math.max(score, 0), 100);
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const getColor = (score: number) => {
        if (score >= 80) return "text-[var(--match-high)]";
        if (score >= 50) return "text-[var(--match-medium)]";
        return "text-[var(--match-low)]";
    };

    return (
        <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="transform -rotate-90"
            >
                {/* Background Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-muted/20"
                />
                {/* Progress Circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    className={cn(getColor(score), "transition-colors duration-300")}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{ strokeDasharray: circumference }}
                />
            </svg>
            {showLabel && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold">{score}%</span>
                </div>
            )}
        </div>
    );
}
