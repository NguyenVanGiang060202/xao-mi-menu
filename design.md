# Xào Mì! — Design system và hướng dẫn triển khai

Tài liệu này là nguồn chuẩn cho giao diện hiện tại. Khi chỉnh UI, ưu tiên tái sử dụng token, tỷ lệ và thành phần ở đây; không tạo một hệ visual thứ hai.

## 1. Phạm vi và mục tiêu

Sản phẩm có hai bề mặt khác nhau:

- `/` và `/menuquan`: thực đơn hướng tới khách. Công việc chính là chọn nền tảng hoặc món, rồi đặt món nhanh.
- `/admin`: công cụ vận hành. Công việc chính là chỉnh menu, giao diện, lịch theme, đồng bộ nền tảng và xem thống kê.

Ngôn ngữ thương hiệu: quán mì xào Việt Nam ấm, vui và có cảm giác bảng hiệu/mặt tiền. Không dùng phong cách dashboard SaaS, glassmorphism, gradient lạnh hoặc card chồng card.

CTA chính trên trang khách là **Đặt qua Xanh SM Ngon**. CTA trong hero là hành động chính; Zalo là hành động phụ; CTA ở navigation chỉ là bản tiện ích khi khách đã cuộn. Trang khách không có tìm kiếm: menu ngắn, dùng tab nền tảng và filter category là đủ.

## 2. Nguồn sự thật kỹ thuật

| Hạng mục | Nguồn chuẩn |
| --- | --- |
| Token Tailwind/shadcn và CSS trang khách | `src/styles.css` |
| Markup trang khách | `src/views/menu.tsx` |
| Dữ liệu/menu/theme | `src/lib/catalog.ts`, `src/lib/menu-data.ts`, `src/lib/public-menu.ts` |
| Logo mặc định | `public/xao-mi-logo.png` |
| Metadata/SEO, icon, ảnh chia sẻ | `src/app/layout.tsx`, `src/lib/site.ts`, `public/og-image.png` |
| UI admin | `src/views/admin.tsx`, `src/views/*.tsx` liên quan |
| Font | `@fontsource-variable/baloo-2` trong `src/app/layout.tsx` |

`src/styles.css` là nguồn theme thắng cuối cùng. Giá trị theme trong `Appearance` chỉ override các biến động như `--primary` và `--background`; không tạo token trùng trong component.

## 3. Bộ token cốt lõi

### Màu default

| Vai trò | Giá trị | Dùng cho |
| --- | --- | --- |
| Canvas kem | `#fff6df` | nền trang, sắc ấm |
| Card kem sáng | `#fffaf0` | khối menu/món |
| Kem vàng | `#ffe8ab` | header category, hover nhẹ |
| Đỏ gạch | `#ae3126` | mặt tiền hero |
| Đỏ rượu | `#843225` | heading và điểm nhấn nền tối |
| Nâu mực | `#632b22` | text trên panel kem |
| Viền caramel | `#e6c99c` | đường viền/divider nhẹ |
| Vàng brush | `#ffd01e` | gạch nhấn brand, không dùng cho CTA chính |
| Xanh ngọc Xanh SM | `#54dfcf` | CTA đặt món duy nhất |
| Xanh ngọc đậm | `#238e87` | viền/bóng CTA Xanh SM |

Neutrals phải nghiêng vàng/kem. Không thêm grey lạnh hoặc trắng/đen thuần vào bề mặt chính.

### Typography

- UI/body: system UI (`system-ui`, `Segoe UI`, sans-serif).
- Brand, tiêu đề kênh và tiêu đề category: `Baloo 2 Variable`.
- Wordmark `Xào Mì!`: Baloo 2, weight `800`, tracking `-0.035em`, kem `#fff4d8`, viền đỏ rượu quanh chữ + bóng mềm. Đây là một treatment logo, không áp dụng cho heading khác.
- Số giá và giờ: `tabular-nums`.
- Không thêm font display mới nếu chưa có asset/giấy phép cụ thể. Baloo 2 đã là lựa chọn mềm, tròn và phù hợp logo hiện có.

### Nhịp spacing và bo góc

