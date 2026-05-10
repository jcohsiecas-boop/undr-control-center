import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/api";
import { EventDetailWorkspace } from "@/components/events/event-detail-workspace";

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      lineItems: { include: { actionedBy: true }, orderBy: { createdAt: "desc" } }
    }
  });
  if (!event) notFound();
  return <EventDetailWorkspace initialEvent={serialize(event)} />;
}
