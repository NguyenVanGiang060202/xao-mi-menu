"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/menu-data";
import type { MenuDish } from "@/lib/catalog";
import { groupMenu, moveMenuCategory, moveMenuDish } from "@/lib/menu-order";

type DragItem = { kind: "category"; id: string } | { kind: "dish"; id: string; category: string };

export function ShopMenuOrder({ dishes, disabled, onChange }: {
  dishes: MenuDish[];
  disabled: boolean;
  onChange: (dishes: MenuDish[]) => void;
}) {
  const groups = groupMenu(dishes);
  const [drag, setDrag] = useState<DragItem | null>(null);
  const [over, setOver] = useState<DragItem | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const container = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ id: number; item: DragItem; x: number; y: number; originX: number; originY: number; started: boolean } | null>(null);
  const hitTest = useRef<(item: DragItem, x: number, y: number) => DragItem | null>(() => null);

  function targetAt(item: DragItem, x: number, y: number): DragItem | null {
    const element = document.elementFromPoint(x, y);
    if (!element || !container.current?.contains(element)) return null;
    const section = element.closest<HTMLElement>("[data-order-category]");
    const category = section?.dataset.orderCategory;
    if (!category) return null;
    if (item.kind === "category") return category !== item.id ? { kind: "category", id: category } : null;
    const id = element.closest<HTMLElement>("[data-order-dish]")?.dataset.orderDish;
    return id && id !== item.id && category === item.category ? { kind: "dish", id, category } : null;
  }
  hitTest.current = targetAt;

  useEffect(() => {
    if (!drag) return;
    let frame: number;
    function scroll() {
      const current = pointer.current;
      if (!current?.started) return;
      const delta = current.y < 72 ? -12 : current.y > window.innerHeight - 72 ? 12 : 0;
      if (delta) {
        window.scrollBy(0, delta);
        const target = hitTest.current(current.item, current.x, current.y);
        setOver(previous => previous?.id === target?.id && previous?.kind === target?.kind ? previous : target);
      }
      frame = requestAnimationFrame(scroll);
    }
    frame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(frame);
  }, [drag]);

  function reorder(item: DragItem, target: string) {
    if (disabled || item.id === target) return;
    const next = item.kind === "category" ? moveMenuCategory(dishes, item.id, target) : moveMenuDish(dishes, item.id, target);
    onChange(next);
    const position = item.kind === "category" ? groupMenu(next).findIndex(group => group.category === item.id)
      : next.filter(dish => dish.category === item.category).findIndex(dish => dish.id === item.id);
    const label = item.kind === "category" ? item.id : dishes.find(dish => dish.id === item.id)?.name;
    setAnnouncement(`${label} ở vị trí ${position + 1}${item.kind === "dish" ? ` trong ${item.category}` : ""}. Bấm Lưu Menu quán để áp dụng thứ tự đang chỉnh.`);
  }

  function cancelDrag() {
    pointer.current = null;
    setDrag(null);
    setOver(null);
  }

  function start(event: PointerEvent<HTMLButtonElement>, item: DragItem) {
    if (disabled || event.button !== 0 || !event.isPrimary) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current = { id: event.pointerId, item, x: event.clientX, y: event.clientY, originX: event.clientX, originY: event.clientY, started: false };
  }

  function movePointer(event: PointerEvent<HTMLButtonElement>) {
    const current = pointer.current;
    if (disabled || !current || current.id !== event.pointerId) return;
    current.x = event.clientX;
    current.y = event.clientY;
    if (!current.started && Math.hypot(current.x - current.originX, current.y - current.originY) < 6) return;
    if (!current.started) {
      current.started = true;
      setDrag(current.item);
    }
    const target = targetAt(current.item, current.x, current.y);
    setOver(previous => previous?.id === target?.id && previous?.kind === target?.kind ? previous : target);
  }

  function drop(event: PointerEvent<HTMLButtonElement>) {
    const current = pointer.current;
    if (!current || current.id !== event.pointerId) return;
    const target = targetAt(current.item, event.clientX, event.clientY);
    if (current.started && target && !disabled) reorder(current.item, target.id);
    cancelDrag();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handle(item: DragItem, label: string, previous?: string, next?: string) {
    return <button type="button" disabled={disabled}
      aria-label={`Kéo sắp xếp ${label}`} title="Kéo thả hoặc dùng phím mũi tên lên, xuống"
      onPointerDown={event => start(event, item)} onPointerMove={movePointer} onPointerUp={drop}
      onPointerCancel={cancelDrag} onLostPointerCapture={cancelDrag}
      onKeyDown={event => {
        if (event.key === "Escape") cancelDrag();
        const target = event.key === "ArrowUp" ? previous : event.key === "ArrowDown" ? next : undefined;
        if (event.key === "ArrowUp" || event.key === "ArrowDown") event.preventDefault();
        if (target) reorder(item, target);
      }}
      className="grid size-11 shrink-0 touch-none select-none cursor-grab place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 active:cursor-grabbing disabled:cursor-default">
      <GripVertical size={20} aria-hidden="true" />
    </button>;
  }

  return <div ref={container} className="space-y-4" aria-label="Sắp xếp Menu quán">
    <p className="text-xs leading-relaxed text-muted-foreground">Kéo tay nắm để đổi thứ tự, hoặc dùng nút ↑ ↓. Món được sắp xếp trong cùng danh mục. Bấm Lưu Menu quán để áp dụng.</p>
    <p role="status" aria-live="polite" className="sr-only">{announcement}</p>
    {groups.map((group, index) => {
      const item: DragItem = { kind: "category", id: group.category };
      const targeted = over?.kind === "category" && over.id === item.id;
      return <section key={group.category} data-order-category={group.category}
        className={`rounded-xl border bg-card ${targeted || (drag?.kind === "category" && drag.id === item.id) ? "border-primary ring-1 ring-primary" : "border-border"}`}>
        <div className="flex min-w-0 flex-wrap items-center gap-1 rounded-t-xl border-b border-border bg-secondary/60 p-1.5 sm:gap-2">
          {handle(item, `danh mục ${group.category}`, groups[index - 1]?.category, groups[index + 1]?.category)}
          <h3 className="min-w-0 flex-1 break-words">{group.category}<span className="ml-2 font-sans text-xs font-normal text-muted-foreground">{group.dishes.length} món</span></h3>
          <MoveButtons label={`danh mục ${group.category}`} disabled={disabled} first={index === 0} last={index === groups.length - 1}
            onUp={() => reorder(item, groups[index - 1].category)} onDown={() => reorder(item, groups[index + 1].category)} />
        </div>
        <ol className="divide-y divide-border px-1.5 sm:px-3">
          {group.dishes.map((dish, position) => {
            const entry: DragItem = { kind: "dish", id: dish.id, category: group.category };
            const targeted = over?.kind === "dish" && over.id === dish.id;
            return <li key={dish.id} data-order-dish={dish.id}
              className={`flex min-w-0 items-center gap-1 rounded-lg py-2 sm:gap-2 ${targeted || (drag?.kind === "dish" && drag.id === dish.id) ? "bg-primary/10 ring-1 ring-inset ring-primary" : ""}`}>
              {handle(entry, dish.name, group.dishes[position - 1]?.id, group.dishes[position + 1]?.id)}
              {dish.image && <img src={dish.image} alt="" draggable={false} loading="lazy" className="hidden size-11 shrink-0 rounded-lg object-cover sm:block" />}
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-bold leading-snug">{dish.name}</p>
                <p className="mt-1 text-xs font-semibold text-primary">{formatPrice(dish.price)}{!dish.available && <span className="ml-2 font-normal text-muted-foreground">Tạm hết</span>}</p>
              </div>
              <MoveButtons label={dish.name} disabled={disabled} first={position === 0} last={position === group.dishes.length - 1}
                onUp={() => reorder(entry, group.dishes[position - 1].id)} onDown={() => reorder(entry, group.dishes[position + 1].id)} />
            </li>;
          })}
        </ol>
      </section>;
    })}
  </div>;
}

function MoveButtons({ label, disabled, first, last, onUp, onDown }: {
  label: string; disabled: boolean; first: boolean; last: boolean; onUp: () => void; onDown: () => void;
}) {
  return <div className="flex shrink-0 gap-0.5">
    <Button variant="ghost" size="icon" className="size-11 rounded-lg" disabled={disabled || first} aria-label={`Đưa ${label} lên`} title="Đưa lên" onClick={onUp}><ArrowUp size={16} aria-hidden="true" /></Button>
    <Button variant="ghost" size="icon" className="size-11 rounded-lg" disabled={disabled || last} aria-label={`Đưa ${label} xuống`} title="Đưa xuống" onClick={onDown}><ArrowDown size={16} aria-hidden="true" /></Button>
  </div>;
}
