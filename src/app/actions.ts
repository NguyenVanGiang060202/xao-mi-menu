"use server";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put } from "@vercel/blob";
import { z } from "zod";
import { cookieName, equal, isAdmin, signSession } from "@/lib/admin-auth";
import { changeSeasonSchedule, publishAppearance, publishPlatformMenu, readStore, saveShopDishChanges, saveValue, syncBeShopDishes } from "@/lib/store";
import { fetchBeMenu } from "@/lib/be-menu-sync";
import { fetchGrabMenu, verifyGrabSession } from "@/lib/grab-menu-sync";
import { clearGrabConnection, grabConnectionStatus, GrabSessionError, GrabSyncError, parseGrabCurl, saveGrabConnection } from "@/lib/grab-connection";
import { platformMenus, type Platform, type PlatformDraftDish } from "@/lib/catalog";
import { themeNames } from "@/lib/menu-data";
import { readMenuTracking } from "@/lib/menu-tracking";
import { trackingPeriods } from "@/lib/tracking-data";

async function requireAdmin() {
  if (!await isAdmin()) throw new Error("Bạn cần đăng nhập.");
}

export async function getMenuTracking(value: unknown) {
  await requireAdmin();
  const period = trackingPeriods.find((days) => days === value);
  if (!period) throw new Error("Khoảng thời gian không hợp lệ.");
  return readMenuTracking(period);
}

export async function getGrabConnectionStatus() {
  await requireAdmin();
  return grabConnectionStatus();
}

export async function connectGrabFood(value: unknown) {
  await requireAdmin();
  if (typeof value !== "string") return { ok: false as const, message: "Dán cURL của request menu GrabFood." };
  try {
    const { session, dishes } = await verifyGrabSession(parseGrabCurl(value));
    if (!await saveGrabConnection(session)) throw new Error("Connection was not saved");
    revalidatePath("/admin");
    return {
      ok: true as const, connection: await grabConnectionStatus(),
      message: `Đã kết nối GrabFood và xác nhận ${dishes.length} món với tên, mô tả và giá gốc.`,
    };
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof GrabSyncError ? error.message : "Không kết nối được GrabFood. Kiểm tra cURL, kết nối mạng và cấu hình lưu phiên rồi thử lại.",
    };
  }
}

export async function disconnectGrabFood() {
  await requireAdmin();
  await clearGrabConnection();
  revalidatePath("/admin");
  return { ok: true as const, message: "Đã ngắt kết nối phiên GrabFood." };
}

const syncTargetSchema = z.enum(["grab", "be", "xanh"]);

async function fetchPlatformMenu(platform: Platform, beDishes?: PlatformDraftDish[]): Promise<PlatformDraftDish[]> {
  if (platform !== "grab") return fetchBeMenu();
  const references = await fetchBeMenu().catch(() => beDishes);
  return fetchGrabMenu(references);
}

function menuDigest(dishes: PlatformDraftDish[]) {
  return createHash("sha256").update(JSON.stringify(dishes)).digest("hex");
}

export async function previewPlatformMenu(value: unknown) {
  await requireAdmin();
  const platform = syncTargetSchema.parse(value);
  const canPublish = Boolean(process.env.DATABASE_URL);
  try {
    const store = await readStore();
    const dishes = await fetchPlatformMenu(platform, store.beMenu?.dishes);
    const published = store[platformMenus[platform].key];
    return { ok: true as const, dishes, digest: menuDigest(dishes), previousSync: published?.syncedAt ?? "", canPublish };
  } catch (error) {
    return {
      ok: false as const,
      needsGrabConnection: error instanceof GrabSessionError,
      message: error instanceof GrabSyncError ? error.message : "Không lấy được thực đơn mới. Hãy thử lại.",
    };
  }
}

