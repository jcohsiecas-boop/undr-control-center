import { cn } from "@/lib/utils";

const tones = {
  default: "border-border bg-muted text-muted-foreground",
  red: "border-red-500/30 bg-red-500/10 text-red-300",
  green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  blue: "border-sky-500/30 bg-sky-500/10 text-sky-300"
};

export function Badge({ className, tone = "default", children }: { className?: string; tone?: keyof typeof tones; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>{children}</span>;
}
