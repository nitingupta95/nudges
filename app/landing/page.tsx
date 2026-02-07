"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"; 
import { t } from "@/lib/i18n";
 
import { motion } from "framer-motion";
import { Briefcase, Lightbulb, Send, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/auth-contex";
import Image from "next/image";
import { Footer } from "@/components/layout/footer";

const steps = [
  {
    icon: Briefcase,
    title: t("landing.step1.title"),
    desc: t("landing.step1.desc"),
  },
  {
    icon: Lightbulb,
    title: t("landing.step2.title"),
    desc: t("landing.step2.desc"),
  },
  {
    icon: Send,
    title: t("landing.step3.title"),
    desc: t("landing.step3.desc"),
  },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  if (isAuthenticated) {
    router.replace("/dashboard");
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-foreground focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Minimal header */}
      <header className="border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold text-foreground"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground text-sm font-extrabold">
              P
            </span>
            Pieworks
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                {t("nav.login")}
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="default" size="sm">
                {t("nav.signup")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-card py-20 md:py-28">
          <div className="container grid items-center gap-12 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-xl"
            >
              <h1 className="text-4xl font-extrabold leading-tight text-foreground md:text-5xl lg:text-6xl">
                {t("landing.headline")}
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                {t("landing.subheadline")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/signup">
                  <Button variant="default" size="lg">
                    {t("landing.cta.start")}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="outline" size="lg">
                    {t("landing.cta.post")}
                  </Button>
                </Link>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-success" />
                {t("landing.privacy")}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative hidden md:block"
            >
              <Image
                src="/hero-illustration.png"
                width={600}
                height={400}
                alt="Network of connected professionals illustrating referral-driven hiring"
                className="w-full rounded-2xl shadow-2xl shadow-primary/10"
              />
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20">
          <div className="container">
            <h2 className="text-center text-3xl font-bold text-foreground">
              How it works
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.15 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs">
                      {step.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary py-16">
          <div className="container text-center">
            <h2 className="text-3xl font-bold text-primary-foreground">
              Ready to refer?
            </h2>
            <p className="mt-3 text-primary-foreground/80 text-lg">
              Join Pieworks and start connecting great people with great roles.
            </p>
            <Link href="/signup">
              <Button variant="default" size="lg" className="mt-8">
                {t("landing.cta.start")}
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
