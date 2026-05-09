"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("admin@undr.co");
  const [password, setPassword] = useState("UNDR2026!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Credenciales invalidas.");
      return;
    }
    router.push(params.get("callbackUrl") ?? "/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background noise px-4">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-md bg-primary text-lg font-black text-primary-foreground shadow-glow">U</div>
          <h1 className="text-2xl font-semibold">UNDR Control Center</h1>
          <p className="mt-2 text-sm text-muted-foreground">THE BASS THE RHYTHM & THE KICK S.A.S</p>
        </div>
        <Card className="border-white/10 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LockKeyhole className="h-4 w-4 text-primary" />
              Acceso ejecutivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="admin@undr.co" />
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />
              {error && <p className="text-sm text-red-300">{error}</p>}
              <Button className="w-full" disabled={loading}>
                {loading ? "Validando..." : "Entrar"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
            <p className="mt-4 text-xs text-muted-foreground">Demo seed: admin@undr.co / UNDR2026!</p>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
