import { NextResponse } from "next/server";
import type { AppDatabase } from "@/types";
import { sanitizeDB } from "@/lib/store";

/** JSON success response whose `db` payload is sanitised (no password hashes). */
export function dbResponse(db: AppDatabase, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ success: true, db: sanitizeDB(db), ...extra });
}

/** Generic JSON success response. */
export function ok(body: Record<string, unknown> = {}) {
  return NextResponse.json({ success: true, ...body });
}

/** JSON error response with a status code. */
export function fail(error: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ success: false, error, ...extra }, { status });
}

/** Safely parse a JSON request body, returning {} on empty/invalid input. */
export async function readBody<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    const text = await req.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

/** Default auth actor used for activity logging when none supplied. */
export function actor(body: { auth?: { userId?: string; username?: string } } | undefined) {
  return body?.auth ?? { userId: "system", username: "system" };
}
