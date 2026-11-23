"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NotifyAdmin } from "@/components/admin-toast";
import { platformMenus, type Platform, type PlatformFeeMap } from "@/lib/catalog";
import { updatePlatformFees } from "@/app/actions";

const platforms = ["xanh", "be", "grab"] as const;
type Field = "delivery" | "service" | "smallOrderThreshold" | "smallOrderFee";
type Draft = Record<Platform, Record<Field, string>>;

function toDraft(fees: PlatformFeeMap): Draft {
  return Object.fromEntries(platforms.map(platform => [platform, {
    delivery: fees[platform].delivery ? String(fees[platform].delivery / 1000) : "",
    service: fees[platform].service ? String(fees[platform].service / 1000) : "",
    smallOrderThreshold: fees[platform].smallOrderThreshold ? String(fees[platform].smallOrderThreshold / 1000) : "",
    smallOrderFee: fees[platform].smallOrderFee ? String(fees[platform].smallOrderFee / 1000) : "",
  }])) as Draft;
}

// "20" -> 20000; "" -> 0; "12,5" -> 12500
function toAmount(text: string) {
  const value = text.trim().replace(",", ".");
  if (!value) return 0;
  if (!/^\d+(?:\.\d{0,3})?$/.test(value)) return NaN;
  return Math.round(Number(value) * 1000);
}

const fields: { key: Field; label: string; hint: string }[] = [
  { key: "delivery", label: "Phí giao hàng", hint: "Số tiền app báo khi đặt thử" },
  { key: "service", label: "Phí dịch vụ", hint: "Thường là một khoản cố định" },
  { key: "smallOrderThreshold", label: "Đơn tối thiểu", hint: "Dưới mức này bị phụ phí" },
  { key: "smallOrderFee", label: "Phụ phí đơn nhỏ", hint: "Cộng thêm khi đơn dưới mức trên" },
];

export function PlatformFees({ fees, notify }: { fees: PlatformFeeMap; notify: NotifyAdmin }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => toDraft(fees));
  const [busy, setBusy] = useState(false);

  function change(platform: Platform, field: Field, value: string) {
    setDraft(current => ({ ...current, [platform]: { ...current[platform], [field]: value } }));
  }

  async function save() {
    if (busy) return;
    const payload = Object.fromEntries(platforms.map(platform => [platform, {
      delivery: toAmount(draft[platform].delivery),
      service: toAmount(draft[platform].service),
      smallOrderThreshold: toAmount(draft[platform].smallOrderThreshold),
      smallOrderFee: toAmount(draft[platform].smallOrderFee),
    }])) as Record<Platform, Record<Field, number>>;
    if (Object.values(payload).some(fee => Object.values(fee).some(value => !Number.isFinite(value) || value < 0))) {
      notify("Phí không hợp lệ. Chỉ nhập số, đơn vị là nghìn đồng.", "error");
      return;
    }
    setBusy(true);
    try {
      const error = await updatePlatformFees(payload);
      if (error) {
        notify(error, "error");
        return;
      }
      notify("Đã lưu phí ước tính cho công cụ tính tiền.", "success");
      router.refresh();
    } catch {
      notify("Không lưu được phí ước tính. Hãy thử lại.", "error");
    } finally {
      setBusy(false);
    }
  }

  return <section className="admin-sheet">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 text-2xl"><Wallet size={20} aria-hidden="true" />Phí đặt app (ước tính)</h2>
        <p className="mt-1 text-sm text-muted-foreground">Dùng cho nút <b>Tính tiền</b> trên trang khách. Nhập số tiền app báo khi bạn đặt thử; để trống nếu không có.</p>
      </div>
      <Button disabled={busy} onClick={() => void save()}><Save size={15} aria-hidden="true" />{busy ? "Đang lưu…" : "Lưu phí ước tính"}</Button>
    </div>
    <div className="grid gap-3 lg:grid-cols-3">
      {platforms.map(platform => <fieldset key={platform} className="min-w-0 rounded-xl border border-border p-3">
        <legend className="px-1 text-sm font-bold">{platformMenus[platform].label}</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {fields.map(field => <label key={field.key} className="min-w-0 text-xs font-semibold text-muted-foreground">
            {field.label} <span className="font-normal">(nghìn ₫)</span>
            <Input inputMode="decimal" value={draft[platform][field.key]} placeholder="0"
              onChange={event => change(platform, field.key, event.target.value)} className="mt-1" />
            <span className="mt-0.5 block font-normal text-[11px]">{field.hint}</span>
          </label>)}
        </div>
      </fieldset>)}
    </div>
    <p className="mt-3 text-xs text-muted-foreground">Ví dụ: gõ <b>20</b> = 20.000 ₫. Phí thực tế còn phụ thuộc địa chỉ, khoảng cách, thời điểm và khuyến mãi nên trang khách chỉ hiển thị ước tính.</p>
  </section>;
}
