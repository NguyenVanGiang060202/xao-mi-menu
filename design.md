# Xào Mì! — Design system và hướng dẫn triển khai

Tài liệu này là nguồn chuẩn cho giao diện hiện tại. Khi chỉnh UI, ưu tiên tái sử dụng token, tỷ lệ và thành phần ở đây; không tạo một hệ visual thứ hai.

## 1. Phạm vi và mục tiêu

Sản phẩm có hai bề mặt khác nhau:

- `/` và `/menuquan`: thực đơn hướng tới khách. Công việc chính là chọn nền tảng hoặc món, rồi đặt món nhanh.
- `/admin`: công cụ vận hành. Công việc chính là chỉnh menu, giao diện, lịch theme, đồng bộ nền tảng và xem thống kê.

Ngôn ngữ thương hiệu: quán mì xào Việt Nam ấm, vui và có cảm giác bảng hiệu/mặt tiền. Không dùng phong cách dashboard SaaS, glassmorphism, gradient lạnh hoặc card chồng card.

CTA chính trên trang khách là **Đặt qua Xanh SM Ngon**. CTA trong hero là hành động chính; CTA ở navigation chỉ là bản tiện ích khi khách đã cuộn.

## 2. Nguồn sự thật kỹ thuật

| Hạng mục | Nguồn chuẩn |
| --- | --- |
| Token Tailwind/shadcn và CSS trang khách | `src/styles.css` |
| Markup trang khách | `src/views/menu.tsx` |
| Dữ liệu/menu/theme | `src/lib/catalog.ts`, `src/lib/menu-data.ts`, `src/lib/public-menu.ts` |
| Logo mặc định | `public/xao-mi-logo.jpg` |
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
- Wordmark `Xào Mì!`: Baloo 2, weight `800`, tracking `-0.035em`, kem `#fff4d8`, bóng đỏ rượu lệch xuống-phải. Đây là một treatment logo, không áp dụng bóng chữ này cho heading khác.
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
| Hero/panel lớn | 32–48px radius | storefront và panel thông tin |

Chỉ dùng bo lớn ở mặt tiền, panel hero và category. Không bọc mọi text bằng pill hoặc card.

### Độ sâu

- Menu/category: border caramel hoặc divider nét đứt, không cần shadow lớn.
- Hero: viền đỏ sẫm + chân đế đỏ sẫm 6–8px và một bóng mềm thấp.
- CTA Xanh: viền xanh đậm + bóng đế ngắn. Đây là yếu tố nâng lên duy nhất trong hero.
- Không kết hợp đồng thời border cứng, shadow lớn và nền đậm cho cùng một panel trừ storefront.

## 4. Trang khách

### 4.1 Khung trang

```text
canvas kem + pattern doodle nhẹ
└─ max-width 68rem
   ├─ storefront hero
   ├─ sticky navigation: nền tảng + CTA tiện ích
   ├─ category filters
   └─ menu content: title/search → category boards → dish rows
```

- Container hero/menu dùng cùng mép ngang: `max-w-6xl`/68rem với padding `16px` mobile, `32px` desktop.
- Nền chỉ là pattern line-art rất nhạt. Sticker nằm ngoài category, không chen vào thông tin món.
- Default root mở Xanh SM Ngon; `/menuquan` là menu quán riêng. Không phục hồi tab “Menu quán” vào root.

### 4.2 Storefront hero

Nguồn tham chiếu là banner “Xào Mì! Vietnamese Noodle Banner”. Dùng ngôn ngữ tạo hình của ảnh, **không dùng đĩa mì lớn** vì không có asset phù hợp và sẽ làm hero nặng/nhòe ở mobile.

#### Hình học desktop (từ 896px)

```text
┌──────────────────────── striped awning ────────────────────────┐
│  [logo]  Xào Mì!                         ┌─ cream order panel ┐ │
│          yellow brush                    │ [turquoise CTA]    │ │
│          Mì nóng, nước mát.              │ Maps │ hours       │ │
│                                            │ Zalo              │ │
└────────────────────────────────────────────────────────────────┘
```

