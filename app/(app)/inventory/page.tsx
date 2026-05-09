import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/api";
import { InventoryWorkspace } from "@/components/inventory/inventory-workspace";

export default async function InventoryPage() {
  const assets = await prisma.inventory.findMany({ orderBy: { category: "asc" } });
  return <InventoryWorkspace initialAssets={serialize(assets)} />;
}
