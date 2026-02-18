"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { NetworkBackground } from "@/components/landing/network-background";
import { StatCard } from "@/components/ui/stat-card";
import { User, Briefcase, TrendingUp } from "lucide-react";

export function HeroSection() {
    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-background">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
                <NetworkBackground />
            </div>

            <div className="container relative z-10 mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    {/* Text Content */}
                    <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Badge
                                variant="outline"
                                className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-1.5 text-sm font-medium inline-flex gap-2 items-center rounded-full"
                            >
                                <Sparkles className="w-3.5 h-3.5 fill-primary/20" />
                                AI-Powered Employee Referral Platform
                            </Badge>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                            className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl leading-[1.1] tracking-tight mb-6"
                        >
                            Hire through your{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-ai-accent to-primary animate-gradient-x bg-[length:200%_auto]">
                                best network.
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.25 }}
                            className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0"
                        >
                            Turn every employee into a talent scout. Smart matching, personalised nudges,
                            and AI-crafted messages make referrals effortless.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.38 }}
                            className="flex flex-wrap items-center justify-center lg:justify-start gap-4"
                        >
                            <Button
                                size="lg"
                                className="bg-primary text-primary-foreground font-semibold px-8 h-12 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5"
                            >
                                Start for free
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-12 px-8 text-base border-border hover:bg-muted/50 transition-colors"
                            >
                                Book a demo
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground"
                        >
                            <span className="flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-primary" />
                                Enterprise Security
                            </span>
                            <span className="flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-primary" />
                                GDPR Compliant
                            </span>
                        </motion.div>
                    </div>

                    {/* Visual/Stats Side */}
                    <div className="relative hidden lg:block h-[600px]">
                        {/* Abstract glow behind */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

                        {/* Floating Cards */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            className="absolute top-20 right-10 z-20"
                        >
                            <StatCard
                                title="Referral Conversion"
                                value="18.5%"
                                icon={TrendingUp}
                                trend={12.5}
                                trendLabel="vs cold hire"
                                className="w-72 glass-card"
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6, duration: 0.8 }}
                            className="absolute top-60 left-10 z-10"
                        >
                            <StatCard
                                title="Active Referrers"
                                value="1,248"
                                icon={User}
                                trend={8.2}
                                className="w-64 glass-card"
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8, duration: 0.8 }}
                            className="absolute bottom-20 right-20 z-30"
                        >
                            <StatCard
                                title="Time to Hire"
                                value="14 Days"
                                icon={Briefcase}
                                description="Down from 45 days"
                                trend={-68}
                                className="w-72 glass-card"
                            />
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}
