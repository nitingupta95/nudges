"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Briefcase,
  PlusCircle,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/auth-contex";

// Navigation items for members
const memberNavItems = [
  { href: "/dashboard/member", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/member/referrals", label: "My Referrals", icon: Users },
  { href: "/dashboard/member/profile", label: "Profile", icon: UserCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Navigation items for recruiters/admins
const recruiterNavItems = [
  { href: "/dashboard/recruiter", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/recruiter/referrals", label: "Referrals", icon: Users },
  { href: "/dashboard/recruiter/profile", label: "Profile", icon: UserCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Header() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Determine if user is recruiter/admin (persists on reload via auth context)
  const isRecruiterOrAdmin = useMemo(() => {
    return user?.role === "RECRUITER" || user?.role === "ADMIN";
  }, [user?.role]);

  // Select nav items based on user role
  const navItems = useMemo(() => {
    if (isRecruiterOrAdmin) {
      return recruiterNavItems;
    }
    return memberNavItems;
  }, [isRecruiterOrAdmin]);

  // Get the correct dashboard path for this user
  const dashboardPath = useMemo(() => {
    return isRecruiterOrAdmin ? "/dashboard/recruiter" : "/dashboard/member";
  }, [isRecruiterOrAdmin]);

  // Check if current path matches nav item (including sub-paths)
  const isActiveLink = useCallback((href: string) => {
    if (href === "/dashboard/member" || href === "/dashboard/recruiter") {
      return pathname.startsWith("/dashboard");
    }
    return pathname === href || pathname.startsWith(href + "/");
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
      <nav
        className="container flex h-16 items-center justify-between"
        aria-label="Main navigation"
      >
        <Link
          href={isAuthenticated ? dashboardPath : "/"}
          className="flex items-center gap-2 text-xl font-bold text-foreground"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground text-sm font-extrabold">
            N
          </span>
          Nudges
        </Link>

        {/* Loading state */}
        {isLoading && (
          <div className="hidden md:flex items-center gap-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        )}

        {isAuthenticated && !isLoading && (
          <>
            {/* Desktop nav */}
            <div className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveLink(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>

            <div className="hidden items-center gap-3 md:flex">
              {user?.role && (
                <Badge
                  variant={isRecruiterOrAdmin ? "default" : "outline"}
                  className="text-xs capitalize"
                >
                  {user.role.toLowerCase()}
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                {user?.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  window.location.href = "/login";
                }}
                aria-label={t("nav.logout")}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X /> : <Menu />}
            </Button>
          </>
        )}

        {!isAuthenticated && !isLoading && (
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
        )}
      </nav>

      {/* Mobile menu */}
      {isAuthenticated && !isLoading && mobileOpen && (
        <div className="border-t bg-card p-4 md:hidden">
          {user?.role && (
            <div className="mb-3 pb-3 border-b">
              <Badge
                variant={isRecruiterOrAdmin ? "default" : "outline"}
                className="text-xs capitalize"
              >
                {user.role.toLowerCase()}
              </Badge>
              <span className="ml-2 text-sm text-muted-foreground">{user.name}</span>
            </div>
          )}
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveLink(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                >
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-destructive"
              onClick={() => {
                logout();
                setMobileOpen(false);
                window.location.href = "/login";
              }}
            >
              <LogOut className="h-4 w-4" />
              {t("nav.logout")}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
