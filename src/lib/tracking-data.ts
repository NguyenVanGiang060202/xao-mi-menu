export const trackingChannels = [
  { event: "zalo", label: "Zalo" },
  { event: "grab", label: "GrabFood" },
  { event: "be", label: "beFood" },
  { event: "xanh", label: "Xanh SM Ngon" },
] as const;

export const trackingMenuTabs = [
  { id: "shop", label: "Menu quán" },
  { id: "grab", label: "GrabFood" },
  { id: "be", label: "beFood" },
  { id: "xanh", label: "Xanh SM Ngon" },
] as const;

export const trackingCategories = [
  { id: "all", label: "Tất cả" },
  { id: "combo", label: "Combo" },
  { id: "stir_fried", label: "Mì xào" },
  { id: "mixed", label: "Mì trộn" },
  { id: "sides", label: "Ăn kèm" },
  { id: "drinks", label: "Đồ uống" },
  { id: "other", label: "Danh mục khác" },
] as const;

export const trackingScrollLevels = [25, 50, 75, 100] as const;
export const trackingEvents = [
  "view", ...trackingChannels.map(({ event }) => event),
  "maps", "grab_price", "zalo_contact", "zalo_navigation",
  ...trackingScrollLevels.map((level) => `scroll_${level}` as const),
  ...trackingMenuTabs.flatMap(({ id }) => [
    `tab_${id}` as const,
    `search_found_${id}` as const,
    `search_empty_${id}` as const,
    ...trackingCategories.map((category) => `category_${id}_${category.id}` as const),
  ]),
] as const;
export const trackingPeriods = [7, 30, 90] as const;

export type TrackingEvent = (typeof trackingEvents)[number];
export type TrackingPeriod = (typeof trackingPeriods)[number];
export type TrackingCounts = Partial<Record<TrackingEvent, number>>;
export type TrackingDay = { day: string; counts: TrackingCounts };
