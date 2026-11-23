"use client";

import { useState } from "react";
import { ArrowDownUp, Check, ImagePlus, Pencil, Plus, RefreshCw, Save, Trash2, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DishTag } from "@/components/dish-tag";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { platformMenus, type Platform, type PlatformDraftDish } from "@/lib/catalog";
import { dishTagPresets, formatPrice, getDishTags } from "@/lib/menu-data";
import { groupMenu } from "@/lib/menu-order";
import { ShopMenuOrder } from "./shop-menu-order";
import { uploadImage as uploadAsset } from "@/app/actions";
import type { PlatformDishChange } from "@/lib/platform-dish";

type CommitPayload = {
  changes: PlatformDishChange[];
  removedIds: string[];
  orderedIds: string[];
};

type CommitResult = { ok: boolean; message?: string };

export function PlatformMenuEditor({
  platform,
  dishes: initialDishes,
  hint,
  onClose,
  onCommit,
}: {
  platform: Platform;
  dishes: PlatformDraftDish[];
  hint?: string;
  onClose: () => void;
  onCommit: (payload: CommitPayload) => Promise<CommitResult> | CommitResult;
}) {
  const { label } = platformMenus[platform];
  const [dishes, setDishes] = useState<PlatformDraftDish[]>(initialDishes);
  const [reordering, setReordering] = useState(false);
  const [editingDish, setEditingDish] = useState<PlatformDraftDish | null>(null);
  const [dishDraft, setDishDraft] = useState<PlatformDraftDish | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dishPriceInput, setDishPriceInput] = useState("");
  const [dishOriginalPriceInput, setDishOriginalPriceInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const originalDishesMap = new Map(initialDishes.map(d => [d.id, d]));
  const hasChanges = JSON.stringify(dishes) !== JSON.stringify(initialDishes);
  const dishGroups = groupMenu(dishes);

  const priceText = dishPriceInput.trim().replace(",", ".");
  const parsedPrice = priceText ? (/^\d+(?:\.\d{0,3})?$/.test(priceText) ? Math.round(Number(priceText) * 1000) : NaN) : null;
  const validPrice = priceText ? (Number.isSafeInteger(parsedPrice) && parsedPrice !== null && parsedPrice >= 0 && parsedPrice <= 100000000 ? parsedPrice : undefined) : null;

  const originalPriceText = dishOriginalPriceInput.trim().replace(",", ".");
  const parsedOrigPrice = originalPriceText ? (/^\d+(?:\.\d{0,3})?$/.test(originalPriceText) ? Math.round(Number(originalPriceText) * 1000) : NaN) : null;
  const validOrigPrice = originalPriceText ? (Number.isSafeInteger(parsedOrigPrice) && parsedOrigPrice !== null && parsedOrigPrice >= 0 && parsedOrigPrice <= 100000000 ? parsedOrigPrice : undefined) : undefined;

  function openDish(dish: PlatformDraftDish) {
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

  function stageDish(id: string, updated?: PlatformDraftDish) {
    setDishes(current => {
      if (!updated) {
        return current.filter(d => d.id !== id);
      }
      const exists = current.some(d => d.id === id);
      return exists ? current.map(d => (d.id === id ? updated : d)) : [...current, updated];
    });
  }

  function stageOrder(ordered: PlatformDraftDish[]) {
    setDishes(ordered);
  }

  function toggleAvailable(id: string, available: boolean) {
    setDishes(current => current.map(d => (d.id === id ? { ...d, available } : d)));
  }

  async function uploadImageFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.set("image", file);
      const url = await uploadAsset(form);
      setDishDraft(curr => (curr ? { ...curr, image: url } : curr));
    } catch {
      setError("Không tải được ảnh. Hãy thử lại.");
    } finally {
      setBusy(false);
    }
  }

  async function saveAll() {
    if (busy) return;
    const currentIds = new Set(dishes.map(d => d.id));
    const removedIds = initialDishes.filter(d => !currentIds.has(d.id)).map(d => d.id);

    const changes: PlatformDishChange[] = [];
    for (const dish of dishes) {
      const orig = originalDishesMap.get(dish.id);
      const tagsEqual = JSON.stringify(dish.tags ?? []) === JSON.stringify(orig?.tags ?? []);
      if (
        !orig ||
        dish.name !== orig.name ||
        dish.category !== orig.category ||
        (dish.description ?? "") !== (orig.description ?? "") ||
        (dish.ingredients ?? "") !== (orig.ingredients ?? "") ||
        dish.price !== orig.price ||
        (dish.originalPrice ?? null) !== (orig.originalPrice ?? null) ||
        dish.available !== orig.available ||
        (dish.image ?? "") !== (orig.image ?? "") ||
        dish.tag !== orig.tag ||
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

    const orderedIds = dishes.map(d => d.id);

    setBusy(true);
    setError("");
    try {
      const result = await onCommit({ changes, removedIds, orderedIds });
      if (!result.ok) {
        setError(result.message ?? "Không lưu được thay đổi. Hãy thử lại.");
        return;
      }
      onClose();
    } catch {
      setError("Không lưu được thay đổi. Hãy thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Sheet open onOpenChange={open => { if (!open && !busy) onClose(); }}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-3xl">
          <div className="sticky top-0 z-20 border-b border-border bg-card px-5 pb-4 pt-12">
            <SheetHeader className="text-left">
              <SheetTitle className="text-2xl font-bold">Quản lý menu {label}</SheetTitle>
              <SheetDescription>
                {hint ?? "Thêm, sửa, xóa, gắn nhãn, thay đổi ảnh và sắp xếp thứ tự món cho " + label + "."}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {dishes.length} món · {dishes.filter(d => d.available).length} đang bán
                </span>
                {hasChanges && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                    Chưa lưu
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={reordering ? "secondary" : "outline"}
                  disabled={busy || !dishes.length}
                  onClick={() => setReordering(v => !v)}
                >
                  <ArrowDownUp size={15} />
                  {reordering ? "Xong sắp xếp" : "Sắp xếp"}
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    const newDish: PlatformDraftDish = {
                      id: `${platform}-${crypto.randomUUID()}`,
                      name: "",
                      category: "Mì xào",
                      price: null,
                      description: "",
                      ingredients: "",
                      available: true,
                    };
                    openDish(newDish);
                  }}
                >
                  <Plus size={16} />Thêm món
                </Button>
                <Button disabled={busy || !hasChanges} onClick={() => void saveAll()}>
                  <Save size={15} />
                  {busy ? "Đang lưu…" : "Lưu Menu " + label}
                </Button>
              </div>
            </div>

            {error && (
              <p role="alert" className="mt-3 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <div className="p-5 pb-16">
            {reordering ? (
              <ShopMenuOrder dishes={dishes} disabled={busy} onChange={stageOrder} />
            ) : (
              <div className="space-y-6">
                {!dishes.length && (
                  <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    Menu {label} chưa có món nào. Bấm &quot;Thêm món&quot; để tạo món mới.
                  </p>
                )}
                {dishGroups.map(({ category, dishes: items }) => (
                  <section key={category}>
                    <h3 className="mb-2 flex items-center gap-2 font-bold text-foreground">
                      {category}
                      <span className="rounded-full bg-secondary px-2 py-0.5 font-sans text-xs font-semibold">
                        {items.length}
                      </span>
                    </h3>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {items.map(dish => (
                        <li key={dish.id} className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card p-2 sm:gap-3">
                          <button
                            type="button"
                            disabled={busy}
                            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg text-left sm:gap-3"
                            onClick={() => openDish(dish)}
                          >
                            {dish.image ? (
                              <img src={dish.image} alt="" loading="lazy" className="size-12 shrink-0 rounded-lg object-cover sm:size-14" />
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
                                  <span className="ml-1 text-[11px] font-normal text-muted-foreground line-through">
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
                              disabled={busy}
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
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet chi tiết món của sàn (Thêm / Sửa / Xóa / Ảnh / Nhãn) */}
      <Sheet open={Boolean(editingDish)} onOpenChange={open => { if (!open) closeDish(); }}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {dishDraft && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle>{editingDish?.name ? `Sửa: ${editingDish.name}` : "Thêm món mới"}</SheetTitle>
                <SheetDescription>
                  Chỉnh thông tin món trên {label}. Bấm &quot;Lưu vào danh sách&quot; sau đó lưu menu để cập nhật.
                </SheetDescription>
              </SheetHeader>

              {dishDraft.image && (
                <img src={dishDraft.image} alt={dishDraft.name || "Ảnh món"} className="mt-4 h-40 w-full rounded-xl object-cover" />
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
                    <label htmlFor="platform-dish-price" className="block text-xs font-semibold">Giá bán (nghìn đ)</label>
                    <Input
                      id="platform-dish-price"
                      type="text"
                      inputMode="decimal"
                      value={dishPriceInput}
                      onChange={event => setDishPriceInput(event.target.value)}
                      placeholder="Trống = chưa có"
                      className="mt-2 tabular-nums"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {validPrice !== undefined ? (validPrice !== null ? formatPrice(validPrice) : "Chưa có giá") : "Giá không hợp lệ"}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="platform-dish-orig-price" className="block text-xs font-semibold">Giá gốc (nghìn đ)</label>
                    <Input
                      id="platform-dish-orig-price"
                      type="text"
                      inputMode="decimal"
                      value={dishOriginalPriceInput}
                      onChange={event => setDishOriginalPriceInput(event.target.value)}
                      placeholder="Trống = không gạch"
                      className="mt-2 tabular-nums"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {validOrigPrice !== undefined ? formatPrice(validOrigPrice) : "Không có"}
                    </p>
                  </div>
                </div>

                <label className="block text-xs font-semibold">
                  Mô tả món
                  <Input
                    value={dishDraft.description ?? ""}
                    onChange={event => setDishDraft({ ...dishDraft, description: event.target.value })}
                    className="mt-2"
                    placeholder="Nguyên liệu, cách chế biến..."
                  />
                </label>

                <label className="flex cursor-pointer items-center gap-2 border border-border px-3 py-2.5 text-xs font-semibold hover:bg-secondary">
                  <ImagePlus size={16} className="text-primary" />
                  Ảnh món
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={busy}
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
                    className="text-destructive"
                    disabled={busy || confirmDelete}
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 size={15} />Xóa món
                  </Button>
                )}
                <Button
                  className="ml-auto"
                  disabled={busy || confirmDelete || !dishDraft.name.trim() || validPrice === undefined || validOrigPrice === undefined}
                  onClick={() => {
                    stageDish(dishDraft.id, {
                      ...dishDraft,
                      name: dishDraft.name.trim(),
                      price: validPrice ?? null,
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
                  <p className="text-sm font-bold">Xóa {editingDish?.name} khỏi {label}?</p>
                  <p className="mt-1 text-xs text-muted-foreground">Món sẽ bị gỡ khỏi thực đơn {label} khi bạn bấm Lưu.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setConfirmDelete(false)}>Giữ món</Button>
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
    </>
  );
}

function DishTagsEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [custom, setCustom] = useState("");
  const customTag = getDishTags({ tag: custom })[0];
  const canAdd = Boolean(customTag && !tags.includes(customTag) && tags.length < 5);

  return (
    <fieldset className="mt-5 rounded-xl border border-border p-3">
      <legend className="px-1 text-sm font-bold">Nhãn món</legend>
      <p className="mb-3 text-xs text-muted-foreground">Chọn tối đa 5 nhãn. Hiển thị cùng nhãn với thực đơn.</p>
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
