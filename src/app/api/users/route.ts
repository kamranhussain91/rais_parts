import type { User } from "@/types";
import { readDB, writeDB, logActivity } from "@/lib/store";
import { dbResponse, fail, readBody, actor } from "@/lib/http";
import { hashPassword, normalizeEmail } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/users — create (no id) or update (with id) a user.
export async function POST(req: Request) {
  try {
    const db = await readDB();
    const body = await readBody<{ user: User; auth?: { userId?: string; username?: string } }>(req);
    const user = body.user;
    const { userId, username } = actor(body);

    // Normalize email if provided.
    if (user.email) user.email = normalizeEmail(user.email);

    // Only hash when a new non-empty password is supplied; otherwise ensure no
    // blank password/passwordHash keys clobber the existing stored hash.
    if (typeof user.password === "string" && user.password.length > 0) {
      user.passwordHash = hashPassword(user.password);
      delete user.password;
    } else {
      delete user.password;
      delete user.passwordHash;
    }

    if (!user.id) {
      user.id = "user_" + Date.now();
      if (!user.status) user.status = "Active";
      db.users.push(user);
      logActivity(db, userId!, username!, `Added user: ${user.name} (${user.role})`);
    } else {
      const idx = db.users.findIndex((u) => u.id === user.id);
      if (idx !== -1) {
        db.users[idx] = { ...db.users[idx], ...user };
        logActivity(db, userId!, username!, `Updated user: ${user.name}`);
      } else {
        db.users.push(user);
      }
    }

    await writeDB(db);
    return dbResponse(db);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
