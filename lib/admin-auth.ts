const COOKIE_NAME = "admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Buffer.from(signature).toString("hex");
}

export async function createAdminSessionToken(): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET!;
  const issuedAt = Date.now().toString();
  const signature = await sign(issuedAt, secret);
  return `${issuedAt}.${signature}`;
}

function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function verifyAdminSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;

  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;

  const expectedSignature = await sign(issuedAt, secret);
  if (!timingSafeStringEqual(signature, expectedSignature)) return false;

  const age = Date.now() - Number(issuedAt);
  if (!Number.isFinite(age) || age > MAX_AGE_SECONDS * 1000) return false;

  return true;
}

export { COOKIE_NAME as ADMIN_COOKIE_NAME, MAX_AGE_SECONDS as ADMIN_COOKIE_MAX_AGE };
