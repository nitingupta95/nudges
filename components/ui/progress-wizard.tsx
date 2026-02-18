"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface Step {
    id: string | number;
    label: string;
    description?: string;
}

interface ProgressWizardProps {
    steps: Step[];
    currentStep: number; // 0-indexed
    onStepClick?: (step: number) => void;
    className?: string;
    vertical?: boolean;
}

export function ProgressWizard({
    steps,
    currentStep,
    onStepClick,
    className,
    vertical = false
}: ProgressWizardProps) {
    return (
        <div className={cn("w-full", vertical ? "flex flex-col gap-8" : "flex justify-between relative", className)}>
            {!vertical && (
                <div className="absolute top-[15px] left-0 w-full h-[2px] bg-muted -z-10">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                </div>
            )}

            {steps.map((step, index) => {
                const status = index < currentStep ? "completed" : index === currentStep ? "current" : "upcoming";

                return (
                    <div
                        key={step.id}
                        className={cn(
                            "group flex items-center gap-4 relative",
                            vertical ? "" : "flex-col text-center",
                            onStepClick && index <= currentStep ? "cursor-pointer" : "cursor-default"
                        )}
                        onClick={() => onStepClick && index <= currentStep && onStepClick(index)}
                    >
                        {vertical && index !== steps.length - 1 && (
                            <div
                                className="absolute left-[15px] top-[34px] w-[2px] h-[calc(100%-4px)] bg-muted -z-10"
                            >
                                {index < currentStep && (
                                    <motion.div
                                        className="w-full bg-primary"
                                        initial={{ height: "0%" }}
                                        animate={{ height: "100%" }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}
                            </div>
                        )}

                        <div
                            className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 z-10 bg-background",
                                status === "completed" ? "border-primary bg-primary text-primary-foreground scale-110" :
                                    status === "current" ? "border-primary ring-4 ring-primary/20 scale-125" :
                                        "border-muted bg-muted text-muted-foreground"
                            )}
                        >
                            {status === "completed" ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <span className="text-xs font-semibold">{index + 1}</span>
                            )}
                        </div>

                        <div className={cn(vertical ? "pb-0" : "mt-2")}>
                            <p className={cn(
                                "text-sm font-medium transition-colors duration-300",
                                status === "current" ? "text-primary" : "text-muted-foreground"
                            )}>
                                {step.label}
                            </p>
                            {step.description && (
                                <p className="text-xs text-muted-foreground hidden sm:block">
                                    {step.description}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
