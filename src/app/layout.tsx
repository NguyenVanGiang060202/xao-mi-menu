import type { Metadata } from "next";
import "@fontsource-variable/baloo-2";
import "../styles.css";

export const metadata: Metadata = {
  title: "Xào Mì! · Thực đơn",
  description: "Mì nóng, nước mát. Xem thực đơn Xào Mì! theo từng kênh đặt món.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><body>{children}</body></html>;
}
