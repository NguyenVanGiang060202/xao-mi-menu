"use client";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

import { ArrowUpRight, Clock3, CupSoda, Flame, Layers, MapPin, MessageCircle, ReceiptText, Soup, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DishTag } from "@/components/dish-tag";
import { OrderEstimator } from "@/components/order-estimator";
import { SeasonGutterStickers, SeasonSticker } from "@/components/season-sticker";
import { StorefrontAwning } from "@/components/storefront-awning";
import { formatPrice, getDishTags, themes, type Channel } from "@/lib/menu-data";
import { channels, defaultShopSchedule, shopDays, shopLocation, type PlatformDraftDish as Dish, type Appearance, type PlatformFeeMap, type ShopInfo, type VoucherMap } from "@/lib/catalog";
import { contactName, zaloNumber, zaloUrl } from "@/lib/contact";
import { VoucherList } from "@/components/voucher-list";
import { trackingCategories, trackingScrollLevels, type TrackingEvent } from "@/lib/tracking-data";
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
const compactShopDays = { weekday: "T2 – T6", weekend: "T7 – CN" } as const;

function sendMenuEvents(...events: TrackingEvent[]) {
  const query = new URLSearchParams(events.map((event) => ["event", event]));
  void fetch(`/api/menu-tracking?${query}`, { method: "POST", keepalive: true }).catch(() => {});
}

type MenuPageProps = {
  menus: Record<Channel, Dish[]>;
  appearance: Appearance;
  vouchers: VoucherMap;
  platformFees: PlatformFeeMap;
  now: number;
  shop: ShopInfo;
  trackTraffic?: boolean;
  initialChannel?: Channel;
  channelOrder?: readonly Channel[];
};

