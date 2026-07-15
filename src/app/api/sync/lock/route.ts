import { readState, writeState } from "@/lib/store";
import { fail, ok, readBody } from "@/lib/http";
import { PARTS_LOCKS_KEY, type PartsLocks } from "@/lib/fbr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/sync/lock — acquire or release a stock lock for a product/terminal.
export async function POST(req: Request) {
  try {
    const body = await readBody<{ productId?: string; terminalId?: string; action?: string }>(req);
    const { productId, terminalId, action } = body;
    if (!productId || !terminalId) return fail("Missing productId or terminalId", 400);

    const locks = await readState<PartsLocks>(PARTS_LOCKS_KEY, {});

    if (action === "acquire") {
      const existing = locks[productId];
      if (existing && existing.terminalId !== terminalId) {
        return fail(`Item locked by terminal '${existing.terminalId}'`, 409);
      }
      locks[productId] = { terminalId, lockTime: new Date().toISOString() };
      await writeState(PARTS_LOCKS_KEY, locks);
      return ok({ message: "Lock acquired" });
    }

    delete locks[productId];
    await writeState(PARTS_LOCKS_KEY, locks);
    return ok({ message: "Lock released" });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
