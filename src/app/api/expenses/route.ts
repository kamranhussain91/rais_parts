import type { Expense } from "@/types";
import { readDB, writeDB, logActivity } from "@/lib/store";
import { dbResponse, fail, readBody, actor } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/expenses — record an expense and debit the cash drawer.
export async function POST(req: Request) {
  try {
    const db = await readDB();
    const body = await readBody<{ expense: Expense; auth?: { userId?: string; username?: string } }>(req);
    const expense = body.expense;
    const { userId, username } = actor(body);
    expense.id = "exp_" + Date.now();
    expense.date = new Date().toISOString();
    db.expenses.unshift(expense);
    const cashIdx = db.accounts.findIndex((a) => a.id === "cash_chest");
    if (cashIdx !== -1) {
      db.accounts[cashIdx].balance -= expense.amount;
      db.ledger.unshift({ id: "led_" + Date.now(), bankAccountId: "cash_chest", bankName: "Cash-in-Hand Drawer", date: expense.date, type: "Debit", amount: expense.amount, description: `Expense: ${expense.category} - ${expense.description}`, balanceAfter: db.accounts[cashIdx].balance, referenceId: expense.id });
    }
    logActivity(db, userId!, username!, `Expense [${expense.category}]: Rs. ${expense.amount}`);
    await writeDB(db);
    return dbResponse(db);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
