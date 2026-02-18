"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

const testimonials = [
    {
        quote: "Nudges surfaced candidates we never would have found. The AI matching is genuinely impressive.",
        name: "Sarah Chen",
        role: "VP Talent, Horizon Labs",
        initials: "SC",
        color: "bg-emerald-500",
    },
    {
        quote: "Our referral volume tripled in the first month. The nudge engine does the heavy lifting for us.",
        name: "Marcus Reid",
        role: "Head of People, Cortex AI",
        initials: "MR",
        color: "bg-indigo-500",
    },
    {
        quote: "Finally an employee referral tool that doesn't feel like a chore. Love the automated messages.",
        name: "Priya Nair",
        role: "Talent Lead, Stratum Health",
        initials: "PN",
        color: "bg-rose-500",
    },
];

export function TestimonialCarousel() {
    const [active, setActive] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setActive((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="py-24 bg-background relative overflow-hidden">
            <div className="container px-6 mx-auto">
                <div className="text-center mb-16">
                    <Badge variant="outline" className="mb-4">Social Proof</Badge>
                    <h2 className="font-display font-bold text-3xl md:text-4xl">Trusted by top talent teams</h2>
                </div>

                <div className="max-w-4xl mx-auto relative h-[300px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={active}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-card border border-border/50 rounded-3xl shadow-xl shadow-primary/5"
                        >
                            <Quote className="w-12 h-12 text-primary/20 mb-6" />
                            <p className="text-2xl md:text-3xl font-medium leading-relaxed mb-8 max-w-2xl px-4">
                                "{testimonials[active].quote}"
                            </p>

                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                                    <AvatarFallback className={`${testimonials[active].color} text-white font-bold`}>
                                        {testimonials[active].initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-left">
                                    <div className="font-bold text-foreground">{testimonials[active].name}</div>
                                    <div className="text-sm text-muted-foreground">{testimonials[active].role}</div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Dots */}
                <div className="flex justify-center gap-3 mt-8">
                    {testimonials.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setActive(i)}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === active ? "bg-primary w-8" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                                }`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
