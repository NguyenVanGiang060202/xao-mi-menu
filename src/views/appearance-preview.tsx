import { useState, type ReactNode } from "react";
import { ArrowLeft, Maximize2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Appearance } from "@/lib/catalog";
import { themes } from "@/lib/menu-data";
import type { PublicMenu } from "@/lib/public-menu";
import { MenuPage } from "./menu";

const fields = [
  { key: "theme", label: "Chủ đề" },
  { key: "greeting", label: "Lời chào" },
  { key: "accent", label: "Màu điểm nhấn" },
  { key: "background", label: "Màu nền" },
  { key: "image", label: "Ảnh đầu trang" },
  { key: "logo", label: "Logo quán" },
] as const;

function describe(appearance: Appearance) {
  return {
    theme: themes[appearance.theme].title,
    greeting: appearance.greeting.trim(),
    accent: appearance.accent.toLowerCase(),
    background: (appearance.background || themes[appearance.theme].background).toLowerCase(),
    image: appearance.image,
    logo: appearance.logo,
  };
}

function AppearanceValue({ field, value }: { field: keyof Appearance; value: string }) {
  if (field === "image" || field === "logo") {
    const source = value || (field === "logo" ? "/xao-mi-logo.jpg" : "");
    return source ? <img src={source} alt={value ? "Ảnh đã chọn" : "Logo mặc định"} className="h-11 w-16 rounded-md border border-border bg-card object-contain" />
      : <span className="text-muted-foreground">Chưa có ảnh</span>;
  }
  if (field === "accent" || field === "background") {
    return value ? <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className="size-4 shrink-0 rounded border border-border" style={{ backgroundColor: value }} />
      {value}
    </span> : <span className="text-muted-foreground">Theo chủ đề</span>;
  }
  return value || <span className="text-muted-foreground">Để trống</span>;
}

export function AppearancePreview({ menu, draft, busy, notification, onOpenChange, onApply }: {
  menu: PublicMenu;
  draft: Appearance;
  busy: boolean;
  notification: ReactNode;
  onOpenChange: (open: boolean) => void;
  onApply: () => Promise<void>;
}) {
  const [version, setVersion] = useState<"draft" | "published">("draft");
  const before = describe(menu.appearance);
  const after = describe(draft);
  const changed = fields.filter(({ key }) => before[key] !== after[key]);

  return <section className="admin-sheet">
    <Sheet onOpenChange={onOpenChange}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3>So sánh giao diện</h3>
          <p className="mt-1 text-sm text-muted-foreground">{changed.length ? `${changed.length} mục khác với giao diện đang hiển thị.` : "Bản đang chỉnh giống giao diện đang hiển thị."}</p>
        </div>
        <SheetTrigger asChild>
          <Button onClick={() => setVersion("draft")}><Maximize2 size={15} />Xem toàn bộ trang</Button>
        </SheetTrigger>
      </div>
      {changed.length > 0 && <dl className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
        {changed.map(({ key, label }) => <div key={key} className="grid grid-cols-2 gap-x-3 gap-y-2 px-3 py-3 text-sm sm:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <dt className="col-span-2 self-start font-semibold sm:col-span-1">{label}</dt>
          <dd className="min-w-0 break-words"><span className="mb-1 block text-xs text-muted-foreground">Đang hiển thị</span><AppearanceValue field={key} value={before[key]} /></dd>
          <dd className="min-w-0 break-words"><span className="mb-1 block text-xs text-muted-foreground">Bản đang chỉnh</span><AppearanceValue field={key} value={after[key]} /></dd>
        </div>)}
      </dl>}
      <SheetContent side="bottom" className="admin-full-preview" showClose={false}>
        {notification}
        <div className="admin-full-preview-toolbar">
          <SheetClose asChild>
            <Button variant="outline"><ArrowLeft size={15} />Quay lại admin</Button>
          </SheetClose>
          <div className="min-w-0">
            <SheetTitle className="text-lg font-bold">Xem trước toàn bộ trang</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">Thử các tab, bộ lọc và xem chi tiết món như trên trang khách.</SheetDescription>
          </div>
          <div role="group" aria-label="Phiên bản giao diện" className="flex flex-wrap gap-2">
            <Button aria-pressed={version === "published"} variant={version === "published" ? undefined : "outline"} onClick={() => setVersion("published")}>Đang hiển thị</Button>
            <Button aria-pressed={version === "draft"} variant={version === "draft" ? undefined : "outline"} onClick={() => setVersion("draft")}>Bản đang chỉnh</Button>
          </div>
          {version === "draft" && <Button disabled={busy} onClick={onApply}><Save size={15} />Lưu giao diện</Button>}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-menu-scroll-root>
          <MenuPage {...menu} appearance={version === "draft" ? draft : menu.appearance} />
        </div>
      </SheetContent>
    </Sheet>
  </section>;
}
