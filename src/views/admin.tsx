"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ImagePlus, LogOut, Menu, Monitor, Palette, Pencil, Plus, RefreshCw, Save, Smartphone, Trash2, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminToast, type AdminNotice, type NotifyAdmin } from "@/components/admin-toast";
import { DishTag } from "@/components/dish-tag";
import { SeasonSticker } from "@/components/season-sticker";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { categories, dishTagPresets, formatPrice, getDishTags, parseVietnamDateTime, themeNames, themes, type ThemeName } from "@/lib/menu-data";
import { defaultShopSchedule, shopDays, shopLocation, type Appearance, type MenuDish as Dish } from "@/lib/catalog";
import type { Store } from "@/lib/store";
import type { PublicMenu } from "@/lib/public-menu";
import { cancelSchedule, logout, syncBeToShop, updateSeasonSchedule, updateShop, updateShopMenu, updateTheme, uploadImage as uploadAsset } from "@/app/actions";
import { PlatformMenuSync } from "./platform-menu-sync";
import { AppearancePreview } from "./appearance-preview";

const sections = [
  { id: "appearance", label: "Giao diện", icon: Palette },
  { id: "menu", label: "Menu quán", icon: Menu },
] as const;

type MenuDraft = { revision: string; original: Dish[]; dishes: Dish[] };
const seasonTime = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" });
const dateTimeInput = (time: number) => new Date(time + 7 * 60 * 60 * 1000).toISOString().slice(0, 16);

