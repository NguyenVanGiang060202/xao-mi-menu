"use client";
import { useMemo, useState } from "react";
import { ArrowUpRight, Minus, Plus, ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { channels, platformMenus, type Platform, type PlatformDraftDish, type PlatformFee, type Voucher } from "@/lib/catalog";
import { formatPrice } from "@/lib/menu-data";
import { groupMenu } from "@/lib/menu-order";
import { voucherAmount, voucherDiscountLabel, voucherSortValue } from "@/lib/voucher";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: Platform;
  dishes: PlatformDraftDish[];
  vouchers: Voucher[];
  fees: PlatformFee;
};

export function OrderEstimator({ open, onOpenChange, platform, dishes, vouchers, fees }: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [voucherChoice, setVoucherChoice] = useState("auto");

  const sellable = useMemo(() => dishes.filter(dish => dish.price !== null && dish.available !== false), [dishes]);
  const groups = useMemo(() => groupMenu(sellable), [sellable]);
  const count = sellable.reduce((sum, dish) => sum + (quantities[dish.id] ?? 0), 0);
  const subtotal = sellable.reduce((sum, dish) => sum + (dish.price ?? 0) * (quantities[dish.id] ?? 0), 0);

  const enabledVouchers = vouchers.filter(voucher => voucher.enabled);
  const eligibleVouchers = enabledVouchers
    .filter(voucher => !voucher.minOrder || subtotal >= voucher.minOrder)
    .sort((a, b) => voucherSortValue(b) - voucherSortValue(a));
  let bestVoucher: Voucher | undefined;
  for (const voucher of eligibleVouchers) {
    if (!bestVoucher || voucherAmount(voucher, subtotal) > voucherAmount(bestVoucher, subtotal)) bestVoucher = voucher;
  }
  const voucherValue = voucherChoice === "auto" || voucherChoice === "none" || eligibleVouchers.some(voucher => voucher.id === voucherChoice)
    ? voucherChoice
    : "auto";
  const chosenVoucher = voucherValue === "auto" ? bestVoucher : voucherValue === "none" ? undefined : eligibleVouchers.find(voucher => voucher.id === voucherValue);
  const discount = chosenVoucher ? voucherAmount(chosenVoucher, subtotal) : 0;

  const delivery = subtotal > 0 ? fees.delivery : 0;
  const service = subtotal > 0 ? fees.service : 0;
  const smallOrder = subtotal > 0 && fees.smallOrderThreshold > 0 && subtotal < fees.smallOrderThreshold ? fees.smallOrderFee : 0;
  const hasFeeConfig = fees.delivery > 0 || fees.service > 0 || fees.smallOrderFee > 0;
  const total = Math.max(0, subtotal - discount) + delivery + service + smallOrder;
  const label = platformMenus[platform].label;

  function change(id: string, delta: number) {
    setQuantities(current => {
      const next = Math.max(0, (current[id] ?? 0) + delta);
      const copy = { ...current };
      if (next) copy[id] = next;
      else delete copy[id];
      return copy;
    });
  }

  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="bottom" className="max-h-[88dvh] overflow-y-auto rounded-t-2xl">
      <SheetHeader className="mx-auto max-w-3xl">
        <SheetTitle className="flex items-center gap-2 text-xl font-bold"><ReceiptText size={20} aria-hidden="true" />Tính tiền đặt app</SheetTitle>
        <SheetDescription className="text-sm text-muted-foreground">
          Chọn món như khi đặt trên {label}. Tổng tiền chỉ là ước tính.
        </SheetDescription>
      </SheetHeader>

      <div className="mx-auto mt-4 max-w-3xl">
        {!sellable.length && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Chưa có món nào có giá trên {label}.</p>}
        {groups.map(group => <section key={group.category} className="mb-4">
          <h3 className="mb-1 text-sm font-bold">{group.category}</h3>
          <ul>
            {group.dishes.map(dish => {
              const quantity = quantities[dish.id] ?? 0;
              return <li key={dish.id} className="flex items-center gap-3 border-b border-border py-2 last:border-0">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold leading-snug">{dish.name}</span>
                  <span className="mt-0.5 block text-xs font-semibold text-primary">{formatPrice(dish.price ?? 0)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <Button variant="outline" size="icon" className="size-8 rounded-full" disabled={!quantity}
                    aria-label={`Bớt ${dish.name}`} onClick={() => change(dish.id, -1)}><Minus size={14} /></Button>
                  <span className="w-7 text-center text-sm font-bold tabular-nums" aria-live="polite">{quantity}</span>
                  <Button variant="outline" size="icon" className="size-8 rounded-full"
                    aria-label={`Thêm ${dish.name}`} onClick={() => change(dish.id, 1)}><Plus size={14} /></Button>
                </span>
              </li>;
            })}
          </ul>
        </section>)}
      </div>

      {enabledVouchers.length > 0 && <div className="mx-auto mt-4 max-w-3xl">
        <label htmlFor="estimator-voucher" className="block text-sm font-bold">Voucher</label>
        <select id="estimator-voucher" value={voucherValue} onChange={event => setVoucherChoice(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold">
          <option value="auto">Tự động chọn mức giảm tốt nhất</option>
          <option value="none">Không dùng voucher</option>
          {eligibleVouchers.map(voucher => <option key={voucher.id} value={voucher.id}>
            {voucher.title} · {voucherDiscountLabel(voucher.discount)}
          </option>)}
        </select>
        {!eligibleVouchers.length && <p className="mt-1.5 text-xs text-muted-foreground">Chưa đạt đơn tối thiểu của voucher nào.</p>}
      </div>}

      <div className="mx-auto mt-4 max-w-3xl">
        <dl className="space-y-1.5 rounded-xl border border-border bg-secondary/50 p-3 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Tạm tính ({count} món)</dt>
            <dd className="font-bold tabular-nums">{formatPrice(subtotal)}</dd>
          </div>
          {discount > 0 && <div className="flex items-baseline justify-between gap-3 text-emerald-700">
            <dt className="min-w-0 truncate">Voucher · {chosenVoucher?.title}</dt>
            <dd className="font-bold tabular-nums">-{formatPrice(discount)}</dd>
          </div>}
          {delivery > 0 && <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Phí giao hàng (ước tính)</dt>
            <dd className="font-bold tabular-nums">{formatPrice(delivery)}</dd>
          </div>}
          {service > 0 && <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Phí dịch vụ (ước tính)</dt>
            <dd className="font-bold tabular-nums">{formatPrice(service)}</dd>
          </div>}
          {smallOrder > 0 && <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Phí đơn nhỏ (dưới {formatPrice(fees.smallOrderThreshold)})</dt>
            <dd className="font-bold tabular-nums">{formatPrice(smallOrder)}</dd>
          </div>}
          <div className="flex items-baseline justify-between gap-3 border-t border-border pt-2">
            <dt className="font-bold">{hasFeeConfig ? "Tổng ước tính" : "Tạm tính món"}</dt>
            <dd className="text-xl font-extrabold tabular-nums text-primary">{formatPrice(total)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Đây là ước tính. {label} tính phí giao hàng theo địa chỉ, khoảng cách, thời điểm và khuyến mãi thực tế, nên số tiền trên app có thể khác.
          {!hasFeeConfig && " Quán chưa nhập phí giao/dịch vụ nên tổng trên chỉ gồm tiền món và voucher."}
        </p>
      </div>

      <div className="sticky bottom-0 z-10 -mx-6 -mb-6 mt-4 border-t border-border bg-card px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <span>
            <span className="block text-xs text-muted-foreground">{count} món · {hasFeeConfig ? "tổng ước tính" : "tạm tính"}</span>
            <span className="text-xl font-extrabold tabular-nums text-primary">{formatPrice(total)}</span>
          </span>
          <a href={channels[platform].url} target="_blank" rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">
            Đặt trên {label}<ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
    </SheetContent>
  </Sheet>;
}
