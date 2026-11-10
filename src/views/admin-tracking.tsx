"use client";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { getMenuTracking } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { trackingCategories, trackingChannels, trackingEvents, trackingMenuTabs, trackingPeriods, trackingScrollLevels, type TrackingCounts, type TrackingDay, type TrackingPeriod } from "@/lib/tracking-data";
import { TrackingTrend } from "./tracking-trend";

const numberFormat = new Intl.NumberFormat("vi-VN");
const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeZone: "UTC" });
const formatDay = (day: string) => dateFormat.format(new Date(day));
const orderClicks = (counts: TrackingCounts) =>
  trackingChannels.reduce((sum, { event }) => sum + (counts[event] ?? 0), 0);
const categoryClicks = (counts: TrackingCounts, tab: (typeof trackingMenuTabs)[number]["id"]) =>
  trackingCategories.reduce((sum, { id }) => sum + (counts[`category_${tab}_${id}`] ?? 0), 0);
const menuInteractions = (counts: TrackingCounts) =>
  trackingMenuTabs.reduce((sum, { id }) => sum + (counts[`tab_${id}`] ?? 0) + categoryClicks(counts, id)
    + (counts[`search_found_${id}`] ?? 0) + (counts[`search_empty_${id}`] ?? 0), 0)
  + (counts.maps ?? 0) + (counts.grab_price ?? 0);

function InteractionBreakdown({ totals }: { totals: TrackingCounts }) {
  const links = [
    { label: "Chỉ đường", total: totals.maps },
    { label: "Xem giá trên GrabFood", total: totals.grab_price },
    { label: "Zalo ở thông tin quán", total: totals.zalo_contact },
    { label: "Zalo ở thanh thực đơn", total: totals.zalo_navigation },
  ];
  return <section className="mt-6 space-y-4" aria-labelledby="tracking-interactions">
    <div>
      <h4 id="tracking-interactions" className="font-bold">Khách thao tác thế nào?</h4>
      <p className="mt-1 text-xs text-muted-foreground">Lượt chuyển vào từng tab, số lần chọn danh mục và kết quả tìm món trên tab đó.</p>
    </div>
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {trackingMenuTabs.map(({ id, label }) => <section key={id} className="rounded-xl border border-border p-3">
        <h5 className="mb-2 text-sm font-bold">{label}</h5>
        <dl className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 text-xs tabular-nums">
          {([
            ["Chuyển vào tab", totals[`tab_${id}`]],
            ["Chọn danh mục", categoryClicks(totals, id)],
            ["Tìm thấy món", totals[`search_found_${id}`]],
            ["Tìm không thấy món", totals[`search_empty_${id}`]],
          ] as const).map(([name, total]) => <div key={name} className="contents">
            <dt className="text-muted-foreground">{name}</dt>
            <dd className="text-right font-bold">{numberFormat.format(total ?? 0)}</dd>
          </div>)}
        </dl>
      </section>)}
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-border p-3">
        <h5 className="mb-2 text-sm font-bold">Danh mục được chọn</h5>
        <dl className="space-y-1 text-sm tabular-nums">
          {trackingCategories.map(({ id, label }) => <div key={id} className="flex justify-between gap-2">
            <dt>{label}</dt>
            <dd className="font-bold">{numberFormat.format(trackingMenuTabs.reduce((sum, tab) => sum + (totals[`category_${tab.id}_${id}`] ?? 0), 0))}</dd>
          </div>)}
        </dl>
      </div>
      <div className="rounded-xl border border-border p-3">
        <h5 className="mb-2 text-sm font-bold">Điểm bấm trên trang</h5>
        <dl className="space-y-1 text-sm tabular-nums">
          {links.map(({ label, total }) => <div key={label} className="flex justify-between gap-2">
            <dt>{label}</dt><dd className="font-bold">{numberFormat.format(total ?? 0)}</dd>
          </div>)}
        </dl>
      </div>
    </div>
    <div>
      <h5 className="text-sm font-bold">Độ sâu cuộn trang</h5>
      <p className="mt-1 text-xs text-muted-foreground">Mỗi mốc tính tối đa một lần trong một lượt xem thực đơn chưa lọc.</p>
      <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {trackingScrollLevels.map((level) => <div key={level} className="rounded-lg border border-border px-3 py-2">
          <dt className="text-xs text-muted-foreground">Đến {level}%</dt>
          <dd className="font-bold tabular-nums">{numberFormat.format(totals[`scroll_${level}`] ?? 0)}</dd>
        </div>)}
      </dl>
    </div>
  </section>;
}

