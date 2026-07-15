import { readDB, writeDB, publicUser } from "@/lib/store";
import { fail, ok, readBody } from "@/lib/http";
import { verifyPassword, normalizeEmail, signToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth/login — verify email + password against Neon.
export async function POST(req: Request) {
  try {
    const body = await readBody<{ email?: string; password?: string }>(req);
    const email = normalizeEmail(body.email || "");
    const password = body.password || "";
    if (!email || !password) return fail("Email and password are required", 400);

    const db = await readDB();
    const user = db.users.find(
      (u) => (normalizeEmail(u.email || "") === email || u.username === email) && u.status !== "Inactive",
    );

    // Support hashed passwords (normal) and any legacy plaintext password field.
    const valid = user
      ? verifyPassword(password, user.passwordHash) || (!!user.password && user.password === password)
      : false;
    if (!user || !valid) return fail("Invalid email or password", 401);

    user.lastLogin = new Date().toISOString();
    await writeDB(db);

    const token = signToken({ uid: user.id, ts: Date.now() });
    return ok({ user: publicUser(user), token });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
