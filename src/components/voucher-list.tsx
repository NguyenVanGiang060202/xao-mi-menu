"use client";
import { useState } from "react";
import { Check, Copy, TicketPercent } from "lucide-react";
import type { Voucher } from "@/lib/catalog";
import { formatPrice } from "@/lib/menu-data";
import { voucherDiscountLabel } from "@/lib/voucher";

export function VoucherList({ vouchers }: { vouchers: Voucher[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  if (!vouchers.length) return null;

  async function copyCode(voucher: Voucher) {
    try {
      await navigator.clipboard.writeText(voucher.code);
    } catch {
      const field = document.createElement("textarea");
      field.value = voucher.code;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(voucher.id);
    window.setTimeout(() => setCopied(current => (current === voucher.id ? null : current)), 2000);
  }

  return <section className="menu-vouchers mb-6 rounded-3xl border border-border bg-card p-4 sm:p-5" aria-labelledby="menu-vouchers-title">
    <div className="flex items-center gap-2">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-primary" aria-hidden="true"><TicketPercent size={18} /></span>
      <h3 id="menu-vouchers-title" className="text-lg font-bold">Voucher</h3>
      <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">{vouchers.length} ưu đãi</span>
    </div>
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {vouchers.map(voucher => <li key={voucher.id} className="flex min-w-0 flex-col gap-2 rounded-2xl border border-dashed border-border p-3">
        <p className="text-sm font-bold leading-snug">{voucher.title}</p>
        <p className="text-sm font-semibold text-primary">{voucherDiscountLabel(voucher.discount)}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {voucher.minOrder !== undefined && voucher.minOrder > 0 && <span>Đơn từ {formatPrice(voucher.minOrder)}</span>}
          {voucher.terms && <span className="min-w-0">{voucher.terms}</span>}
        </div>
        {voucher.code && <button type="button" onClick={() => void copyCode(voucher)}
          className="mt-auto inline-flex min-h-9 w-fit items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 text-xs font-bold tracking-wide text-primary hover:bg-primary/10"
          aria-label={`Sao chép mã ${voucher.code}`}>
          <span className="font-mono text-sm">{voucher.code}</span>
          {copied === voucher.id ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          <span className="font-sans font-semibold">{copied === voucher.id ? "Đã chép" : "Chép mã"}</span>
        </button>}
      </li>)}
    </ul>
  </section>;
}
