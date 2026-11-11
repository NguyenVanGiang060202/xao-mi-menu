import { getDishTags, themes, type Dish, type ThemeName } from "./menu-data";
import bePhotos from "./be-photos.json";

export type MenuDish = Dish & { image?: string; originalPrice?: number };
export const platformMenus = {
  grab: { label: "GrabFood", key: "grabMenu" },
  be: { label: "beFood", key: "beMenu" },
  xanh: { label: "Xanh SM Ngon", key: "xanhMenu" },
} as const;
export type Platform = keyof typeof platformMenus;
export type PlatformDraftDish = Omit<MenuDish, "price"> & { price: number | null };

const grabVietnameseNames: Record<string, string> = {
  "noodles mixed with egg, sausage + drink": "Mì trộn trứng xúc xích + nước",
  "stir-fried noodles with egg, sausage + drink": "Mì xào trứng xúc xích + nước",
  "stir-fried noodles with beef and egg + drink": "Mì xào bò trứng + nước",
  "stir-fried noodles with beef + soup": "Mì xào bò + súp",
  "stir-fried noodles with egg and sausage": "Mì xào trứng xúc xích",
  "stir-fried noodles with beef and egg": "Mì xào bò trứng",
  "stir-fried beef noodles": "Mì xào bò",
  "noodles mixed with egg and sausage": "Mì trộn trứng xúc xích",
  "beef and egg mixed noodles": "Mì trộn bò trứng",
  "stir-fried noodles with beef + lemon tea": "Mì xào bò + trà chanh",
  "stir-fried noodles with beef, peach tea.": "Mì xào bò + trà đào",
  "stir-fried noodles with beef + peach tea": "Mì xào bò + trà đào",
  "beef and egg mixed noodles + peach tea": "Mì trộn bò trứng + trà đào",
  "beef and egg mixed noodles + lemon tea": "Mì trộn bò trứng + trà chanh",
  "pepsi cup": "Pepsi ly",
  "peach tea": "Trà đào",
  "lemon tea": "Trà chanh",
};

const grabVietnameseCategories: Record<string, string> = {
  "stir-fried noodles": "Mì xào",
  "mixed noodles": "Mì trộn",
  "beverage": "Đồ uống",
  "best-selling combo": "Combo bán chạy",
};

export function dishNameKey(name: string) {
  const key = name.normalize("NFC").toLocaleLowerCase("vi").replaceAll(",", "").replace(/\s+/g, " ").trim();
  return key === "pepsi ly" ? "pepsi" : key;
}

type DishText = Pick<PlatformDraftDish, "name" | "description">;

