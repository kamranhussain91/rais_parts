import type { BankLedgerEntry } from "@/types";
import { readDB, writeDB, logActivity } from "@/lib/store";
import { dbResponse, fail, readBody, actor } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/bank-accounts/transaction — record a manual credit/debit on an account.
export async function POST(req: Request) {
  try {
    const db = await readDB();
    const body = await readBody<{
      id: string;
      type: "Credit" | "Debit";
      amount: number;
      description: string;
      auth?: { userId?: string; username?: string };
    }>(req);
    const { id, type, amount, description } = body;
    const { userId, username } = actor(body);
    const accIdx = db.accounts.findIndex((a) => a.id === id);
    if (accIdx === -1) return fail("Account not found", 404);
    const acc = db.accounts[accIdx];
    if (type === "Credit") acc.balance += amount;
    else acc.balance -= amount;
    const entry: BankLedgerEntry = {
      id: "led_" + Date.now(),
      bankAccountId: id,
      bankName: acc.bankName,
      date: new Date().toISOString(),
      type,
      amount,
      description,
      balanceAfter: acc.balance,
    };
    db.ledger.unshift(entry);
    logActivity(db, userId!, username!, `Manual ${type} on ${acc.bankName}: Rs. ${amount}`);
    await writeDB(db);
    return dbResponse(db);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