- Hero: rộng tối đa `68rem`; viền 2px, đáy 8px; radius `32px 32px 48px 48px`.
- Mái hiên: cao khoảng 13–15% hero; sọc kem/đỏ bằng nhau; nếp scallop và bóng đổ thuộc `StorefrontAwning`.
- Grid desktop: brand : info là `1.02 : 0.98`, gap `20px`. Không dùng tỷ lệ cũ khiến panel phải hẹp.
- Hero không có ảnh đĩa mì nên chiều cao desktop chỉ đủ cho brand và panel; không mở rộng để tạo khoảng đỏ rỗng.
- Brand lockup căn giữa theo trục dọc. Logo mặc định 128–160px desktop; wordmark là trọng tâm trái, slogan thấp hơn brush vàng.
- Nền đỏ là gradient/vignette ấm; doodle nếu có phải opacity thấp và nằm sau text.

#### Hero panel

- Panel ngoài: kem sáng, radius không đối xứng mềm `48px 48px 38px 44px`, padding 10–14px, viền kem sáng.
- CTA: pill xanh ngọc full-width, cao tối thiểu 48px; text `Đặt qua Xanh SM Ngon`, icon external. Giữ link thật tới `channels.xanh.url` và tracking event `xanh`.
- Khối thông tin bên dưới là **một surface chung**, không phải ba card:
  - hàng trên: Google Maps | Giờ mở cửa, divider dọc;
  - hàng dưới: Zalo, divider ngang;
  - Maps/Zalo là anchor toàn hàng/ô; giờ mở cửa là thông tin tĩnh.
- Label mờ hơn value; Maps/điện thoại/giờ dùng đỏ gạch. Nút `Nhắn Zalo` là nút phụ vàng nhỏ, không cạnh tranh CTA xanh.
- Chỉ dùng `Google Maps`, không render lại địa chỉ dài trong hero. URL Maps và Zalo lấy từ cấu hình/code hiện có.

#### Mobile và tablet (dưới 896px)

1. Brand lockup.
2. CTA Xanh full-width.
3. Maps.
4. Giờ mở cửa.
5. Zalo.

- Hero chuyển một cột, không ép hai cột co lại.
- Maps và giờ có divider ngang; thời gian luôn không xuống hàng trong cùng một dải.
- Body text tối thiểu 16px; cỡ nhãn có thể 13–14px.
- `min-w-0` ở mọi child flex có text; icon/logo/sticker `shrink-0`.

### 4.3 Navigation và filters

- `menu-navigation` sticky, nền trùng canvas khi stuck; không dùng backdrop hoặc dải màu khác khiến nền bị cắt.
- Tab nền tảng: `Xanh SM Ngon`, `GrabFood`, `beFood`; selected state lấy đúng màu platform.
- CTA navigation là bản tiện ích nhỏ hơn CTA hero. Khi navigation chưa sticky nó là outline/tint; khi sticky mới có fill xanh.
- Filter category là chip có selected state rõ bằng `aria-pressed`; không dùng badge trang trí không có ý nghĩa.

### 4.4 Menu boards và món

- Heading category: dải vàng sọc nhẹ, icon tròn đỏ, count ở bên phải.
- Category board: nền kem sáng + một viền caramel; không thêm card con cho từng món.
- Desktop từ `sm`: grid hai cột. Mobile: một cột.
- Dish row: ảnh 68px mobile/80px desktop, tên đậm, tag thật (bán chạy/nên thử/món mới), mô tả tối giản, giá tabular. Divider đứt chỉ tách món cùng board.
- Sticker category chỉ nằm ở mép/corner, không che tên category, count, giá hoặc ảnh món.
- Nếu link rời site (Grab/be/Xanh/Maps/Zalo), dùng `ArrowUpRight`; không dùng arrow external cho thao tác nội bộ.

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

- [ ] CTA Xanh trong hero là yếu tố màu mạnh nhất.
- [ ] Hero không có khoảng đỏ trống lớn khi không dùng ảnh món.
- [ ] Maps, giờ mở cửa, Zalo không overflow ở 360px và desktop.
- [ ] Tab/filter sticky không che nền hoặc nội dung lúc scroll.
- [ ] Sticker không che text, count, CTA hay ảnh món.
- [ ] Default và mỗi theme seasonal vẫn cùng hierarchy/menu density.
- [ ] `/menuquan`, `/`, `/admin` build thành công; link Maps, Zalo, Xanh và tracking vẫn hoạt động.
