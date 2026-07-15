import { readState, writeState } from "@/lib/store";
import { fail, ok, readBody } from "@/lib/http";
import { DEFAULT_FBR_CONFIG, FBR_CONFIG_KEY, type FbrConfig } from "@/lib/fbr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/fbr/config — update FBR gateway config (persisted in Neon).
export async function POST(req: Request) {
  try {
    const body = await readBody<Partial<FbrConfig>>(req);
    const config = await readState<FbrConfig>(FBR_CONFIG_KEY, DEFAULT_FBR_CONFIG);

    if (body.internetStatus) config.internetStatus = body.internetStatus;
    if (body.fbrServerStatus) config.fbrServerStatus = body.fbrServerStatus;
    if (body.apiUrl) config.apiUrl = body.apiUrl;
    if (body.apiKey) config.apiKey = body.apiKey;
    if (body.apiSecret) config.apiSecret = body.apiSecret;

    await writeState(FBR_CONFIG_KEY, config);
    return ok({ config });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
