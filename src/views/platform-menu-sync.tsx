"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { confirmPlatformMenu, previewPlatformMenu } from "@/app/actions";
import { Button } from "@/components/ui/button";
import type { NotifyAdmin } from "@/components/admin-toast";
import { platformMenus, type Platform } from "@/lib/catalog";
import { formatPrice } from "@/lib/menu-data";
import type { PlatformSnapshots } from "@/lib/store";

const platformHelp: Record<Platform, string> = {
  grab: "Khi nguồn đồng bộ thiếu giá, dùng giá đã đối chiếu trên GrabFood cho món khớp.",
  be: "Lấy dữ liệu từ gian hàng beFood.",
  xanh: "Lấy danh sách từ beFood và công bố riêng cho tab Xanh SM Ngon.",
};
type Review = Extract<Awaited<ReturnType<typeof previewPlatformMenu>>, { ok: true }> & { platform: Platform };

export function PlatformMenuSync({ notify, ...snapshots }: PlatformSnapshots & { notify: NotifyAdmin }) {
  const router = useRouter();
  const [loading, setLoading] = useState<Platform | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const busy = Boolean(loading) || publishing;
  const previewDishes = review?.dishes ?? [];
  const groups = new Map<string, typeof previewDishes>();
  for (const dish of previewDishes) {
    const group = groups.get(dish.category);
    if (group) group.push(dish);
    else groups.set(dish.category, [dish]);
  }
  async function load(platform: Platform) {
    setLoading(platform);
    try {
      const result = await previewPlatformMenu(platform);
      if (result.ok) {
        setReview({ ...result, platform });
        notify(`Đã tải ${result.dishes.length} món. Xem lại trước khi công bố.`, "success");
      } else notify(result.message, "error");
    } catch {
      notify("Không tải được thực đơn. Hãy thử lại.", "error");
    } finally {
      setLoading(null);
    }
  }

  async function publish() {
    if (!review || !review.canPublish || busy) return;
    setPublishing(true);
    try {
      const result = await confirmPlatformMenu({ platform: review.platform, previousSync: review.previousSync, digest: review.digest });
      notify(result.message, result.ok ? "success" : "error");
      if (result.ok) {
        setReview(null);
        router.refresh();
      }
    } catch {
      notify("Không công bố được. Hãy thử lại.", "error");
    } finally {
      setPublishing(false);
    }
  }

  return <section className="admin-sheet">
    <h3 className="mb-3">Thực đơn trên nền tảng</h3>
    <p className="mb-3 text-sm text-muted-foreground">Duyệt và công bố riêng cho từng tab đặt món.</p>
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {(Object.keys(platformMenus) as Platform[]).map(platform => {
        const { label, key } = platformMenus[platform];
        const snapshot = snapshots[key];
        return <div key={platform} className="flex flex-col items-start gap-2 rounded-xl bg-secondary p-3">
          <p className="text-sm font-bold">{label}</p>
          <p className="text-xs text-muted-foreground">{platformHelp[platform]}</p>
          {snapshot && <p className="text-xs text-muted-foreground">
            {snapshot.dishes.length} món · {new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(snapshot.syncedAt))}
          </p>}
          <Button type="button" className="mt-auto" disabled={busy || Boolean(review)} onClick={() => load(platform)}>
            <RefreshCw size={15} />{loading === platform ? "Đang lấy món…" : `Đồng bộ ${label}`}
          </Button>
        </div>;
      })}
    </div>
    {review && <form className="mt-5 border-t border-border pt-4" onSubmit={event => { event.preventDefault(); void publish(); }}>
      <h4 className="font-bold">Duyệt thực đơn {platformMenus[review.platform].label}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{previewDishes.length} món từ nguồn đồng bộ</p>
      <div className="mt-4 space-y-5">
        {[...groups].map(([category, dishes]) => <section key={category}>
          <h5 className="mb-2 text-sm font-bold">{category} <span className="ml-1 font-normal text-muted-foreground">· {dishes.length} món</span></h5>
          <ul className="grid gap-2 xl:grid-cols-2">
            {dishes.map(dish => <li key={dish.id} className="flex min-w-0 items-start gap-3 rounded-xl border border-border bg-card p-3">
              {dish.image ? <img src={dish.image} alt="" loading="lazy" className="size-16 shrink-0 rounded-lg object-cover" /> : <span className="grid size-16 shrink-0 place-items-center rounded-lg bg-secondary text-center text-[10px] text-muted-foreground">Chưa có ảnh</span>}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{dish.name}</p>
                {!dish.available && <p className="mt-1 text-xs text-muted-foreground">Tạm hết</p>}
                {dish.price === null ? <p className="mt-1 text-xs text-muted-foreground">Xem giá trên GrabFood</p>
                  : <p className="mt-1 flex flex-wrap items-baseline gap-2 text-sm font-bold text-primary">
                    {formatPrice(dish.price)}
                    {dish.originalPrice !== undefined && dish.originalPrice > dish.price && <span className="text-xs font-normal text-muted-foreground line-through">{formatPrice(dish.originalPrice)}</span>}
                  </p>}
              </div>
            </li>)}
          </ul>
        </section>)}
      </div>
      {!review.canPublish && <p className="mt-3 text-sm text-muted-foreground">Cần kết nối cơ sở dữ liệu để lưu thực đơn.</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="submit" disabled={busy || !review.canPublish}>{publishing ? "Đang công bố…" : `Công bố lên tab ${platformMenus[review.platform].label}`}</Button>
        <Button type="button" variant="outline" disabled={publishing} onClick={() => setReview(null)}>Bỏ bản duyệt</Button>
      </div>
    </form>}
  </section>;
}