export function MenuPage({
  menus,
  appearance,
  vouchers,
  platformFees,
  now,
  shop,
  trackTraffic = false,
  initialChannel = "xanh",
  channelOrder = ["xanh", "be", "grab"],
}: MenuPageProps) {
  const [channel, setChannel] = useState<Channel>(initialChannel);
  const [category, setCategory] = useState("Tất cả");
  const [estimatorOpen, setEstimatorOpen] = useState(false);
  const [navigationStuck, setNavigationStuck] = useState(false);
  const navigationMarker = useRef<HTMLDivElement>(null);
  const viewSent = useRef(false);
  const lastScrollLevel = useRef(0);
  const theme = appearance.theme;
  const schedule = shop.schedule ?? defaultShopSchedule;

  useEffect(() => {
    if (!trackTraffic || viewSent.current) return;
    viewSent.current = true;
    sendMenuEvents("view");
  }, [trackTraffic]);

  function trackLink(event: MouseEvent<HTMLAnchorElement>, ...events: TrackingEvent[]) {
    if (trackTraffic && !event.defaultPrevented && (event.button === 0 || event.button === 1)) {
      sendMenuEvents(...events);
    }
  }

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
  const activeVouchers = vouchers[channel].filter(voucher => voucher.enabled);

  const visibleDishes = useMemo(() => menu.filter((dish) => {
    const matchesCategory = category === "Tất cả" || dish.category === category;
    return matchesCategory;
  }), [category, menu]);

  const trackScroll = trackTraffic && category === "Tất cả" && menu.length > 0;
  useEffect(() => {
    if (!trackScroll) return;
    function recordScrollDepth() {
      if (lastScrollLevel.current === 100) return;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0 || window.scrollY <= 0) return;
      const percent = (window.scrollY + 1) / maxScroll * 100;
      const crossed = trackingScrollLevels.filter((level) => level > lastScrollLevel.current && level <= percent);
      if (!crossed.length) return;
      lastScrollLevel.current = crossed[crossed.length - 1];
      sendMenuEvents(...crossed.map((level) => `scroll_${level}` as const));
    }
    window.addEventListener("scroll", recordScrollDepth, { passive: true });
    return () => window.removeEventListener("scroll", recordScrollDepth);
  }, [trackScroll]);

  const themeInfo = themes[theme];
  const grouped = categories.slice(1).map((name) => ({ name, dishes: visibleDishes.filter((dish) => dish.category === name) })).filter((group) => group.dishes.length > 0);

  function selectCategory(name: string) {
    if (trackTraffic && name !== category) {
      const selected = trackingCategories.find(({ label }) => label === name)?.id ?? "other";
      sendMenuEvents(`category_${channel}_${selected}`);
    }
    setCategory(name);
  }

  function selectChannel(next: Channel) {
    if (trackTraffic && next !== channel) sendMenuEvents(`tab_${next}`);
    setChannel(next);
    setCategory("Tất cả");
  }

  const order = channel === "shop"
    ? { url: shopLocation.mapsUrl, label: "Chỉ đường tới quán", event: "maps" as const }
    : { url: channels[channel].url, label: `Đặt qua ${channelNames[channel]}`, event: channel };

  function trackOrder(event: MouseEvent<HTMLAnchorElement>) {
    trackLink(event, "xanh");
  }

  function trackChannelOrder(event: MouseEvent<HTMLAnchorElement>) {
    trackLink(event, order.event);
  }

  const sameHours = schedule.weekday.open === schedule.weekend.open && schedule.weekday.close === schedule.weekend.close;
  const hoursLines = !shop.schedule && shop.hours.trim()
    ? [shop.hours]
    : sameHours
      ? [`${schedule.weekday.open} – ${schedule.weekday.close} mỗi ngày`]
      : shopDays.map(({ id }) => `${compactShopDays[id]}: ${schedule[id].open} – ${schedule[id].close}`);

  return (
    <main className={`menu-page min-h-screen bg-background pb-28 text-foreground theme-${theme}`} style={{ "--primary": appearance.accent, ...((appearance.background || themeInfo.background) ? { "--background": appearance.background || themeInfo.background } : {}) } as React.CSSProperties}>
      <header key={theme} className="menu-hero menu-storefront relative mx-auto max-w-6xl overflow-hidden">
        {appearance.image && <img src={appearance.image} alt="" width={1280} height={640} className="absolute inset-0 h-full w-full object-cover object-center opacity-35" />}

        <StorefrontAwning />
        <div className="menu-hero-inner relative px-4 sm:px-6">
          <div className="menu-sign">
            <div className="menu-brand-stage">
              <div className="menu-brand-lockup flex min-w-0 items-center gap-3 sm:gap-5">
                <div className="menu-brand-mark relative shrink-0">
                  <div className="menu-logo flex size-20 overflow-hidden rounded-full sm:size-28">
                    <img src={appearance.logo || "/xao-mi-logo.png"} alt="" width={112} height={112}
                      className={`size-full object-contain ${appearance.logo ? "" : "scale-[1.48]"}`} />
                  </div>
                  <SeasonSticker theme={theme} movable />
                </div>
                <div className="menu-brand-copy min-w-0">
                  {theme !== "default" && <p className="text-xs font-semibold">{themeInfo.eyebrow}</p>}
                  <h1 className="menu-wordmark font-black leading-none">Xào Mì!</h1>
                  <span className="menu-brand-swoosh" aria-hidden="true" />
                  {appearance.greeting.trim() && <p className="menu-greeting">{appearance.greeting.trim()}</p>}
                </div>
              </div>
            </div>
            <div className="menu-hero-side">
              <a href={channels.xanh.url} target="_blank" rel="noreferrer"
                onClick={trackOrder} onAuxClick={trackOrder}
                className="menu-order-cta menu-channel-cta menu-channel-xanh inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full px-5 text-base font-extrabold sm:text-lg">
                <span className="menu-cta-label">Đặt qua Xanh SM Ngon</span><ArrowUpRight size={20} aria-hidden="true" />
              </a>
              <a href={zaloUrl} target="_blank" rel="noreferrer"
                aria-label={`Nhắn Zalo để phản ánh ${zaloNumber}, ${contactName}`}
                onClick={(event) => trackLink(event, "zalo", "zalo_contact")}
                onAuxClick={(event) => trackLink(event, "zalo", "zalo_contact")}
                className="menu-zalo-cta inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-base font-bold">
                <MessageCircle size={20} aria-hidden="true" />Nhắn Zalo để phản ánh
              </a>
              <ul className="menu-hero-meta" aria-label="Thông tin quán">
                <li className="menu-hero-hours">
                  <Clock3 size={18} aria-hidden="true" />
                  <span>{hoursLines.map((line) => <span key={line} className="block tabular-nums">{line}</span>)}</span>
                </li>
                <li>
                  <a href={shopLocation.mapsUrl} target="_blank" rel="noreferrer"
                    onClick={(event) => trackLink(event, "maps")} onAuxClick={(event) => trackLink(event, "maps")}>
                    <MapPin size={18} aria-hidden="true" />Chỉ đường
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      <div ref={navigationMarker} className="-mb-px h-px" aria-hidden="true" />
      <section className="menu-navigation sticky top-0 z-30" data-stuck={navigationStuck}>
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          {channelOrder.length > 0 && <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:gap-3" role="tablist" aria-label="Chọn nơi đặt món">
            {channelOrder.map((key) => <Button key={key} role="tab" aria-selected={channel === key} variant="ghost" onClick={() => selectChannel(key)} className={`menu-channel-tab ${channelStyles[key]} h-11 flex-1 rounded-xl px-2 text-xs font-bold sm:flex-none sm:px-5 sm:text-sm`}><span>{channelNames[key]}</span></Button>)}
          </div>}
          <div className="flex w-full gap-2 sm:w-auto">
            <a href={order.url} target="_blank" rel="noreferrer"
              onClick={trackChannelOrder} onAuxClick={trackChannelOrder}
              className={`menu-channel-cta ${channelStyles[channel]} inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold sm:flex-none`}>
              <span className="menu-cta-label">{order.label}</span><ArrowUpRight size={16} aria-hidden="true" />
            </a>
            {channel !== "shop" && <Button variant="outline" className="min-h-11 rounded-xl" onClick={() => setEstimatorOpen(true)}>
              <ReceiptText size={16} aria-hidden="true" />Tính tiền
            </Button>}
          </div>
        </div>
        {menu.length > 0 && <nav className="menu-filter-row mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 sm:px-8" aria-label="Danh mục món">
          {categories.map((item) => {
            const count = item === "Tất cả" ? menu.length : menu.filter((dish) => dish.category === item).length;
            const active = category === item;
            return <Button key={item} variant="ghost" aria-pressed={active} onClick={() => selectCategory(item)} className={`menu-filter h-9 shrink-0 rounded-full border px-3.5 text-[13px] font-semibold ${active ? "border-primary bg-primary font-bold text-primary-foreground shadow-sm hover:bg-primary/90" : "border-dashed border-border bg-transparent text-muted-foreground hover:bg-secondary"}`}><span>{item}<b className="menu-filter-count" aria-label={`${count} món`}>{count}</b></span></Button>;
          })}
        </nav>}
      </section>

      <div key={channel} className="menu-content mx-auto max-w-6xl px-4 sm:px-8">
        <VoucherList vouchers={activeVouchers} channel={channel} channelName={channelNames[channel]} className={channelStyles[channel]} />
        <div key={category} className="menu-board">
        {grouped.length ? grouped.map((group) => <section id={`category-${group.name}`} key={group.name} className="menu-category scroll-mt-36 mb-6">
          <SeasonGutterStickers theme={theme} index={categories.indexOf(group.name) - 1} seed={now} />
          <div className="menu-category-heading flex items-center gap-3">
            <CategoryStamp category={group.name} />
            <h3 className="text-xl font-bold sm:text-2xl">{group.name}</h3>
            <span key={group.dishes.length} className="menu-category-count ml-auto text-xs">{group.dishes.length} món</span>
          </div>
          <SeasonSticker theme={theme} category={group.name} movable />
          <div className="menu-category-items grid sm:grid-cols-2">
            {group.dishes.map(dish => <DishRow key={dish.id} dish={dish} channel={channel} onPriceClick={(event) => trackLink(event, dish.supplementedFrom === "be" ? "be" : "grab_price")} />)}
          </div>
        </section>) : <div className="mb-8 rounded-3xl border border-dashed border-primary/25 bg-card py-12 text-center text-sm text-muted-foreground">{menu.length ? "Chưa tìm thấy món phù hợp." : "Menu quán đang được cập nhật."}{!menu.length && <div className="mt-3 flex justify-center gap-3"><Button variant="outline" onClick={() => selectChannel("grab")}>Xem menu GrabFood</Button><Button variant="outline" onClick={() => selectChannel("be")}>Xem menu beFood</Button></div>}</div>}
        </div>
      </div>
      {channel !== "shop" && <OrderEstimator key={`estimator-${channel}`} open={estimatorOpen} onOpenChange={setEstimatorOpen}
        platform={channel} dishes={menus[channel]} vouchers={vouchers[channel]} fees={platformFees[channel]} />}
    </main>
  );
}