export function localizeGrabDish<T extends DishText & { category: string }>(dish: T, beDishes: readonly DishText[] = []): T {
  const translatedName = grabVietnameseNames[dish.name.trim().toLowerCase()];
  const name = translatedName ?? dish.name;
  const reference = beDishes.find(candidate => dishNameKey(candidate.name) === dishNameKey(name));
  const category = grabVietnameseCategories[dish.category.trim().toLowerCase()] ?? dish.category;
  return {
    ...dish, category,
    name: reference?.name.trim() ?? name,
    description: reference ? reference.description : translatedName ? "" : dish.description,
  };
}
export type Appearance = { theme: ThemeName; greeting: string; accent: string; background: string; image: string; logo: string };
export type Voucher = { title: string; code: string; terms: string; start: string; end: string };
type Hours = { open: string; close: string };
export type ShopInfo = { branch: string; hours: string; schedule?: { weekday: Hours; weekend: Hours } };
export const shopLocation = {
  address: "28A Đường số 2, Bình Trưng, Hồ Chí Minh",
  mapsUrl: "https://www.google.com/maps?q=Ti%E1%BB%87m+X%C3%A0o+M%C3%AC!,+28a+%C4%90.+S%E1%BB%91+2,+B%C3%ACnh+Tr%C6%B0ng,+H%E1%BB%93+Ch%C3%AD+Minh&ftid=0x317527000f6f7aa7:0xbc9b8402e15779c0",
};
export const shopDays = [
  { id: "weekday", label: "Thứ 2 – Thứ 6" },
  { id: "weekend", label: "Thứ 7 – Chủ nhật" },
] as const;
export const defaultShopSchedule = {
  weekday: { open: "09:00", close: "23:59" },
  weekend: { open: "18:00", close: "23:59" },
};
export const defaultAppearance: Appearance = { theme: "default", greeting: themes.default.greeting, accent: themes.default.accent, background: "", image: "", logo: "" };
export const channels = {
  xanh: { url: "https://xanhsmngon.onelink.me/14WJ/jkt91awj" },
  shop: { branch: "", hours: "", url: "" },
  grab: { branch: "Nguyễn Duy Trinh", hours: "", url: "https://app.grab.com/s/e1LKbfi0" },
  be: { branch: "Đường Số 2 · 28A1 Đường Số 2, Phường Bình Trưng, Hồ Chí Minh", hours: "T2–T6 09:00–23:59 · T7–CN 18:00–23:59", url: "https://begroup.onelink.me/ZOqn/0w83hab9" },
};
const beRows = [
  ["14109301","Mì xào bò trứng + Pepsi ly","Combo",75000,80000],
  ["14109302","Mì xào bò + Pepsi ly","Combo",70000,75000],
  ["14109303","Mì xào bò trứng + trà đào","Combo",77000,85000],
  ["14109304","Mì xào bò trứng + trà chanh","Combo",77000,85000],
  ["14109305","Mì xào bò + trà đào","Combo",72000,80000],
  ["14109306","Mì xào bò + trà chanh","Combo",72000,80000],
  ["14109307","Mì xào bò","Mì xào",60000,60000],
  ["14109308","Mì xào bò trứng","Mì xào",65000,65000],
  ["14109309","Trà đào","Đồ uống",20000,20000],
  ["14109310","Trà chanh","Đồ uống",20000,20000],
] as const;
const grabRows = [
  ["egg-pepsi","Mì xào bò trứng + Pepsi ly","Combo",81000,90000],
  ["beef-pepsi","Mì xào bò + Pepsi ly","Combo",76500,85000],
  ["egg-peach","Mì xào bò trứng + trà đào","Combo",85500,95000],
  ["egg-lemon","Mì xào bò trứng + trà chanh","Combo",85500,95000],
  ["beef-peach","Mì xào bò + trà đào","Combo",81000,90000],
  ["beef-lemon","Mì xào bò + trà chanh","Combo",81000,90000],
  ["sausage","Mì xào trứng xúc xích","Mì xào",58500,65000],
  ["egg","Mì xào bò trứng","Mì xào",67500,75000],
  ["beef","Mì xào bò","Mì xào",63000,70000],
  ["mix-sausage","Mì trộn trứng xúc xích","Mì trộn",58500,65000],
  ["mix-beef","Mì trộn bò trứng","Mì trộn",67500,75000],
  ["pepsi","Pepsi ly","Đồ uống",15000,15000],
  ["peach","Trà đào","Đồ uống",20000,20000],
  ["lemon","Trà chanh","Đồ uống",20000,20000],
] as const;
function dishes(rows: readonly (readonly [string,string,string,number,number])[]): MenuDish[] {
  return rows.map(([id,name,category,price,originalPrice]) => ({
    id, name, category, price, originalPrice, description: "", ingredients: "", available: true,
    tag: name === "Mì xào bò" ? "Bán chạy" : undefined,
  }));
}
const be = dishes(beRows).map(dish => ({ ...dish, image: (bePhotos as Record<string, string>)[dish.id] }));
const bePhotosByName = new Map(be.map(dish => [dish.name, dish.image]));
const grabPhotos: Record<string, string> = {
  "sausage": "https://huawei-food-cms.grab.com/compressed_webp/items/VNITE2026110715521161953/photo/menueditor_item_eee2165d92254cf4b7062aa46962b9f0_1794204989860725754.webp",
  "mix-sausage": "https://huawei-food-cms.grab.com/compressed_webp/items/VNITE2026110715565290474/photo/menueditor_item_6717e279c6ad48f59197f6767dfbd162_1794204810484168403.webp",
  "mix-beef": "https://huawei-food-cms.grab.com/compressed_webp/items/VNITE2026110715555767547/photo/menueditor_item_42274c643b5c4778a785c09d976e81ec_1794204932172269344.webp",
  "pepsi": "https://huawei-food-cms.grab.com/compressed_webp/items/VNITE2026110113254957877/photo/menueditor_item_f93b0b3bc16745d8a442a3ac5d6b6887_1793539514377501480.webp",
};
const grab = dishes(grabRows).map(dish => ({ ...dish, image: bePhotosByName.get(dish.name) ?? grabPhotos[dish.id] }));
const shop = grab.map(({ originalPrice, ...dish }) => ({
  ...dish,
  id: `shop-${dish.id}`,
  price: originalPrice ?? dish.price,
}));
export const seedMenus = { shop, grab, be };

export function dishMatchKey(dish: Pick<MenuDish, "name" | "category">) {
  return `${dish.category}:${dishNameKey(dish.name)}`;
}

export function sharedDishTags(shopDishes: MenuDish[]) {
  const tagsByDish = new Map(shopDishes.map(dish => [dishMatchKey(dish), getDishTags(dish)]));
  const originals = new Map(shop.map(dish => [dish.id, dishMatchKey(dish)]));
  for (const dish of shopDishes) {
    const original = originals.get(dish.id);
    if (original && !tagsByDish.has(original)) tagsByDish.set(original, getDishTags(dish));
  }
  return (dish: PlatformDraftDish): PlatformDraftDish => ({
    ...dish,
    tags: tagsByDish.get(dishMatchKey(dish)) ?? [],
  });
}
