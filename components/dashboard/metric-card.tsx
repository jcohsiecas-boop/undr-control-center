import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({ label, value, hint, icon: Icon, href }: { label: string; value: string; hint: string; icon: LucideIcon; href?: string }) {
  const content = (
    <Card className="bg-card/75 backdrop-blur">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
  if (!href) return content;
  return <Link href={href} className="block transition hover:-translate-y-0.5 hover:opacity-90">{content}</Link>;
}
