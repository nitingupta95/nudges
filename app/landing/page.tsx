"use client"
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Lightbulb,
  Send,
  ShieldCheck,
  ArrowRight,
  Users,
  TrendingUp,
  Zap,
  CheckCircle2,
  Network,
  BarChart3,
  Bot,
  Star,
  ChevronRight,
  Sparkles,
} from "lucide-react"; 
import { useRouter } from "next/navigation";

/* ────────────────────────────────────────────────────────────
   DATA
──────────────────────────────────────────────────────────── */
const steps = [
  {
    icon: Briefcase,
    step: "01",
    title: "Post a Job",
    desc: "Recruiters create a job posting. Our AI instantly parses requirements, skills, and seniority — no manual tagging needed.",
  },
  {
    icon: Lightbulb,
    step: "02",
    title: "Smart Matching",
    desc: "The engine scores every employee's network against the role using a multi-factor algorithm: skills, companies, industry & location.",
  },
  {
    icon: Send,
    step: "03",
    title: "Refer & Track",
    desc: "Employees get personalised nudges, generate AI-crafted messages, and submit referrals. Every status update is tracked in real-time.",
  },
];

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

const stats = [
  { value: "2–3×", label: "Referral conversion vs. cold" },
  { value: "30%", label: "Faster time-to-hire" },
  { value: "40%", label: "Cost reduction vs. agencies" },
  { value: "11", label: "Stage referral pipeline" },
];

const testimonials = [
  {
    quote: "Nudges surfaced candidates we never would have found. The AI matching is genuinely impressive.",
    name: "Sarah Chen",
    role: "VP Talent, Horizon Labs",
    avatar: "SC",
  },
  {
    quote: "Our referral volume tripled in the first month. The nudge engine does the heavy lifting for us.",
    name: "Marcus Reid",
    role: "Head of People, Cortex AI",
    avatar: "MR",
  },
  {
    quote: "Finally an employee referral tool that doesn't feel like a chore. Love the automated messages.",
    name: "Priya Nair",
    role: "Talent Lead, Stratum Health",
    avatar: "PN",
  },
];

/* ────────────────────────────────────────────────────────────
   ANIMATION HELPERS
──────────────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   COUNTER ANIMATION
──────────────────────────────────────────────────────────── */
function AnimatedCounter({ value }: { value: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, ease: "backOut" }}
    >
      {value}
    </motion.span>
  );
}

