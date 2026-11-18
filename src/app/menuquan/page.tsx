import { MenuPage } from "@/views/menu";
import { readStore } from "@/lib/store";
import { getPublicMenu } from "@/lib/public-menu";

export const dynamic = "force-dynamic";

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
