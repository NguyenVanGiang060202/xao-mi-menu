import { dishNameKey, type PlatformDraftDish } from "./catalog";
import { getDishTags } from "./menu-data";

export type PlatformDishChange = {
  id: string;
  name: string;
  category?: string;
  description?: string;
  ingredients?: string;
  price: number | null;
  originalPrice: number | null;
  available: boolean;
  image?: string;
  tag?: string;
  tags?: string[];
};

export function applyPlatformDishChanges(
  dishes: readonly PlatformDraftDish[],
  changes: readonly PlatformDishChange[],
  removedIds?: readonly string[],
  orderedIds?: readonly string[]
): PlatformDraftDish[] {
  const removedSet = new Set(removedIds ?? []);
  const byId = new Map(dishes.filter(d => !removedSet.has(d.id)).map(dish => [dish.id, dish]));

  for (const change of changes) {
    if (removedSet.has(change.id)) continue;
    const existing = byId.get(change.id);
    const updated: PlatformDraftDish = {
      ...(existing ?? {
        id: change.id,
        category: change.category ?? "Mì xào",
        description: "",
        ingredients: "",
      }),
      name: change.name,
      ...(change.category !== undefined ? { category: change.category } : {}),
      ...(change.description !== undefined ? { description: change.description } : {}),
      ...(change.ingredients !== undefined ? { ingredients: change.ingredients } : {}),
      price: change.price,
      available: change.available,
      originalPrice: change.originalPrice === null ? undefined : change.originalPrice,
      image: change.image || undefined,
      tag: change.tag,
      tags: change.tags,
    };
    byId.set(change.id, updated);
  }

  const result = [...byId.values()];
  if (orderedIds?.length) {
    const orderMap = new Map(orderedIds.map((id, index) => [id, index]));
    result.sort((a, b) => {
      const idxA = orderMap.get(a.id);
      const idxB = orderMap.get(b.id);
      if (idxA !== undefined && idxB !== undefined) return idxA - idxB;
      if (idxA !== undefined) return -1;
      if (idxB !== undefined) return 1;
      return 0;
    });
  }
  return result;
}

export function diffPlatformDishes(baseline: readonly PlatformDraftDish[], edited: readonly PlatformDraftDish[]): PlatformDishChange[] {
  const before = new Map(baseline.map(dish => [dish.id, dish]));
  const changes: PlatformDishChange[] = [];
  for (const dish of edited) {
    const original = before.get(dish.id);
    if (!original) {
      // New dish
      changes.push({
        id: dish.id,
        name: dish.name,
        category: dish.category,
        description: dish.description,
        ingredients: dish.ingredients,
        price: dish.price,
        originalPrice: dish.originalPrice ?? null,
        available: dish.available,
        image: dish.image,
        tag: dish.tag,
        tags: dish.tags,
      });
      continue;
    }
    const tagsEqual = JSON.stringify(dish.tags ?? []) === JSON.stringify(original.tags ?? []);
    if (
      dish.name !== original.name ||
      dish.category !== original.category ||
      (dish.description ?? "") !== (original.description ?? "") ||
      (dish.ingredients ?? "") !== (original.ingredients ?? "") ||
      dish.price !== original.price ||
      (dish.originalPrice ?? null) !== (original.originalPrice ?? null) ||
      dish.available !== original.available ||
      (dish.image ?? "") !== (original.image ?? "") ||
      dish.tag !== original.tag ||
      !tagsEqual
    ) {
      changes.push({
        id: dish.id,
        name: dish.name,
        category: dish.category,
        description: dish.description,
        ingredients: dish.ingredients,
        price: dish.price,
        originalPrice: dish.originalPrice ?? null,
        available: dish.available,
        image: dish.image,
        tag: dish.tag,
        tags: dish.tags,
      });
    }
  }
  return changes;
}

export type DishWithTags = {
  id: string;
  name: string;
  tag?: string;
  tags?: string[];
};

export function preserveDishTags<T extends DishWithTags>(
  incoming: readonly T[],
  sources: readonly (readonly DishWithTags[])[]
): T[] {
  const tagsById = new Map<string, { tag?: string; tags?: string[] }>();
  const tagsByNameKey = new Map<string, { tag?: string; tags?: string[] }>();

  for (const source of sources) {
    for (const dish of source) {
      const activeTags = getDishTags(dish);
      if (activeTags.length > 0) {
        if (!tagsById.has(dish.id)) {
          tagsById.set(dish.id, { tag: dish.tag, tags: dish.tags ?? activeTags });
        }
        const nameKey = dishNameKey(dish.name);
        if (!tagsByNameKey.has(nameKey)) {
          tagsByNameKey.set(nameKey, { tag: dish.tag, tags: dish.tags ?? activeTags });
        }
      }
    }
  }

  return incoming.map(dish => {
    // Nếu món mới tải về đã có nhãn thì giữ nguyên
    const existingActive = getDishTags(dish);
    if (existingActive.length > 0) return dish;

    // Tìm nhãn từ món trùng ID hoặc trùng tên
    const matched = tagsById.get(dish.id) ?? tagsByNameKey.get(dishNameKey(dish.name));
    if (!matched) return dish;

    return {
      ...dish,
      tag: matched.tag,
      tags: matched.tags,
    };
  });
}