| Cấp | Giá trị thường dùng | Vai trò |
| --- | --- | --- |
| Tight | 8px | icon với label, metadata gần nhau |
| Group | 12–16px | item cùng nhóm, tabs, món |
| Section | 24–32px | cách category/khối độc lập |
| Control | 10–12px radius | tab, filter, input, nút nhỏ |
| Card | 20px radius | category/menu card |
| Hero/panel lớn | 32px radius | storefront |

Chỉ dùng bo lớn ở mặt tiền, panel hero và category. Không bọc mọi text bằng pill hoặc card.

### Độ sâu

- Menu/category: border caramel hoặc divider nét đứt, không cần shadow lớn.
- Hero: **không có shadow và không viền dày**; khối hero phẳng, tách khỏi canvas bằng màu nền đậm.
- Nút nâng lên (có "chân đế" 3–4px): CTA Xanh trong hero, nút Zalo kem, tab nền tảng đang chọn. Các phần tử khác phẳng.
- Wordmark: viền đỏ rượu quanh chữ kem (text-shadow 8 hướng) + một bóng mềm. Đây là treatment logo, không áp cho chữ khác.
- Không kết hợp đồng thời border cứng, shadow lớn và nền đậm cho cùng một panel.

## 4. Trang khách

### 4.1 Khung trang

```text
canvas kem + pattern doodle nhẹ
└─ max-width 68rem
   ├─ storefront hero
   ├─ sticky navigation: nền tảng + CTA tiện ích
   ├─ category filters
   └─ menu content: category boards → dish rows
```

- Container hero/menu dùng cùng mép ngang: `max-w-6xl`/68rem với padding `16px` mobile, `32px` desktop.
- Nền chỉ là pattern line-art rất nhạt. Sticker nằm ngoài category, không chen vào thông tin món.
- Default root mở Xanh SM Ngon; `/menuquan` là menu quán riêng. Không phục hồi tab “Menu quán” vào root.

### 4.2 Storefront hero

Nguồn tham chiếu là banner "Xào Mì! Vietnamese Noodle Banner". Dùng ngôn ngữ tạo hình của ảnh (mái hiên sọc, nền đỏ có nét vẽ tay, vệt vàng, chữ kem viền đỏ) nhưng **không dùng đĩa mì** và **không dùng panel kem chứa nhiều thông tin**.

Nguyên tắc: hero chỉ có **một thông điệp, một hành động chính, một hành động phụ, một dòng thông tin**. Mọi thứ khác (địa chỉ, giá, tính năng) ở lại phần menu.

#### Thứ tự ưu tiên thị giác

1. Thương hiệu: logo, `Xào Mì!`, câu chào/slogan.
2. CTA chính: **Đặt qua Xanh SM Ngon** (teal, cao ≥ 56px, nút mạnh nhất hero).
3. CTA phụ: **Nhắn Zalo để phản ánh** (nền kem đặc, chữ đỏ đậm, cao ≥ 48px).
4. Thông tin nhỏ: giờ mở cửa và `Chỉ đường` trên một khối mờ, ngăn bằng đường nét đứt.

#### Desktop (từ 896px)

```text
┌──────────────────────── striped awning ────────────────────────┐
│  [logo]  Xào Mì!  ///             ┆  [ Đặt qua Xanh SM Ngon ↗ ] │
│          ~~~~~ brush              ┆  [ Nhắn Zalo để phản ánh ]   │
│          Mì nóng, nước mát.       ┆  ◷ T2–T6: …      ⌖ Chỉ đường │
│                                   ┆  ◷ T7–CN: …                 │
└────────────────────────────────────────────────────────────────┘
```

- Hero rộng tối đa `68rem`, radius `2rem` đều, không viền dày.
- Grid: brand `1.1fr` : actions `0.9fr`, gap `2.5rem`. Cột actions ngăn với brand bằng một đường dọc nét đứt (`2px dashed`, 35% màu chữ).
- Brand lockup căn giữa theo trục dọc; logo có viền kem dày và bóng mềm.
- Chiều cao hero chỉ đủ nội dung. Không kéo cao để tạo khoảng đỏ rỗng.

#### Nền và trang trí

