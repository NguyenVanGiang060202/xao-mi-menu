export type Channel = "shop" | "grab" | "be" | "xanh";
type ThemePreset = { title: string; greeting: string; eyebrow: string; accent: string; background: string; motif: string };

export type Dish = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  grabPrice?: number;
  bePrice?: number;
  spicy?: number;
  tag?: string;
  tags?: string[];
  available: boolean;
  photo?: boolean;
  ingredients: string;
};

export const dishTagPresets = ["Bán chạy", "Nên thử", "Món mới"] as const;

export function getDishTags(dish: Pick<Dish, "tag" | "tags">): string[] {
  const tags = dish.tags ?? (dish.tag ? [dish.tag] : []);
  return [...new Set(tags.map(tag => {
    const label = tag.trim();
    if (/^(bán chạy|best[ -]?seller|được gọi nhiều)$/i.test(label)) return "Bán chạy";
    if (/^(nên thử|must[ -]?try)$/i.test(label)) return "Nên thử";
    return label;
  }).filter(Boolean))];
}

export const categories = ["Tất cả", "Combo", "Mì xào", "Mì trộn", "Ăn kèm", "Đồ uống"];

export const initialDishes: Dish[] = [
  { id: "combo-1", name: "Combo no bụng", category: "Combo", description: "Mì xào bò, trứng ốp la & trà tắc nhà làm", price: 79000, grabPrice: 71000, bePrice: 74000, tag: "Được gọi nhiều", available: true, photo: true, ingredients: "Mì trứng, bò, trứng gà, trà tắc. Có chứa gluten và trứng." },
  { id: "beef", name: "Mì xào bò", category: "Mì xào", description: "Mì trứng xào lửa lớn, bò mềm, rau cải giòn", price: 70000, grabPrice: 63000, bePrice: 66000, spicy: 1, tag: "Bán chạy", available: true, photo: true, ingredients: "Mì trứng, thịt bò, cải thìa, giá đỗ, hành lá, nước tương." },
  { id: "seafood", name: "Mì xào hải sản", category: "Mì xào", description: "Tôm tươi, mực giòn, xào cùng cải thìa xanh", price: 78000, grabPrice: 70000, bePrice: 73000, spicy: 1, tag: "Món mới", available: true, photo: true, ingredients: "Mì trứng, tôm, mực, cải thìa, giá đỗ. Có chứa hải sản và gluten." },
  { id: "chicken", name: "Mì xào gà nấm", category: "Mì xào", description: "Gà áp chảo, nấm hương, chút tiêu thơm", price: 63000, grabPrice: 57000, bePrice: 59000, available: true, ingredients: "Mì trứng, gà, nấm hương, cải ngọt, hành lá." },
  { id: "mix", name: "Mì trộn sa tế bò", category: "Mì trộn", description: "Sốt sa tế rang thơm, bò xào, đậu phộng giòn", price: 68000, grabPrice: 61000, bePrice: 64000, spicy: 2, available: true, ingredients: "Mì trứng, bò, sa tế, đậu phộng, hành phi. Có chứa đậu phộng và gluten." },
  { id: "egg", name: "Trứng ốp la", category: "Ăn kèm", description: "Rìa giòn, lòng đào vừa tới", price: 10000, available: true, ingredients: "Trứng gà. Có chứa trứng." },
  { id: "spring-roll", name: "Chả giò chiên", category: "Ăn kèm", description: "Hai cuốn vàng ruộm, rau sống ăn kèm", price: 25000, available: false, ingredients: "Thịt heo, miến, nấm mèo, bánh tráng." },
  { id: "kumquat", name: "Trà tắc nhà làm", category: "Đồ uống", description: "Tắc tươi, trà lài ủ trong ngày", price: 18000, available: true, ingredients: "Trà lài, tắc tươi, đường phèn." },
  { id: "soy", name: "Sữa đậu nành", category: "Đồ uống", description: "Nấu mới mỗi sáng, thơm dịu", price: 15000, available: true, ingredients: "Đậu nành, đường phèn." },
];

