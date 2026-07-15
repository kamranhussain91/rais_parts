import type { Customer } from "@/types";
import { readDB, writeDB, logActivity } from "@/lib/store";
import { dbResponse, fail, readBody, actor } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PUT /api/customers/:id — update a customer.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await readDB();
    const body = await readBody<{ customer: Partial<Customer>; auth?: { userId?: string; username?: string } }>(req);
    const { userId, username } = actor(body);
    const idx = db.customers.findIndex((c) => c.id === id);
    if (idx === -1) return fail("Customer not found", 404);
    db.customers[idx] = { ...db.customers[idx], ...body.customer };
    logActivity(db, userId!, username!, `Customer updated: ${db.customers[idx].name}`);
    await writeDB(db);
    return dbResponse(db);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}

// DELETE /api/customers/:id — delete a customer.
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await readDB();
    const body = await readBody<{ auth?: { userId?: string; username?: string } }>(req);
    const { userId, username } = actor(body);
    const idx = db.customers.findIndex((c) => c.id === id);
    if (idx === -1) return fail("Customer not found", 404);
    const name = db.customers[idx].name;
    db.customers.splice(idx, 1);
    logActivity(db, userId!, username!, `Customer deleted: ${name}`);
    await writeDB(db);
    return dbResponse(db);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
