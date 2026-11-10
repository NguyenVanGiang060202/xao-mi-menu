# Thiết kế website menu của quán

## Phạm vi bản đầu

Giả định website phục vụ một quán, một chi nhánh và một chủ quán quản trị. Trang chủ ưu tiên điện thoại, mặc định mở **Menu quán**, hiển thị món theo nhóm, tên, ảnh nếu có, giá VND và trạng thái còn/hết món. Có bốn mục riêng cho GrabFood, ShopeeFood, beFood và Xanh SM Ngon (hiểu là GreenSMFood trong yêu cầu). Mỗi mục hiện menu riêng nếu đã nhập dữ liệu, kèm nút mở đúng gian hàng. Nếu chỉ có link thì hiện nút mở nền tảng để xem menu và đặt món.

Giá trên từng nền tảng độc lập với giá tại quán. Món trùng tên có thể có giá hoặc size khác nhau. Menu nền tảng hiện ngày cập nhật và ghi “Xem giá và ưu đãi hiện tại trên ứng dụng”. Khách đặt hàng qua link của từng nền tảng.

## Kiến trúc chạy trên Vercel

| Thành phần | Lựa chọn |
| --- | --- |
| Web và backend | Next.js App Router, TypeScript, Tailwind CSS. Dùng Server Components đọc dữ liệu, Server Actions cho thao tác admin, Node.js runtime cho tác vụ server. |
| Dữ liệu | Postgres của Neon qua Vercel Marketplace, Drizzle ORM và migrations SQL. Neon là dịch vụ DB quản lý, kết nối từ Vercel Dashboard. |
| Ảnh nền | Vercel Blob public. DB giữ URL và màu nền dự phòng. |
| Đăng nhập | Auth.js với Google OAuth. Chỉ cấp quyền cho tài khoản chủ quán nằm trong danh sách cho phép và có email đã xác minh. |
| Lịch đồng bộ | Vercel Cron sau khi xác nhận nguồn được phép đọc. MVP dùng nhập tay hoặc CSV. |

