import type { Product } from "@/types";
import { readDB, writeDB, logActivity } from "@/lib/store";
import { dbResponse, fail, readBody, actor } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/products — create (no id) or update (with id) a product.
export async function POST(req: Request) {
  try {
    const db = await readDB();
    const body = await readBody<{ product: Product; auth?: { userId?: string; username?: string } }>(req);
    const product = body.product;
    if (!product) return fail("Missing product", 400);
    const { userId, username } = actor(body);

    if (!product.id) {
      product.id = "prod_" + Date.now();
      db.products.push(product);
      logActivity(db, userId!, username!, `Added product: ${product.name}`);
    } else {
      const idx = db.products.findIndex((p) => p.id === product.id);
      if (idx !== -1) {
        db.products[idx] = product;
        logActivity(db, userId!, username!, `Updated product: ${product.name}`);
      } else {
        db.products.push(product);
      }
    }

    await writeDB(db);
    return dbResponse(db);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
