import "server-only";
import { z } from "zod";
import { dishNameKey, localizeGrabDish, type PlatformDraftDish } from "./catalog";
import grabSnapshot from "./grab-snapshot.json";
import beSnapshot from "./be-snapshot.json";

const merchantId = "5-C8KGJLKAN3UEEE";
const item = z.object({
  ID: z.string().min(1),
  name: z.string().trim().min(1),
  available: z.boolean(),
  imgHref: z.string().optional(),
  description: z.string().optional(),
  price: z.number().int().nonnegative().optional(),
});
const payload = z.object({ merchant: z.object({
  ID: z.literal(merchantId),
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

export async function fetchGrabMenu(beDishes: readonly Pick<PlatformDraftDish, "name" | "description">[] = beSnapshot): Promise<PlatformDraftDish[]> {
  const response = await fetch(`https://food.grab.com/proxy/foodweb/merchants/${merchantId}`, {
    cache: "no-store", signal: AbortSignal.timeout(8000),
    headers: { "Accept-Language": "vi-VN,vi;q=0.9" },
  });
  if (!response.ok) throw new Error(`GrabFood trả HTTP ${response.status}.`);
  const { merchant } = payload.parse(await response.json());
  const dishes = new Map<string, PlatformDraftDish>();
  for (const category of merchant.menu.categories) {
    if (!category.available || recommendationCategories.has(category.name)) continue;
    for (const entry of category.items) {
      if (dishes.has(entry.ID)) continue;
      dishes.set(entry.ID, localizeGrabDish({
        id: entry.ID,
        name: entry.name,
        price: entry.price ?? null,
        category: category.name,
        available: entry.available,
        description: entry.description ?? "",
        ingredients: "",
        image: entry.imgHref?.startsWith("https://huawei-food-cms.grab.com/") ? entry.imgHref : undefined,
      }, beDishes));
    }
  }
  if (!dishes.size) throw new Error("Không tìm thấy menu GrabFood hợp lệ.");
  return [...dishes.values()].map(withVerifiedGrabPrices);
}