- Nền: **màu đặc `--hero-paper` luôn được khai báo bằng `background-color`**, chỉ phủ thêm lớp ấm rất nhẹ và lớp tối ở góc dưới. Không dùng lớp sáng lớn: chữ kem phải luôn đạt tương phản trên mọi theme. (Theme mùa chỉ ghi đè `background-image`, nên nếu thiếu `background-color` hero sẽ trong suốt.)
- Họa tiết nét vẽ tay (sao 4 cánh, vòng mì, lá) màu kem nhạt, opacity ≈ 15%, tile `15rem`, nằm sau mọi nội dung (`.menu-hero-inner::before`, `z-index: -1`).
- Vệt vàng 3 nét cạnh tên quán: chỉ từ 640px trở lên.
- Theme mùa override nền riêng; họa tiết vẫn dùng chung ở mật độ thấp.

#### Dòng thông tin

- Giờ mở cửa: mỗi khung giờ một dòng (`T2 – T6: 09:00 – 23:59`, `T7 – CN: …`). Hai khung giống nhau thì gộp `… mỗi ngày`. Dùng `tabular-nums`.
- `Chỉ đường` là link gạch chân, mở Google Maps, giữ tracking `maps`.
- Không render địa chỉ dài, không hiện số điện thoại/tên người liên hệ trong hero (số Zalo nằm trong `aria-label` của nút).

#### Mobile và tablet (dưới 896px)

1. Brand lockup.
2. CTA Xanh full-width.
3. CTA Zalo full-width.
4. Dòng thông tin: giờ bên trái, `Chỉ đường` bên phải, tự xuống hàng nếu hẹp.

- Hero một cột; đường dọc nét đứt chuyển thành đường ngang nét đứt phía trên dòng thông tin.
- Body tối thiểu 16px; nhãn 13–14px. `min-w-0` cho child flex có text; icon/logo `shrink-0`.

### 4.3 Navigation và filters

- `menu-navigation` sticky, nền trùng canvas khi stuck; không dùng backdrop hoặc dải màu khác khiến nền bị cắt.
- **Tab nền tảng** (`Xanh SM Ngon`, `GrabFood`, `beFood`): tab đang chọn là nút đặc màu platform, chữ đậm 800, viền + chân đế đậm hơn. Tab không chọn **lùi lại**: nền trong suốt, viền nét đứt xám ấm, chữ `--muted-foreground`; hover mới hiện tint. Selected phải nhận ra được không chỉ bằng màu (đậm, viền, chân đế).
- **CTA navigation** là bản tiện ích nhỏ hơn CTA hero (`min-h-11`, `rounded-xl`, `text-sm`), giữ nguyên style fill màu platform ban đầu ở cả hai trạng thái.
- **Filter category**: chip cao 36px, có **số món** trong badge nhỏ. Đang chọn: nền `--primary`, chữ đậm, badge sáng, `aria-pressed`. Không chọn: nền trong suốt, viền nét đứt (cùng ngôn ngữ với tab không chọn), chữ muted. Trên mobile hàng chip cuộn ngang, mép phải mờ dần để gợi ý còn chip phía sau; ẩn scrollbar. Khi navigation sticky có đường nét đứt phía dưới.
- Không có ô tìm kiếm và không có tiêu đề kênh lặp lại tên tab. Board đầu tiên cách hàng chip chỉ khoảng `8px` (không cộng dồn padding + margin).

### 4.4 Menu boards và món

- Heading category: dải vàng sọc nhẹ, icon tròn đỏ, count `N món` bên phải.
- Category board: nền kem sáng + một viền caramel; không thêm card con cho từng món.
- Desktop từ `sm` (640px): grid hai cột. Mobile: một cột.
- Dish row: ảnh 68px mobile/80px desktop, tên đậm, tag thật (bán chạy/nên thử/món mới), mô tả tối giản, giá `tabular-nums`.
- Divider đứt chỉ **giữa** các món cùng board. Hàng cuối của board không có divider (tránh vạch ngay sát viền board).
- Món hết (`available = false`): giảm opacity, không ẩn layout.
- Sticker category chỉ nằm ở mép/corner, không che tên category, count, giá hoặc ảnh món.
- Link rời site (Grab/be/Xanh/Maps/Zalo) dùng `ArrowUpRight`; không dùng arrow external cho thao tác nội bộ.
- Voucher (khi còn hiệu lực): một khối riêng cuối danh sách, viền caramel, tiêu đề + mã đậm + điều kiện; không chen vào giữa các board.
- Trạng thái rỗng: "Menu quán đang được cập nhật." kèm nút sang GrabFood/beFood; không để trang trắng.

