"use client";
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { Check, ChevronLeft, ChevronRight, Copy, Ticket } from "lucide-react";
import type { Voucher } from "@/lib/catalog";
import { formatPrice, type Channel } from "@/lib/menu-data";
import { voucherDiscountLabel, voucherSortValue } from "@/lib/voucher";

// 15000 -> "15K", 12500 -> "12.500đ"
function shortMoney(amount: number) {
  if (amount >= 1000 && amount % 1000 === 0) return `${amount / 1000}K`;
  return `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
}

type VoucherListProps = {
  vouchers: Voucher[];
  /** Nền tảng đang xem: quyết định tiêu đề. Bỏ trống thì hiện "Voucher". */
  channel?: Channel;
  channelName?: string;
  /** Class đặt biến màu nền tảng (menu-channel-xanh/grab/be/shop). */
  className?: string;
};

export function VoucherList({ vouchers, channel, channelName, className = "" }: VoucherListProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  const list = useRef<HTMLUListElement>(null);
  const drag = useRef({ active: false, moved: false, x: 0, left: 0 });

  // Tracks whether there is more to scroll to on either side (arrows + edge fades).
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const update = () => {
      const start = el.scrollLeft <= 2;
      const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      setEdges(prev => (prev.start === start && prev.end === end ? prev : { start, end }));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      resize.disconnect();
    };
  }, [vouchers.length]);

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

  function page(direction: 1 | -1) {
    const el = list.current;
    if (!el) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: smooth ? "smooth" : "auto" });
  }

  // Mouse users can drag the row sideways; touch scrolls natively.
  function startDrag(event: PointerEvent<HTMLUListElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0 || !list.current) return;
    drag.current = { active: true, moved: false, x: event.clientX, left: list.current.scrollLeft };
  }
  function moveDrag(event: PointerEvent<HTMLUListElement>) {
    const state = drag.current;
    const el = list.current;
    if (!state.active || !el) return;
    const distance = event.clientX - state.x;
    if (!state.moved) {
      if (Math.abs(distance) < 5) return;
      state.moved = true;
      el.dataset.dragging = "true";
    }
    el.scrollLeft = state.left - distance;
  }
  function endDrag() {
    drag.current.active = false;
    if (list.current) delete list.current.dataset.dragging;
  }
  // A drag must not count as a click on the copy button underneath.
  function swallowDragClick(event: MouseEvent<HTMLUListElement>) {
    if (!drag.current.moved) return;
    event.preventDefault();
    event.stopPropagation();
    drag.current.moved = false;
  }

  const heading = channel === "shop" ? "Ưu đãi tại quán" : channelName ? `Ưu đãi trên ${channelName}` : "Voucher";
  const scrollable = !(edges.start && edges.end);

  return <section className={`menu-tickets ${className}`} aria-labelledby="menu-vouchers-title">
    <header className="menu-tickets-head">
      <span className="menu-tickets-icon" aria-hidden="true"><Ticket size={14} /></span>
      <h3 id="menu-vouchers-title">{heading}</h3>
      <span className="menu-tickets-count">{vouchers.length} mã</span>
      {scrollable && <div className="menu-tickets-nav">
        <button type="button" aria-label="Xem ưu đãi trước" disabled={edges.start} onClick={() => page(-1)}><ChevronLeft size={16} aria-hidden="true" /></button>
        <button type="button" aria-label="Xem ưu đãi tiếp theo" disabled={edges.end} onClick={() => page(1)}><ChevronRight size={16} aria-hidden="true" /></button>
      </div>}
    </header>
    {channel === "shop" && <p className="menu-tickets-hint">Đọc mã cho nhân viên khi gọi món.</p>}
    <ul ref={list} className="menu-tickets-list" tabIndex={0} aria-label={heading}
      data-at-start={edges.start} data-at-end={edges.end}
      onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerLeave={endDrag} onPointerCancel={endDrag}
      onClickCapture={swallowDragClick}>
      {[...vouchers].sort((a, b) => voucherSortValue(b) - voucherSortValue(a)).map(voucher => {
        const done = copied === voucher.id;
        const value = voucher.discount.kind === "percent" ? `${voucher.discount.value}%` : shortMoney(voucher.discount.value);
        const conditions = [
          voucherDiscountLabel(voucher.discount),
          voucher.minOrder ? `Đơn từ ${formatPrice(voucher.minOrder)}` : "",
        ].filter(Boolean).join(" · ");
        return <li key={voucher.id} className="menu-ticket">
          <div className="menu-ticket-stub" aria-hidden="true"><strong data-long={value.length > 4}>{value}</strong></div>
          <div className="menu-ticket-body">
            <h4 className="menu-ticket-title">{voucher.title}</h4>
            <p className="menu-ticket-meta">{conditions}</p>
            {voucher.terms && <p className="menu-ticket-terms">{voucher.terms}</p>}
            <div className="menu-ticket-foot">
              {voucher.code
                ? <button type="button" className="menu-ticket-code" data-copied={done} aria-label={`Sao chép mã ${voucher.code}`} onClick={() => void copyCode(voucher)}>
                    <b>{voucher.code}</b>
                    <span aria-live="polite">{done ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}{done ? "Đã chép" : "Sao chép"}</span>
                  </button>
                : <span className="menu-ticket-auto"><Check size={12} aria-hidden="true" />Tự động áp dụng</span>}
            </div>
          </div>
        </li>;
      })}
    </ul>
  </section>;
}
