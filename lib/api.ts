import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export type JsonSerialized<T> = T extends { toJSON(): infer R }
  ? R
  : T extends Array<infer U>
    ? JsonSerialized<U>[]
    : T extends object
      ? { [K in keyof T]: JsonSerialized<T[K]> }
      : T;

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, response: null };
}

export function serialize<T>(data: T): JsonSerialized<T> {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (typeof value === "bigint" ? value.toString() : value))
  );
}
