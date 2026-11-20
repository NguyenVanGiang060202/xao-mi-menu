import "server-only";
import { neon } from "@neondatabase/serverless";
import { defaultAppearance, dishMatchKey, platformMenus, seedMenus, voucherChannels, type Appearance, type MenuDish, type Platform, type PlatformDraftDish, type ShopInfo, type Voucher, type VoucherChannel, type VoucherDiscount, type VoucherMap } from "./catalog";
import { isHolidayTheme } from "./menu-data";
import { applyMenuOrder } from "./menu-order";

type PlatformMenuKey = (typeof platformMenus)[Platform]["key"];
export type PlatformSnapshots = Partial<Record<PlatformMenuKey, { dishes: PlatformDraftDish[]; syncedAt: string }>>;
export type SeasonSchedule = { appearance: Appearance; start: number; end: number };
export type Store = PlatformSnapshots & {
  dishes: MenuDish[];
  shop: ShopInfo;
  appearance: Appearance;
  draft: Appearance | null;
  seasonSchedules: SeasonSchedule[];
  vouchers: VoucherMap;
};
const emptyVouchers = (): VoucherMap => ({ shop: [], xanh: [], grab: [], be: [] });
const defaults: Store = { dishes: seedMenus.shop, shop: { branch: "", hours: "" }, appearance: defaultAppearance, draft: null, seasonSchedules: [], vouchers: emptyVouchers() };
const shopPhotos = new Map(seedMenus.shop.map(dish => [dish.id, dish.image]));
function database() {
  if (!process.env.DATABASE_URL) throw new Error("Chưa cấu hình DATABASE_URL.");
  return neon(process.env.DATABASE_URL);
}
export async function readStore(): Promise<Store> {
  return (await readStoreWithMenuRevision()).store;
}

export async function readStoreWithMenuRevision(): Promise<{ store: Store; menuRevision: string }> {
  if (!process.env.DATABASE_URL) return { store: defaults, menuRevision: "" };
  const sql = database();
  const [row] = await sql`SELECT data - 'grabConnection' AS data, md5(NULLIF(data->'dishes', 'null'::jsonb)::text) AS revision FROM menu_state WHERE id = 1`;
  const store: Store = { ...defaults, ...row?.data };
  const dishes = (store.dishes ?? defaults.dishes).map(dish => ({
    ...dish,
    image: dish.image || shopPhotos.get(dish.id),
  }));
  const seasons = row?.data?.seasonSchedules ?? (row?.data?.schedule ? [row.data.schedule] : []);
  const seasonSchedules: SeasonSchedule[] = [...seasons, ...(row?.data?.holidaySchedules ?? [])];
  seasonSchedules.sort((a, b) => a.start - b.start);
  const vouchers = normalizeVouchers(row?.data?.vouchers ?? store.vouchers);
  return { store: { ...store, dishes, seasonSchedules, vouchers }, menuRevision: row?.revision ?? "" };
}

export async function saveValue<K extends keyof Store>(key: K, value: Store[K]) {
  const sql = database();
  const initial = JSON.stringify({ ...defaults, [key]: value });
  await sql`INSERT INTO menu_state (id, data) VALUES (1, ${initial}::jsonb)
    ON CONFLICT (id) DO UPDATE SET data = jsonb_set(menu_state.data, ARRAY[${key}]::text[], ${JSON.stringify(value)}::jsonb, true)`;
}

export async function publishPlatformMenu(platform: Platform, dishes: PlatformDraftDish[], previousSync: string) {
  const sql = database();
  const { key } = platformMenus[platform];
  const snapshot = { dishes, syncedAt: new Date().toISOString() };
  const initial = JSON.stringify({ ...defaults, [key]: snapshot });
  const rows = await sql`INSERT INTO menu_state (id, data)
    SELECT 1, ${initial}::jsonb
    WHERE ${previousSync} = '' OR EXISTS (SELECT 1 FROM menu_state WHERE id = 1)
    ON CONFLICT (id) DO UPDATE SET data = jsonb_set(menu_state.data, ARRAY[${key}]::text[], ${JSON.stringify(snapshot)}::jsonb, true)
    WHERE COALESCE(menu_state.data -> ${key}::text ->> 'syncedAt', '') = ${previousSync}
    RETURNING id`;
  return rows.length === 1;
}

