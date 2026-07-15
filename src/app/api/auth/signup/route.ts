import type { User } from "@/types";
import { readDB, writeDB, logActivity, publicUser } from "@/lib/store";
import { fail, ok, readBody } from "@/lib/http";
import { hashPassword, normalizeEmail } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth/signup — real registration. The FIRST account becomes the
// Super Admin owner; later signups default to Cashier (an admin can promote).
export async function POST(req: Request) {
  try {
    const body = await readBody<{ name?: string; email?: string; password?: string; username?: string }>(req);
    const name = (body.name || "").trim();
    const email = normalizeEmail(body.email || "");
    const password = body.password || "";

    if (!name) return fail("Name is required", 400);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("A valid email is required", 400);
    if (password.length < 4) return fail("Password must be at least 4 characters", 400);

    const db = await readDB();
    if (db.users.some((u) => normalizeEmail(u.email || "") === email || u.username === email)) {
      return fail("An account with this email already exists", 409);
    }

    const isFirstUser = db.users.length === 0;
    const user: User = {
      id: "user_" + Date.now(),
      username: body.username?.trim() || email,
      email,
      name,
      role: isFirstUser ? "Super Admin" : "Cashier",
      passwordHash: hashPassword(password),
      status: "Active",
      lastLogin: new Date().toISOString(),
    };

    db.users.push(user);
    logActivity(db, user.id, user.username, `Signed up (${user.role})`);
    await writeDB(db);

    return ok({ user: publicUser(user) });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
