"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
    imageSrc?: string;
}

export function EmptyState({ title, description, icon: Icon, action, className, imageSrc }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className={cn("flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-xl border border-dashed bg-muted/30", className)}
        >
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                {Icon ? (
                    <Icon className="w-8 h-8 text-primary" />
                ) : imageSrc ? (
                    <img src={imageSrc} alt="" className="w-10 h-10 object-contain opacity-80" />
                ) : null}
            </div>

            <h3 className="text-xl font-semibold tracking-tight mb-2">{title}</h3>
            <p className="text-muted-foreground max-w-sm mb-6">{description}</p>

            {action && (
                <Button onClick={action.onClick} size="lg">
                    {action.label}
                </Button>
            )}
        </motion.div>
    );
}
