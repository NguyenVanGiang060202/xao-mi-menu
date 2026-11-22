"use client";
import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { platformMenus, type Platform, type PlatformDraftDish } from "@/lib/catalog";
import { diffPlatformDishes, type PlatformDishChange } from "@/lib/platform-dish";

type EditRow = { id: string; category: string; name: string; price: string; originalPrice: string; available: boolean };
type CommitResult = { ok: boolean; message?: string };

const formatThousands = (value: number | undefined) => value === undefined ? "" : String(value / 1000);

function parseThousands(text: string): number | null | undefined {
  const normalized = text.trim().replace(",", ".");
  if (!normalized) return null;
  if (!/^\d+(?:\.\d{0,3})?$/.test(normalized)) return undefined;
  const value = Math.round(Number(normalized) * 1000);
  return value >= 0 && value <= 100000000 ? value : undefined;
}

export function PlatformMenuEditor({ platform, dishes, hint, onClose, onCommit }: {
  platform: Platform;
  dishes: PlatformDraftDish[];
  hint?: string;
  onClose: () => void;
  onCommit: (changes: PlatformDishChange[]) => Promise<CommitResult> | CommitResult;
}) {
  const [rows, setRows] = useState<EditRow[]>(() => dishes.map(dish => ({
    id: dish.id,
    category: dish.category,
    name: dish.name,
    price: dish.price === null ? "" : formatThousands(dish.price),
    originalPrice: formatThousands(dish.originalPrice),
    available: dish.available,
  })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { label } = platformMenus[platform];
  const originalById = new Map(dishes.map(dish => [dish.id, dish]));
  const groups = new Map<string, EditRow[]>();
  for (const row of rows) {
    const group = groups.get(row.category);
    if (group) group.push(row);
    else groups.set(row.category, [row]);
  }

  function updateRow(id: string, patch: Partial<EditRow>) {
    setRows(current => current.map(row => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function save() {
    if (busy) return;
    const edited: PlatformDraftDish[] = [];
    for (const row of rows) {
      const original = originalById.get(row.id);
      if (!original) continue;
      const name = row.name.trim();
      if (!name) {
        setError("Tên món không được để trống.");
        return;
      }
      const price = parseThousands(row.price);
      if (price === undefined) {
        setError(`Giá bán của "${name}" không hợp lệ.`);
        return;
      }
      const originalPrice = parseThousands(row.originalPrice);
      if (originalPrice === undefined) {
        setError(`Giá gốc của "${name}" không hợp lệ.`);
        return;
      }
      edited.push({ ...original, name, price, available: row.available, originalPrice: originalPrice === null ? undefined : originalPrice });
    }

    const changes = diffPlatformDishes(dishes, edited);
    if (!changes.length) {
      onClose();
      return;
    }

    setBusy(true);
    setError("");
    try {
      const result = await onCommit(changes);
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

  return <Sheet open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-2xl">
      <div className="sticky top-0 z-10 border-b border-border bg-card px-5 pb-3 pt-12">
        <SheetHeader className="text-left">
          <SheetTitle>Sửa menu {label}</SheetTitle>
          <SheetDescription>{hint ?? "Chỉnh tên, giá bán, giá gốc và trạng thái món. Giá tính bằng nghìn đồng, để trống nếu chưa có giá."}</SheetDescription>
        </SheetHeader>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">{rows.length} món</p>
          <Button disabled={busy} onClick={() => void save()}><Save size={15} />{busy ? "Đang lưu…" : "Lưu thay đổi"}</Button>
        </div>
        {error && <p role="alert" className="mt-3 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      </div>

      <div className="space-y-5 px-5 pb-10 pt-4">
        {[...groups].map(([category, items]) => <section key={category}>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">{category}<span className="rounded-full bg-secondary px-2 py-0.5 font-sans text-xs font-semibold">{items.length}</span></h3>
          <ul className="grid gap-2">
            {items.map(row => <li key={row.id} className="flex min-w-0 items-start gap-3 rounded-xl border border-border bg-card p-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Input value={row.name} aria-label={`Tên món ${row.name}`} maxLength={120}
                  onChange={event => updateRow(row.id, { name: event.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-[11px] font-semibold text-muted-foreground">Giá bán (nghìn đ)
                    <Input type="text" inputMode="decimal" value={row.price} placeholder="Ví dụ 70" className="mt-1 tabular-nums"
                      aria-label={`Giá bán ${row.name}`}
                      onChange={event => updateRow(row.id, { price: event.target.value.replace(/[^\d.,]/g, "") })} />
                  </label>
                  <label className="block text-[11px] font-semibold text-muted-foreground">Giá gốc (nghìn đ)
                    <Input type="text" inputMode="decimal" value={row.originalPrice} placeholder="Trống = không có" className="mt-1 tabular-nums"
                      aria-label={`Giá gốc ${row.name}`}
                      onChange={event => updateRow(row.id, { originalPrice: event.target.value.replace(/[^\d.,]/g, "") })} />
                  </label>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-center gap-1 border-l border-border pl-2 text-[10px] text-muted-foreground sm:pl-3">
                <Switch checked={row.available} disabled={busy} aria-label={`Đang bán: ${row.name}`}
                  onCheckedChange={available => updateRow(row.id, { available })} />
                {row.available ? "Đang bán" : "Tạm hết"}
              </div>
            </li>)}
          </ul>
        </section>)}
      </div>
    </SheetContent>
  </Sheet>;
}
