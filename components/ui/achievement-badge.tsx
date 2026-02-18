"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon, Trophy, Star, Medal, Award } from "lucide-react";

interface AchievementBadgeProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    variant?: "bronze" | "silver" | "gold" | "platinum" | "default";
    size?: "sm" | "md" | "lg";
    className?: string;
    unlocked?: boolean;
}

export function AchievementBadge({
    title,
    description,
    icon: Icon = Trophy,
    variant = "default",
    size = "md",
    className,
    unlocked = true
}: AchievementBadgeProps) {

    const variantStyles = {
        bronze: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300",
        silver: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800/60 dark:text-slate-300",
        gold: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300",
        platinum: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-300",
        default: "bg-primary/10 text-primary border-primary/20",
    };

    const sizeStyles = {
        sm: "p-2 min-w-[120px]",
        md: "p-4 min-w-[160px]",
        lg: "p-6 min-w-[200px]",
    };

    const iconSizes = {
        sm: "w-6 h-6",
        md: "w-10 h-10",
        lg: "w-16 h-16",
    };

    return (
        <motion.div
            className={cn(
                "relative flex flex-col items-center justify-center text-center rounded-xl border-2 transition-all",
                unlocked ? variantStyles[variant] : "bg-muted text-muted-foreground border-muted-foreground/20 grayscale opacity-80",
                sizeStyles[size],
                className
            )}
            whileHover={unlocked ? { scale: 1.05, y: -5 } : {}}
            initial={unlocked ? { opacity: 0, scale: 0.9 } : {}}
            animate={{ opacity: 1, scale: 1 }}
        >
            <div className={cn("mb-3 rounded-full flex items-center justify-center", unlocked ? "bg-white/20" : "bg-black/10", size === "sm" ? "p-1" : "p-3")}>
                <Icon className={cn(iconSizes[size])} />
            </div>
            <h4 className={cn("font-bold", size === "sm" ? "text-xs" : "text-sm")}>{title}</h4>
            {description && size !== "sm" && (
                <p className="text-xs opacity-90 mt-1 max-w-[150px]">{description}</p>
            )}

            {!unlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-xl z-10">
                    <div className="bg-background/80 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border shadow-sm">
                        Locked
                    </div>
                </div>
            )}
        </motion.div>
    );
}
