import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MenuPage } from "@/views/menu";
import { readStore } from "@/lib/store";
import { getPublicMenu } from "@/lib/public-menu";
import { themes, type ThemeName } from "@/lib/menu-data";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const store = await readStore();
  const menu = getPublicMenu(store, Date.now());
  const { preview } = await searchParams;
  const name = preview === "noel" ? "christmas" : preview;
  if (!name || !Object.hasOwn(themes, name)) return <MenuPage {...menu} trackTraffic={preview === undefined && process.env.VERCEL_ENV !== "preview"} />;
  const theme = name as ThemeName;
  const { title, greeting, accent, background } = themes[theme];
  const appearance = { ...menu.appearance, theme, greeting, accent, background, image: "" };

  return <>
    <div className="admin-preview-banner">
      <Link href="/admin" className="inline-flex min-h-10 items-center gap-2 font-semibold"><ArrowLeft size={16} />Quay lại admin</Link>
      <span className="text-xs">Xem thử {title}</span>
    </div>
    <MenuPage {...menu} appearance={appearance} />
  </>;
}