async function readShopDishes() {
  const sql = database();
  const [row] = await sql`SELECT data->'dishes' AS dishes, md5(NULLIF(data->'dishes', 'null'::jsonb)::text) AS revision
    FROM menu_state WHERE id = 1`;
  return { current: (row?.dishes ?? defaults.dishes) as MenuDish[], revision: (row?.revision ?? "") as string };
}

async function writeShopDishes(dishes: MenuDish[], revision: string) {
  const sql = database();
  const initial = JSON.stringify({ ...defaults, dishes });
  const rows = await sql`INSERT INTO menu_state (id, data)
    SELECT 1, ${initial}::jsonb WHERE ${revision} = '' OR EXISTS (SELECT 1 FROM menu_state WHERE id = 1)
    ON CONFLICT (id) DO UPDATE SET data = jsonb_set(menu_state.data, '{dishes}', EXCLUDED.data->'dishes')
    WHERE COALESCE(md5(NULLIF(menu_state.data->'dishes', 'null'::jsonb)::text), '') = ${revision}
    RETURNING id`;
  return rows.length === 1;
}

export async function saveShopDishChanges(revision: string, changed: MenuDish[], removedIds: string[], orderedIds?: string[]) {
  const snapshot = await readShopDishes();
  if (snapshot.revision !== revision) return false;

  const dishes = new Map(snapshot.current.map(dish => [dish.id, dish]));
  for (const id of removedIds) dishes.delete(id);
  for (const dish of changed) {
    dishes.set(dish.id, { ...dishes.get(dish.id), ...dish, tag: dish.tag, tags: dish.tags });
  }
  const ordered = orderedIds ? applyMenuOrder([...dishes.values()], orderedIds) : [...dishes.values()];
  if (!ordered) return false;
  return writeShopDishes(ordered, revision);
}

export async function syncBeShopDishes(source: MenuDish[]) {
  const { current, revision } = await readShopDishes();
  const ids = new Set(current.map(dish => dish.id));
  const keys = new Set(current.map(dishMatchKey));
  const originalKeys = new Map(defaults.dishes.map(dish => [dish.id, dishMatchKey(dish)]));
  const byId = new Map(source.map(dish => [`shop-be-${dish.id}`, dish]));
  const byKey = new Map(source.map(dish => [dishMatchKey(dish), dish]));

  let updated = 0;
  const dishes = current.map(dish => {
    const original = originalKeys.get(dish.id);
    if (original) keys.add(original);
    const fromBe = byId.get(dish.id) ?? byKey.get(dishMatchKey(dish)) ?? (original ? byKey.get(original) : undefined);
    if (!fromBe) return dish;

    const image = fromBe.image || dish.image;
    const description = fromBe.description || dish.description;
    const available = fromBe.available;
    if (image === dish.image && description === dish.description && available === dish.available) return dish;
    updated++;
    return { ...dish, image, description, available };
  });

  let added = 0;
  for (const dish of source) {
    const id = `shop-be-${dish.id}`;
    const key = dishMatchKey(dish);
    if (ids.has(id) || keys.has(key)) continue;
    keys.add(key);
    dishes.push({ ...dish, id, originalPrice: undefined });
    added++;
  }
  if (!added && !updated) return { added, updated };
  return await writeShopDishes(dishes, revision) ? { added, updated } : null;
}

export async function publishAppearance(appearance: Appearance) {
  const sql = database();
  const changes = JSON.stringify({ appearance, draft: null });
  const initial = JSON.stringify({ ...defaults, appearance });
  await sql`INSERT INTO menu_state (id, data) VALUES (1, ${initial}::jsonb)
    ON CONFLICT (id) DO UPDATE SET data = menu_state.data || ${changes}::jsonb`;
}

