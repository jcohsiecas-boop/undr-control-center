import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, response: null };
}

export function serialize<T>(data: T): any {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (typeof value === "bigint" ? value.toString() : value))
  );
}
