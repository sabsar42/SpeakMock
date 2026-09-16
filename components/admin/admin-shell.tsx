"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Calendar,
  ClipboardList,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/slots", label: "Slots", icon: Calendar },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/admin/results", label: "Results", icon: FileText },
];

const POLL_INTERVAL_MS = 60_000;

interface AdminShellProps {
  title: string;
  children: ReactNode;
  headerActions?: ReactNode;
}

export function AdminShell({ title, children, headerActions }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const [awaitingResultCount, setAwaitingResultCount] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setPendingCount(data.pending ?? 0);
          setAwaitingResultCount(data.awaitingResult ?? 0);
        }
      } catch {
        // Silent — badges just won't update this cycle.
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  const notificationCount = pendingCount + awaitingResultCount;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-white sm:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <span className="text-lg font-bold text-text-primary">
            Speak<span className="text-accent">Mock</span>
          </span>
          <span className="rounded-full border border-border bg-gray-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
            Admin
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV_LINKS.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const badgeCount =
              link.href === "/admin/bookings"
                ? pendingCount
                : link.href === "/admin/results"
                  ? awaitingResultCount
                  : 0;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-gray-100 text-text-primary"
                    : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
                )}
              >
                <span className="flex items-center gap-2.5">
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </span>
                {badgeCount > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white",
                      link.href === "/admin/bookings" ? "bg-error" : "bg-warning"
                    )}
                  >
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-border p-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-gray-50 hover:text-text-primary"
          >
            <ExternalLink className="h-4 w-4" />
            View Live Site
          </a>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-text-secondary hover:bg-gray-50 hover:text-text-primary"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-4 sm:px-6">
          <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
          <div className="flex items-center gap-3">
            {headerActions}
            <div className="relative">
              <button
                onClick={() => setBellOpen((v) => !v)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-text-secondary hover:text-text-primary"
              >
                <Bell className="h-4 w-4" />
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
                    {notificationCount}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-0 top-11 z-20 w-64 rounded-lg border border-border bg-white p-3 shadow-xl">
                  {notificationCount === 0 ? (
                    <p className="text-sm text-text-muted">You&apos;re all caught up.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {pendingCount > 0 && (
                        <li>
                          <Link
                            href="/admin/bookings?status=pending"
                            className="text-text-secondary hover:text-text-primary"
                            onClick={() => setBellOpen(false)}
                          >
                            {pendingCount} booking{pendingCount === 1 ? "" : "s"} awaiting
                            verification
                          </Link>
                        </li>
                      )}
                      {awaitingResultCount > 0 && (
                        <li>
                          <Link
                            href="/admin/results?filter=pending"
                            className="text-text-secondary hover:text-text-primary"
                            onClick={() => setBellOpen(false)}
                          >
                            {awaitingResultCount} result
                            {awaitingResultCount === 1 ? "" : "s"} not uploaded yet
                          </Link>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <Link
              href="/admin/slots"
              className="flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-sm font-medium text-white hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4" />
              Add Slot
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden bg-background p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
