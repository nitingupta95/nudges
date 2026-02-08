"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-contex";

const navItems = [
  { href: "/dashboard", label: "nav.dashboard", icon: LayoutDashboard },
  { href: "/referrals", label: "nav.referrals", icon: Users },
  { href: "/profile", label: "nav.profile", icon: UserCircle },
  { href: "/settings", label: "nav.settings", icon: Settings },
];

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
      <nav
        className="container flex h-16 items-center justify-between"
        aria-label="Main navigation"
      >
        <Link
          href={isAuthenticated ? "/dashboard" : "/"}
          className="flex items-center gap-2 text-xl font-bold text-foreground"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground text-sm font-extrabold">
            P
          </span>
          Pieworks
        </Link>

        {isAuthenticated && (
          <>
            {/* Desktop nav */}
            <div className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {t(item.label)}
                    </Button>
                  </Link>
                );
              })}
            </div>

            <div className="hidden items-center gap-3 md:flex">
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

        {!isAuthenticated && (
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
      {isAuthenticated && mobileOpen && (
        <div className="border-t bg-card p-4 md:hidden">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
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
                    {t(item.label)}
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
