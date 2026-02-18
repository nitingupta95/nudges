"use client";

import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onSearch?: (value: string) => void;
    className?: string;
}

export function SearchBar({ onSearch, className, ...props }: SearchBarProps) {
    const [value, setValue] = useState(props.value || props.defaultValue || "");
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        props.onChange?.(e);
        onSearch?.(e.target.value);
    };

    const clearSearch = () => {
        setValue("");
        if (inputRef.current) {
            inputRef.current.value = "";
            inputRef.current.focus();
        }
        const event = { target: { value: "" } } as React.ChangeEvent<HTMLInputElement>;
        props.onChange?.(event);
        onSearch?.("");
    };

    return (
        <div
            className={cn(
                "relative flex items-center w-full max-w-sm transition-all duration-300",
                isFocused ? "scale-[1.02] shadow-lg ring-2 ring-primary/20 rounded-md" : "",
                className
            )}
        >
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
                ref={inputRef}
                type="search"
                className={cn(
                    "pl-9 pr-9 h-10 w-full transition-all border-muted bg-background/50 backdrop-blur-sm",
                    isFocused ? "border-primary" : "border-border"
                )}
                value={value}
                onChange={handleChange}
                onFocus={(e) => {
                    setIsFocused(true);
                    props.onFocus?.(e);
                }}
                onBlur={(e) => {
                    setIsFocused(false);
                    props.onBlur?.(e);
                }}
                {...props}
            />
            {value && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 w-7 h-7 hover:bg-transparent"
                    onClick={clearSearch}
                >
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                </Button>
            )}
        </div>
    );
}
