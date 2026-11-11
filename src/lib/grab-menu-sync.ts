import "server-only";
import { z } from "zod";
import { dishNameKey, localizeGrabDish, type PlatformDraftDish } from "./catalog";
import grabSnapshot from "./grab-snapshot.json";
import beSnapshot from "./be-snapshot.json";
import { grabMerchantId, GrabSessionError, GrabSyncError, mergeGrabCookies, readGrabConnection, saveGrabConnection, type GrabSession } from "./grab-connection";

const merchantId = grabMerchantId;
const item = z.object({
  ID: z.string().min(1),
  name: z.string().trim().min(1),
  available: z.boolean(),
  imgHref: z.string().optional(),
  description: z.string().optional(),
  price: z.number().int().nonnegative().optional(),
  priceInMinorUnit: z.number().int().nonnegative().optional(),
  discountedPriceInMin: z.number().int().nonnegative().optional(),
  priceV2: z.object({ amountInMinor: z.number().int().nonnegative() }).optional(),
  discountedPriceV2: z.object({ amountInMinor: z.number().int().nonnegative() }).optional(),
});
const payload = z.object({ merchant: z.object({
  ID: z.literal(merchantId),
  currency: z.object({ code: z.string() }).optional(),
  menuLanguageList: z.array(z.object({ languageCode: z.string(), isAppliedOnMenu: z.boolean().optional() })).optional(),
  menu: z.object({ categories: z.array(z.object({
    name: z.string().trim().min(1), available: z.boolean(), items: z.array(item),
  })).min(1) }),
}) });
const recommendationCategories = new Set(["Today's Offer", "For You", "Ưu đãi hôm nay", "Dành cho bạn"]);
const verifiedPrices = new Map(grabSnapshot.map(dish => [dish.id, dish]));

export function withVerifiedGrabPrices(dish: PlatformDraftDish): PlatformDraftDish {
  const verified = verifiedPrices.get(dish.id);
  if (dish.price !== null || !verified || dishNameKey(verified.name) !== dishNameKey(localizeGrabDish(dish).name)) return dish;
  return { ...dish, price: verified.price, originalPrice: verified.originalPrice };
}

export function completeGrabMenu(source: readonly PlatformDraftDish[], beDishes: readonly PlatformDraftDish[]): PlatformDraftDish[] {
  const dishes = source.filter(dish => !dish.supplementedFrom).map(dish =>
    withVerifiedGrabPrices(localizeGrabDish(dish, beDishes)));
  const names = new Set(dishes.map(dish => dishNameKey(dish.name)));
  for (const dish of beDishes) {
    const key = dishNameKey(dish.name);
    if (names.has(key)) continue;
    names.add(key);
    dishes.push({
      ...dish,
      id: `be-fallback-${dish.id}`,
      price: null,
      originalPrice: undefined,
      supplementedFrom: "be",
    });
  }
  return dishes;
}

export function parseGrabMenu(value: unknown, native = false): PlatformDraftDish[] {
  const { merchant } = payload.parse(value);
  if (native && (merchant.currency?.code !== "VND" ||
    !merchant.menuLanguageList?.some(language => language.languageCode === "vi" && language.isAppliedOnMenu))) {
    throw new GrabSessionError("GrabFood chưa trả menu tiếng Việt. Chọn Tiếng Việt trên GrabFood rồi kết nối lại.");
  }
  const dishes = new Map<string, PlatformDraftDish>();
  for (const category of merchant.menu.categories) {
    if (!category.available || recommendationCategories.has(category.name)) continue;
    for (const entry of category.items) {
      if (dishes.has(entry.ID)) continue;
      const basePrice = entry.priceV2?.amountInMinor ?? entry.priceInMinorUnit ?? entry.price ?? null;
      const discountedPrice = entry.discountedPriceV2?.amountInMinor ?? entry.discountedPriceInMin;
      const hasDiscount = basePrice !== null && discountedPrice !== undefined && discountedPrice < basePrice;
      dishes.set(entry.ID, {
        id: entry.ID,
        name: entry.name,
        price: hasDiscount ? discountedPrice : basePrice,
        originalPrice: hasDiscount ? basePrice : undefined,
        category: category.name,
        available: entry.available,
        description: entry.description ?? "",
        ingredients: "",
        image: entry.imgHref?.startsWith("https://huawei-food-cms.grab.com/") ? entry.imgHref : undefined,
        ...(native ? { textSource: "grab" as const } : {}),
      });
    }
  }
  if (!dishes.size) throw new Error("Không tìm thấy menu GrabFood hợp lệ.");
  if (native && [...dishes.values()].some(dish => dish.price === null)) {
    throw new GrabSyncError("GrabFood chưa trả đủ giá món. Hãy thử đồng bộ lại.");
  }
  return [...dishes.values()];
}

async function grabRequest(url: string, options: RequestInit) {
  let response: Response;
  try {
    response = await fetch(url, { ...options, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(8000) });
  } catch {
    throw new GrabSyncError("Không kết nối được GrabFood. Hãy thử lại.");
  }
  if ([400, 401, 403].includes(response.status) || (response.status >= 300 && response.status < 400)) {
    throw new GrabSessionError("Phiên GrabFood không còn hợp lệ. Đăng nhập Google và cập nhật cURL trong Kết nối GrabFood.");
  }
  if (response.status === 429) throw new GrabSyncError("GrabFood đang giới hạn yêu cầu. Hãy chờ vài phút rồi đồng bộ lại.");
  if (!response.ok) throw new GrabSyncError("GrabFood tạm thời chưa trả được thực đơn. Hãy thử lại.");
  return response;
}

export async function verifyGrabSession(session: GrabSession) {
  const refresh = await grabRequest("https://food.grab.com/auth/access-token", {
    method: "POST",
    headers: {
      Cookie: session.cookie, "X-Grab-Request": "1", Origin: "https://food.grab.com",
      Referer: "https://food.grab.com/vn/vi/", "Accept-Language": "vi",
    },
  });
  const { token } = z.object({ token: z.string().min(1).max(16384) }).parse(await refresh.json());
  const refreshed = { ...session, cookie: mergeGrabCookies(session.cookie, refresh.headers.getSetCookie()) };
  const response = await grabRequest(`https://food.grab.com/proxy/foodweb/v2/order/merchants/${merchantId}?latlng=21.0278,105.8342`, {
    headers: {
      Cookie: refreshed.cookie, "X-GFC-Session": token, "X-Hydra-JWT": refreshed.hydraJwt,
      "Accept-Language": "vi", "X-GFC-Country": "VN", "X-Country-Code": "VN",
    },
  });
  return { session: refreshed, dishes: parseGrabMenu(await response.json(), true) };
}

export async function fetchGrabMenu(beDishes: readonly PlatformDraftDish[] = beSnapshot): Promise<PlatformDraftDish[]> {
  const connection = await readGrabConnection();
  if (connection) {
    const { dishes, session } = await verifyGrabSession(connection.session);
    if (session.cookie !== connection.session.cookie) {
      await saveGrabConnection(session, connection.revision);
    }
    return completeGrabMenu(dishes, beDishes);
  }
  const response = await fetch(`https://food.grab.com/proxy/foodweb/merchants/${merchantId}`, {
    cache: "no-store", signal: AbortSignal.timeout(8000),
    headers: { "Accept-Language": "vi-VN,vi;q=0.9" },
  });
  if (!response.ok) throw new Error(`GrabFood trả HTTP ${response.status}.`);
  return completeGrabMenu(parseGrabMenu(await response.json()), beDishes);
}
