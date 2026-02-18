"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

export type SkillLevel = "beginner" | "intermediate" | "expert";

interface SkillTagProps {
    name: string;
    level?: SkillLevel;
    className?: string;
    showLevel?: boolean;
}

export function SkillTag({ name, level, className, showLevel = false }: SkillTagProps) {
    const levelConfig = {
        beginner: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", stars: 1 },
        intermediate: { color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300", stars: 2 },
        expert: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", stars: 3 },
    };

    const config = level ? levelConfig[level] : { color: "bg-secondary text-secondary-foreground", stars: 0 };

    return (
        <Badge
            variant="secondary"
            className={cn("px-2.5 py-0.5 font-medium transition-colors hover:opacity-80", config.color, className)}
        >
            {name}
            {showLevel && level && (
                <span className="ml-1.5 flex gap-0.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Star
                            key={i}
                            className={cn(
                                "w-3 h-3",
                                i < config.stars ? "fill-current opacity-100" : "opacity-20"
                            )}
                        />
                    ))}
                </span>
            )}
        </Badge>
    );
}
