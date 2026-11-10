import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const cookieName = "xao-mi-admin";
export function equal(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a,b);
}
export function signSession(expires: number) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("Cần cấu hình AUTH_SECRET tối thiểu 32 ký tự.");
  return expires + "." + createHmac("sha256", secret).update(String(expires)).digest("hex");
}
export async function isAdmin() {
  const token = (await cookies()).get(cookieName)?.value;
  const expires = Number(token?.split(".")[0]);
  return Boolean(token && process.env.AUTH_SECRET && Number.isSafeInteger(expires) && expires > Date.now() && equal(token, signSession(expires)));
}
