"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, CalendarDays, CheckSquare, CircleDollarSign, LayoutDashboard, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Checklist", icon: CheckSquare },
  { href: "/financial", label: "Finanzas", icon: CircleDollarSign },
  { href: "/events", label: "Eventos", icon: CalendarDays },
  { href: "/partners", label: "Socios", icon: Users },
  { href: "/inventory", label: "Inventario", icon: Boxes },
  { href: "/dashboard#activity", label: "Actividad", icon: BarChart3 }
];

export function Sidebar({ events = [] }: { events?: { slug: string; name: string }[] }) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-72 shrink-0 border-r border-border bg-card/40 px-4 py-5 lg:block">
      <Link href="/dashboard" className="mb-8 flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-sm font-black text-primary-foreground shadow-glow">U</div>
        <div>
          <div className="text-sm font-semibold">UNDR</div>
          <div className="text-xs text-muted-foreground">Control Center</div>
        </div>
      </Link>
      <nav className="space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",
                active && "bg-muted text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        {events.length > 0 && (
          <div className="pt-2">
            <div className="px-3 pb-1 text-[10px] uppercase text-muted-foreground">Eventos</div>
            {events.map((event) => (
              <Link
                key={event.slug}
                href={`/events/${event.slug}`}
                className={cn(
                  "ml-6 block truncate rounded-md px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground",
                  pathname === `/events/${event.slug}` && "bg-muted text-foreground"
                )}
              >
                {event.name.toUpperCase()}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
}
