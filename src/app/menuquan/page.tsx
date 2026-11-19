import type { Metadata } from "next";
import { MenuPage } from "@/views/menu";
import { readStore } from "@/lib/store";
import { getPublicMenu } from "@/lib/public-menu";
import { siteOgImage } from "@/lib/site";

export const dynamic = "force-dynamic";

const title = "Thực đơn quán";
const description = "Thực đơn đầy đủ tại quán Xào Mì!: mì xào bò, mì xào hải sản, mì trộn, món ăn kèm và đồ uống. Giá cập nhật, xem món trước khi ghé 28A Đường số 2, Bình Trưng, TP.HCM.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/menuquan" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "/menuquan",
    siteName: "Xào Mì!",
    title: `${title} · Xào Mì!`,
    description,
    images: [siteOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} · Xào Mì!`,
    description,
    images: [siteOgImage.url],
  },
};

export default async function MenuQuanPage() {
  const store = await readStore();
  const menu = getPublicMenu(store, Date.now());

  return <MenuPage
    {...menu}
    initialChannel="shop"
    channelOrder={[]}
    trackTraffic={process.env.VERCEL_ENV !== "preview"}
  />;
}