Frontend, backend và tác vụ theo lịch cùng chạy trong một project Vercel. Dùng Vercel Pro cho website kinh doanh của quán vì Hobby dành cho sử dụng cá nhân phi thương mại. Chi phí có thể gồm gói Vercel, mức sử dụng Blob/Functions và gói Neon. [Vercel Hobby](https://vercel.com/docs/plans/hobby) · [Postgres qua Marketplace](https://vercel.com/docs/postgres) · [Vercel Blob](https://vercel.com/docs/vercel-blob)

## Routes và dữ liệu

| Route | Chức năng |
| --- | --- |
| `/` | Menu công khai. Có thể dùng `?source=grabfood` để chia sẻ thẳng từng nguồn. |
| `/admin` | Đăng nhập, thêm/sửa/ẩn món của quán, cập nhật giá và trạng thái, đổi ảnh/màu nền, xem trước trước khi lưu. |
| `/admin/sources` | Cấu hình link từng gian hàng, nhập CSV cho từng nền tảng, xem trước chênh lệch và xác nhận công bố. |
| `/api/auth/[...nextauth]` | Callback đăng nhập. |
| `/api/cron/sync` | Giai đoạn sau. GET nội bộ, kiểm tra `Authorization: Bearer <CRON_SECRET>` trước khi chạy. |

| Bảng | Các trường chính |
| --- | --- |
| `menu_sources` | `id`, `key` duy nhất (`house`, `grabfood`, `shopeefood`, `befood`, `xanhsm`), `store_url`, `enabled`, `last_published_at`. |
| `menu_items` | `id`, `source_id`, `item_key`, `category`, `name`, `description`, `price_vnd`, `image_url`, `availability`, `sort_order`, `updated_at`. Khóa duy nhất `(source_id, item_key)`. Giá là số nguyên VND không âm. Dùng mã ổn định riêng cho từng size nếu có giá riêng. |
| `site_settings` | Một hàng chứa tên quán, `background_url`, `background_color`, `updated_at`. |
| `sync_runs` | Khi tích hợp tự động: nguồn, thời điểm chạy, kết quả, số dòng thêm/sửa/ẩn và mã lỗi. |

CSV UTF-8 cho từng nguồn gồm `item_key,category,name,price_vnd,availability,description`. Admin chọn nguồn trên giao diện. Trước khi lưu, báo dòng trùng mã, thiếu tên hoặc sai giá. Chế độ mặc định cập nhật/thêm các mã có trong file. Khi nhập toàn bộ thực đơn, hiển thị các món sẽ bị ẩn và yêu cầu xác nhận trước khi thay thế. Lưu một lần trong transaction, sau đó làm mới trang công khai. Giá menu quán chỉ được sửa qua thao tác của admin cho nguồn `house`.

Kiểm tra quyền ở server cho mọi thao tác ghi và upload. Ảnh nền nhận JPEG/PNG/WebP, tối đa 3 MB, xác minh định dạng theo nội dung. Upload với tên mới rồi mới đổi URL trong DB. Nếu bước lưu DB lỗi, dọn file mới và giữ ảnh đang dùng. Kiểm tra URL đặt món thuộc đúng nền tảng. Render nội dung menu dưới dạng văn bản và giữ khóa DB/Blob trong biến môi trường server.

## Theme theo mùa và sự kiện

Trong `/admin`, thêm mục **Giao diện** để chỉnh theme mặc định và tạo theme sự kiện từ preset Noel, Tết dương lịch hoặc Tết Nguyên đán. Mỗi theme có tên, ảnh nền phần đầu trang, màu nền dự phòng, màu nhấn và lời chào tùy chọn. Ảnh được tải lên Vercel Blob theo cùng quy tắc kiểm tra với ảnh nền. Cho phép xem trước bản nháp ở chiều rộng mobile và PC trước khi công bố.

Admin có thể áp dụng ngay, đặt thời gian bắt đầu/kết thúc hoặc tắt theme sự kiện. Hiển thị và nhập lịch theo giờ Việt Nam, lưu thời gian trong Postgres dưới dạng `timestamptz`. Chặn lịch trùng giữa các theme đã công bố. Tính theme hiệu lực theo thời gian trên server khi tải trang, với khoảng bắt đầu bao gồm và kết thúc loại trừ. Sau khi hết lịch hoặc tắt sự kiện, trang quay về theme mặc định. Bản đầu đọc theme ở mỗi yêu cầu để lịch có hiệu lực mà không cần cron hay deploy lại.

Thêm bảng `site_themes` lưu `id`, `name`, `background_url`, `background_color`, `accent_color`, `greeting`, `starts_at`, `ends_at`, `status` và `updated_at`. `site_settings` giữ ID theme mặc định. Kiểm tra lịch và lưu trong một transaction. Bản nháp chỉ hiện trong admin. Khi thêm tính năng vào app đã có dữ liệu, tạo theme mặc định từ ảnh và màu nền hiện tại.

Theme áp dụng cho cả Menu quán, GrabFood và beFood. Trên mobile, giữ tab chọn nguồn dễ chạm và nút mở app ở cuối màn hình. Trên PC, dùng cùng ảnh đầu trang, với menu bên trái và voucher bên phải. Giữ danh sách món trên nền đơn sắc và kiểm tra độ tương phản của chữ, giá và nút khi đổi màu.

## Kiểm tra link thực tế của quán

Kiểm tra HTTP từ máy làm việc ngày 09/11/2026. ShopeeFood tạm bỏ khỏi phạm vi triển khai hiện tại.

| Nguồn | Kết quả |
| --- | --- |
| beFood | Link chuyển đến trang web **Xào Mì - Đường Số 2**, ID gian hàng `153593`. HTTP 200. HTML trả về có dữ liệu tên, mã món, giá hiện tại và giá cũ. Ví dụ `14109307` Mì xào bò 60.000 ₫, `14109308` Mì xào bò trứng 65.000 ₫. Đây là nguồn ưu tiên thử adapter HTTP sau khi xác nhận quyền dùng lại dữ liệu. Cần kiểm tra đủ danh mục, trạng thái bán và độ ổn định từ Vercel trước khi bật cron. [Trang menu beFood](https://food.be.com.vn/ho-chi-minh/xao-mi-duong-so-2-153593) |
| GrabFood | Mở link gốc trong trình duyệt, chờ tải xong và xác nhận menu web của **Xào Mì! - Nguyễn Duy Trinh** (merchant ID `5-C8KGJLKAN3UEEE`) hiển thị tên, nhóm món và giá. Bốn nhóm chính hiện 14 món, chưa tính các mục gợi ý/ưu đãi lặp lại món. Ví dụ mì xào bò 70.000 ₫, giá ưu đãi hiển thị 63.000 ₫. Khi đi theo URL chuyển hướng web bằng HTTP trực tiếp, máy thử nhận 403. Có thể đọc dữ liệu đã render trong trình duyệt, còn khả năng chạy tự động từ Vercel chưa được kiểm chứng. Giữ link đặt món và dùng CSV hoặc nguồn đối tác cho MVP. [Link GrabFood](https://app.grab.com/s/e1LKbfi0) |
| Xanh SM Ngon | Link chuyển tới App Store trong phép thử HTTP desktop. Chưa lấy được ID gian hàng hoặc menu. Dùng làm link mở ứng dụng và đối chiếu đích đến trên điện thoại trước khi công bố. [Link Xanh SM Ngon](https://xanhsmngon.onelink.me/14WJ/jkt91awj) |

Hai gian hàng trả về tên chi nhánh khác nhau. Xác nhận đây là các gian hàng muốn hiển thị và giữ nguyên nhãn từng chi nhánh. Khi đọc beFood, chỉ lấy dữ liệu danh mục của gian hàng mục tiêu và khử trùng theo mã món vì HTML có thể lặp dữ liệu cho các phần hiển thị khác nhau. Giữ giá hiện tại và giá cũ riêng nếu hiển thị ưu đãi.

## Dựng lại menu và hiển thị ưu đãi

- **GrabFood:** Có thể dựng bản menu ban đầu từ 14 món nhìn thấy trong bốn danh mục chính trên web. Nhập CSV từ bản đối chiếu của quán. Bỏ các bản lặp trong Today's Offer và For You, giữ giá gốc và giá ưu đãi nếu cùng xuất hiện. Ví dụ mì xào bò từ 70.000 ₫ còn 63.000 ₫. Trang công khai đã xem hiển thị ưu đãi từng món. Chưa xác minh được mã voucher hoặc điều kiện áp dụng cho đơn hàng.
- **beFood:** HTML công khai chứa 10 mã món riêng biệt có cả tên và hai trường giá, trong đó có 6 combo có giá hiện tại thấp hơn giá cũ. Ví dụ mì xào bò + trà đào từ 80.000 ₫ còn 72.000 ₫. Dữ liệu cũng có cờ ưu đãi chung của gian hàng, nhưng lần kiểm tra chưa tìm được mã voucher, hạn dùng hoặc điều kiện đủ để hiển thị như voucher của đơn hàng.
- **Xanh SM Ngon:** Giữ nút mở ứng dụng. Để dựng menu hoặc nhập voucher, cần bản menu và ưu đãi từ cổng đối tác, ảnh chụp hoặc đường dẫn mở được trang gian hàng.

### Giờ mở cửa và nhóm món

- **GrabFood · Nguyễn Duy Trinh:** Trang hiển thị giờ trong ngày kiểm tra là 09:00–23:59. Chưa xác minh lịch theo tuần. Nhóm chính gồm Combo, Mì xào, Mì trộn và Đồ uống. Các mục gợi ý và ưu đãi có thể lặp món.
- **beFood · Đường Số 2:** Lịch trên trang ghi thứ Hai–thứ Sáu 09:00–23:59, thứ Bảy–Chủ nhật 18:00–23:59. Nguồn có nhóm Menu và Món phải thử. Giữ nhóm gợi ý riêng để tránh đếm lặp.

Hiển thị giờ và nhóm theo nguồn đang chọn trên mobile lẫn PC. Lưu lịch theo gian hàng, ngày trong tuần, giờ mở/đóng và múi giờ `Asia/Ho_Chi_Minh`. Nếu chỉ có giờ trong ngày, lưu kèm ngày xác minh và không suy ra lịch cả tuần. Với Menu quán, cho admin nhập giờ và nhóm riêng.

### Logo và ảnh món

- **beFood:** Trang có ảnh đại diện và ảnh bìa của gian hàng. HTML công khai chứa URL `item_image` gắn với mã món, nên có thể nhập ảnh cùng menu. [Trang beFood](https://food.be.com.vn/ho-chi-minh/xao-mi-duong-so-2-153593)
- **GrabFood:** Link chia sẻ có ảnh đại diện khi chia sẻ. Trang đã render có URL ảnh món trên `huawei-food-cms.grab.com`. Luồng lấy HTML trực tiếp từng trả 403. [Trang GrabFood](https://app.grab.com/s/e1LKbfi0)

Thêm `logo_url` vào `site_settings` và ô tải logo lên Blob trong `/admin`. Hiện logo một lần cạnh tên Xào Mì ở đầu trang. Ảnh đại diện hoặc ảnh chia sẻ của nền tảng cần được đối chiếu trước khi dùng làm logo. Dùng `menu_items.image_url` cho ảnh thu nhỏ cạnh món, nhập ảnh quán có quyền sử dụng.

Chủ quán cung cấp logo chính thức. Với ảnh món, có thể lấy ảnh đã xác nhận từ một kênh và dùng chung cho cùng món ở Menu quán, GrabFood và beFood. Ưu tiên lấy từ beFood vì URL ảnh có sẵn cùng mã món trong HTML. Dùng ảnh GrabFood đã xác nhận để bổ sung món chỉ có ở đó hoặc thiếu ảnh ở beFood. Ví dụ có thể đối chiếu Mì xào bò, Mì xào bò trứng và combo Mì xào bò + trà đào giữa hai kênh.

Trong admin, chọn một ảnh dùng chung rồi gắn với mã món của từng nguồn sau khi kiểm tra đúng món, size và thành phần combo. Giữ riêng giá và thông tin bán theo từng kênh. Dùng URL Blob chung cho ảnh được phép đăng lại. Món chưa ghép được ảnh hiển thị tên và giá theo bố cục gọn.

### Giá giảm từng món và voucher đơn hàng

Thêm `original_price_vnd` tùy chọn vào `menu_items`. Chỉ hiện giá gạch ngang khi giá gốc đã xác minh lớn hơn giá hiện tại. Ghi ngày kiểm tra giá và phân biệt khuyến mãi món với voucher tại checkout.

Tạo bảng `vouchers` với `id`, `source_id`, `title`, `code` (có thể để trống nếu tự áp dụng), `terms`, `min_order_vnd`, `max_discount_vnd`, `starts_at`, `ends_at`, `verified_at`, `enabled` và `source_url`. Mỗi voucher gắn với đúng gian hàng. Hiển thị mã, mức giảm, điều kiện đã xác minh và nút mở app. Ẩn khi quá hạn. Khi thiếu thời hạn hoặc điều kiện quan trọng, giữ ở trạng thái nháp để admin kiểm tra. Các điều kiện về tài khoản, địa chỉ, phương thức thanh toán hoặc lượt dùng được kiểm tra trên app khi đặt.

Trong MVP, cho phép nhập/sửa voucher trong `/admin/sources`. Trang công khai chỉ render mục Voucher khi nguồn đang chọn có ít nhất một voucher đã xác minh và đang hiệu lực. Ẩn cả khối trên mobile và PC nếu danh sách rỗng. GrabFood và beFood hiện đều ẩn khối này. Giá giảm đã đối chiếu vẫn hiển thị ngay trên món. Khi đồng bộ món, giữ nguyên voucher đã nhập và quản lý vòng đời voucher riêng.

## Khảo sát ban đầu về crawl GrabFood và ShopeeFood

Phần này ghi lại khảo sát các trang công khai mẫu và tài liệu tích hợp trước khi nhận link thực tế. Chưa chạy thử adapter từ Vercel Function.

| Nguồn | Quan sát và hướng triển khai |
| --- | --- |
| GrabFood | Trang chủ công khai xem được, nhưng truy xuất một trang danh mục Đồng Nai trong công cụ khảo sát trả HTTP 403. Mẫu đó chưa chứng minh có thể lấy tên và giá từng món bằng HTTP từ Vercel. Điều khoản người dùng Grab giới hạn việc dùng crawler và khai thác nội dung tự động. Grab có API cho đối tác, nhưng tài liệu đồng bộ menu mô tả thao tác cập nhật và kiểm tra trạng thái đồng bộ. Cần hỏi GrabMerchant/POS xem tài khoản của quán có quyền **đọc menu đang bán** hoặc xuất file và công bố lại trên web riêng hay không. [Trang mẫu](https://food.grab.com/vn/vi/dong-nai/dishes/tr%C3%A0-s%E1%BB%AFa-delivery/401341) · [Điều khoản Grab](https://www.grab.com/vn/en/terms/consumer/) · [Tích hợp menu Grab](https://merchant.grab.com/vn-vn/blog/tudongdanhdauhethang-api) |
| ShopeeFood | Trang công khai Phúc Long Binconsi trong bản trích xuất có thông tin chi nhánh và khoảng giá chung, thiếu danh sách tên và giá từng món. Có thể dữ liệu món cần bước tải riêng hoặc phụ thuộc ngữ cảnh giao hàng. Tài liệu OpenAPI tìm được thuộc Indonesia, nên cần hỏi Shopee Partner Việt Nam về quyền đọc/xuất menu và phạm vi sử dụng dữ liệu. [Trang mẫu](https://shopeefood.vn/binh-duong/phuc-long-binconsi) · [ShopeeFood OpenAPI Indonesia](https://developer.shopeefood.co.id/vendor/api-docs) |
| beFood | Dùng link đúng gian hàng và dữ liệu do quán nhập trước. Hỏi kênh đối tác về chức năng xuất hoặc API đọc menu. [Đối tác beFood](https://landing.be.com.vn/doitacnhahang) |
| Xanh SM Ngon | Dùng link đúng gian hàng và dữ liệu do quán nhập trước. Xác minh kênh cung cấp file hoặc API với bộ phận hỗ trợ đối tác của quán. |

**Quyết định cho MVP:** chạy menu quán và bốn nguồn với CSV hoặc link đặt món. Với GrabFood và ShopeeFood, ưu tiên file xuất từ công cụ đối tác hoặc API đọc được cấp quyền. Kết quả khảo sát hiện tại chưa đủ để dùng crawler làm nguồn đồng bộ production.

### Thử đồng bộ khi có nguồn được phép

1. Lấy link từng gian hàng, ID chi nhánh, địa chỉ giao mẫu và file/menu chuẩn để đối chiếu. Xác nhận dữ liệu được dùng lại trên website riêng, gồm cả ảnh nếu có.
2. Chạy thử adapter đọc từ một Vercel Function. Kiểm tra tên, danh mục, giá từng size, hết món, phân trang và việc giá thay đổi theo địa chỉ hoặc khuyến mãi. Với 403, yêu cầu đăng nhập hoặc CAPTCHA, dừng đường truy xuất đó và chuyển sang file/API đối tác.
3. Kiểm tra toàn bộ danh sách tên và giá với menu chuẩn của cùng chi nhánh. Chạy lại tại nhiều thời điểm, ghi tỷ lệ khớp, mã lỗi và thời gian chạy. Chỉ bật tự động khi cả danh sách và giá đều khớp ổn định, và xác định được phản hồi đầy đủ.
4. Mỗi lần chạy tạo bản nháp để so sánh. Lỗi, phản hồi rỗng, thiếu trang hoặc giảm số món bất thường thì giữ bản đã công bố và hiện lỗi trong admin. Chặn hai tác vụ đồng thời trên cùng nguồn bằng khóa DB. Công bố trong một transaction, theo khóa nguồn + mã món, rồi làm mới cache. Thử ban đầu mỗi ngày một lần, ví dụ `0 20 * * *` là 03:00 giờ Việt Nam hôm sau. [Vercel Cron](https://vercel.com/docs/cron-jobs)

## Thứ tự build và deploy

1. Tạo repo Next.js, thiết lập schema và seed năm nguồn. Build trang `/` responsive với menu quán và trạng thái chỉ có link.
2. Làm `/admin`, đăng nhập và kiểm tra quyền server. Thêm quản lý món, sửa giá, upload và đổi nền. Làm `/admin/sources` với nhập CSV và xem trước.
3. Import repo lên Vercel. Kết nối Neon và Blob. Cấu hình `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` và `ADMIN_EMAILS` phía server. Tách DB/Blob Preview với Production. Chạy migration cho từng môi trường trước khi phát hành phiên bản dùng schema mới.
4. Dùng `https://<project>.vercel.app` để chạy ngay. Đăng ký callback Google với URL production, dạng `https://<project>.vercel.app/api/auth/callback/google`. Sau khi mua domain, thêm domain trong Vercel, cập nhật DNS theo Dashboard, chờ HTTPS, rồi thêm callback OAuth và cập nhật URL công khai theo domain mới. [Vercel Domains](https://vercel.com/docs/domains)
5. Khi có quyền đọc và vượt qua bước thử ở trên, thêm `CRON_SECRET` vào Production, cấu hình cron trong `vercel.json` và triển khai adapter theo từng nguồn.

## Tiêu chí nghiệm thu MVP

- Khách mở URL `.vercel.app` trên điện thoại, xem được giá menu quán và mở đúng link từng gian hàng đã cấu hình.
- Chủ quán sửa giá hoặc đổi nền và thấy cập nhật trên trang công khai sau khi lưu. Tài khoản ngoài danh sách bị từ chối thao tác ghi kể cả khi gọi trực tiếp.
- Nhập lại cùng CSV không tạo món trùng. File sai hoặc thao tác lưu lỗi giữ nguyên dữ liệu đang công bố. Đổi giá menu quán không đổi giá trên bốn nguồn.
