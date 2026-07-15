import { NextResponse } from "next/server";
import { readState } from "@/lib/store";
import { fail } from "@/lib/http";
import { MULTI_TERMINALS, PARTS_LOCKS_KEY, type PartsLocks } from "@/lib/fbr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/sync/terminals — configured terminals + active stock locks.
export async function GET() {
  try {
    const locks = await readState<PartsLocks>(PARTS_LOCKS_KEY, {});
    return NextResponse.json({ terminals: MULTI_TERMINALS, locks });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
