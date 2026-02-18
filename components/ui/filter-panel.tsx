"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface FilterPanelProps {
    children: React.ReactNode;
    activeCount?: number;
    onClearAll?: () => void;
    title?: string;
    triggerLabel?: string;
}

export function FilterPanel({
    children,
    activeCount = 0,
    onClearAll,
    title = "Filters",
    triggerLabel = "Filter"
}: FilterPanelProps) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9 border-dashed">
                    <Filter className="w-4 h-4" />
                    {triggerLabel}
                    {activeCount > 0 && (
                        <>
                            <Separator orientation="vertical" className="mx-1 h-4" />
                            <Badge variant="secondary" className="px-1 h-5 min-w-5 justify-center rounded-sm text-xs pointer-events-none">
                                {activeCount}
                            </Badge>
                        </>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[300px] sm:w-[350px] p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
                        {activeCount > 0 && onClearAll && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onClearAll();
                                }}
                                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                            >
                                Clear all
                            </Button>
                        )}
                    </div>
                    <SheetDescription className="sr-only">
                        Filter options
                    </SheetDescription>
                </SheetHeader>
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-6 pb-20">
                        {children}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t bg-background mt-auto sticky bottom-0">
                    <Button className="w-full">
                        Show Results
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
