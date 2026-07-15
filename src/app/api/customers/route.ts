import type { Customer } from "@/types";
import { readDB, writeDB, logActivity } from "@/lib/store";
import { dbResponse, fail, readBody, actor } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/customers — create a customer.
export async function POST(req: Request) {
  try {
    const db = await readDB();
    const body = await readBody<{ customer: Customer; auth?: { userId?: string; username?: string } }>(req);
    const { userId, username } = actor(body);
    const customer = body.customer;
    customer.id = "cust_" + Date.now();
    customer.creditBalance = customer.creditBalance || 0;
    db.customers.push(customer);
    logActivity(db, userId!, username!, `Customer added: ${customer.name}`);
    await writeDB(db);
    return dbResponse(db);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
