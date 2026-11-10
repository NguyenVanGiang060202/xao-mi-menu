"use client";
import { useEffect, useMemo, useRef, useState } from "react";

import { ArrowUpRight, Clock3, CupSoda, Flame, Layers, MapPin, MessageCircle, Search, Soup, Utensils, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DishTag } from "@/components/dish-tag";
import { SeasonGutterStickers, SeasonSticker } from "@/components/season-sticker";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatPrice, getDishTags, themes, type Channel } from "@/lib/menu-data";
import { channels, defaultShopSchedule, shopDays, shopLocation, type PlatformDraftDish as Dish, type Appearance, type ShopInfo, type Voucher } from "@/lib/catalog";
const channelNames: Record<Channel, string> = { shop: "Menu quán", grab: "GrabFood", be: "beFood", xanh: "Xanh SM Ngon" };
const categoryIcons: Record<string, typeof Soup> = {
  Combo: Layers,
  "Mì xào": Soup,
  "Mì trộn": Utensils,
  "Ăn kèm": Utensils,
  "Đồ uống": CupSoda,
};

function CategoryStamp({ category }: { category: string }) {
  const Icon = categoryIcons[category] ?? Utensils;
  return <span className="menu-category-stamp" aria-hidden="true"><Icon size={18} /></span>;
}
const channelStyles: Record<Channel, string> = {
  shop: "menu-channel-shop",
  grab: "menu-channel-grab",
  be: "menu-channel-be",
  xanh: "menu-channel-xanh",
};
const zaloNumber = "0399944450";
const zaloUrl = `https://zalo.me/${zaloNumber}`;