export function AdminTracking() {
  const [period, setPeriod] = useState<TrackingPeriod>(7);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<TrackingDay[] | "error" | null>(null);

  useEffect(() => {
    let current = true;
    void getMenuTracking(period).then(
      (days) => { if (current) setResult(days); },
      () => { if (current) setResult("error"); },
    );
    return () => { current = false; };
  }, [period, refresh]);

  const days = Array.isArray(result) ? result : [];
  const totals = days.reduce<TrackingCounts>((counts, day) => {
    for (const event of trackingEvents) counts[event] = (counts[event] ?? 0) + (day.counts[event] ?? 0);
    return counts;
  }, {});
  const clicks = orderClicks(totals);
  const dailyPoints = days.map(({ day, counts }) => ({
    day, views: counts.view ?? 0, orders: orderClicks(counts), interactions: menuInteractions(counts),
  }));

  return <section className="admin-sheet" aria-labelledby="tracking-title">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h3 id="tracking-title" className="font-bold">Thống kê trang khách</h3>
        <p className="mt-1 text-sm text-muted-foreground">Lượt xem, lượt bấm đặt món và cách khách sử dụng thực đơn.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Khoảng thời gian thống kê">
        {trackingPeriods.map((days) => <Button
          key={days}
          variant={period === days ? undefined : "outline"}
          aria-pressed={period === days}
          onClick={() => { if (period !== days) { setResult(null); setPeriod(days); } }}
        >{days} ngày</Button>)}
        <Button
          variant="outline" aria-label="Làm mới thống kê"
          disabled={result === null}
          onClick={() => { setResult(null); setRefresh((value) => value + 1); }}
        ><RefreshCw size={16} aria-hidden="true" />Làm mới</Button>
      </div>
    </div>

    <div className="mt-5" aria-busy={result === null}>
      {result === null ? <p className="text-sm text-muted-foreground" role="status">Đang tải thống kê…</p>
        : result === "error" ? <p className="text-sm text-destructive" role="alert">Chưa tải được thống kê. Hãy bấm làm mới để thử lại.</p>
        : <>
          {days.length > 0 && <p className="mb-3 text-xs text-muted-foreground">
            {formatDay(days[days.length - 1].day)} – {formatDay(days[0].day)} · Giờ Việt Nam (GMT+7)
          </p>}
          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-secondary/50 p-4">
              <dt className="text-sm font-semibold">Lượt xem thực đơn</dt>
              <dd className="mt-1 text-3xl font-extrabold tabular-nums text-primary">{numberFormat.format(totals.view ?? 0)}</dd>
            </div>
            <div className="rounded-xl border border-border bg-secondary/50 p-4">
              <dt className="text-sm font-semibold">Lượt bấm đặt món</dt>
              <dd className="mt-1 text-3xl font-extrabold tabular-nums text-primary">{numberFormat.format(clicks)}</dd>
            </div>
          </dl>
          {dailyPoints.length > 0 && <TrackingTrend points={dailyPoints.toReversed()} />}
          <h4 className="mt-6 text-sm font-bold">Lượt bấm theo kênh</h4>
          <dl className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {trackingChannels.map(({ event, label }) => <div key={event} className="rounded-lg border border-border px-3 py-2">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-lg font-extrabold tabular-nums">{numberFormat.format(totals[event] ?? 0)}</dd>
            </div>)}
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">Lượt bấm ghi nhận thao tác mở kênh đặt món. Số đơn hoàn tất do từng nền tảng quản lý.</p>
          <InteractionBreakdown totals={totals} />
          <div className="mt-6 max-h-80 overflow-auto rounded-xl border border-border" tabIndex={0} role="region" aria-label="Thống kê theo ngày">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-secondary">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left">Ngày</th>
                  <th scope="col" className="px-3 py-2 text-right">Lượt xem</th>
                  <th scope="col" className="px-3 py-2 text-right">Lượt bấm</th>
                  <th scope="col" className="px-3 py-2 text-right" title="Chuyển tab, chọn danh mục, tìm món, xem giá và chỉ đường">Khám phá</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {dailyPoints.map(({ day, views, orders, interactions }) => <tr key={day} className="border-t border-border">
                  <th scope="row" className="whitespace-nowrap px-3 py-2 text-left font-medium">{formatDay(day)}</th>
                  <td className="px-3 py-2 text-right">{numberFormat.format(views)}</td>
                  <td className="px-3 py-2 text-right">{numberFormat.format(orders)}</td>
                  <td className="px-3 py-2 text-right">{numberFormat.format(interactions)}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </>}
    </div>
  </section>;
}
