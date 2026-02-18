"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KanbanColumnProps {
    title: string;
    count?: number;
    color?: string; // Hex color for the header line
    children: React.ReactNode;
    onAdd?: () => void;
    className?: string;
}

export function KanbanColumn({
    title,
    count,
    color = "var(--primary)",
    children,
    onAdd,
    className
}: KanbanColumnProps) {
    return (
        <div className={cn("flex flex-col h-full min-w-[280px] w-full max-w-xs bg-muted/40 rounded-xl border border-border/50", className)}>
            <div className="p-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                    />
                    <h3 className="font-semibold text-sm">{title}</h3>
                    {count !== undefined && (
                        <Badge variant="secondary" className="px-1.5 h-5 text-[10px] min-w-5 justify-center">
                            {count}
                        </Badge>
                    )}
                </div>
                <div className="flex items-center">
                    {onAdd && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAdd}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1 px-3 pb-3">
                <div className="flex flex-col gap-3">
                    {children}
                </div>
            </ScrollArea>
        </div>
    );
}