export async function login(form: FormData) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || (process.env.NODE_ENV !== "development" && password.length < 12) || !equal(String(form.get("password") ?? ""), password)) redirect("/admin?error=1");
  const maxAge = 8 * 60 * 60;
  (await cookies()).set(cookieName, signSession(Date.now() + maxAge * 1000), {
    maxAge, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/",
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(cookieName);
  redirect("/admin");
}

const imageUrl = z.union([z.literal(""), z.url().refine(value => new URL(value).protocol === "https:")]);
const dishPrice = z.number().int().min(0).max(100000000);

export async function confirmPlatformMenu(value: unknown) {
  await requireAdmin();
  if (!process.env.DATABASE_URL) return { ok: false, message: "Cần cấu hình DATABASE_URL để công bố menu." };
  const parsed = z.object({
    platform: syncTargetSchema,
    previousSync: z.union([z.literal(""), z.iso.datetime()]),
    digest: z.string().regex(/^[a-f0-9]{64}$/),
  }).safeParse(value);
  if (!parsed.success) return { ok: false, message: "Bản duyệt không hợp lệ. Hãy đồng bộ lại." };
  const { platform, digest, previousSync } = parsed.data;
  const store = await readStore();
  let dishes: PlatformDraftDish[];
  try {
    dishes = await fetchPlatformMenu(platform, store.beMenu?.dishes);
  } catch (error) {
    return {
      ok: false, needsGrabConnection: error instanceof GrabSessionError,
      message: error instanceof GrabSyncError ? error.message : "Không lấy được thực đơn để công bố. Hãy thử lại.",
    };
  }
  if (menuDigest(dishes) !== digest) {
    return { ok: false, message: "Thực đơn trên nền tảng đã thay đổi. Hãy bỏ bản duyệt và đồng bộ lại." };
  }
  if (!await publishPlatformMenu(platform, dishes, previousSync)) {
    return { ok: false, message: "Menu đã được cập nhật ở phiên khác. Hãy tải lại để duyệt bản mới." };
  }
  return { ok: true, message: `Đã công bố ${dishes.length} món lên tab ${platformMenus[platform].label}.` };
}

export async function syncBeToShop() {
  await requireAdmin();
  if (!process.env.DATABASE_URL) return { ok: false, message: "Cần kết nối cơ sở dữ liệu để đồng bộ Menu quán." };

  const result = await syncBeShopDishes(await fetchBeMenu());
  if (!result) return { ok: false, message: "Menu quán vừa được chỉnh sửa. Hãy bấm đồng bộ lại." };
  const { added, updated } = result;
  if (!added && !updated) return { ok: true, message: "Menu quán đã đồng bộ với beFood." };

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, message: `Đã đồng bộ Menu quán từ beFood. Thêm ${added} món, cập nhật ${updated} món.` };
}
const color = z.string().regex(/^#[0-9a-f]{6}$/i);
const appearanceSchema = z.object({
  theme: z.enum(themeNames),
  greeting: z.string().trim().max(52),
  accent: color,
  background: z.union([z.literal(""), color]),
  image: imageUrl,
  logo: imageUrl,
});

export async function updateTheme(mode: "appearance" | "draft", value: unknown) {
  await requireAdmin();
  const appearance = appearanceSchema.parse(value);
  if (mode === "appearance") {
    await publishAppearance(appearance);
    revalidatePath("/");
  } else if (mode === "draft") {
    await saveValue("draft", appearance);
  }
}

export async function updateSeasonSchedule(value: unknown, start: number, end: number, previousStart: number | null) {
  await requireAdmin();
  const appearance = appearanceSchema.parse(value);
  if (![start, end].every(time => Number.isSafeInteger(time) && time > 0 && time <= 253402300799999)
    || end <= start || end <= Date.now() || (previousStart !== null && !Number.isSafeInteger(previousStart))) {
    return "Kiểm tra lại thời gian bắt đầu và kết thúc.";
  }
  const error = await changeSeasonSchedule({ appearance, start, end }, previousStart);
  if (!error) revalidatePath("/");
  return error;
}

export async function cancelSchedule(start: number) {
  await requireAdmin();
  if (!Number.isSafeInteger(start)) return "Lịch không hợp lệ.";
  const error = await changeSeasonSchedule(null, start);
  if (!error) revalidatePath("/");
  return error;
}

export async function updateShop(form: FormData) {
  await requireAdmin();
  const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
  const hours = z.object({ open: time, close: time }).refine(({ open, close }) => open < close);
  const schedule = z.object({ weekday: hours, weekend: hours }).parse({
    weekday: { open: form.get("weekday-open"), close: form.get("weekday-close") },
    weekend: { open: form.get("weekend-open"), close: form.get("weekend-close") },
  });
  await saveValue("shop", { branch: "", hours: "", schedule });
  revalidatePath("/");
}

const voucherSchema = z.object({
  title: z.string().trim().min(1).max(100),
  code: z.string().trim().max(40),
  terms: z.string().trim().min(1).max(350),
  start: z.iso.datetime(),
  end: z.iso.datetime(),
}).refine(voucher => Date.parse(voucher.end) > Date.parse(voucher.start));

export async function updateVouchers(value: unknown) {
  await requireAdmin();
  const vouchers = z.object({ grab: z.array(voucherSchema).max(20), be: z.array(voucherSchema).max(20) }).parse(value);
  await saveValue("vouchers", vouchers);
}

export async function updateShopMenu(value: unknown) {
  await requireAdmin();
  if (!process.env.DATABASE_URL) return { ok: false, message: "Cần kết nối cơ sở dữ liệu để lưu Menu quán." };
  const id = z.string().min(1).max(80);
  const dish = z.object({
    id, name: z.string().trim().min(1).max(120),
    category: z.string().trim().min(1).max(80), description: z.string().max(500),
    ingredients: z.string().max(500), price: dishPrice,
    tag: z.string().trim().max(40).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(5).optional(),
    available: z.boolean(), image: imageUrl.optional(),
  });
  const parsed = z.object({
    revision: z.string().regex(/^(?:[a-f0-9]{32})?$/),
    changed: z.array(dish),
    removedIds: z.array(id),
  }).safeParse(value);
  if (!parsed.success) return { ok: false, message: "Thông tin món không hợp lệ. Kiểm tra tên, danh mục và giá." };

  const { revision, changed, removedIds } = parsed.data;
  if (!await saveShopDishChanges(revision, changed, removedIds)) {
    return { ok: false, message: "Menu quán đã thay đổi ở phiên khác. Hãy bỏ bản chỉnh sửa để tải menu mới." };
  }
  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, message: "Đã lưu và cập nhật Menu quán trên trang khách." };
}

export async function uploadImage(form: FormData) {
  await requireAdmin();
  const file = form.get("image");
  if (!(file instanceof File) || !file.size || file.size > 3_000_000) throw new Error("Ảnh phải nhỏ hơn 3 MB.");
  const header = Buffer.from(await file.slice(0, 12).arrayBuffer());
  const format = header.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")) ? "png" :
    header.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex")) ? "jpeg" :
    header.toString("ascii", 0, 4) === "RIFF" && header.toString("ascii", 8, 12) === "WEBP" ? "webp" : null;
  if (!format) throw new Error("Chọn ảnh PNG, JPEG hoặc WebP.");
  const blob = await put("menu/" + crypto.randomUUID() + "." + format, file, { access: "public", contentType: "image/" + format });
  return blob.url;
}
