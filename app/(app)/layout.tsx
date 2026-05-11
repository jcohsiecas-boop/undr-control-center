import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  let events: { slug: string; name: string }[] = [];
  try {
    events = await prisma.event.findMany({ select: { slug: true, name: true }, orderBy: { date: "desc" }, take: 12 });
  } catch {
    events = [];
  }
  return (
    <div className="flex min-h-screen bg-background noise">
      <Sidebar events={events} />
      <div className="min-w-0 flex-1">
        <Topbar events={events} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