export function MenuPage({ menus, appearance, vouchers, now, shop }: { menus: Record<Channel, Dish[]>; appearance: Appearance; vouchers: { grab: Voucher[]; be: Voucher[] }; now: number; shop: ShopInfo }) {
  const [channel, setChannel] = useState<Channel>("shop");
  const [category, setCategory] = useState("Tất cả");
  const [query, setQuery] = useState("");
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const dishTrigger = useRef<HTMLButtonElement>(null);
  const [navigationStuck, setNavigationStuck] = useState(false);
  const navigationMarker = useRef<HTMLDivElement>(null);
  const theme = appearance.theme;
  const schedule = shop.schedule ?? defaultShopSchedule;

  useEffect(() => {
    const marker = navigationMarker.current;
    if (!marker) return;
    const root = marker.closest("[data-menu-scroll-root]");
    const observer = new IntersectionObserver(([entry]) => {
      setNavigationStuck(!entry.isIntersecting && entry.boundingClientRect.bottom <= (entry.rootBounds?.top ?? 0));
    }, { root });
    observer.observe(marker);
    return () => observer.disconnect();
  }, []);

  const menu = menus[channel];
  const categories = ["Tất cả", ...new Set(menu.map(dish => dish.category))];
  const channelVouchers = channel === "grab" || channel === "be" ? vouchers[channel] : [];
  const activeVouchers = channelVouchers.filter(voucher => Date.parse(voucher.start) <= now && now < Date.parse(voucher.end));

  const visibleDishes = useMemo(() => menu.filter((dish) => {
    const matchesCategory = category === "Tất cả" || dish.category === category;
    const matchesQuery = `${dish.name} ${dish.description}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"));
    return matchesCategory && matchesQuery;
  }), [category, query, menu]);

  const themeInfo = themes[theme];
  const grouped = categories.slice(1).map((name) => ({ name, dishes: visibleDishes.filter((dish) => dish.category === name) })).filter((group) => group.dishes.length > 0);

  function jumpToCategory(name: string) {
    setCategory(name);
  }

  return (
    <main className={`menu-page min-h-screen bg-background pb-28 text-foreground theme-${theme}`} style={{ "--primary": appearance.accent, ...((appearance.background || themeInfo.background) ? { "--background": appearance.background || themeInfo.background } : {}) } as React.CSSProperties}>
      <header key={theme} className="menu-hero menu-storefront relative mx-auto max-w-6xl overflow-hidden">
        {appearance.image && <img src={appearance.image} alt="" width={1280} height={640} className="absolute inset-0 h-full w-full object-cover object-center opacity-35" />}

        <div className="menu-awning" aria-hidden="true">
          <div className="menu-awning-canopy">
            <div className="menu-awning-fabric" />
            <div className="menu-awning-front"><span /></div>
          </div>
        </div>
        <div className="menu-hero-inner relative px-4 py-4 sm:px-6">
          <div className="menu-sign">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="menu-brand-mark relative shrink-0">
                <div className="menu-logo flex size-20 overflow-hidden rounded-full sm:size-28">
                  <img src={appearance.logo || "/xao-mi-logo.jpg"} alt="" width={112} height={112}
                    className={`size-full object-contain ${appearance.logo ? "" : "scale-[1.48]"}`} />
                </div>
                <SeasonSticker theme={theme} />
              </div>
              <div className="min-w-0">
                {theme !== "default" && <p className="text-xs font-semibold">{themeInfo.eyebrow}</p>}
                <h1 className="menu-wordmark font-black leading-none">Xào Mì!</h1>
                {appearance.greeting.trim() && <p className="menu-greeting">{appearance.greeting.trim()}</p>}
              </div>
            </div>
          <section aria-label="Thông tin liên hệ của quán"
            className="menu-shop-contact mt-3 grid min-w-0 gap-3 rounded-[1.65rem] border p-2.5 sm:p-5">
            <div className="menu-contact-hours relative flex flex-col items-center justify-center gap-2 rounded-[1.15rem] p-4">
              <Clock3 size={21} strokeWidth={1.9} className="menu-contact-icon shrink-0" aria-hidden="true" />
              <div className="min-w-0 w-full">
                <p className="menu-contact-label text-center text-[13px] font-semibold leading-tight">Giờ mở cửa</p>
                {!shop.schedule && shop.hours.trim() ? <p className="menu-hours-highlight mt-1 rounded-full px-3 py-2 text-center text-sm font-bold">{shop.hours}</p> : <dl className="menu-hours-slots mt-3 grid gap-2 text-center text-xs tabular-nums">
                  {shopDays.map(({ id, label }) => <div key={id} className="menu-hours-highlight rounded-xl px-2 py-2">
                    <dt className="menu-contact-label">{label}</dt>
                    <dd className="menu-hours-value mt-0.5 text-lg font-extrabold leading-tight sm:text-xl">{schedule[id].open} – {schedule[id].close}</dd>
                  </div>)}
                </dl>}
              </div>
            </div>
            <a href={shopLocation.mapsUrl} target="_blank" rel="noreferrer"
              className="menu-contact-action grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 gap-y-2 rounded-[1.15rem] p-3 focus-visible:outline-2 focus-visible:-outline-offset-2">
              <MapPin size={21} strokeWidth={1.9} className="menu-contact-icon shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="menu-contact-label block text-[13px] font-semibold leading-tight">Địa chỉ</span>
                <span className="mt-0.5 block text-base font-extrabold leading-tight">{shopLocation.address}</span>
              </span>
              <span className="menu-directions col-start-2 inline-flex min-h-8 w-24 items-center justify-center gap-1 justify-self-start rounded-full px-2 text-xs font-extrabold">
                Chỉ đường <ArrowUpRight size={13} aria-hidden="true" />
              </span>
            </a>
            <a href={zaloUrl} target="_blank" rel="noreferrer"
              className="menu-contact-action grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 gap-y-2 rounded-[1.15rem] p-3 focus-visible:outline-2 focus-visible:-outline-offset-2">
              <MessageCircle size={21} strokeWidth={1.9} className="menu-contact-icon shrink-0" aria-hidden="true" />
              <span className="min-w-0">
                <span className="menu-contact-label block text-[13px] font-semibold leading-tight">Đặt món qua Zalo</span>
                <span className="mt-0.5 block text-base leading-tight"><strong className="font-extrabold tabular-nums">{zaloNumber}</strong><span className="menu-contact-label"> · Hiếu Kiên</span></span>
              </span>
              <span className="menu-directions col-start-2 inline-flex min-h-8 w-24 items-center justify-center gap-1 justify-self-start rounded-full px-2 text-xs font-extrabold">
                Đặt món <ArrowUpRight size={13} aria-hidden="true" />
              </span>
            </a>
          </section>

          </div>
        </div>
      </header>

      <div ref={navigationMarker} className="-mb-px h-px" aria-hidden="true" />
      <section className="menu-navigation sticky top-0 z-30" data-stuck={navigationStuck}>
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:gap-3" role="tablist" aria-label="Chọn nơi đặt món">
            {(["shop", "grab", "be", "xanh"] as const).map((key) => <Button key={key} role="tab" aria-selected={channel === key} variant="ghost" onClick={() => { setChannel(key); setCategory("Tất cả"); setQuery(""); }} className={`menu-channel-tab ${channelStyles[key]} h-11 flex-1 rounded-xl px-2 text-xs font-bold sm:flex-none sm:px-5 sm:text-sm`}><span>{channelNames[key]}</span></Button>)}
          </div>
          <a href={channel === "shop" ? zaloUrl : channels[channel].url} target="_blank" rel="noreferrer"
            className={`menu-channel-cta ${channelStyles[channel]} inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold`}>
            <span key={channel} className="menu-cta-label">{channel === "shop" ? "Đặt qua Zalo" : `Đặt qua ${channelNames[channel]}`}</span><ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
        {menu.length > 0 && <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 sm:px-8" aria-label="Danh mục món">
          {categories.map((item) => <Button key={item} variant="ghost" aria-pressed={category === item} onClick={() => jumpToCategory(item)} className={`menu-filter h-8 shrink-0 rounded-full border px-3 text-xs font-semibold ${category === item ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90" : "border-border bg-card text-muted-foreground hover:bg-secondary"}`}><span>{item}</span></Button>)}
        </nav>}
      </section>

      <div key={channel} className="menu-content mx-auto max-w-6xl px-4 sm:px-8">
        <section className="flex flex-col gap-2 pt-3 pb-1 sm:flex-row sm:items-center sm:gap-4 sm:pt-4">
          <h2 className={`menu-channel-heading ${channelStyles[channel]} text-2xl font-extrabold sm:text-3xl`}>{channelNames[channel]}</h2>
          {menu.length > 0 && <label className="menu-search flex h-11 w-full items-center gap-2 rounded-full border border-border bg-card px-4 text-muted-foreground sm:max-w-[290px]"><Search size={17} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm món bạn thích..." className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" aria-label="Tìm món" />{query && <Button variant="ghost" size="icon" className="size-8" onClick={() => setQuery("")} aria-label="Xóa tìm kiếm"><X size={15} /></Button>}</label>}
        </section>

        <div key={category} className="menu-board">
        {grouped.length ? grouped.map((group) => <section id={`category-${group.name}`} key={group.name} className="menu-category scroll-mt-36 mb-6">
          <SeasonGutterStickers theme={theme} index={categories.indexOf(group.name) - 1} seed={now} />
          <div className="menu-category-heading flex items-center gap-3">
            <CategoryStamp category={group.name} />
            <h3 className="text-xl font-bold sm:text-2xl">{group.name}</h3>
            <span key={group.dishes.length} className="menu-category-count ml-auto text-xs">{group.dishes.length} món</span>
          </div>
          {theme !== "default" ? <SeasonSticker theme={theme} category={group.name} /> : group.name === "Combo" ? <svg className="menu-edge-sticker menu-edge-egg" aria-hidden="true" viewBox="0 0 76 66">
            <path d="M13 30C4 20 22 8 33 13c10-13 30-3 31 9 14 8 8 28-6 29-7 13-27 12-34 3C9 56 3 38 13 30Z" fill="#fff7df" stroke="#fffaf0" strokeWidth="9" />
            <path d="M13 30C4 20 22 8 33 13c10-13 30-3 31 9 14 8 8 28-6 29-7 13-27 12-34 3C9 56 3 38 13 30Z" fill="#fff0c6" stroke="#8c422a" strokeWidth="2" />
            <circle cx="39" cy="34" r="14" fill="#ffb43e" stroke="#d28332" strokeWidth="1.5" />
            <path d="M30 31q2-5 7-6" fill="none" stroke="#ffdd84" strokeWidth="2" strokeLinecap="round" />
            <path d="M34 35h1m9 0h1m-10 5q4 3 8 0" fill="none" stroke="#853525" strokeWidth="2" strokeLinecap="round" />
          </svg> : group.name === "Đồ uống" ? <svg className="menu-edge-sticker menu-edge-drink" aria-hidden="true" viewBox="0 0 76 80">
            <path d="m21 25 6 45h27l6-45H21Zm24 0 8-19h13" fill="#f7ca68" stroke="#fffaf0" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" />
            <path d="m21 25 6 45h27l6-45H21Zm24 0 8-19h13M25 38h32m-22 10h1m9 0h1m-9 6q4 4 8 0" fill="none" stroke="#853525" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx="19" cy="28" r="11" fill="#d8df81" stroke="#547039" strokeWidth="2" />
            <path d="M19 21v14m-6-3 12-8m-12 0 12 8" stroke="#7c923d" strokeWidth="1.5" strokeLinecap="round" />
          </svg> : group.name === "Mì trộn" ? <svg className="menu-edge-sticker menu-edge-pepper" aria-hidden="true" viewBox="0 0 76 66">
            <path d="M57 20q0-10 10-13M55 18c-18-7-18 27-47 36 24 9 47-4 55-24 3-7-2-12-8-12Z" fill="#ea6950" stroke="#fffaf0" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" />
            <path d="M57 20q0-10 10-13" fill="none" stroke="#547039" strokeWidth="4" strokeLinecap="round" />
            <path d="M55 18c-18-7-18 27-47 36 24 9 47-4 55-24 3-7-2-12-8-12Z" fill="#ea6950" stroke="#853525" strokeWidth="2" />
            <path d="M44 30q2-5 6-6m-12 16 1-1m8-3 1-1m-7 8q3 2 6-2" fill="none" stroke="#853525" strokeWidth="1.8" strokeLinecap="round" />
          </svg> : <svg className="menu-edge-sticker" aria-hidden="true" viewBox="0 0 76 66" fill="none">
            <path d="M12 32h51a4 4 0 0 1 4 5c-3 15-13 24-29 24S12 52 8 37a4 4 0 0 1 4-5Z" fill="#f9bc56" stroke="#fffaf0" strokeWidth="10" />
            <path d="M26 30c-9-9 10-13 4-22m10 22c-9-9 10-13 4-22M51 33 64 8M58 34 71 12" stroke="#fffaf0" strokeWidth="8" strokeLinecap="round" />
            <path d="M26 30c-9-9 10-13 4-22m10 22c-9-9 10-13 4-22" stroke="#df8a2f" strokeWidth="3" strokeLinecap="round" />
            <path d="M51 33 64 8M58 34 71 12" stroke="#853525" strokeWidth="3" strokeLinecap="round" />
            <path d="M12 32h51a4 4 0 0 1 4 5c-3 15-13 24-29 24S12 52 8 37a4 4 0 0 1 4-5Z" fill="#f9bc56" stroke="#853525" strokeWidth="2" />
            <path d="M16 42h45m-29 6h1m10 0h1m-11 5q5 4 10 0" stroke="#853525" strokeWidth="2" strokeLinecap="round" />
          </svg>}
          <div className="menu-category-items grid sm:grid-cols-2">
            {group.dishes.map((dish) => <DishRow key={dish.id} dish={dish} channel={channel} onSelect={trigger => {
              dishTrigger.current = trigger;
              setSelectedDish(dish);
              setDetailOpen(true);
            }} />)}
          </div>
        </section>) : <div className="mb-8 rounded-3xl border border-dashed border-primary/25 bg-card py-12 text-center text-sm text-muted-foreground">{menu.length ? "Chưa tìm thấy món phù hợp." : "Menu quán đang được cập nhật."}{!menu.length && <div className="mt-3 flex justify-center gap-3"><Button variant="outline" onClick={() => setChannel("grab")}>Xem menu GrabFood</Button><Button variant="outline" onClick={() => setChannel("be")}>Xem menu beFood</Button></div>}</div>}

        {activeVouchers.length > 0 && <section className="mb-6 rounded border border-border p-4"><h3 className="font-bold">Voucher</h3><ul>{activeVouchers.map(voucher => <li key={voucher.title + voucher.code} className="mt-2 text-sm">{voucher.title} {voucher.code && <strong>{voucher.code}</strong>} · {voucher.terms}</li>)}</ul></section>}
        </div>
      </div>


      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="bottom" className="menu-dish-sheet mx-auto max-h-[88dvh] max-w-xl overflow-y-auto rounded-t-xl border-border px-5 pb-8 sm:px-7" onCloseAutoFocus={event => {
          const trigger = dishTrigger.current;
          if (trigger?.isConnected) {
            event.preventDefault();
            trigger.focus({ preventScroll: true });
          }
        }}>
          {selectedDish && <>
            {selectedDish.image && <img src={selectedDish.image} alt={selectedDish.name} width={1024} height={1024} className="mb-5 h-48 w-full rounded-md object-cover" />}
            <SheetHeader className="text-left"><p className="text-xs font-bold uppercase tracking-wider text-primary">{selectedDish.category}</p><SheetTitle className="text-2xl">{selectedDish.name}</SheetTitle><SheetDescription>{selectedDish.description}</SheetDescription></SheetHeader>
            <DishTags dish={selectedDish} />
            {selectedDish.ingredients && <p className="mt-4 text-sm">{selectedDish.ingredients}</p>}
            {selectedDish.price === null && <Button asChild className="mt-5 w-full"><a href={channels.grab.url} target="_blank" rel="noreferrer">Xem giá trên GrabFood <ArrowUpRight size={15} /></a></Button>}
            <Button className="mt-3 w-full" onClick={() => setDetailOpen(false)}>Đóng{selectedDish.price !== null && ` · ${formatPrice(selectedDish.price)}`}</Button>
          </>}
        </SheetContent>
      </Sheet>
    </main>
  );
}

function DishRow({ dish, channel, onSelect }: { dish: Dish; channel: Channel; onSelect: (trigger: HTMLButtonElement) => void }) {
  const { price } = dish;
  const discount = channel !== "shop" && dish.originalPrice !== undefined && price !== null ? dish.originalPrice - price : 0;
  return <Button variant="ghost" disabled={!dish.available} onClick={event => onSelect(event.currentTarget)} className={`menu-dish group flex h-auto min-h-[114px] min-w-0 w-full items-center justify-start gap-3 overflow-hidden rounded-xl border-b border-border px-1 py-3 text-left hover:bg-secondary/50 sm:gap-4 ${!dish.available ? "cursor-not-allowed opacity-55" : ""}`}>
    {dish.image ? <img src={dish.image} alt={dish.name} width={1024} height={1024} loading="lazy" className="size-[68px] shrink-0 rounded-2xl object-cover sm:size-[80px]" /> : <div className="flex size-[68px] shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary/70 sm:size-[80px]"><Soup size={28} strokeWidth={1.5} /></div>}
    <span className="flex min-w-0 flex-1 flex-col self-stretch justify-center">
      <span className="flex min-w-0 flex-wrap items-center gap-1.5">
        <span className="text-base font-bold text-foreground">{dish.name}</span>
        {discount > 0 && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">Giảm {formatPrice(discount)}</span>}
        {!dish.available && <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">Tạm hết</span>}
      </span>
      <DishTags dish={dish} />
      <span className="mt-1 line-clamp-2 text-xs font-normal leading-5 text-muted-foreground">{dish.description}</span>
      <span className="mt-2 flex flex-wrap items-baseline gap-x-2 text-base font-bold tabular-nums text-foreground">{price === null ? <span className="text-xs text-muted-foreground">Xem giá trên GrabFood</span> : formatPrice(price)}{discount > 0 && dish.originalPrice !== undefined && <span className="text-xs font-medium text-muted-foreground line-through">{formatPrice(dish.originalPrice)}</span>}</span>
    </span>
    {Boolean(dish.spicy) && <span className="flex shrink-0 items-center text-xs font-normal text-primary" aria-label={`Cay mức ${dish.spicy}`}>{Array.from({ length: dish.spicy ?? 0 }, (_, index) => <Flame size={13} key={index} />)}</span>}
  </Button>;
}

function DishTags({ dish }: { dish: Dish }) {
  const tags = getDishTags(dish);
  if (!tags.length) return null;
  return <span className="mt-1.5 flex min-w-0 flex-wrap gap-1.5">
    {tags.map(tag => <DishTag key={tag} label={tag} />)}
  </span>;
}














