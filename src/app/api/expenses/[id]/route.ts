import type { Expense } from "@/types";
import { readDB, writeDB, logActivity } from "@/lib/store";
import { dbResponse, fail, readBody, actor } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PUT /api/expenses/:id — edit an expense and adjust the ledger by the difference.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await readDB();
    const body = await readBody<{ category?: Expense["category"]; amount?: number; description?: string; date?: string; auth?: { userId?: string; username?: string } }>(req);
    const { userId, username } = actor(body);
    const idx = db.expenses.findIndex((e) => e.id === id);
    if (idx === -1) return fail("Expense not found", 404);
    const old = db.expenses[idx];
    const { category, amount, description, date } = body;
    const newAmount = Number(amount) || old.amount;
    const diff = newAmount - old.amount;
    db.expenses[idx] = { ...old, category: category || old.category, amount: newAmount, description: description || old.description, date: date || old.date };
    if (diff !== 0) {
      const accId = (old as { bankAccountId?: string }).bankAccountId || "cash_chest";
      const accIdx = db.accounts.findIndex((a) => a.id === accId);
      if (accIdx !== -1) {
        db.accounts[accIdx].balance -= diff;
        db.ledger.unshift({ id: "led_" + Date.now(), bankAccountId: accId, bankName: db.accounts[accIdx].bankName, date: new Date().toISOString(), type: "Debit", amount: Math.abs(diff), description: `Expense correction: ${db.expenses[idx].category} - ${db.expenses[idx].description}`, balanceAfter: db.accounts[accIdx].balance, referenceId: old.id });
      }
    }
    logActivity(db, userId!, username!, `Expense updated [${db.expenses[idx].category}]: Rs. ${newAmount}`);
    await writeDB(db);
    return dbResponse(db);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}

// DELETE /api/expenses/:id — remove an expense and reverse its ledger impact.
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await readDB();
    const body = await readBody<{ auth?: { userId?: string; username?: string } }>(req);
    const { userId, username } = actor(body);
    const idx = db.expenses.findIndex((e) => e.id === id);
    if (idx === -1) return fail("Expense not found", 404);
    const exp = db.expenses[idx];
    const accId = (exp as { bankAccountId?: string }).bankAccountId || "cash_chest";
    const accIdx = db.accounts.findIndex((a) => a.id === accId);
    if (accIdx !== -1) {
      db.accounts[accIdx].balance += exp.amount;
      db.ledger.unshift({ id: "led_" + Date.now(), bankAccountId: accId, bankName: db.accounts[accIdx].bankName, date: new Date().toISOString(), type: "Credit", amount: exp.amount, description: `Expense reversal: ${exp.category} - ${exp.description}`, balanceAfter: db.accounts[accIdx].balance, referenceId: exp.id });
    }
    db.expenses.splice(idx, 1);
    logActivity(db, userId!, username!, `Expense deleted [${exp.category}]: Rs. ${exp.amount}`);
    await writeDB(db);
    return dbResponse(db);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
