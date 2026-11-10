import "server-only";
import { z } from "zod";
import type { MenuDish } from "./catalog";

const restaurantId = 153593;
const source = `https://food.be.com.vn/api/v1/restaurants/${restaurantId}/menu`;
const price = z.number().int().nonnegative();
const item = z.object({
  restaurant_item_id: z.number().int().positive(),
  restaurant_id: z.literal(restaurantId),
  item_name: z.string().trim().min(1),
  item_details: z.string().nullish(),
  price,
  old_price: price.nullish(),
  item_image: z.string().nullish(),
  item_image_compressed_web: z.string().nullish(),
  is_active: z.union([z.literal(0), z.literal(1)]).optional(),
});
const menuPayload = z.object({
  categories: z.array(z.object({
    category_id: z.number().int(),
    category_name: z.string().trim().min(1),
    category_active: z.union([z.literal(0), z.literal(1)]),
    items: z.array(item),
  })).min(1),
});

export async function fetchBeMenu(): Promise<MenuDish[]> {
  const response = await fetch(source, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`beFood trả HTTP ${response.status}.`);
  const menu = menuPayload.parse(await response.json());
  const dishes = new Map<string, MenuDish>();
  for (const category of menu.categories) {
    if (category.category_id === 0 || !category.category_active) continue;
    for (const entry of category.items) {
      const id = String(entry.restaurant_item_id);
      if (dishes.has(id)) continue;
      const photo = entry.item_image_compressed_web || entry.item_image;
      dishes.set(id, {
        id,
        name: entry.item_name,
        category: category.category_name === "Nước giải khát" ? "Đồ uống" : category.category_name,
        price: entry.price,
        originalPrice: entry.old_price ?? undefined,
        image: photo?.startsWith("https://media.be.com.vn/") ? photo : undefined,
        description: entry.item_details?.trim() ?? "",
        ingredients: "",
        available: entry.is_active !== 0,
      });
    }
  }
  if (!dishes.size) throw new Error("Không tìm thấy menu beFood hợp lệ.");
  return [...dishes.values()];
}
