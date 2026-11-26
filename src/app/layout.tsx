import type { Metadata, Viewport } from "next";
import "@fontsource-variable/baloo-2";
import "../styles.css";
import { restaurantJsonLd, siteDescription, siteName, siteOgImage, siteTitle, siteUrl } from "@/lib/site";
import { AppAnalytics } from "@/components/app-analytics";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteTitle, template: "%s · Xào Mì!" },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    "Xào Mì",
    "mì xào",
    "quán mì xào",
    "mì xào bò",
    "mì xào hải sản",
    "đặt món online",
    "Bình Trưng",
    "TP.HCM",
    "Xanh SM Ngon",
    "GrabFood",
    "beFood",
  ],
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  category: "food",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "/",
    siteName,
    title: siteTitle,
    description: siteDescription,
    images: [siteOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [siteOgImage.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: { capable: true, title: siteName, statusBarStyle: "default" },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ae3126",
  colorScheme: "light",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        {children}
        <AppAnalytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
