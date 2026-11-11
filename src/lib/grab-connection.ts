import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";

export const grabMerchantId = "5-C8KGJLKAN3UEEE";
const cookieNames = ["passenger_authn_token", "passenger_authn_token_jti", "grabid-openid-authn-ck", "gfc_session"];
const sessionSchema = z.object({
  cookie: z.string().min(1).max(16384),
  hydraJwt: z.string().min(1).max(8192),
});
export type GrabSession = z.infer<typeof sessionSchema>;
export type GrabConnectionStatus = { connected: boolean; connectedAt: string | null };
const envelopeSchema = z.object({
  version: z.literal(1),
  iv: z.string(),
  tag: z.string(),
  encrypted: z.string(),
  connectedAt: z.iso.datetime(),
});
const context = Buffer.from("xao-mi:grab-session:v1");

export class GrabSyncError extends Error {}
export class GrabSessionError extends GrabSyncError {}

function key() {
  const secret = process.env.GRAB_SESSION_SECRET || process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("Cần cấu hình GRAB_SESSION_SECRET hoặc AUTH_SECRET tối thiểu 32 ký tự.");
  return createHash("sha256").update(secret + ":grab-connection:v1").digest();
}

function database() {
  if (!process.env.DATABASE_URL) throw new Error("Cần kết nối cơ sở dữ liệu để lưu phiên GrabFood.");
  return neon(process.env.DATABASE_URL);
}