function DishRow({ dish, channel, onPriceClick }: { dish: Dish; channel: Channel; onPriceClick: (event: MouseEvent<HTMLAnchorElement>) => void }) {
  const { price } = dish;
  const priceChannel = dish.supplementedFrom ?? "grab";
  const discount = channel !== "shop" && dish.originalPrice !== undefined && price !== null ? dish.originalPrice - price : 0;
  return <article data-available={dish.available} className={`menu-dish flex min-h-[114px] min-w-0 w-full items-center gap-3 overflow-hidden rounded-xl border-b border-border px-1 py-3 text-left sm:gap-4 ${dish.available ? "" : "opacity-55"}`}>
    {dish.image ? <img src={dish.image} alt="" width={1024} height={1024} loading="lazy" className="size-[68px] shrink-0 rounded-2xl object-cover sm:size-[80px]" /> : <div aria-hidden="true" className="flex size-[68px] shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary/70 sm:size-[80px]"><Soup size={28} strokeWidth={1.5} /></div>}
    <span className="flex min-w-0 flex-1 flex-col self-stretch justify-center">
      <span className="flex min-w-0 flex-wrap items-center gap-1.5">
        <span className="text-base font-bold text-foreground">{dish.name}</span>
        {discount > 0 && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">Giảm {formatPrice(discount)}</span>}
        {!dish.available && <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">Tạm hết</span>}
      </span>
      <DishTags dish={dish} />
      {dish.supplementedFrom && <span className="mt-1.5 self-start rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Bổ sung từ beFood</span>}
      {(dish.description || dish.ingredients) && <span className="mt-1 text-xs font-normal leading-5 text-muted-foreground">{dish.description || dish.ingredients}</span>}
      <span className="mt-2 flex flex-wrap items-baseline gap-x-2 text-base font-bold tabular-nums text-foreground">
        {price === null ? <a href={channels[priceChannel].url} target="_blank" rel="noreferrer" onClick={onPriceClick} onAuxClick={onPriceClick} className="inline-flex items-center gap-1 rounded text-xs text-muted-foreground underline underline-offset-2 focus-visible:outline-2">
          {dish.supplementedFrom ? "Xem món trên beFood" : "Xem giá trên GrabFood"} <ArrowUpRight size={13} aria-hidden="true" />
        </a> : formatPrice(price)}
        {discount > 0 && dish.originalPrice !== undefined && <span className="text-xs font-medium text-muted-foreground line-through">{formatPrice(dish.originalPrice)}</span>}
      </span>
    </span>
    {Boolean(dish.spicy) && <span className="flex shrink-0 items-center text-xs font-normal text-primary" aria-label={`Cay mức ${dish.spicy}`}>{Array.from({ length: dish.spicy ?? 0 }, (_, index) => <Flame size={13} key={index} />)}</span>}
  </article>;
}

function DishTags({ dish }: { dish: Dish }) {
  const tags = getDishTags(dish);
  if (!tags.length) return null;
  return <span className="mt-1.5 flex min-w-0 flex-wrap gap-1.5">
    {tags.map(tag => <DishTag key={tag} label={tag} />)}
  </span>;
}