export async function changeSeasonSchedule(schedule: SeasonSchedule | null, previousStart: number | null) {
  const sql = database();
  const [row] = await sql`SELECT data->'seasonSchedules' AS seasons, data->'holidaySchedules' AS holidays, data->'schedule' AS legacy FROM menu_state WHERE id = 1`;
  const seasons = row?.seasons ?? (row?.legacy ? [row.legacy] : []);
  const current: SeasonSchedule[] = [...seasons, ...(row?.holidays ?? [])];
  if (previousStart !== null && !current.some(item => item.start === previousStart)) {
    return "Lịch đã thay đổi ở phiên khác. Hãy tải lại trang.";
  }
  const seasonSchedules = current.filter(item => item.start !== previousStart && item.end > Date.now());
  if (schedule) {
    if (seasonSchedules.some(item => item.start < schedule.end && schedule.start < item.end)) {
      return "Thời gian bị trùng với một lịch đã lưu.";
    }
    seasonSchedules.push(schedule);
  }
  seasonSchedules.sort((a, b) => a.start - b.start);
  // Older deployments still read seasonSchedules and only know the original themes.
  const changes = {
    seasonSchedules: seasonSchedules.filter(item => !isHolidayTheme(item.appearance.theme)),
    holidaySchedules: seasonSchedules.filter(item => isHolidayTheme(item.appearance.theme)),
  };
  const rows = await sql`INSERT INTO menu_state (id, data)
    SELECT 1, ${JSON.stringify({ ...defaults, ...changes })}::jsonb
    WHERE ${!row} OR EXISTS (SELECT 1 FROM menu_state WHERE id = 1)
    ON CONFLICT (id) DO UPDATE SET data = menu_state.data || ${JSON.stringify(changes)}::jsonb
    WHERE COALESCE(menu_state.data->'seasonSchedules', 'null'::jsonb) = ${JSON.stringify(row?.seasons ?? null)}::jsonb
      AND COALESCE(menu_state.data->'holidaySchedules', 'null'::jsonb) = ${JSON.stringify(row?.holidays ?? null)}::jsonb
      AND COALESCE(menu_state.data->'schedule', 'null'::jsonb) = ${JSON.stringify(row?.legacy ?? null)}::jsonb
    RETURNING id`;
  return rows.length === 1 ? undefined : "Lịch đã thay đổi ở phiên khác. Hãy tải lại trang.";
}

function positiveAmount(value: unknown) {
  const amount = typeof value === "number" ? Math.round(value) : NaN;
  return Number.isSafeInteger(amount) && amount > 0 && amount <= 100_000_000 ? amount : undefined;
}

function normalizeDiscount(value: unknown): VoucherDiscount | null {
  if (!value || typeof value !== "object") return null;
  const discount = value as Record<string, unknown>;
  const amount = typeof discount.value === "number" ? Math.round(discount.value) : NaN;
  if (discount.kind === "percent" && Number.isSafeInteger(amount) && amount >= 1 && amount <= 100) {
    const maxDiscount = positiveAmount(discount.maxDiscount);
    return { kind: "percent", value: amount, ...(maxDiscount ? { maxDiscount } : {}) };
  }
  if (discount.kind === "amount" && positiveAmount(amount)) {
    return { kind: "amount", value: amount };
  }
  return null;
}

function normalizeVoucher(value: unknown, channel: VoucherChannel, index: number): Voucher | null {
  if (!value || typeof value !== "object") return null;
  const voucher = value as Record<string, unknown>;
  const title = typeof voucher.title === "string" ? voucher.title.trim() : "";
  if (!title) return null;
  const discount = normalizeDiscount(voucher.discount);
  return {
    // Voucher cũ chưa có id hoặc mức giảm: giữ lại ở trạng thái tắt để admin sửa, không hiện cho khách.
    id: typeof voucher.id === "string" && voucher.id ? voucher.id : `legacy-${channel}-${index}`,
    title,
    code: typeof voucher.code === "string" ? voucher.code.trim() : "",
    discount: discount ?? { kind: "amount", value: 0 },
    minOrder: positiveAmount(voucher.minOrder),
    terms: typeof voucher.terms === "string" ? voucher.terms.trim() : "",
    enabled: Boolean(discount) && voucher.enabled !== false,
  };
}

export function normalizeVouchers(value: unknown): VoucherMap {
  const source = value && typeof value === "object" ? value as Partial<Record<VoucherChannel, unknown>> : {};
  return Object.fromEntries(voucherChannels.map(channel => {
    const list = Array.isArray(source[channel]) ? source[channel] as unknown[] : [];
    const vouchers = list
      .map((voucher, index) => normalizeVoucher(voucher, channel, index))
      .filter((voucher): voucher is Voucher => voucher !== null);
    return [channel, vouchers];
  })) as VoucherMap;
}

