# Việc vặt kiếm tiền và đi bộ trên vỉa hè

## Đường, vỉa hè và giao thông (`src/walkways.ts`, `src/traffic.ts`)

- Lòng đường rộng gấp 1,4 lần bản phác (`ROAD_SCALE`), vỉa hè 28px mỗi bên (`SIDEWALK` trong `mapLayout.ts`); nhà tự lùi vào để không chạm vỉa hè.
- Đi được trên vỉa hè, bãi cỏ, lối lát gạch và sân lát. **Lòng đường bị chặn, chỉ sang đường ở vạch kẻ ngựa vằn** (gần ngã ba và cách quãng 220–300px trên mọi tuyến). Nhân vật giữ cách mép đường 7px để không lấn xuống lòng đường.
- Va chạm, hình vẽ và bản đồ dùng chung một lưới (ô 4px).
- Chỉ đường: mũi tên vàng và chấm vàng dưới chân đi theo tuyến hợp lệ (qua vạch kẻ), khoảng cách là quãng đường đi thật; bản đồ vẽ tuyến màu đỏ.
- Giao thông: 22 người đi bộ qua lại trên vỉa hè; 18 xe máy/ô tô chạy làn bên phải trên các đường lớn, quay đầu ở cuối đường và **dừng lại khi có người đang đứng trên đường phía trước** (đang qua vạch).
- Vườn ghế đá cũ nằm đè lên đường đã được dời sang bãi cỏ cạnh sân chơi của Nam.

## Việc vặt (`src/sidejobs.ts`, `src/JobsPanel.tsx`, phím **K**)

Nhận việc ở **Bảng việc vặt khu phố** (cạnh nhà mình), 06:30–19:30, mỗi lần một việc. Việc phải xong chương trình học/lời hứa trong ngày trước (dùng chung `activityLock`).

| Việc | Cách làm | Tiền công | Rủi ro |
|---|---|---|---|
| Giao hàng (3 việc/ngày) | Đến nơi lấy hàng → nhấn E ở vòng xanh → mang đến nơi nhận → nhấn E | 5.000–25.000đ theo quãng đường, hàng dễ vỡ +2.000đ | Trễ hạn chỉ được một nửa; hàng dễ vỡ mà chạy (Shift) quá 4 giây sẽ vỡ, đền nửa tiền công (không đủ tiền thì quan hệ −4) |
| Phát tờ rơi (1 việc/ngày) | Lấy tờ rơi ở quán anh Tú, nhét vào 5 nhà đánh dấu xanh | 2.000đ/nhà + 4.000đ thưởng nếu đúng hạn 90 phút | Trễ hạn mất thưởng |
| Nhặt ve chai | Đi ngang chai/lon trên vỉa hè (06:00–20:00) là tự nhặt, 14 món/ngày; túi chứa 8 (ba lô: 16) | Bán cho bà Tư ở Chợ Rừng 06:00–18:00, giá 500–1.500đ/món đổi mỗi ngày | Giữ lại chờ giá có thể gặp giá thấp hơn |

Bỏ việc: quan hệ −2. Bỏ dở quá 6 tiếng sau hạn (hoặc sang ngày mới khi chưa lấy hàng): quan hệ −3. Xong đúng hạn: XP, Kỷ luật, Danh tiếng, quan hệ với người giao việc tăng. Mọi khoản thu/đền đi qua `transact` nên có trong lịch sử giao dịch.

## Xe cộ và đồ dùng để tích góp

| Món | Giá | Nơi bán | Tác dụng |
|---|---|---|---|
| Ba lô to | 120.000đ | Tạp hóa | Túi ve chai 16 món |
| Đồng hồ đeo tay | 250.000đ | Chợ Rừng | +20 phút mỗi chuyến giao |
| Xe chòi chân | 300.000đ | Chợ Rừng | Nhanh hơn 12% |
| Xe trượt scooter | 550.000đ | Chợ Rừng | Nhanh hơn 20% |
| Xe đạp trẻ em | 1.000.000đ | Chợ Rừng | Nhanh hơn 30% |
| Xe đạp địa hình (10 tuổi) | 2.500.000đ | Chợ Rừng | Nhanh hơn 40% |
| Xe đạp điện (14 tuổi) | 9.000.000đ | Chợ Rừng | Nhanh hơn 60% |
| Xe máy (18 tuổi) | 25.000.000đ | Chợ Rừng | Nhanh hơn 80% |

Tốc độ lấy theo xe nhanh nhất đang có. Tất cả đều đặt được làm mục tiêu tiết kiệm trong Ví (V); bảng việc vặt hiện tiến độ tích góp (tiền mặt + ống heo).

## Lưu trữ

`state.jobs` lưu cùng save `quang-yen-save-v1`; save cũ được thêm giá trị mặc định. Vị trí lưu cũ nằm trên cỏ/lòng đường sẽ đưa về trước cửa nhà.
