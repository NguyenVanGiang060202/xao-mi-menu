type Categorized = { id: string; category: string };

export function groupMenu<T extends Categorized>(dishes: readonly T[]) {
  const groups = new Map<string, T[]>();
  for (const dish of dishes) {
    const group = groups.get(dish.category);
    if (group) group.push(dish);
    else groups.set(dish.category, [dish]);
  }
  return [...groups].map(([category, items]) => ({ category, dishes: items }));
}

function move<T>(items: readonly T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) return [...items];
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function moveMenuCategory<T extends Categorized>(dishes: readonly T[], category: string, target: string): T[] {
  const groups = groupMenu(dishes);
  if (category === target || !groups.some(group => group.category === category) || !groups.some(group => group.category === target)) return [...dishes];
  return move(groups, groups.findIndex(group => group.category === category), groups.findIndex(group => group.category === target))
    .flatMap(group => group.dishes);
}

export function moveMenuDish<T extends Categorized>(dishes: readonly T[], id: string, targetId: string): T[] {
  const source = dishes.find(dish => dish.id === id);
  const target = dishes.find(dish => dish.id === targetId);
  if (!source || !target || source.category !== target.category || id === targetId) return [...dishes];
  return groupMenu(dishes).flatMap(group => group.category !== source.category ? group.dishes
    : move(group.dishes, group.dishes.findIndex(dish => dish.id === id), group.dishes.findIndex(dish => dish.id === targetId)));
}

// A reorder must contain every remaining dish exactly once; it cannot delete or invent dishes.
export function applyMenuOrder<T extends { id: string }>(dishes: readonly T[], orderedIds: readonly string[]): T[] | null {
  const byId = new Map(dishes.map(dish => [dish.id, dish]));
  if (orderedIds.length !== dishes.length || new Set(orderedIds).size !== orderedIds.length || orderedIds.some(id => !byId.has(id))) return null;
  return orderedIds.map(id => byId.get(id)!);
}
