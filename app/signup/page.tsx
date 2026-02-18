"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { fadeUp } from "@/lib/animations";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-contex";


export default function Signup() {
  const router = useRouter();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "MEMBER" as "MEMBER" | "RECRUITER",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signup(formData.name, formData.email, formData.password, formData.role);
      // Success - redirect to login page with success message
      router.push("/login?signup=success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen  items-center justify-center bg-background p-4 overflow-hidden">
      <div className="absolute inset-0 opacity-40" />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07] blur-[120px] pointer-events-none"
        style={{
          background: `radial-gradient(circle, hsl(250 80% 65%), transparent 70%)`,
        }}
      />

      <motion.div
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md border-2 border-black-500 rounded-2xl"
      >
        <motion.div
          custom={0}
          variants={fadeUp}
          className="glass-card rounded-2xl p-8 space-y-6"
        >
          <motion.div custom={1} variants={fadeUp} className="text-center space-y-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-xl font-bold text-foreground"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-extrabold shadow-lg shadow-primary/25">
                N
              </span>
              Nudges
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Create your account
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Start building something amazing today
              </p>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div custom={2} variants={fadeUp} className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-foreground/80">
                Full Name
              </Label>
              <div className="input-glow rounded-lg transition-shadow">
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jane Doe"
                  autoComplete="name"
                  maxLength={100}
                  disabled={loading}
                  required
                  className="h-11 bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 focus-visible:border-primary/40 transition-colors"
                />
              </div>
            </motion.div>

            <motion.div custom={3} variants={fadeUp} className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground/80">
                Email
              </Label>
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

            <motion.div custom={4} variants={fadeUp} className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium text-foreground/80">
                I am a
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value: "MEMBER" | "RECRUITER") => setFormData({ ...formData, role: value })}
                disabled={loading}
              >
                <SelectTrigger className="h-11 bg-secondary/50 border-border/50 text-foreground focus:ring-primary/30 focus:border-primary/40 transition-colors">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member (looking to refer or get referred)</SelectItem>
                  <SelectItem value="RECRUITER">Recruiter (posting jobs)</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            <motion.div custom={5} variants={fadeUp} className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
                Password
              </Label>
              <div className="relative input-glow rounded-lg transition-shadow">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
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
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </motion.div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive"
                role="alert"
              >
                {error}
              </motion.p>
            )}

            <motion.div custom={6} variants={fadeUp}>
              <Button
                type="submit"
                className="w-full h-11 font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </motion.div>
          </form>

          <motion.div
            custom={7}
            variants={fadeUp}
            className="flex items-center gap-2.5 rounded-xl bg-secondary/50 border border-border/30 p-3.5 text-xs text-muted-foreground"
          >
            <ShieldCheck className="h-4 w-4 text-success shrink-0" />
            <span>
              Your data is encrypted and securely stored. We never share your
              information with third parties.
            </span>
          </motion.div>

          <motion.p
            custom={8}
            variants={fadeUp}
            className="text-center text-sm text-muted-foreground"
          >
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
