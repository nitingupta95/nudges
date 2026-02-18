"use client";

import { motion, Variants } from "framer-motion";
import { Bot, Network, Sparkles, BarChart3, ShieldCheck, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const features = [
    {
        icon: Bot,
        label: "AI-Powered",
        title: "Intelligent Job Parsing",
        desc: "GPT-4 extracts skills, seniority, tech stack, and culture signals from any job description in seconds.",
    },
    {
        icon: Network,
        label: "Matching",
        title: "Multi-Factor Scoring",
        desc: "40% skills · 20% companies · 15% industry · 15% seniority · 10% location. Explainable, auditable scores.",
    },
    {
        icon: Sparkles,
        label: "Engagement",
        title: "Personalised Nudges",
        desc: "Contextual nudges with AI-generated referral messages for WhatsApp, LinkedIn, and Email — one tap away.",
    },
    {
        icon: BarChart3,
        label: "Analytics",
        title: "Full-Funnel Tracking",
        desc: "View → Nudge → Click → Submit → Hire. Every stage measured so you know exactly where to optimise.",
    },
    {
        icon: ShieldCheck,
        label: "Security",
        title: "Enterprise-Grade Auth",
        desc: "PBKDF2 hashing, JWT sessions, role-based access (Admin / Recruiter / Member), and CSRF protection.",
    },
    {
        icon: TrendingUp,
        label: "ROI",
        title: "30% Faster Time-to-Hire",
        desc: "Pre-vetted candidates from warm networks convert at 2–3× the rate of cold applicants.",
    },
];

const container: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } },
};

export function FeatureShowcase() {
    return (
        <section id="features" className="py-24 sm:py-32 bg-secondary/30 relative overflow-hidden">
            {/* Decorative Blob */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container px-6 mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                            Platform Features
                        </Badge>
                        <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl mb-6">
                            Everything you need to <span className="text-primary">hire smarter</span>
                        </h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Built for recruiters, loved by employees. Every feature designed around real referral workflows
                            to maximize engagement and conversion.
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {features.map((feature, idx) => (
                        <motion.div key={idx} variants={item} className="group">
                            <div className="h-full bg-card border border-border/50 rounded-2xl p-8 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-3xl" />

                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <feature.icon className="w-6 h-6 text-primary" />
                                </div>

                                <div className="flex items-center gap-2 mb-3">
                                    <h3 className="font-bold text-xl">{feature.title}</h3>
                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{feature.label}</Badge>
                                </div>

                                <p className="text-muted-foreground leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
