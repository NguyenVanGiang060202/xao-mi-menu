import { zaloUrl } from "@/lib/contact";

const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://xaomimenu.vercel.app");

export const siteUrl = configuredUrl.replace(/\/+$/, "");
export const siteName = "Xào Mì!";
export const siteTitle = "Xào Mì! · Thực đơn mì xào";
export const siteDescription = "Mì nóng, nước mát. Mì xào bò, hải sản, combo và đồ uống tại Xào Mì! — đặt qua Xanh SM Ngon, GrabFood, beFood. 28A Đường số 2, Bình Trưng, TP.HCM.";
export const siteOgImage = { url: "/og-image.png", width: 1200, height: 630, alt: "Xào Mì! — mì nóng, nước mát" };
export const shopAddress = {
  street: "28A Đường số 2",
  locality: "Phường Bình Trưng",
  region: "Hồ Chí Minh",
  country: "VN",
};
export const shopTelephone = "+84393508079";

export const restaurantJsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "@id": `${siteUrl}/#restaurant`,
  name: siteName,
  alternateName: "Tiệm Xào Mì!",
  url: siteUrl,
  logo: `${siteUrl}/xao-mi-logo.png`,
  image: [`${siteUrl}/og-image.png`],
  description: siteDescription,
  servesCuisine: ["Vietnamese", "Mì xào"],
  priceRange: "₫₫",
  telephone: shopTelephone,
  currenciesAccepted: "VND",
  hasMenu: `${siteUrl}/menuquan`,
  acceptsReservations: false,
  address: {
    "@type": "PostalAddress",
    streetAddress: shopAddress.street,
    addressLocality: shopAddress.locality,
    addressRegion: shopAddress.region,
    addressCountry: shopAddress.country,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "23:59",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday", "Sunday"],
      opens: "18:00",
      closes: "23:59",
    },
  ],
  sameAs: [zaloUrl],
};