/* ────────────────────────────────────────────────────────────
   MAIN PAGE
──────────────────────────────────────────────────────────── */
export default function Index() {
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ── HEADER ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border"
          : "bg-transparent"
          }`}
      >
        <div className="container max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-accent-foreground font-display font-bold text-sm shadow-glow-primary">
              
            </div>
            <span className="font-display font-bold text-foreground text-lg tracking-tight">
              NUDGES
            </span>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {["How it works", "Features", "Testimonials"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Button onClick={() => { router.push("/login") }} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Log in
            </Button>
            <Button onClick={() => { router.push("/signup") }} size="sm" className="bg-gradient-brand text-accent-foreground font-semibold shadow-glow-primary hover:opacity-90 transition-opacity">
              Get started
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background image */}
        <div className="absolute inset-0">
          {/* <img
            src="./hero-bg.jpg"
            alt="Network background"
            className="w-full h-full object-cover opacity-20"
          /> */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        </div>

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-accent/15 blur-[100px] pointer-events-none" />

        <div className="relative container max-w-6xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="outline"
              className="mb-6 border-primary/40 bg-primary/10 text-primary px-4 py-1.5 text-xs font-medium inline-flex gap-2 items-center"
            >
              <Sparkles className="w-3 h-3" />
              AI-powered employee referral platform
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl leading-[1.05] tracking-tight mb-6"
          >
            Hire through your{" "}
            <span className="gradient-brand-text">best network.</span>
            <br />
            Powered by AI.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Nudges turns every employee into a talent scout. Smart matching, personalised nudges,
            and AI-crafted messages make referrals effortless — and measurable.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.38 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Button
              onClick={() => { router.push("/signup") }}
              size="lg"
              className="bg-gradient-brand text-accent-foreground font-semibold px-8 h-12 text-base shadow-glow-primary hover:opacity-90 transition-opacity animate-glow-pulse"
            >
              Start for free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={() => { router.push("/signup") }}
              size="lg"
              variant="outline"
              className="border-border bg-card/50 backdrop-blur text-foreground font-semibold px-8 h-12 text-base hover:bg-secondary transition-colors"
            >
              Post a job
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="mt-5 text-xs text-muted-foreground flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            No credit card required · GDPR compliant · Enterprise-grade security
          </motion.p>

          {/* Floating stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden border border-border card-glow max-w-3xl mx-auto"
          >
            {stats.map((s) => (
              <div key={s.label} className="bg-card px-6 py-5 text-center">
                <div className="font-display font-extrabold text-2xl gradient-brand-text">
                  <AnimatedCounter value={s.value} />
                </div>
                <div className="text-xs text-muted-foreground mt-1 leading-tight">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
        <div className="relative container max-w-6xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-accent/30 bg-accent/10 text-accent text-xs px-3 py-1">
              How it works
            </Badge>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
              Three steps to better hires
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              From job post to hire — the entire referral lifecycle, automated and tracked.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-primary/40 via-accent/60 to-primary/40" />

            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                  variants={fadeUp}
                  className="relative group"
                >
                  <div className="border-gradient rounded-2xl p-8 h-full bg-card hover:bg-secondary/50 transition-colors duration-300 card-glow">
                    <div className="relative mb-6 flex items-center justify-between">
                      <div className="w-14 h-14 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-primary group-hover:animate-float">
                        <Icon className="w-6 h-6 text-accent-foreground" />
                      </div>
                      <span className="font-display font-extrabold text-4xl text-border select-none">
                        {step.step}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-xl text-foreground mb-3">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-32">
        <div className="container max-w-6xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/10 text-primary text-xs px-3 py-1">
              Features
            </Badge>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
              Everything you need to{" "}
              <span className="gradient-brand-text">hire smarter</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Built for recruiters, loved by employees. Every feature designed around real referral workflows.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  variants={fadeUp}
                  className="group relative"
                >
                  <div className="border border-border rounded-2xl p-6 h-full bg-card hover:border-primary/40 hover:bg-card/80 transition-all duration-300 hover:card-glow cursor-default">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/25 transition-colors">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <Badge className="mt-1 text-[10px] bg-secondary text-muted-foreground border-0 font-medium">
                        {f.label}
                      </Badge>
                    </div>
                    <h3 className="font-display font-bold text-base text-foreground mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] rounded-full" />

        <div className="relative container max-w-6xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-accent/30 bg-accent/10 text-accent text-xs px-3 py-1">
              Testimonials
            </Badge>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
              Trusted by talent teams
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
              >
                <div className="border-gradient rounded-2xl p-7 h-full bg-card card-glow">
                  <div className="flex gap-0.5 mb-5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-foreground/90 text-sm leading-relaxed mb-6 italic">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-accent-foreground font-display font-bold text-xs shadow-glow-primary">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLE SPLIT ── */}
      <section className="py-28">
        <div className="container max-w-6xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <h2 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
              Built for every role
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              One platform, three powerful perspectives.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                role: "Employees",
                color: "accent",
                perks: ["Personalised job match feed", "AI message generator", "Real-time referral tracking", "One-tap nudge responses"],
              },
              {
                icon: Briefcase,
                role: "Recruiters",
                color: "primary",
                perks: ["AI job parsing & tagging", "Candidate pipeline view", "Resume parsing & fit score", "Per-job analytics"],
              },
              {
                icon: BarChart3,
                role: "Admins",
                color: "primary",
                perks: ["Full-funnel conversion view", "User & role management", "System-wide analytics", "A/B nudge testing"],
              },
            ].map((card, i) => (
              <motion.div
                key={card.role}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <div
                  className={`rounded-2xl p-7 h-full border transition-all duration-300 card-glow ${card.color === "accent"
                    ? "border-accent/30 bg-accent/5 hover:border-accent/50"
                    : "border-primary/30 bg-primary/5 hover:border-primary/50"
                    }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${card.color === "accent"
                      ? "bg-accent/20 border border-accent/30"
                      : "bg-primary/20 border border-primary/30"
                      }`}
                  >
                    <card.icon
                      className={`w-5 h-5 ${card.color === "accent" ? "text-accent" : "text-primary"}`}
                    />
                  </div>
                  <h3 className="font-display font-bold text-xl text-foreground mb-4">{card.role}</h3>
                  <ul className="space-y-2.5">
                    {card.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <CheckCircle2
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${card.color === "accent" ? "text-accent" : "text-primary"
                            }`}
                        />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-28">
        <div className="container max-w-4xl mx-auto px-6">
          <AnimatedSection>
            <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-cta p-12 text-center card-glow">
              {/* Background glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-primary/20 blur-[80px] rounded-full -mt-10" />

              <div className="relative">
                <Zap className="w-10 h-10 text-primary mx-auto mb-6 animate-float" />
                <h2 className="font-display font-extrabold text-4xl md:text-5xl text-foreground mb-4 leading-tight">
                  Ready to refer{" "}
                  <span className="gradient-brand-text">great people?</span>
                </h2>
                <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto">
                  Join Nudges and connect your company with top talent hidden in your employees' networks.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button
                  onClick={()=>{router.push("/signup")}}
                    size="lg"
                    className="bg-gradient-brand text-accent-foreground font-semibold px-10 h-13 text-base shadow-glow-primary hover:opacity-90 transition-opacity"
                  >
                    Get started — it's free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    size="lg"
                    onClick={()=>{router.push("/login")}}
                    variant="outline"
                    className="border-border text-foreground font-semibold px-8 h-13 text-base hover:bg-secondary"
                  >
                    Post a job
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border py-10">
        <div className="container max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-brand flex items-center justify-center text-accent-foreground font-display font-bold text-xs">
              P
            </div>
            <span className="font-display font-bold text-foreground text-sm">Nudges</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 Nudges. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Security"].map((link) => (
              <a key={link} href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
