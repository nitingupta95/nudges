"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

interface CompanyLogoProps {
    src?: string;
    name: string;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

export function CompanyLogo({ src, name, size = "md", className }: CompanyLogoProps) {
    const sizeClasses = {
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-12 h-12 text-base",
        xl: "w-16 h-16 text-lg"
    };

    return (
        <Avatar className={cn("rounded-lg border bg-background", sizeClasses[size], className)}>
            <AvatarImage src={src} alt={name} className="object-contain p-1" />
            <AvatarFallback className="rounded-lg bg-primary/5 text-primary font-medium">
                {name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
        </Avatar>
    );
}