export function AdminPage({ store, menuRevision, publicMenu }: { store: Store; menuRevision: string; publicMenu: PublicMenu }) {
  const router = useRouter();
  const initial = store.draft ?? store.appearance;
  const [theme, setTheme] = useState<ThemeName>(initial.theme);
  const [previewMode, setPreviewMode] = useState<"phone" | "desktop">("desktop");
  const [greeting, setGreeting] = useState(initial.greeting);
  const [accent, setAccent] = useState(initial.accent);
  const [background, setBackground] = useState(initial.background);
  const [headerImage, setHeaderImage] = useState(initial.image);
  const [logo, setLogo] = useState(initial.logo);
  const [notice, setNotice] = useState<AdminNotice | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const dismissNotice = useCallback(() => setNotice(null), []);
  const notify: NotifyAdmin = (message, kind) => setNotice({ message, kind });
  const [busy, setBusy] = useState(false);
  const [syncingShop, setSyncingShop] = useState(false);
  const [savingMenu, setSavingMenu] = useState(false);
  const [menuDraft, setMenuDraft] = useState<MenuDraft | null>(null);
  const [editingSeason, setEditingSeason] = useState<{ start: number; end: number; originalAppearance: Appearance } | null>(null);
  const [activeSection, setActiveSection] = useState<(typeof sections)[number]["id"]>("appearance");
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [dishDraft, setDishDraft] = useState<Dish | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dishPriceInput, setDishPriceInput] = useState("");
  const priceText = dishPriceInput.trim().replace(",", ".");
  const parsedPrice = /^\d+(?:\.\d{0,3})?$/.test(priceText) ? Math.round(Number(priceText) * 1000) : NaN;
  const dishPrice = Number.isSafeInteger(parsedPrice) && parsedPrice <= 100000000 ? parsedPrice : null;
  const menuDishes = menuDraft?.dishes ?? store.dishes;
  const dishGroups = [...new Set([...categories.slice(1), ...menuDishes.map(dish => dish.category)])]
    .map(category => ({ category, dishes: menuDishes.filter(dish => dish.category === category) }))
    .filter(group => group.dishes.length);
  const appearance = { theme, greeting, accent, background, image: headerImage, logo };
  const menuBusy = busy || syncingShop || savingMenu;

  async function run(action: () => Promise<void | string>, message: string) {
    if (busy) return;
    setBusy(true);
    try {
      const error = await action();
      if (error) {
        notify(error, "error");
        return;
      }
      notify(message, "success");
      router.refresh();
    } catch {
      notify("Không lưu được thay đổi. Hãy thử lại.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function syncShopMenu() {
    if (menuBusy || menuDraft) return;
    setSyncingShop(true);
    try {
      const result = await syncBeToShop();
      notify(result.message, result.ok ? "success" : "error");
    } catch {
      notify("Không đồng bộ được Menu quán từ beFood. Hãy thử lại.", "error");
    } finally {
      setSyncingShop(false);
    }
  }

  function stageDish(id: string, dish?: Dish) {
    setMenuDraft(current => {
      const draft = current ?? { revision: menuRevision, original: store.dishes, dishes: store.dishes };
      const original = draft.original.find(item => item.id === id);
      const next = JSON.stringify(dish) === JSON.stringify(original) ? original : dish;
      const exists = draft.dishes.some(item => item.id === id);
      const dishes = !next ? draft.dishes.filter(item => item.id !== id)
        : exists ? draft.dishes.map(item => item.id === id ? next : item)
        : [...draft.dishes, next];
      return dishes.length === draft.original.length && dishes.every((item, index) => item === draft.original[index])
        ? null : { ...draft, dishes };
    });
  }

  async function saveMenu() {
    if (menuBusy || !menuDraft) return;
    setSavingMenu(true);
    try {
      const originals = new Set(menuDraft.original);
      const ids = new Set(menuDraft.dishes.map(dish => dish.id));
      const result = await updateShopMenu({
        revision: menuDraft.revision,
        changed: menuDraft.dishes.filter(dish => !originals.has(dish)),
        removedIds: menuDraft.original.filter(dish => !ids.has(dish.id)).map(dish => dish.id),
      });
      notify(result.message, result.ok ? "success" : "error");
      if (result.ok) setMenuDraft(null);
    } catch {
      notify("Không lưu được Menu quán. Hãy thử lại.", "error");
    } finally {
      setSavingMenu(false);
    }
  }

  function openDish(dish: Dish) {
    setConfirmDelete(false);
    setEditingDish(dish);
    setDishDraft({ ...dish });
    setDishPriceInput(dish.name ? String(dish.price / 1000).replace(".", ",") : "");
  }

  function closeDish() {
    setEditingDish(null);
    setDishDraft(null);
  }

  function editAppearance(value: Appearance) {
    setTheme(value.theme);
    setGreeting(value.greeting);
    setAccent(value.accent);
    setBackground(value.background);
    setHeaderImage(value.image);
    setLogo(value.logo);
  }

  function chooseTheme(name: ThemeName) {
    const { greeting, accent, background } = themes[name];
    editAppearance({ ...appearance, theme: name, greeting, accent, background });
  }

  async function saveAppearance(mode: "appearance" | "draft") {
    const message = mode === "appearance" ? "Đã áp dụng giao diện và lời chào lên trang khách." : "Đã lưu bản nháp.";
    await run(() => updateTheme(mode, appearance), message);
  }

  function resetSeasonEditor() {
    if (editingSeason) editAppearance(editingSeason.originalAppearance);
    setEditingSeason(null);
  }

  function scheduleTheme(form: HTMLFormElement) {
    const values = new FormData(form);
    const start = parseVietnamDateTime(String(values.get("start")));
    const end = parseVietnamDateTime(String(values.get("end")));
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end <= Date.now()) {
      notify("Chọn khoảng thời gian hợp lệ và chưa kết thúc.", "error");
      return;
    }
    void run(async () => {
      const error = await updateSeasonSchedule(appearance, start, end, editingSeason?.start ?? null);
      if (!error) {
        form.reset();
        resetSeasonEditor();
      }
      return error;
    }, "Đã lưu lịch theo giờ Việt Nam.");
  }

  function uploadImage(file: File | undefined, setter: (url: string) => void) {
    if (!file) return;
    const form = new FormData();
    form.set("image", file);
    void run(async () => setter(await uploadAsset(form)), "Đã tải ảnh. Lưu thay đổi để công bố.");
  }

  const toast = <AdminToast notice={notice} onDismiss={dismissNotice} />;

  return <main className="admin-workspace min-h-screen">
    {!previewOpen && !editingDish && toast}
    <header className="admin-header">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <img src="/xao-mi-logo.jpg" alt="" className="size-12 rounded-full border-2 border-[#ffd889] object-cover" />
          <div><h1 className="admin-heading text-3xl leading-none">Xào Mì!</h1><p className="mt-1 text-xs text-[#ffe4bc]">Quản lý quán</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/" className="admin-header-action"><ArrowLeft size={15} />Xem thực đơn</Link>
          <form action={logout}><button className="admin-header-action" type="submit"><LogOut size={15} />Đăng xuất</button></form>
        </div>
      </div>
    </header>
    <div className="mx-auto grid max-w-7xl items-start gap-4 px-4 py-5 sm:px-8 lg:grid-cols-[185px_minmax(0,1fr)] lg:gap-7 lg:py-8">
      <nav aria-label="Quản lý quán" className="admin-navigation">
        {sections.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-pressed={activeSection === id} onClick={() => setActiveSection(id)}>
          <Icon size={17} aria-hidden="true" />{label}
        </button>)}
      </nav>

      <div className="admin-content min-w-0">
        {activeSection === "menu" ? <>
          <PlatformMenuSync beMenu={store.beMenu} grabMenu={store.grabMenu} xanhMenu={store.xanhMenu} notify={notify} />
          <section className="admin-sheet">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-3xl">Menu quán</h2><p className="text-sm text-muted-foreground">{menuDishes.length} món · {menuDishes.filter(dish => dish.available).length} đang bán</p></div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" disabled={menuBusy || Boolean(menuDraft)} onClick={syncShopMenu}>
                  <RefreshCw size={15} aria-hidden="true" />{syncingShop ? "Đang đồng bộ…" : "Đồng bộ từ beFood"}
                </Button>
                <Button variant="outline" disabled={menuBusy} onClick={() => {
                  const dish = { id: crypto.randomUUID(), name: "", category: "Mì xào", price: 0, description: "", ingredients: "", available: true };
                  openDish(dish);
                }}><Plus size={16} />Thêm món</Button>
              </div>
            </div>
            <div className="sticky top-2 z-10 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-sm sm:px-4">
              <p role="status" className="text-sm">
                <span className="font-bold">{menuDraft ? "Có thay đổi chưa lưu" : "Menu quán đã lưu"}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{menuDraft ? "Lưu hoặc bỏ thay đổi trước khi đồng bộ từ beFood." : "Thêm, sửa hoặc xóa món rồi lưu để cập nhật trang khách."}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {menuDraft && <Button variant="outline" disabled={menuBusy} onClick={() => { setMenuDraft(null); router.refresh(); }}>Bỏ thay đổi</Button>}
                <Button disabled={menuBusy || !menuDraft} onClick={saveMenu}><Save size={15} />{savingMenu ? "Đang lưu…" : "Lưu Menu quán"}</Button>
              </div>
            </div>
            <div className="space-y-6">
              {!menuDishes.length && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Menu quán chưa có món.</p>}
              {dishGroups.map(({ category, dishes }) => <section key={category}>
                <h3 className="mb-2 flex items-center gap-2">{category}<span className="rounded-full bg-secondary px-2 py-0.5 font-sans text-xs font-semibold">{dishes.length}</span></h3>
                <ul className="grid gap-2 xl:grid-cols-2">
                  {dishes.map(dish => <li key={dish.id} className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card p-2 sm:gap-3">
                    <button type="button" disabled={menuBusy} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg text-left sm:gap-3" onClick={() => openDish(dish)}>
                      {dish.image ? <img src={dish.image} alt="" loading="lazy" className="size-12 shrink-0 rounded-lg object-cover sm:size-14" /> : <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-secondary text-primary sm:size-14"><Utensils size={18} /></span>}
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold leading-snug">{dish.name}</span>
                        <span className="mt-0.5 block text-xs font-semibold text-primary">{formatPrice(dish.price)}</span>
                        <span className="flex flex-wrap gap-1.5 empty:hidden [&:not(:empty)]:mt-1.5">
                          {getDishTags(dish).map(tag => <DishTag key={tag} label={tag} />)}
                        </span>
                      </span>
                      <Pencil size={14} className="shrink-0 text-primary" aria-hidden="true" />
                    </button>
                    <div className="flex shrink-0 flex-col items-center gap-1 border-l border-border pl-2 text-[10px] text-muted-foreground sm:pl-3">
                      <Switch checked={dish.available} disabled={menuBusy} aria-label={`Đang bán: ${dish.name}`} onCheckedChange={available => stageDish(dish.id, { ...dish, available })} />
                      {dish.available ? "Đang bán" : "Tạm hết"}
                    </div>
                  </li>)}
                </ul>
              </section>)}
            </div>
          </section>
        </> : <>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Cửa hàng của bạn</p><h2 className="mt-1 text-2xl font-bold sm:text-3xl">Giao diện thực đơn</h2><p className="mt-1 text-sm text-muted-foreground">Xào Mì!</p></div><span className="flex items-center gap-1.5 text-xs font-semibold text-accent-foreground"><span className="size-2 rounded-full bg-emerald-600" />Đang hiển thị</span></div>

        <section className="admin-sheet">
          <h3 className="mb-4">Thông tin quán</h3>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-secondary p-3 text-sm">
            <div><p className="text-xs text-muted-foreground">Địa chỉ</p><p className="mt-1 font-bold">{shopLocation.address}</p></div>
            <a href={shopLocation.mapsUrl} target="_blank" rel="noreferrer" className="font-semibold text-primary underline underline-offset-4">Xem trên Google Maps ↗</a>
          </div>
          <form onSubmit={event => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            if (shopDays.some(({ id }) => String(form.get(`${id}-open`)) >= String(form.get(`${id}-close`)))) {
              notify("Giờ đóng cửa phải sau giờ mở cửa trong cùng ngày.", "error");
              return;
            }
            void run(() => updateShop(form), "Đã cập nhật giờ mở cửa.");
          }}>
            <p className="mb-2 text-sm font-bold">Giờ mở cửa</p>
            {!store.shop.schedule && store.shop.hours.trim() && <p className="mb-3 text-sm text-muted-foreground">Giờ đang hiển thị: {store.shop.hours}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              {shopDays.map(({ id, label }) => {
                const hours = (store.shop.schedule ?? defaultShopSchedule)[id];
                return <fieldset key={id} className="min-w-0 rounded-xl border border-border px-3 pb-3">
                  <legend className="px-1 text-sm font-semibold">{label}</legend>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="min-w-0 text-xs text-muted-foreground">Mở cửa<Input type="time" name={`${id}-open`} defaultValue={hours.open} required className="mt-1 min-w-0 px-1.5" /></label>
                    <label className="min-w-0 text-xs text-muted-foreground">Đóng cửa<Input type="time" name={`${id}-close`} defaultValue={hours.close} required className="mt-1 min-w-0 px-1.5" /></label>
                  </div>
                </fieldset>;
              })}
            </div>
            <Button type="submit" className="mt-4" disabled={busy}><Save size={15} />Lưu giờ mở cửa</Button>
          </form>
        </section>

        <section className="admin-sheet">
          <div className="mb-4 flex items-center justify-between"><div><h3 className="font-bold">Chọn không khí</h3><p className="mt-1 text-xs text-muted-foreground">Màu sắc và lời chào theo mùa.</p></div><span className="rounded-sm bg-secondary px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Đang chỉnh · {themes[theme].title}</span></div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {themeNames.map(key => <button key={key} type="button" aria-pressed={theme === key} onClick={() => chooseTheme(key)} className={`admin-theme-option theme-${key}`}>
              <span aria-hidden="true" className="admin-theme-swatch">{themes[key].motif || "!"}</span>
              <span className="flex items-center justify-between gap-1 px-2 py-2 text-sm font-bold">{themes[key].title}{theme === key && <Check size={15} className="shrink-0" />}</span>
            </button>)}
          </div>
        </section>

        <section className="admin-sheet grid gap-6 xl:grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)]">
          <div>
            <h3 className="font-bold">Lời chào & điểm nhấn</h3>
            <div className="mt-3 rounded-xl border border-border bg-secondary/45 p-3">
              <label htmlFor="menu-greeting" className="block text-sm font-semibold">Lời chào</label>
              <Input id="menu-greeting" value={greeting} onChange={event => setGreeting(event.target.value)}
                className="mt-2 h-10 rounded-lg bg-card" maxLength={52} placeholder="Mì nóng, nước mát." aria-describedby="menu-greeting-hint" />
              <p id="menu-greeting-hint" className="mt-1.5 text-xs leading-relaxed text-muted-foreground">Hiện ngay dưới tên Xào Mì! trên banner. Để trống nếu muốn ẩn.</p>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4"><div><p className="text-xs font-semibold">Màu điểm nhấn</p><p className="mt-1 text-[11px] text-muted-foreground">Dùng cho nút và chi tiết nổi bật.</p></div><label className="flex h-10 cursor-pointer items-center gap-2 border border-border bg-card px-2"><input aria-label="Chọn màu điểm nhấn" type="color" value={accent} onChange={(event) => setAccent(event.target.value)} className="size-6 cursor-pointer border-0 bg-transparent p-0" /><span className="font-mono text-xs uppercase">{accent}</span></label></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="flex cursor-pointer items-center gap-2 border border-border px-3 py-2.5 text-xs font-semibold hover:bg-secondary"><ImagePlus size={16} className="text-primary" />Ảnh đầu trang<input type="file" accept="image/*" className="sr-only" onChange={(event) => uploadImage(event.currentTarget.files?.[0], setHeaderImage)} /></label><label className="flex cursor-pointer items-center gap-2 border border-border px-3 py-2.5 text-xs font-semibold hover:bg-secondary"><ImagePlus size={16} className="text-primary" />Logo quán<input type="file" accept="image/*" className="sr-only" onChange={(event) => uploadImage(event.currentTarget.files?.[0], setLogo)} /></label></div>
            <label className="mt-4 flex items-center gap-3 text-xs font-semibold">Màu nền <input type="color" value={background || "#fffaf3"} onChange={event => setBackground(event.target.value)} /></label>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
              <Button disabled={busy} onClick={() => saveAppearance("appearance")}><Save size={15} />Lưu giao diện</Button>
              <Button variant="outline" disabled={busy} onClick={() => saveAppearance("draft")}>Lưu nháp</Button>
            </div>
          </div>
          <div className="admin-preview min-w-0">
            <h3 className="font-bold">Xem trước thực đơn</h3>
            <p className="mb-3 mt-1 text-xs text-muted-foreground">Mô phỏng đầu trang và món ăn với thiết lập đang chỉnh.</p>
            <div role="group" aria-label="Bố cục xem trước" className="mb-3 flex flex-wrap gap-2">
              <Button className="h-9 px-3" variant={previewMode === "phone" ? undefined : "outline"} aria-pressed={previewMode === "phone"} onClick={() => setPreviewMode("phone")}><Smartphone size={15} />Điện thoại</Button>
              <Button className="h-9 px-3" variant={previewMode === "desktop" ? undefined : "outline"} aria-pressed={previewMode === "desktop"} onClick={() => setPreviewMode("desktop")}><Monitor size={15} />Máy tính</Button>
            </div>
            <PreviewPanel mode={previewMode} appearance={appearance} dishes={store.dishes.filter(dish => dish.available).slice(0, 2)} />
          </div>
        </section>

        <AppearancePreview menu={publicMenu} draft={appearance} busy={busy} onOpenChange={setPreviewOpen} notification={previewOpen ? toast : null}
          onApply={() => saveAppearance("appearance")} />

        <section className="admin-sheet">
          <div className="mb-4">
            <h3 className="font-bold">Lên lịch theo mùa</h3>
            <p className="mt-1 text-xs text-muted-foreground">Theo giờ Việt Nam (GMT+7). Khi hết lịch, thực đơn trở về giao diện thường nếu chưa đến lịch kế tiếp.</p>
          </div>
          <form key={editingSeason?.start ?? "new"} onSubmit={event => { event.preventDefault(); scheduleTheme(event.currentTarget); }}>
            <p className="mb-3 text-sm font-semibold">{editingSeason === null ? "Thêm lịch" : "Sửa lịch"} · {themes[theme].title}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold">Bắt đầu<input aria-label="Ngày giờ bắt đầu" name="start" type="datetime-local" required defaultValue={editingSeason ? dateTimeInput(editingSeason.start) : ""} className="mt-2 h-10 w-full border border-input bg-card px-3 text-xs font-normal text-foreground" /></label>
              <label className="text-xs font-semibold">Kết thúc<input aria-label="Ngày giờ kết thúc" name="end" type="datetime-local" required defaultValue={editingSeason ? dateTimeInput(editingSeason.end) : ""} className="mt-2 h-10 w-full border border-input bg-card px-3 text-xs font-normal text-foreground" /></label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="submit" className="h-10" disabled={busy}><Save size={15} />Lưu lịch theo mùa</Button>
              {editingSeason !== null && <Button variant="outline" disabled={busy} onClick={resetSeasonEditor}>Bỏ sửa lịch</Button>}
            </div>
          </form>
          <div className="mt-5 border-t border-border pt-4">
            <h4 className="text-sm font-bold">Lịch đã lưu</h4>
            <ul className="mt-2 grid gap-2">
              {store.seasonSchedules.filter(item => item.end > publicMenu.now).map(item => {
                const preset = themes[item.appearance.theme];
                const active = item.start <= publicMenu.now;
                return <li key={item.start} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3">
                  <div>
                    <p className="flex flex-wrap items-center gap-2 text-sm font-bold"><span aria-hidden="true" style={{ color: preset.accent }}>{preset.motif || "!"}</span>{preset.title}<span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">{active ? "Đang hiển thị" : "Sắp tới"}</span></p>
                    <p className="mt-1 text-xs text-muted-foreground">{seasonTime.format(item.start)} → {seasonTime.format(item.end)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" disabled={busy} aria-label={`Sửa lịch ${preset.title}`} onClick={() => {
                      editAppearance(item.appearance);
                      setEditingSeason({ start: item.start, end: item.end, originalAppearance: editingSeason?.originalAppearance ?? appearance });
                    }}>Sửa</Button>
                    <Button variant="ghost" disabled={busy} aria-label={`Hủy lịch ${preset.title}`} onClick={() => run(async () => {
                      const error = await cancelSchedule(item.start);
                      if (!error && editingSeason?.start === item.start) resetSeasonEditor();
                      return error;
                    }, "Đã hủy lịch.")}>Hủy lịch</Button>
                  </div>
                </li>;
              })}
            </ul>
            {!store.seasonSchedules.some(item => item.end > publicMenu.now) && <p className="text-xs text-muted-foreground">Chưa có lịch sắp tới.</p>}
          </div>
        </section>

        </>}
      </div>
    </div>
    <Sheet open={Boolean(editingDish)} onOpenChange={open => { if (!open) closeDish(); }}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {editingDish && toast}
        {dishDraft && <><SheetHeader className="text-left"><SheetTitle>{editingDish?.name || "Thêm món"}</SheetTitle><SheetDescription>Chỉnh thông tin món, sau đó bấm Lưu Menu quán để cập nhật trang khách.</SheetDescription></SheetHeader>
          {dishDraft.image && <img src={dishDraft.image} alt={dishDraft.name || "Ảnh món"} className="mt-4 h-40 w-full rounded-xl object-cover" />}
          <div className="mt-6 space-y-4"><label className="block text-xs font-semibold">Tên món<Input value={dishDraft.name} onChange={(event) => setDishDraft({ ...dishDraft, name: event.target.value })} className="mt-2" /></label><label className="block text-xs font-semibold">Danh mục<select value={dishDraft.category} onChange={(event) => setDishDraft({ ...dishDraft, category: event.target.value })} className="mt-2 h-10 w-full border border-input bg-card px-3 text-sm">{["Combo", "Mì xào", "Mì trộn", "Ăn kèm", "Đồ uống"].map((name) => <option key={name}>{name}</option>)}</select></label><div>
            <label htmlFor="dish-price" className="block text-xs font-semibold">Giá tại quán</label>
            <div className="relative mt-2">
              <Input id="dish-price" type="text" inputMode="decimal" value={dishPriceInput} onChange={event => setDishPriceInput(event.target.value)}
                placeholder="Ví dụ 65" className="pr-20 tabular-nums" aria-describedby="dish-price-hint" aria-invalid={Boolean(priceText) && dishPrice === null} />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-muted-foreground">nghìn đồng</span>
            </div>
            <p id="dish-price-hint" className="mt-1.5 text-xs text-muted-foreground">
              {dishPrice !== null ? `Giá hiển thị ${formatPrice(dishPrice)}` : priceText ? "Nhập giá hợp lệ bằng nghìn đồng." : "Ví dụ nhập 65 để lưu 65.000 ₫."}
            </p>
          </div><label className="flex cursor-pointer items-center gap-2 border border-border px-3 py-2.5 text-xs font-semibold hover:bg-secondary"><ImagePlus size={16} className="text-primary" />Ảnh món<input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={event => uploadImage(event.currentTarget.files?.[0], image => setDishDraft(current => current?.id === dishDraft.id ? { ...current, image } : current))} /></label></div>
          <DishTagsEditor key={dishDraft.id} tags={getDishTags(dishDraft)} onChange={tags => setDishDraft({ ...dishDraft, tag: undefined, tags })} />
          <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-border pt-4">
            {editingDish?.name && <Button variant="outline" className="text-destructive" disabled={busy || confirmDelete} onClick={() => setConfirmDelete(true)}><Trash2 size={15} />Xóa món</Button>}
            <Button className="ml-auto" disabled={busy || confirmDelete || !dishDraft.name.trim() || dishPrice === null} onClick={() => {
              if (dishPrice === null) return;
              stageDish(dishDraft.id, { ...dishDraft, name: dishDraft.name.trim(), price: dishPrice });
              closeDish();
            }}><Check size={15} />Lưu món vào bản chỉnh sửa</Button>
          </div>
          {confirmDelete && <div className="mt-3 rounded-xl border border-destructive/25 bg-destructive/5 p-3">
            <p className="text-sm font-bold">Xóa {editingDish?.name}?</p>
            <p className="mt-1 text-xs text-muted-foreground">Món sẽ được gỡ khỏi trang khách khi bạn bấm Lưu Menu quán.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setConfirmDelete(false)}>Giữ món</Button>
              <Button onClick={() => { stageDish(dishDraft.id); closeDish(); }}>Xác nhận xóa</Button>
            </div>
          </div>}
        </>}
      </SheetContent>
    </Sheet>
  </main>;
}

function DishTagsEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [custom, setCustom] = useState("");
  const customTag = getDishTags({ tag: custom })[0];
  const canAdd = Boolean(customTag && !tags.includes(customTag) && tags.length < 5);

  return <fieldset className="mt-5 rounded-xl border border-border p-3">
    <legend className="px-1 text-sm font-bold">Nhãn món</legend>
    <p className="mb-3 text-xs text-muted-foreground">Chọn tối đa 5 nhãn. Món tương ứng trên các tab đặt món sẽ hiển thị cùng nhãn.</p>
    <div className="flex flex-wrap gap-2">
      {[...new Set([...dishTagPresets, ...tags])].map(tag => {
        const selected = tags.includes(tag);
        return <Button key={tag} type="button" variant={selected ? undefined : "outline"} aria-pressed={selected}
          disabled={!selected && tags.length >= 5} className="h-9 rounded-full px-3"
          onClick={() => onChange(selected ? tags.filter(value => value !== tag) : [...tags, tag])}>
          {selected && <Check size={14} aria-hidden="true" />}{tag}
        </Button>;
      })}
    </div>
    <div className="mt-3 flex items-center gap-2">
      <Input aria-label="Nhãn tùy chỉnh" placeholder="Nhãn tùy chỉnh" maxLength={40} value={custom} onChange={event => setCustom(event.target.value)} />
      <Button type="button" variant="outline" disabled={!canAdd} onClick={() => { onChange([...tags, customTag]); setCustom(""); }}>Thêm nhãn</Button>
    </div>
  </fieldset>;
}

function PreviewPanel({ mode, appearance, dishes }: { mode: "phone" | "desktop"; appearance: Appearance; dishes: Dish[] }) {
  const { theme, accent, background, image, logo, greeting } = appearance;
  const preset = themes[theme];
  return <div className={`menu-page admin-menu-preview theme-${theme} ${mode === "phone" ? "admin-menu-preview-phone" : "admin-menu-preview-desktop"}`} style={{ "--primary": accent, backgroundColor: background || preset.background || undefined } as React.CSSProperties}>
    <div key={theme} className="menu-hero relative overflow-hidden">
      {image && <img src={image} alt="" className="absolute inset-0 size-full object-cover opacity-35" />}
      <div className="relative flex items-center gap-3 px-3 py-5 sm:px-5">
        <div className="menu-brand-mark relative shrink-0">
          <div className="menu-logo grid size-14 place-items-center overflow-hidden rounded-full sm:size-16">
            <img src={logo || "/xao-mi-logo.jpg"} alt="" className={`size-full object-contain ${logo ? "" : "scale-[1.48]"}`} />
          </div>
          <SeasonSticker theme={theme} />
        </div>
        <div className="min-w-0">
          {theme !== "default" && <p className="text-xs font-semibold">{preset.eyebrow}</p>}
          <p className="menu-wordmark leading-none">Xào Mì!</p>
          {greeting.trim() && <p className="menu-greeting">{greeting.trim()}</p>}
        </div>
      </div>
    </div>
    <div className="my-3 flex flex-wrap gap-1.5 text-xs font-bold">
      <span className="rounded-full bg-primary px-2.5 py-1.5 text-white">Menu quán</span>
      <span className="rounded-full bg-emerald-100 px-2.5 py-1.5 text-emerald-900">GrabFood</span>
      <span className="rounded-full bg-amber-100 px-2.5 py-1.5 text-amber-900">beFood</span>
      <span className="rounded-full bg-cyan-100 px-2.5 py-1.5 text-cyan-900">Xanh SM Ngon</span>
    </div>
    <div className="admin-preview-dishes grid gap-2">
      {dishes.map(dish => <div key={dish.id} className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card p-2">
        {dish.image ? <img src={dish.image} alt="" className="size-12 shrink-0 rounded-lg object-cover" /> : <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-secondary"><Utensils size={16} /></span>}
        <div className="min-w-0"><p className="text-sm font-bold leading-snug">{dish.name}</p><p className="mt-1 text-xs font-bold text-primary">{formatPrice(dish.price)}</p></div>
      </div>)}
    </div>
  </div>;
}