export const holidayThemes = {
  "teachers-day": { title: "Nhà giáo Việt Nam", greeting: "Kính chúc thầy cô một ngày thật vui!", eyebrow: "TRI ÂN THẦY CÔ · 20/11", accent: "#5b578d", background: "#f2effa", motif: "✎" },
  "culture-day": { title: "Ngày Văn hóa Việt Nam", greeting: "Một chút hương vị Việt, ghé quán nha!", eyebrow: "NGÀY VĂN HÓA VIỆT NAM · 24/11", accent: "#306b57", background: "#edf5e9", motif: "❋" },
  "hung-kings": { title: "Giỗ Tổ Hùng Vương", greeting: "Nhớ về cội nguồn, sẻ chia bữa cơm Việt.", eyebrow: "GIỖ TỔ HÙNG VƯƠNG · MÙNG 10 THÁNG 3", accent: "#805325", background: "#f8efdc", motif: "◉" },
  "april-holiday": { title: "Lễ 30/4 – 1/5", greeting: "Chúc bạn một kỳ nghỉ vui!", eyebrow: "CHÀO MỪNG NGÀY LỄ · 30/4–1/5", accent: "#9a3d23", background: "#fff0de", motif: "✷" },
  "national-day": { title: "Quốc khánh 2/9", greeting: "Chúc bạn một ngày Quốc khánh vui!", eyebrow: "CHÀO MỪNG QUỐC KHÁNH · 2/9", accent: "#a72a33", background: "#fff0e5", motif: "★" },
  "mid-autumn": { title: "Tết Trung thu", greeting: "Trăng tròn, cùng nhau ăn mì nha!", eyebrow: "ĐÊM RẰM TRUNG THU · XÀO MÌ!", accent: "#5f3d8a", background: "#f2ecfb", motif: "☾" },
  "womens-day": { title: "Phụ nữ Việt Nam", greeting: "Chúc bạn một ngày 20/10 thật rạng rỡ!", eyebrow: "NGÀY PHỤ NỮ VIỆT NAM · 20/10", accent: "#9b3c61", background: "#fbedf1", motif: "✿" },
} satisfies Record<string, ThemePreset>;

export const themes = {
  default: { title: "Mặc định", greeting: "Mì nóng, nước mát.", eyebrow: "BẾP MÌ XÀO · THỰC ĐƠN", accent: "#c54430", background: "", motif: "" },
  christmas: { title: "Noel", greeting: "Mùa vui, mì nóng hổi!", eyebrow: "MÙA NOEL ẤM ÁP · XÀO MÌ!", accent: "#226044", background: "#f0f5e9", motif: "❄" },
  "new-year": { title: "Tết Dương lịch", greeting: "Năm mới, ăn ngon nha!", eyebrow: "CHÀO NĂM MỚI · XÀO MÌ!", accent: "#3f477e", background: "#eeeff8", motif: "✦" },
  tet: { title: "Tết Nguyên đán", greeting: "Tết đủ đầy, mì đủ vị.", eyebrow: "TẾT ĐOÀN VIÊN · XÀO MÌ!", accent: "#b93226", background: "#fff2d3", motif: "✿" },
  ...holidayThemes,
} satisfies Record<string, ThemePreset>;
export type ThemeName = keyof typeof themes;
export type HolidayTheme = keyof typeof holidayThemes;
export const themeNames = Object.keys(themes) as ThemeName[];

export function isHolidayTheme(theme: ThemeName): theme is HolidayTheme {
  return Object.hasOwn(holidayThemes, theme);
}

export const formatPrice = (price: number) => `${new Intl.NumberFormat("vi-VN").format(price)} ₫`;

export function parseVietnamDateTime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return Number.NaN;
  const [, year, month, day, hour, minute] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour) - 7, Number(minute));
}

export function getDishPrice(dish: Dish, channel: Channel) {
  if (channel === "grab" && dish.grabPrice) return dish.grabPrice;
  if (channel === "be" && dish.bePrice) return dish.bePrice;
  return dish.price;
}
