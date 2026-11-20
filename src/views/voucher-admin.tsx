"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, Save, TicketPercent, Trash2 } from "lucide-react";
import { updateVouchers } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { NotifyAdmin } from "@/components/admin-toast";
import { voucherChannelLabels, voucherChannels, type Voucher, type VoucherChannel, type VoucherMap } from "@/lib/catalog";
import { formatPrice } from "@/lib/menu-data";
import { voucherDiscountLabel } from "@/lib/voucher";

type VoucherForm = {
  id: string;
  channel: VoucherChannel;
  title: string;
  code: string;
  kind: "percent" | "amount";
  value: string;
  maxDiscount: string;
  minOrder: string;
  terms: string;
  enabled: boolean;
};

const maxVouchers = 20;
const channelHelp: Record<VoucherChannel, string> = {
  shop: "Hiện ở trang Menu quán (/menuquan).",
  xanh: "Hiện ở tab Xanh SM Ngon.",
  grab: "Hiện ở tab GrabFood.",
  be: "Hiện ở tab beFood.",
};

function toForm(channel: VoucherChannel, voucher: Voucher): VoucherForm {
  return {
    id: voucher.id,
    channel,
    title: voucher.title,
    code: voucher.code,
    kind: voucher.discount.kind,
    value: String(voucher.discount.value),
    maxDiscount: voucher.discount.kind === "percent" && voucher.discount.maxDiscount ? String(voucher.discount.maxDiscount) : "",
    minOrder: voucher.minOrder ? String(voucher.minOrder) : "",
    terms: voucher.terms,
    enabled: voucher.enabled,
  };
}

function parseVoucher(form: VoucherForm): Voucher | string {
  const title = form.title.trim();
  if (!title) return "Nhập tiêu đề voucher.";
  const value = Number(form.value);
  if (!Number.isInteger(value) || value < 1) return "Mức giảm phải là số nguyên lớn hơn 0.";
  if (form.kind === "percent" && value > 100) return "Phần trăm giảm tối đa là 100%.";
  if (form.kind === "amount" && value > 100000000) return "Mức giảm vượt quá giới hạn.";
  const maxDiscount = form.maxDiscount.trim() ? Number(form.maxDiscount) : undefined;
  if (form.kind === "percent" && maxDiscount !== undefined && (!Number.isInteger(maxDiscount) || maxDiscount < 1 || maxDiscount > 100000000)) {
    return "Mức giảm tối đa phải là số nguyên dương.";
  }
  const minOrder = form.minOrder.trim() ? Number(form.minOrder) : undefined;
  if (minOrder !== undefined && (!Number.isInteger(minOrder) || minOrder < 1 || minOrder > 100000000)) {
    return "Đơn tối thiểu phải là số nguyên dương.";
  }
  return {
    id: form.id,
    title,
    code: form.code.trim().toUpperCase(),
    discount: form.kind === "percent"
      ? { kind: "percent", value, ...(maxDiscount !== undefined ? { maxDiscount } : {}) }
      : { kind: "amount", value },
    ...(minOrder !== undefined ? { minOrder } : {}),
    terms: form.terms.trim(),
    enabled: form.enabled,
  };
}

function previewDiscountLabel(form: VoucherForm) {
  const value = Number(form.value);
  if (!Number.isInteger(value) || value < 1) return "Nhập mức giảm để xem trước.";
  if (form.kind === "percent") {
    if (value > 100) return "Phần trăm giảm tối đa là 100%.";
    const maxDiscount = Number(form.maxDiscount);
    return `Khách thấy: Giảm ${value}%${form.maxDiscount.trim() && maxDiscount >= 1 ? ` · tối đa ${formatPrice(maxDiscount)}` : ""}`;
  }
  return `Khách thấy: Giảm ${formatPrice(value)}`;
}

