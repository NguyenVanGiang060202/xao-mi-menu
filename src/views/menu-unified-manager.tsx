"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownUp,
  Check,
  ImagePlus,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DishTag } from "@/components/dish-tag";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { dishTagPresets, formatPrice, getDishTags } from "@/lib/menu-data";
import { groupMenu } from "@/lib/menu-order";
import { platformMenus, type MenuDish, type Platform, type PlatformDraftDish } from "@/lib/catalog";
import type { Store } from "@/lib/store";
import type { PublicMenu } from "@/lib/public-menu";
import type { NotifyAdmin } from "@/components/admin-toast";
import { syncBeToShop, updatePlatformMenu, updateShopMenu, uploadImage as uploadAsset } from "@/app/actions";
import { ShopMenuOrder } from "./shop-menu-order";
import { diffPlatformDishes, type PlatformDishChange } from "@/lib/platform-dish";

type MenuTabKey = "shop" | Platform;

const menuTabs: { key: MenuTabKey; label: string; badgeColor: string }[] = [
  { key: "shop", label: "Menu quán", badgeColor: "bg-primary text-primary-foreground" },
  { key: "grab", label: "GrabFood", badgeColor: "bg-emerald-600 text-white" },
  { key: "be", label: "beFood", badgeColor: "bg-amber-500 text-white" },
  { key: "xanh", label: "Xanh SM Ngon", badgeColor: "bg-cyan-600 text-white" },
];

