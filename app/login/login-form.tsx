"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { fadeUp } from "@/lib/animations";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-contex";

export function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState(
        searchParams.get("signup") === "success"
            ? "Account created successfully! Please login."
            : ""
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        setLoading(true);

        try {
            await login(formData.email, formData.password);
            // Success - redirect to dashboard
            router.push("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div initial="hidden" animate="visible" className="relative z-10 w-full max-w-md border-border/50 border-2 rounded-xl">
            <motion.div custom={0} variants={fadeUp} className="glass-card rounded-2xl p-8 space-y-6">
                <motion.div custom={1} variants={fadeUp} className="text-center space-y-3">
                    <Link href="/" className="inline-flex items-center gap-2.5 text-xl font-bold text-foreground">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-extrabold shadow-lg shadow-primary/25">
                            P
                        </span>
                        Pieworks
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Welcome back</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Sign in to your account</p>
                    </div>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <motion.div custom={2} variants={fadeUp} className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-foreground/80">Email</Label>
                        <div className="input-glow rounded-lg transition-shadow">
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="you@example.com"
                                autoComplete="email"
                                maxLength={255}
                                disabled={loading}
                                required
                                className="h-11 bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 focus-visible:border-primary/40 transition-colors"
                            />
                        </div>
                    </motion.div>

                    <motion.div custom={3} variants={fadeUp} className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-foreground/80">Password</Label>
                        <div className="relative input-glow rounded-lg transition-shadow">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                disabled={loading}
                                required
                                className="h-11 bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 focus-visible:border-primary/40 transition-colors pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </motion.div>

                    {error && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-destructive" role="alert">
                            {error}
                        </motion.p>
                    )}

                    <motion.div custom={4} variants={fadeUp}>
                        <Button type="submit" className="w-full h-11 font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>
                    </motion.div>
                </form>

                <motion.p custom={5} variants={fadeUp} className="text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link href="/signup" className="font-medium text-primary hover:text-primary/80 transition-colors">
                        Sign up
                    </Link>
                </motion.p>
            </motion.div>
        </motion.div>
    );
}
