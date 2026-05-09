import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/api";
import { EventsWorkspace } from "@/components/events/events-workspace";

export default async function EventsPage() {
  const events = await prisma.event.findMany({ include: { eventFinances: true, lineItems: { orderBy: { createdAt: "desc" } } }, orderBy: { date: "desc" } });
  return <EventsWorkspace initialEvents={serialize(events)} />;
}
