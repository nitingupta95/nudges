"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FunnelStep {
    id: string;
    label: string;
    value: number;
    color?: string;
}

interface FunnelChartProps {
    data: FunnelStep[];
    className?: string;
    showValues?: boolean;
    showLabels?: boolean;
}

export function FunnelChart({ data, className, showValues = true, showLabels = true }: FunnelChartProps) {
    const maxValue = Math.max(...data.map((d) => d.value));

    return (
        <div className={cn("w-full space-y-2", className)}>
            {data.map((step, index) => {
                const widthPercentage = (step.value / maxValue) * 100;

                return (
                    <div key={step.id} className="relative group">
                        <div className="flex items-center gap-4">
                            {showLabels && (
                                <div className="w-24 text-sm font-medium text-muted-foreground text-right shrink-0">
                                    {step.label}
                                </div>
                            )}

                            <div className="flex-1 h-8 bg-muted/30 rounded-md overflow-hidden relative">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${widthPercentage}%` }}
                                    transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                                    className={cn("h-full rounded-md relative", step.color ? "" : "bg-primary/80")}
                                    style={{ backgroundColor: step.color }}
                                >
                                    {showValues && (
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white px-1">
                                            {step.value}
                                        </span>
                                    )}
                                </motion.div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
