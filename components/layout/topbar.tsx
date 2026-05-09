"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function Topbar() {
  const { data } = useSession();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <div className="relative hidden max-w-md flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar tareas, eventos, socios..." />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium">{data?.user?.name ?? "UNDR Admin"}</div>
            <div className="text-xs text-muted-foreground">{data?.user?.email}</div>
          </div>
          <Button variant="ghost" size="icon" aria-label="Cerrar sesion" onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
