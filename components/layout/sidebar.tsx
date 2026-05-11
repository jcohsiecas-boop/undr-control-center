"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, CalendarDays, CheckSquare, CircleDollarSign, LayoutDashboard, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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

type SidebarEvent = { slug: string; name: string };

function SidebarContent({ events = [], onNavigate }: { events?: SidebarEvent[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href.includes("#") ? pathname === href.split("#")[0] : pathname === href);

  return (
    <>
      <Link href="/dashboard" className="mb-8 flex items-center gap-3 px-2" onClick={onNavigate}>
        <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-sm font-black text-primary-foreground shadow-glow">U</div>
        <div>
          <div className="text-sm font-semibold">UNDR</div>
          <div className="text-xs text-muted-foreground">Control Center</div>
        </div>
      </Link>
      <nav className="space-y-1">
        {nav.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
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
                onClick={onNavigate}
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
    </>
  );
}

export function Sidebar({ events = [] }: { events?: SidebarEvent[] }) {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-border bg-card/40 px-4 py-5 lg:block">
      <SidebarContent events={events} />
    </aside>
  );
}

export function MobileSidebar({ events = [], open, onClose }: { events?: SidebarEvent[]; open: boolean; onClose: () => void }) {
  return (
    <div className={cn("fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
      <button
        type="button"
        className={cn("absolute inset-0 bg-background/70 backdrop-blur-sm transition-opacity", open ? "opacity-100" : "opacity-0")}
        aria-label="Cerrar menu"
        onClick={onClose}
      />
      <aside
        className={cn(
          "absolute left-0 top-0 h-full w-[82vw] max-w-80 border-r border-border bg-card px-4 py-5 shadow-2xl transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-4 flex justify-end">
          <Button variant="ghost" size="icon" aria-label="Cerrar menu" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <SidebarContent events={events} onNavigate={onClose} />
      </aside>
    </div>
  );
}