export function MenuUnifiedManager({
  store,
  menuRevision,
  publicMenu,
  notify,
}: {
  store: Store;
  menuRevision: string;
  publicMenu: PublicMenu;
  notify: NotifyAdmin;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<MenuTabKey>("shop");

  // State menu quán
  const [shopDraftDishes, setShopDraftDishes] = useState<MenuDish[] | null>(null);
  const [syncingShop, setSyncingShop] = useState(false);
  const [savingShop, setSavingShop] = useState(false);
  const currentShopDishes = shopDraftDishes ?? store.dishes;

  // State các sàn (Grab, be, Xanh)
  const [platformDrafts, setPlatformDrafts] = useState<Partial<Record<Platform, PlatformDraftDish[]>>>({});
  const [savingPlatform, setSavingPlatform] = useState<Platform | null>(null);

  // Reorder mode cho từng tab
  const [reordering, setReordering] = useState(false);

  // Dialog chỉnh sửa/thêm món
  const [editingDish, setEditingDish] = useState<PlatformDraftDish | MenuDish | null>(null);
  const [dishDraft, setDishDraft] = useState<PlatformDraftDish | MenuDish | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dishPriceInput, setDishPriceInput] = useState("");
  const [dishOriginalPriceInput, setDishOriginalPriceInput] = useState("");
  const [imageUploading, setImageUploading] = useState(false);

  // Baseline dishes cho từng sàn
  function getPlatformBaseline(platform: Platform): PlatformDraftDish[] {
    const snapshot = store[platformMenus[platform].key];
    if (snapshot?.dishes) return snapshot.dishes;
    return publicMenu.menus[platform] ?? [];
  }

  const currentPlatformDishes = (platform: Platform): PlatformDraftDish[] => {
    return platformDrafts[platform] ?? getPlatformBaseline(platform);
  };

  const isCurrentTabDirty = (): boolean => {
    if (activeTab === "shop") return shopDraftDishes !== null;
    return Boolean(platformDrafts[activeTab]);
  };

  const currentTabDishes = activeTab === "shop" ? currentShopDishes : currentPlatformDishes(activeTab);
  const currentTabGroups = groupMenu(currentTabDishes as readonly { id: string; category: string }[]) as { category: string; dishes: (MenuDish | PlatformDraftDish)[] }[];
  const isBusy = syncingShop || savingShop || Boolean(savingPlatform);

  // Parsing giá
  const priceText = dishPriceInput.trim().replace(",", ".");
  const parsedPrice = priceText ? (/^\d+(?:\.\d{0,3})?$/.test(priceText) ? Math.round(Number(priceText) * 1000) : NaN) : null;
  const validPrice = activeTab === "shop"
    ? (Number.isSafeInteger(parsedPrice) && parsedPrice !== null && parsedPrice >= 0 && parsedPrice <= 100000000 ? parsedPrice : null)
    : (priceText ? (Number.isSafeInteger(parsedPrice) && parsedPrice !== null && parsedPrice >= 0 && parsedPrice <= 100000000 ? parsedPrice : undefined) : null);

  const origPriceText = dishOriginalPriceInput.trim().replace(",", ".");
  const parsedOrig = origPriceText ? (/^\d+(?:\.\d{0,3})?$/.test(origPriceText) ? Math.round(Number(origPriceText) * 1000) : NaN) : null;
  const validOrigPrice = origPriceText ? (Number.isSafeInteger(parsedOrig) && parsedOrig !== null && parsedOrig >= 0 && parsedOrig <= 100000000 ? parsedOrig : undefined) : undefined;

  // Xử lý món
  function openDish(dish: MenuDish | PlatformDraftDish) {
    setConfirmDelete(false);
    setEditingDish(dish);
    setDishDraft({ ...dish });
    setDishPriceInput(dish.price !== null ? String(dish.price / 1000).replace(".", ",") : "");
    setDishOriginalPriceInput(dish.originalPrice !== undefined ? String(dish.originalPrice / 1000).replace(".", ",") : "");
  }

  function closeDish() {
    setEditingDish(null);
    setDishDraft(null);
  }

  function stageDish(id: string, updated?: MenuDish | PlatformDraftDish) {
    if (activeTab === "shop") {
      setShopDraftDishes(current => {
        const baseline = store.dishes;
        const draft = current ?? baseline;
        const exists = draft.some(d => d.id === id);
        const next = !updated
          ? draft.filter(d => d.id !== id)
          : exists
          ? draft.map(d => (d.id === id ? (updated as MenuDish) : d))
          : [...draft, updated as MenuDish];

        return JSON.stringify(next) === JSON.stringify(baseline) ? null : next;
      });
    } else {
      const platform = activeTab;
      setPlatformDrafts(current => {
        const baseline = getPlatformBaseline(platform);
        const draft = current[platform] ?? baseline;
        const exists = draft.some(d => d.id === id);
        const next = !updated
          ? draft.filter(d => d.id !== id)
          : exists
          ? draft.map(d => (d.id === id ? (updated as PlatformDraftDish) : d))
          : [...draft, updated as PlatformDraftDish];

        const isSame = JSON.stringify(next) === JSON.stringify(baseline);
        const copy = { ...current };
        if (isSame) delete copy[platform];
        else copy[platform] = next;
        return copy;
      });
    }
  }

  function stageOrder(ordered: (MenuDish | PlatformDraftDish)[]) {
    if (activeTab === "shop") {
      setShopDraftDishes(ordered as MenuDish[]);
    } else {
      const platform = activeTab;
      setPlatformDrafts(current => ({
        ...current,
        [platform]: ordered as PlatformDraftDish[],
      }));
    }
  }

  function toggleAvailable(id: string, available: boolean) {
    const dish = currentTabDishes.find(d => d.id === id);
    if (!dish) return;
    stageDish(id, { ...dish, available });
  }

  async function uploadImageFile(file: File | undefined) {
    if (!file) return;
    setImageUploading(true);
    try {
      const form = new FormData();
      form.set("image", file);
      const url = await uploadAsset(form);
      setDishDraft(curr => (curr ? { ...curr, image: url } : curr));
      notify("Đã tải ảnh lên thành công.", "success");
    } catch {
      notify("Không tải được ảnh. Hãy thử lại.", "error");
    } finally {
      setImageUploading(false);
    }
  }

  // Đồng bộ Menu quán từ beFood
  async function syncShop() {
    if (isBusy || shopDraftDishes) return;
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

  // Lưu Menu quán
  async function saveShopMenu() {
    if (isBusy || !shopDraftDishes) return;
    setSavingShop(true);
    try {
      const original = store.dishes;
      const originals = new Set(original);
      const ids = new Set(shopDraftDishes.map(d => d.id));
      const result = await updateShopMenu({
        revision: menuRevision,
        changed: shopDraftDishes.filter(d => !originals.has(d)),
        removedIds: original.filter(d => !ids.has(d.id)).map(d => d.id),
        orderedIds: shopDraftDishes.map(d => d.id),
      });
      notify(result.message, result.ok ? "success" : "error");
      if (result.ok) {
        setShopDraftDishes(null);
        router.refresh();
      }
    } catch {
      notify("Không lưu được Menu quán. Hãy thử lại.", "error");
    } finally {
      setSavingShop(false);
    }
  }

  // Lưu Menu sàn
  async function savePlatformMenu(platform: Platform) {
    const draft = platformDrafts[platform];
    if (isBusy || !draft) return;
    setSavingPlatform(platform);
    try {
      const baseline = getPlatformBaseline(platform);
      const currentIds = new Set(draft.map(d => d.id));
      const removedIds = baseline.filter(d => !currentIds.has(d.id)).map(d => d.id);
      const changes: PlatformDishChange[] = diffPlatformDishes(baseline, draft);
      const orderedIds = draft.map(d => d.id);

      const snapshot = store[platformMenus[platform].key];
      const result = await updatePlatformMenu({
        platform,
        previousSync: snapshot?.syncedAt ?? "",
        changes,
        removedIds,
        orderedIds,
      });

      notify(result.message, result.ok ? "success" : "error");
      if (result.ok) {
        setPlatformDrafts(curr => {
          const copy = { ...curr };
          delete copy[platform];
          return copy;
        });
        router.refresh();
      }
    } catch {
      notify(`Không lưu được menu ${platformMenus[platform].label}. Hãy thử lại.`, "error");
    } finally {
      setSavingPlatform(null);
    }
  }

  function handleSaveCurrentTab() {
    if (activeTab === "shop") {
      void saveShopMenu();
    } else {
      void savePlatformMenu(activeTab);
    }
  }

  function handleDiscardCurrentTab() {
    if (activeTab === "shop") {
      setShopDraftDishes(null);
    } else {
      setPlatformDrafts(curr => {
        const copy = { ...curr };
        delete copy[activeTab];
        return copy;
      });
    }
    setReordering(false);
  }

  const currentTabLabel = menuTabs.find(t => t.key === activeTab)?.label ?? "Menu";

  return (
    <section className="admin-sheet">
      {/* Header chuyển tab sàn / quán */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">Quản lý thực đơn</h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Chỉnh sửa trực tiếp món ăn, giá và nhãn cho quán hoặc từng nền tảng đặt hàng.
          </p>
        </div>

        {/* Thanh chọn Tab */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-secondary/60 p-1">
          {menuTabs.map(({ key, label }) => {
            const isActive = activeTab === key;
            const isDirty = key === "shop" ? shopDraftDishes !== null : Boolean(platformDrafts[key]);
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setReordering(false);
                  setActiveTab(key);
                }}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors sm:text-sm ${
                  isActive
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                }`}
              >
                {label}
                {isDirty && (
                  <span className="size-2 rounded-full bg-amber-500" title="Có thay đổi chưa lưu" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar điều khiển của tab đang chọn */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-bold">
            {currentTabLabel}
            <span className="text-xs font-normal text-muted-foreground sm:text-sm">
              ({currentTabDishes.length} món · {currentTabDishes.filter(d => d.available).length} đang bán)
            </span>
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={reordering ? "secondary" : "outline"}
            disabled={isBusy || !currentTabDishes.length}
            aria-pressed={reordering}
            onClick={() => setReordering(v => !v)}
          >
            <ArrowDownUp size={15} />
            {reordering ? "Xong sắp xếp" : "Sắp xếp"}
          </Button>

          {activeTab === "shop" && (
            <Button
              variant="outline"
              disabled={isBusy || Boolean(shopDraftDishes)}
              onClick={() => void syncShop()}
            >
              <RefreshCw size={15} className={syncingShop ? "animate-spin" : ""} />
              {syncingShop ? "Đang đồng bộ…" : "Đồng bộ từ beFood"}
            </Button>
          )}

          <Button
            variant="outline"
            disabled={isBusy}
            onClick={() => {
              const newId = activeTab === "shop" ? crypto.randomUUID() : `${activeTab}-${crypto.randomUUID()}`;
              const newDish: MenuDish | PlatformDraftDish = {
                id: newId,
                name: "",
                category: "Mì xào",
                price: activeTab === "shop" ? 0 : null,
                description: "",
                ingredients: "",
                available: true,
              };
              openDish(newDish);
            }}
          >
            <Plus size={16} />Thêm món
          </Button>
        </div>
      </div>

      {/* Thanh trạng thái lưu thay đổi */}
      <div className="sticky top-2 z-10 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-sm sm:px-4">
        <p role="status" className="text-sm">
          <span className="font-bold">
            {isCurrentTabDirty() ? "Có thay đổi chưa lưu" : `Menu ${currentTabLabel} đã lưu`}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {isCurrentTabDirty()
              ? `Lưu thứ tự và các chỉnh sửa để cập nhật lên trang khách cho ${currentTabLabel}.`
              : "Thêm, sửa, xóa hoặc sắp xếp món rồi lưu để công bố."}
          </span>
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {isCurrentTabDirty() && (
            <Button variant="outline" disabled={isBusy} onClick={handleDiscardCurrentTab}>
              Bỏ thay đổi
            </Button>
          )}
          <Button disabled={isBusy || !isCurrentTabDirty()} onClick={handleSaveCurrentTab}>
            <Save size={15} />
            {savingShop || savingPlatform ? "Đang lưu…" : `Lưu ${currentTabLabel}`}
          </Button>
        </div>
      </div>

      {/* Nội dung danh sách món hoặc Sắp xếp */}
      {reordering ? (
        <ShopMenuOrder dishes={currentTabDishes} disabled={isBusy} onChange={stageOrder} />
      ) : (
        <div className="space-y-6">
          {!currentTabDishes.length && (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {currentTabLabel} chưa có món nào. Bấm &quot;Thêm món&quot; để tạo món mới.
            </p>
          )}

          {currentTabGroups.map(({ category, dishes: items }) => (
            <section key={category}>
              <h4 className="mb-2 flex items-center gap-2 font-bold text-foreground">
                {category}
                <span className="rounded-full bg-secondary px-2 py-0.5 font-sans text-xs font-semibold">
                  {items.length}
                </span>
              </h4>

              <ul className="grid gap-2 xl:grid-cols-2">
                {items.map(dish => (
                  <li
                    key={dish.id}
                    className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card p-2 sm:gap-3"
                  >
                    <button
                      type="button"
                      disabled={isBusy}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-lg text-left sm:gap-3"
                      onClick={() => openDish(dish)}
                    >
                      {dish.image ? (
                        <img
                          src={dish.image}
                          alt=""
                          loading="lazy"
                          className="size-12 shrink-0 rounded-lg object-cover sm:size-14"
                        />
                      ) : (
                        <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-secondary text-primary sm:size-14">
                          <Utensils size={18} />
                        </span>
                      )}

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold leading-snug">{dish.name}</span>
                        <span className="mt-0.5 block text-xs font-semibold text-primary">
                          {dish.price !== null ? formatPrice(dish.price) : "Chưa có giá"}
                          {dish.originalPrice !== undefined && dish.originalPrice > (dish.price ?? 0) && (
                            <span className="ml-1.5 text-[11px] font-normal text-muted-foreground line-through">
                              {formatPrice(dish.originalPrice)}
                            </span>
                          )}
                        </span>
                        <span className="flex flex-wrap gap-1.5 empty:hidden [&:not(:empty)]:mt-1.5">
                          {getDishTags(dish).map(tag => (
                            <DishTag key={tag} label={tag} />
                          ))}
                        </span>
                      </span>

                      <Pencil size={14} className="shrink-0 text-primary" aria-hidden="true" />
                    </button>

                    <div className="flex shrink-0 flex-col items-center gap-1 border-l border-border pl-2 text-[10px] text-muted-foreground sm:pl-3">
                      <Switch
                        checked={dish.available}
                        disabled={isBusy}
                        aria-label={`Đang bán: ${dish.name}`}
                        onCheckedChange={available => toggleAvailable(dish.id, available)}
                      />
                      {dish.available ? "Đang bán" : "Tạm hết"}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* Sheet chi tiết món (Dùng chung cho quán & các sàn) */}
      <Sheet open={Boolean(editingDish)} onOpenChange={open => { if (!open) closeDish(); }}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {dishDraft && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle>
                  {editingDish?.name ? `Sửa: ${editingDish.name}` : `Thêm món (${currentTabLabel})`}
                </SheetTitle>
                <SheetDescription>
                  Chỉnh thông tin món cho {currentTabLabel}. Sau đó bấm &quot;Lưu vào danh sách&quot; và bấm Lưu Menu để cập nhật.
                </SheetDescription>
              </SheetHeader>

              {dishDraft.image && (
                <img
                  src={dishDraft.image}
                  alt={dishDraft.name || "Ảnh món"}
                  className="mt-4 h-40 w-full rounded-xl object-cover"
                />
              )}

              <div className="mt-6 space-y-4">
                <label className="block text-xs font-semibold">
                  Tên món
                  <Input
                    value={dishDraft.name}
                    onChange={event => setDishDraft({ ...dishDraft, name: event.target.value })}
                    className="mt-2"
                  />
                </label>

                <label className="block text-xs font-semibold">
                  Danh mục
                  <select
                    value={dishDraft.category}
                    onChange={event => setDishDraft({ ...dishDraft, category: event.target.value })}
                    className="mt-2 h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                  >
                    {["Combo", "Mì xào", "Mì trộn", "Ăn kèm", "Đồ uống"].map(name => (
                      <option key={name}>{name}</option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="unified-dish-price" className="block text-xs font-semibold">
                      {activeTab === "shop" ? "Giá tại quán (nghìn đ)" : "Giá bán (nghìn đ)"}
                    </label>
                    <Input
                      id="unified-dish-price"
                      type="text"
                      inputMode="decimal"
                      value={dishPriceInput}
                      onChange={event => setDishPriceInput(event.target.value)}
                      placeholder={activeTab === "shop" ? "Ví dụ 65" : "Trống = chưa có"}
                      className="mt-2 tabular-nums"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {validPrice !== undefined
                        ? (validPrice !== null ? formatPrice(validPrice) : (activeTab === "shop" ? "Nhập giá" : "Chưa có giá"))
                        : "Giá không hợp lệ"}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="unified-orig-price" className="block text-xs font-semibold">
                      Giá gốc (nghìn đ)
                    </label>
                    <Input
                      id="unified-orig-price"
                      type="text"
                      inputMode="decimal"
                      value={dishOriginalPriceInput}
                      onChange={event => setDishOriginalPriceInput(event.target.value)}
                      placeholder="Trống = không gạch"
                      className="mt-2 tabular-nums"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {validOrigPrice !== undefined ? formatPrice(validOrigPrice) : "Không gạch giá"}
                    </p>
                  </div>
                </div>

                <label className="block text-xs font-semibold">
                  Mô tả món
                  <Input
                    value={dishDraft.description ?? ""}
                    onChange={event => setDishDraft({ ...dishDraft, description: event.target.value })}
                    className="mt-2"
                    placeholder="Mì xào giòn, sốt cay đặc biệt..."
                  />
                </label>

                <label className="flex cursor-pointer items-center gap-2 border border-border px-3 py-2.5 text-xs font-semibold hover:bg-secondary">
                  <ImagePlus size={16} className="text-primary" />
                  {imageUploading ? "Đang tải ảnh lên…" : "Ảnh món"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={imageUploading}
                    onChange={event => void uploadImageFile(event.currentTarget.files?.[0])}
                  />
                </label>
              </div>

              <DishTagsEditor
                key={dishDraft.id}
                tags={getDishTags(dishDraft)}
                onChange={tags => setDishDraft({ ...dishDraft, tag: undefined, tags })}
              />

              <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-border pt-4">
                {editingDish?.name && (
                  <Button
                    variant="outline"
                    className="border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
                    disabled={isBusy || confirmDelete}
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 size={15} />Xóa món
                  </Button>
                )}

                <Button
                  className="ml-auto"
                  disabled={
                    isBusy ||
                    confirmDelete ||
                    !dishDraft.name.trim() ||
                    validPrice === undefined ||
                    (activeTab === "shop" && validPrice === null)
                  }
                  onClick={() => {
                    stageDish(dishDraft.id, {
                      ...dishDraft,
                      name: dishDraft.name.trim(),
                      price: (validPrice ?? (activeTab === "shop" ? 0 : null)) as number,
                      originalPrice: validOrigPrice,
                    });
                    closeDish();
                  }}
                >
                  <Check size={15} />Lưu vào danh sách
                </Button>
              </div>

              {confirmDelete && (
                <div className="mt-3 rounded-xl border border-destructive/25 bg-destructive/5 p-3">
                  <p className="text-sm font-bold">Xóa {editingDish?.name} khỏi {currentTabLabel}?</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Món sẽ bị gỡ khỏi thực đơn {currentTabLabel} khi bạn bấm Lưu.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setConfirmDelete(false)}>
                      Giữ món
                    </Button>
                    <Button
                      variant="outline"
                      className="border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
                      onClick={() => {
                        stageDish(dishDraft.id);
                        closeDish();
                      }}
                    >
                      Xác nhận xóa
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}

function DishTagsEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [custom, setCustom] = useState("");
  const customTag = getDishTags({ tag: custom })[0];
  const canAdd = Boolean(customTag && !tags.includes(customTag) && tags.length < 5);

  return (
    <fieldset className="mt-5 rounded-xl border border-border p-3">
      <legend className="px-1 text-sm font-bold">Nhãn món</legend>
      <p className="mb-3 text-xs text-muted-foreground">
        Chọn tối đa 5 nhãn. Món trên các nền tảng sẽ hiển thị cùng nhãn.
      </p>
      <div className="flex flex-wrap gap-2">
        {[...new Set([...dishTagPresets, ...tags])].map(tag => {
          const selected = tags.includes(tag);
          return (
            <Button
              key={tag}
              type="button"
              variant={selected ? undefined : "outline"}
              aria-pressed={selected}
              disabled={!selected && tags.length >= 5}
              className="h-9 rounded-full px-3"
              onClick={() => onChange(selected ? tags.filter(v => v !== tag) : [...tags, tag])}
            >
              {selected && <Check size={14} aria-hidden="true" />}
              {tag}
            </Button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Input
          aria-label="Nhãn tùy chỉnh"
          placeholder="Nhãn tùy chỉnh"
          maxLength={40}
          value={custom}
          onChange={event => setCustom(event.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={!canAdd}
          onClick={() => {
            onChange([...tags, customTag]);
            setCustom("");
          }}
        >
          Thêm nhãn
        </Button>
      </div>
    </fieldset>
  );
}
