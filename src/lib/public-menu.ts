import "server-only";
import { seedMenus, sharedDishTags, type PlatformDraftDish } from "./catalog";
import grabSnapshot from "./grab-snapshot.json";
import beSnapshot from "./be-snapshot.json";
import { completeGrabMenu } from "./grab-menu-sync";
import type { Store } from "./store";

export function getPublicMenu(store: Store, now: number) {
  const { shop, seasonSchedules, vouchers, dishes } = store;
  const schedule = seasonSchedules.find(item => item.start <= now && now < item.end);
  const appearance = schedule
    ? { ...schedule.appearance, logo: store.appearance.logo }
    : store.appearance;

  const photos = new Map([...seedMenus.be, ...dishes].filter(dish => dish.image).map(dish => [dish.name.trim().toLocaleLowerCase("vi"), dish.image]));
  const bePhotos = new Map(beSnapshot.map(dish => [dish.id, dish.image]));
  const withBePhotos = (items: PlatformDraftDish[]) => items.map(dish => ({
    ...dish, image: dish.image ?? bePhotos.get(dish.id) ?? photos.get(dish.name.trim().toLocaleLowerCase("vi")),
  }));
  const withSharedTags = sharedDishTags(dishes);
  const grabMenu = completeGrabMenu(store.grabMenu?.dishes ?? grabSnapshot, store.beMenu?.dishes ?? beSnapshot);

  return {
    appearance, shop, vouchers, now,
    menus: {
      shop: dishes,
      grab: grabMenu.map(withSharedTags),
      be: withBePhotos(store.beMenu?.dishes ?? beSnapshot).map(withSharedTags),
      xanh: withBePhotos(store.xanhMenu?.dishes ?? beSnapshot).map(withSharedTags),
    },
  };
}

export type PublicMenu = ReturnType<typeof getPublicMenu>;