export function VoucherAdmin({ vouchers, draft, onDraftChange, notify }: {
  vouchers: VoucherMap;
  draft: VoucherMap;
  onDraftChange: (value: VoucherMap) => void;
  notify: NotifyAdmin;
}) {
  const router = useRouter();
  const [channel, setChannel] = useState<VoucherChannel>("shop");
  const [editing, setEditing] = useState<VoucherForm | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(vouchers);
  const list = draft[channel];

  function stage(channel: VoucherChannel, next: Voucher[]) {
    onDraftChange({ ...draft, [channel]: next });
  }

  function openNew() {
    setError("");
    setConfirmDelete(false);
    setEditing({
      id: crypto.randomUUID(),
      channel,
      title: "",
      code: "",
      kind: "percent",
      value: "10",
      maxDiscount: "",
      minOrder: "",
      terms: "",
      enabled: true,
    });
  }

  function openEdit(voucher: Voucher) {
    setError("");
    setConfirmDelete(false);
    setEditing(toForm(channel, voucher));
  }

  function saveVoucher() {
    if (!editing) return;
    const parsed = parseVoucher(editing);
    if (typeof parsed === "string") {
      setError(parsed);
      return;
    }
    const current = draft[editing.channel];
    stage(editing.channel, current.some(voucher => voucher.id === parsed.id)
      ? current.map(voucher => (voucher.id === parsed.id ? parsed : voucher))
      : [...current, parsed]);
    setEditing(null);
  }

  function deleteVoucher() {
    if (!editing) return;
    stage(editing.channel, draft[editing.channel].filter(voucher => voucher.id !== editing.id));
    setEditing(null);
  }

  async function saveAll() {
    if (!dirty || busy) return;
    setBusy(true);
    try {
      const message = await updateVouchers(draft);
      if (message) {
        notify(message, "error");
        return;
      }
      notify("Đã cập nhật voucher cho trang khách.", "success");
      router.refresh();
    } catch {
      notify("Không lưu được voucher. Hãy thử lại.", "error");
    } finally {
      setBusy(false);
    }
  }

  const previewDiscount = editing ? previewDiscountLabel(editing) : "";

  return <>
    <section className="admin-sheet">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl">Voucher</h2>
          <p className="mt-1 text-sm text-muted-foreground">Mỗi nền tảng có danh sách voucher riêng, hiện ngay trên tab tương ứng.</p>
        </div>
        <Button disabled={busy || list.length >= maxVouchers} onClick={openNew}><Plus size={16} />Thêm voucher</Button>
      </div>

      <div className="sticky top-2 z-10 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-sm sm:px-4">
        <p role="status" className="text-sm">
          <span className="font-bold">{dirty ? "Có thay đổi chưa lưu" : "Voucher đã lưu"}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{dirty ? "Bấm Lưu voucher để cập nhật trang khách." : "Thêm, sửa, xóa hoặc bật/tắt voucher rồi lưu để cập nhật trang khách."}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {dirty && <Button variant="outline" disabled={busy} onClick={() => onDraftChange(vouchers)}>Bỏ thay đổi</Button>}
          <Button disabled={busy || !dirty} onClick={() => void saveAll()}><Save size={15} />{busy ? "Đang lưu…" : "Lưu voucher"}</Button>
        </div>
      </div>

      <div role="tablist" aria-label="Voucher theo nền tảng" className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {voucherChannels.map(id => {
          const active = channel === id;
          return <button key={id} type="button" role="tab" aria-selected={active} onClick={() => setChannel(id)}
            className={`flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold ${active ? "border-primary bg-primary font-bold text-primary-foreground" : "border-dashed border-border bg-transparent text-muted-foreground hover:bg-secondary"}`}>
            {voucherChannelLabels[id]}
            <span className={`rounded-full px-1.5 py-0.5 text-[11px] ${active ? "bg-primary-foreground/20" : "bg-secondary"}`}>{draft[id].length}</span>
          </button>;
        })}
      </div>

      <p className="mb-3 text-xs text-muted-foreground">{channelHelp[channel]}</p>

      {list.length ? <ul className="grid gap-2 xl:grid-cols-2">
        {list.map(voucher => <li key={voucher.id} className="flex min-w-0 items-start gap-2 rounded-xl border border-border bg-card p-3">
          <button type="button" disabled={busy} className="flex min-w-0 flex-1 items-start gap-3 text-left" onClick={() => openEdit(voucher)}>
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary" aria-hidden="true"><TicketPercent size={18} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold leading-snug">{voucher.title}</span>
              <span className="mt-0.5 block text-xs font-semibold text-primary">{voucherDiscountLabel(voucher.discount)}</span>
              <span className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                {voucher.code && <span className="font-mono font-bold text-foreground">{voucher.code}</span>}
                {voucher.minOrder ? <span>Đơn từ {formatPrice(voucher.minOrder)}</span> : null}
                {voucher.terms && <span className="min-w-0">{voucher.terms}</span>}
              </span>
            </span>
            <Pencil size={14} className="mt-1 shrink-0 text-primary" aria-hidden="true" />
          </button>
          <div className="flex shrink-0 flex-col items-center gap-1 border-l border-border pl-2 text-[10px] text-muted-foreground sm:pl-3">
            <Switch checked={voucher.enabled} disabled={busy} aria-label={`Hiển thị voucher: ${voucher.title}`}
              onCheckedChange={enabled => stage(channel, list.map(item => (item.id === voucher.id ? { ...item, enabled } : item)))} />
            {voucher.enabled ? "Đang hiện" : "Đang ẩn"}
          </div>
        </li>)}
      </ul> : <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        <p>{voucherChannelLabels[channel]} chưa có voucher.</p>
        <Button className="mt-3" disabled={busy} onClick={openNew}><Plus size={16} />Thêm voucher đầu tiên</Button>
      </div>}

      <p className="mt-4 text-xs text-muted-foreground">Tối đa {maxVouchers} voucher mỗi nền tảng. Voucher đang ẩn sẽ không hiện trên trang khách.</p>
    </section>

    <Sheet open={Boolean(editing)} onOpenChange={open => { if (!open) setEditing(null); }}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {editing && <><SheetHeader className="text-left">
          <SheetTitle>{draft[editing.channel].some(voucher => voucher.id === editing.id) ? editing.title || "Sửa voucher" : "Thêm voucher"}</SheetTitle>
          <SheetDescription>Voucher của {voucherChannelLabels[editing.channel]}. Bấm Lưu voucher ở danh sách để cập nhật trang khách.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <label className="block text-xs font-semibold">Tiêu đề<Input value={editing.title} maxLength={100} placeholder="Ví dụ: Giảm 20% món mì xào" className="mt-2"
            onChange={event => setEditing({ ...editing, title: event.target.value })} /></label>
          <label className="block text-xs font-semibold">Mã voucher (không bắt buộc)<Input value={editing.code} maxLength={40} placeholder="Ví dụ: XAOMI20" className="mt-2 font-mono uppercase"
            onChange={event => setEditing({ ...editing, code: event.target.value.toUpperCase() })} /></label>

          <div>
            <p className="text-xs font-semibold">Loại giảm giá</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {([{ id: "percent", label: "Phần trăm" }, { id: "amount", label: "Số tiền" }] as const).map(option =>
                <Button key={option.id} type="button" variant={editing.kind === option.id ? "secondary" : "outline"} aria-pressed={editing.kind === option.id}
                  onClick={() => setEditing({ ...editing, kind: option.id, maxDiscount: option.id === "amount" ? "" : editing.maxDiscount })}>{option.label}</Button>)}
            </div>
          </div>

          <div>
            <label htmlFor="voucher-value" className="block text-xs font-semibold">{editing.kind === "percent" ? "Phần trăm giảm" : "Số tiền giảm"}</label>
            <div className="relative mt-2">
              <Input id="voucher-value" type="text" inputMode="numeric" value={editing.value} onChange={event => setEditing({ ...editing, value: event.target.value.replace(/[^\d]/g, "") })}
                className={editing.kind === "percent" ? "pr-10 tabular-nums" : "pr-10 tabular-nums"} aria-describedby="voucher-value-hint" />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-muted-foreground">{editing.kind === "percent" ? "%" : "₫"}</span>
            </div>
            <p id="voucher-value-hint" className="mt-1.5 text-xs text-muted-foreground">
              {previewDiscount}
            </p>
          </div>

          {editing.kind === "percent" && <div>
            <label htmlFor="voucher-max" className="block text-xs font-semibold">Giảm tối đa (không bắt buộc)</label>
            <div className="relative mt-2">
              <Input id="voucher-max" type="text" inputMode="numeric" value={editing.maxDiscount} placeholder="Ví dụ: 30000"
                onChange={event => setEditing({ ...editing, maxDiscount: event.target.value.replace(/[^\d]/g, "") })} className="pr-10 tabular-nums" />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-muted-foreground">₫</span>
            </div>
          </div>}

          <div>
            <label htmlFor="voucher-min" className="block text-xs font-semibold">Đơn tối thiểu (không bắt buộc)</label>
            <div className="relative mt-2">
              <Input id="voucher-min" type="text" inputMode="numeric" value={editing.minOrder} placeholder="Ví dụ: 50000"
                onChange={event => setEditing({ ...editing, minOrder: event.target.value.replace(/[^\d]/g, "") })} className="pr-10 tabular-nums" />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-muted-foreground">₫</span>
            </div>
          </div>

          <label className="block text-xs font-semibold">Điều kiện áp dụng
            <textarea value={editing.terms} maxLength={350} rows={3} placeholder="Ví dụ: Áp dụng cho đơn đặt qua GrabFood, không cộng dồn."
              className="mt-2 w-full resize-y border border-input bg-card px-3 py-2 text-sm"
              onChange={event => setEditing({ ...editing, terms: event.target.value })} />
          </label>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
            <div>
              <p className="text-sm font-semibold">Hiển thị trên trang khách</p>
              <p className="text-xs text-muted-foreground">Tắt để tạm ẩn mà không cần xóa.</p>
            </div>
            <Switch checked={editing.enabled} aria-label="Hiển thị voucher trên trang khách" onCheckedChange={enabled => setEditing({ ...editing, enabled })} />
          </div>

          {error && <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

          <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-border pt-4">
            {draft[editing.channel].some(voucher => voucher.id === editing.id) && <Button variant="outline" className="text-destructive" disabled={confirmDelete}
              onClick={() => setConfirmDelete(true)}><Trash2 size={15} />Xóa voucher</Button>}
            <Button className="ml-auto" disabled={confirmDelete} onClick={saveVoucher}><Check size={15} />Lưu voucher vào danh sách</Button>
          </div>

          {confirmDelete && <div className="mt-3 rounded-xl border border-destructive/25 bg-destructive/5 p-3">
            <p className="text-sm font-bold">Xóa voucher này?</p>
            <p className="mt-1 text-xs text-muted-foreground">Voucher sẽ được gỡ khỏi trang khách khi bạn bấm Lưu voucher.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setConfirmDelete(false)}>Giữ voucher</Button>
              <Button onClick={deleteVoucher}>Xác nhận xóa</Button>
            </div>
          </div>}
        </div>
        </>}
      </SheetContent>
    </Sheet>
  </>;
}
