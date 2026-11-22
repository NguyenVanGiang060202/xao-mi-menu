import type { PlatformDraftDish } from "./catalog";

export type PlatformDishChange = {
  id: string;
  name: string;
  price: number | null;
  originalPrice: number | null;
  available: boolean;
};

export function applyPlatformDishChanges(dishes: readonly PlatformDraftDish[], changes: readonly PlatformDishChange[]): PlatformDraftDish[] {
  const byId = new Map(changes.map(change => [change.id, change]));
  return dishes.map(dish => {
    const change = byId.get(dish.id);
    if (!change) return dish;
    return {
      ...dish,
      name: change.name,
      price: change.price,
      available: change.available,
      originalPrice: change.originalPrice === null ? undefined : change.originalPrice,
    };
  });
}

export function diffPlatformDishes(baseline: readonly PlatformDraftDish[], edited: readonly PlatformDraftDish[]): PlatformDishChange[] {
  const before = new Map(baseline.map(dish => [dish.id, dish]));
  const changes: PlatformDishChange[] = [];
  for (const dish of edited) {
    const original = before.get(dish.id);
    if (!original) continue;
    if (dish.name !== original.name || dish.price !== original.price
      || (dish.originalPrice ?? null) !== (original.originalPrice ?? null) || dish.available !== original.available) {
      changes.push({
        id: dish.id,
        name: dish.name,
        price: dish.price,
        originalPrice: dish.originalPrice ?? null,
        available: dish.available,
      });
    }
  }
  return changes;
}
