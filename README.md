# Xào Mì!

Next.js App Router hiển thị Menu quán, GrabFood, beFood và Xanh SM Ngon. Chủ quán có thể sửa Menu quán, duyệt đồng bộ từng nền tảng và lên lịch giao diện trong `/admin`.

## Chạy thử

Cài Node.js 24 và pnpm, sau đó chạy:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Mở `http://localhost:3000`. Khi chưa có `DATABASE_URL`, trang khách dùng dữ liệu có sẵn trong mã nguồn và admin chưa thể lưu thay đổi.

## Cấu hình lưu dữ liệu và deploy

Website đặt món của quán cần team Vercel Pro hoặc Enterprise theo [quy định sử dụng thương mại của Vercel](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage).

1. Chạy `pnpm run typecheck` và `pnpm run build`. Đăng nhập bằng `pnpm dlx vercel login` rồi chạy `pnpm dlx vercel link` để liên kết project. Có thể deploy trực tiếp từ thư mục hiện tại. Dùng Node.js 24. Vercel Functions chạy ở Singapore, cùng khu vực với cơ sở dữ liệu Neon hiện tại.
2. Trong **Settings → Environment Variables**, thêm `DATABASE_URL` cho Production. Dùng chuỗi kết nối Neon hiện tại để giữ menu, giá và lịch đã lưu. Chạy `schema.sql` qua kết nối trực tiếp khi khởi tạo hoặc nâng cấp cơ sở dữ liệu. Có thể chạy lại file này vì các bảng hiện có được giữ nguyên.
3. Đặt `ADMIN_PASSWORD` ít nhất 12 ký tự và `AUTH_SECRET` bằng chuỗi ngẫu nhiên riêng ít nhất 32 ký tự. Đặt các giá trị dưới dạng biến nhạy cảm. Khi chạy local, dùng `.env.local` theo `.env.example`.
4. Để bật tải ảnh trong admin, tạo một Vercel Blob store **Public** và kết nối với project để cấp `BLOB_READ_WRITE_TOKEN` cho Production.
5. Chạy `pnpm dlx vercel deploy --prod`. Mở URL `vercel.app` để kiểm tra trang khách và đăng nhập `/admin`. Mục **Giao diện → Lên lịch theo mùa** hiển thị các lịch đã lưu theo giờ Việt Nam.
6. Khi có tên miền riêng, thêm trong **Settings → Domains** của project rồi trỏ DNS theo hướng dẫn Vercel.

## Thống kê trang khách

Trong `/admin → Thống kê`, chọn 7, 30 hoặc 90 ngày để xem lượt mở thực đơn và lượt bấm đặt món qua Zalo, GrabFood, beFood và Xanh SM Ngon. Số liệu được cộng theo ngày Việt Nam từ lúc bật tính năng. Lượt bấm đo thao tác mở kênh đặt món.

Báo cáo tương tác có lượt đổi tab, chọn danh mục, lượt tìm có hoặc không có kết quả, chỉ đường, xem giá trên GrabFood, vị trí bấm Zalo và các mốc cuộn trang 25%, 50%, 75%, 100%. Tìm kiếm được tính khi có ít nhất hai ký tự và khách dừng nhập 600 ms. Mỗi mốc cuộn được tính tối đa một lần mỗi lượt mở trang, khi đang xem thực đơn chưa lọc.

Bảng `menu_tracking_daily` lưu ngày, môi trường, sự kiện và tổng lượt. Local ghi nhận thao tác trên trang khách kể cả khi đang đăng nhập admin để tiện thử. Vercel Production có số liệu riêng và loại thao tác của phiên admin. Bản xem thử giao diện được loại ở cả hai môi trường. Bấm **Làm mới** trong mục Thống kê để tải các lượt vừa ghi nhận.