### 4.5 Theme theo mùa

- Mỗi theme chỉ override biến màu (`--hero-paper`, `--hero-ink`, awning, category, card, border, pattern) và sticker tương ứng.
- Cấu trúc/hierarchy hero, menu, CTA không đổi giữa các theme.
- Không để theme chỉ đổi màu nền: phải có pattern/sticker gợi đúng dịp, nhưng ở density thấp hơn menu content.
- Tôn trọng `prefers-reduced-motion`; animation là phản hồi hoặc entrance có chủ đích, không dùng fade lặp.

## 5. Admin `/admin`

Admin là product UI, không phải bản sao poster trang khách.

### Cấu trúc

```text
admin header: logo, “Xào Mì! / Quản lý quán”, xem thực đơn, đăng xuất
└─ desktop: navigation 185px | content
   mobile: navigation theo chiều ngang/rút gọn
   ├─ Menu quán: danh sách, edit drawer, reorder, save state
   ├─ Giao diện: theme, greeting, màu/ảnh/logo, preview và so sánh thay đổi
   ├─ Lịch theo mùa
   ├─ Đồng bộ nền tảng: review rồi publish riêng từng tab
   └─ Thống kê: total, trend, bảng theo ngày và interactions
```

### Quy tắc admin

- Canvas kem, header đỏ gạch, `admin-sheet` là panel trắng/kem có border nhẹ và radius 16px.
- Giữ text/body nhỏ gọn desktop, nhưng target chạm 44–48px mobile.
- Save status sticky là một khối trạng thái duy nhất; không lặp nút Save cùng hành động trong từng khu vực.
- Sync platform luôn là workflow `load → review → publish`; review dùng layout menu/card để người vận hành nhìn món, ảnh và giá nhanh.
- Preview trang khách là mô phỏng; layout hero preview phải cập nhật cùng cấu trúc hero thật khi component public thay đổi.
- Tracking ưu tiên số liệu dễ scan: số chính, biểu đồ, bảng; không dùng sticker/poster decoration cho dữ liệu.

## 6. Accessibility và interaction

- Link ngoài mở tab mới với `rel="noreferrer"`; link có destination thật.
- Mọi action keyboard-focusable có `focus-visible` rõ trên nền hiện tại.
- Image món có `alt=""` khi tên món kế bên đã mô tả; logo/link home có nhãn truy cập được.
- Không dùng màu là chỉ dấu duy nhất cho selected state, trạng thái save hay tag.
- Hover chỉ là enhancement cho chuột; mobile vẫn có press/focus state.
- Không làm thay đổi layout khi hover hoặc loading.

## 7. Checklist trước khi ship UI

- [ ] Hero chỉ có: brand, CTA Xanh, CTA Zalo, một dòng giờ + Chỉ đường.
- [ ] CTA Xanh trong hero là yếu tố màu mạnh nhất; CTA navigation giữ style fill ban đầu.
- [ ] Hero không có shadow; chữ kem rõ trên default và từng theme mùa.
- [ ] Hero không có khoảng đỏ trống lớn khi không dùng ảnh món.
- [ ] Hero không overflow ở 360px; hai nút không bị cắt chữ; giờ mở cửa không đè lên `Chỉ đường`.
- [ ] Tab đang chọn nổi bật rõ, các tab khác mờ nhưng vẫn đạt tương phản đọc được.
- [ ] Tab/filter sticky không che nền hoặc nội dung lúc scroll.
- [ ] Hàng cuối mỗi board không còn divider sát viền.
- [ ] Sticker không che text, count, CTA hay ảnh món.
- [ ] Default và mỗi theme seasonal vẫn cùng hierarchy/menu density.
- [ ] `focus-visible` thấy rõ trên nút Zalo, tab, chip, `Chỉ đường`.
- [ ] `/menuquan`, `/`, `/admin` build thành công; link Maps, Zalo, Xanh và tracking vẫn hoạt động. Lưu ý: tracking `search_found_*` / `search_empty_*` không còn vì đã bỏ ô tìm kiếm.