function tokenizeCurl(input: string) {
  const command = input.replace(/\^\r?\n|\\\r?\n|`\r?\n/g, " ")
    .replace(/\^\\\^"/g, '\\"').replace(/\^"/g, '"').replace(/\^\^/g, "^");
  const tokens: string[] = [];
  let token = "";
  let quote = "";
  for (let index = 0; index < command.length; index++) {
    const character = command[index];
    if (character === quote) quote = "";
    else if (!quote && (character === "'" || character === '"')) quote = character;
    else if (character === "\\" && quote !== "'" && index + 1 < command.length) token += command[++index];
    else if (!quote && /\s/.test(character)) {
      if (token) tokens.push(token);
      token = "";
    } else token += character;
  }
  if (quote) throw new GrabSessionError("Lệnh cURL chưa đầy đủ. Hãy sao chép lại toàn bộ request.");
  if (token) tokens.push(token);
  return tokens;
}

export function mergeGrabCookies(cookie: string, changes: readonly string[] = []) {
  const values = new Map<string, string>();
  for (const part of cookie.split(";")) {
    const separator = part.indexOf("=");
    const name = part.slice(0, separator).trim();
    if (separator > 0 && cookieNames.includes(name)) values.set(name, part.slice(separator + 1).trim());
  }
  for (const change of changes) {
    const part = change.split(";")[0];
    const separator = part.indexOf("=");
    const name = part.slice(0, separator).trim();
    if (separator > 0 && cookieNames.includes(name)) values.set(name, part.slice(separator + 1).trim());
  }
  return [...cookieNames.filter(name => values.has(name)).map(name => name + "=" + values.get(name)),
    "next-i18next=vi", "gfc_country=VN"].join("; ");
}

export function parseGrabCurl(input: string): GrabSession {
  if (!input.trim() || input.length > 64000) throw new GrabSessionError("Dán toàn bộ cURL của request menu GrabFood, tối đa 64 KB.");
  const tokens = tokenizeCurl(input.trim());
  if (!/^curl(?:\.exe)?$/i.test(tokens[0] ?? "")) throw new GrabSessionError("Nội dung cần bắt đầu bằng lệnh curl.");
  const headers = new Map<string, string>();
  let url = "";
  let cookie = "";
  for (let index = 1; index < tokens.length; index++) {
    const argument = tokens[index];
    if (argument === "--url") url = tokens[++index] ?? "";
    else if (argument.startsWith("https://")) url = argument;
    else if (argument === "-H" || argument === "--header") {
      const header = tokens[++index] ?? "";
      const separator = header.indexOf(":");
      if (separator > 0) headers.set(header.slice(0, separator).toLowerCase(), header.slice(separator + 1).trim());
    } else if (argument === "-b" || argument === "--cookie") cookie = tokens[++index] ?? "";
    else if ((argument === "-X" || argument === "--request") && tokens[++index]?.toUpperCase() !== "GET") {
      throw new GrabSessionError("Chọn request GET lấy thực đơn GrabFood.");
    }
  }
  let target: URL;
  try { target = new URL(url); } catch { throw new GrabSessionError("Không tìm thấy URL menu trong cURL."); }
  if (target.origin !== "https://food.grab.com" || target.pathname !== `/proxy/foodweb/v2/order/merchants/${grabMerchantId}`) {
    throw new GrabSessionError("Chọn request menu đúng quán Xào Mì! trên food.grab.com.");
  }
  cookie = mergeGrabCookies(cookie || headers.get("cookie") || "");
  const hydraJwt = headers.get("x-hydra-jwt") ?? "";
  if (!cookie.includes("gfc_session=") || !cookie.includes("passenger_authn_token=") || !hydraJwt) {
    throw new GrabSessionError("cURL thiếu phiên GrabFood. Đăng nhập Google, chọn Tiếng Việt rồi sao chép lại request menu.");
  }
  const session = sessionSchema.safeParse({ cookie, hydraJwt });
  if (/[\r\n]/.test(cookie + hydraJwt) || !session.success) throw new GrabSessionError("Thông tin phiên trong cURL không hợp lệ.");
  return session.data;
}

async function connectionRow() {
  const sql = database();
  const [row] = await sql`SELECT data->'grabConnection' AS connection,
    md5((data->'grabConnection')::text) AS revision FROM menu_state WHERE id = 1`;
  return row;
}

export async function grabConnectionStatus(): Promise<GrabConnectionStatus> {
  if (!process.env.DATABASE_URL) return { connected: false, connectedAt: null };
  const row = await connectionRow();
  const result = envelopeSchema.safeParse(row?.connection);
  return { connected: result.success, connectedAt: result.success ? result.data.connectedAt : null };
}

export async function readGrabConnection() {
  if (!process.env.DATABASE_URL) return null;
  const row = await connectionRow();
  if (!row?.connection) return null;
  try {
    const envelope = envelopeSchema.parse(row.connection);
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(envelope.iv, "base64"));
    decipher.setAAD(context);
    decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
    const value = Buffer.concat([decipher.update(Buffer.from(envelope.encrypted, "base64")), decipher.final()]);
    return { session: sessionSchema.parse(JSON.parse(value.toString("utf8"))), revision: row.revision as string };
  } catch {
    throw new GrabSessionError("Không đọc được phiên GrabFood đã lưu. Hãy kết nối lại bằng cURL mới.");
  }
}

export async function saveGrabConnection(session: GrabSession, revision: string | null = null) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(context);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(sessionSchema.parse(session)), "utf8"), cipher.final()]);
  const connection = JSON.stringify({
    version: 1, iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"),
    encrypted: encrypted.toString("base64"), connectedAt: new Date().toISOString(),
  });
  const sql = database();
  const rows = await sql`INSERT INTO menu_state (id, data)
    SELECT 1, jsonb_build_object('grabConnection', ${connection}::jsonb)
    WHERE ${revision}::text IS NULL OR EXISTS (SELECT 1 FROM menu_state WHERE id = 1)
    ON CONFLICT (id) DO UPDATE SET data = jsonb_set(menu_state.data, '{grabConnection}', ${connection}::jsonb, true)
    WHERE ${revision}::text IS NULL OR md5((menu_state.data->'grabConnection')::text) = ${revision}
    RETURNING id`;
  return rows.length === 1;
}

export async function clearGrabConnection() {
  const sql = database();
  await sql`UPDATE menu_state SET data = data - 'grabConnection' WHERE id = 1`;
}
