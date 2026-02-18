"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

interface SparklineChartProps {
    data: { value: number }[];
    color?: string;
    className?: string;
    height?: number;
}

export function SparklineChart({ data, color = "var(--primary)", className, height = 50 }: SparklineChartProps) {
    if (!data || data.length === 0) return null;

    const isPositive = data[data.length - 1].value >= data[0].value;
    const strokeColor = color === "var(--primary)" ? (isPositive ? "var(--success)" : "var(--destructive)") : color;

    return (
        <div className={cn("w-full", className)} style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                                        <span className="font-bold text-muted-foreground">{payload[0].value}</span>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={strokeColor}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={true}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
