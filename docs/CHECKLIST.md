# Kiểm chứng bản tuổi thơ

## Đã kiểm tra tự động

- [x] TypeScript và production build.
- [x] Đi từ điểm bắt đầu tới cửa nhà, không xuyên tường.
- [x] Tự chuyển ra phố khi đi vào vùng cửa.
- [x] Khôi phục vị trí lưu nằm ngoài căn phòng hoặc trong đồ đạc.
- [x] Tuyến đi từ nhà tới cửa tạp hóa không bị chặn.
- [x] Tiền, mua đồ, giữ đồ nhiệm vụ, trao thưởng một lần.
- [x] Sinh nhật khi hoàn thành chuỗi truyện 7 ngày; trao quà và mở vườn một lần.
- [x] Save/load và dữ liệu lưu không hợp lệ.
- [x] Tính toán camera vừa phòng ở các cỡ viewport.
- [x] Khu đất chứa trọn nhà, mái, bóng đổ và lối vào; không chạm đường/vỉa hè.
- [x] Các khu đất cách nhau tối thiểu 12 đơn vị, không chồng chéo.

## Cần kiểm tra trực tiếp trong trình duyệt

Các thay đổi chương truyện 7 ngày và 5 môn đã được kiểm tra logic; chưa xác minh trực quan bản mới vì kết nối trình duyệt không khả dụng trong phiên thực hiện.

- [ ] Hình ảnh, camera và thứ tự vẽ sau khi thay bố cục đường.
- [ ] WASD, chạy, E, tự chuyển cảnh và quay lại nhà.
- [ ] Hoàn thành ba nhiệm vụ bằng thao tác người chơi.
- [ ] Hiệu năng, thay đổi kích thước cửa sổ và console.
- [ ] Góc may, bàn mộc, hoạt động cùng bố mẹ và bố cục sổ gia đình.
- [ ] Chuyển cảnh trường/lớp/nhà, mẹ đi kèm và hội thoại an toàn.

## Đi học và an toàn đã kiểm tra logic

- [x] Giờ học, năng lượng, năm bài mỗi buổi và thưởng một lần/ngày.
- [x] Cửa lớp trở ra cổng trường; lối tới góc học tập không xuyên bàn/tường.
- [x] Lưu/tải tiến độ học và trạng thái cần trợ giúp.
- [x] Mẹ đi cùng chặn tình huống đi theo; báo người lớn thưởng một lần.
- [x] Trợ giúp sau tình huống không làm mất sức khỏe, tiền, đồ và nhiệm vụ.

## Dòng tiền gia đình đã kiểm tra logic

- [x] Doanh thu, vật liệu và sinh hoạt được ghi đúng một lần/ngày.
- [x] Ngày ít đơn, ngày nghỉ, nhận thêm đơn và nghỉ ngơi.
- [x] Ví riêng, dự phòng, tạm ứng đi chợ và trả tiền thừa.
- [x] Tiền tiêu vặt theo ngày; ba hũ không tạo thêm tiền.
- [x] Thiếu tiền dùng dự phòng rồi ghi khoản còn chờ, không âm ví.
- [x] Lưu/tải module mới và nâng cấp save cũ.

## Chương truyện và lớp học mở rộng

- [x] Hết việc trước 21:00 vẫn có sinh hoạt lặp lại; từ 18:00 có thể sinh hoạt đến đúng giờ ngủ.
- [x] Thời gian rảnh không tăng tiền/XP/chỉ số hoặc hoàn thành thay nhiệm vụ.
- [x] Tạp hóa đóng cửa: báo mẹ hoãn mua đồ, giữ nguyên tạm ứng và tiếp tục ngày sau.

- [x] Đi xuyên 7 ngày đến sinh nhật, chỉ trao quà một lần và mở vườn.
- [x] Nhiệm vụ chưa xong tiếp tục sau ngày dự kiến; không nhảy chương.
- [x] Nhật ký và HUD cùng nhiệm vụ hiện tại; dữ liệu truyện lưu/tải được.
- [x] Tổng kết khi ngủ/qua nửa đêm, thay đổi quan hệ và việc tiếp theo.
- [x] Nghỉ miễn phí, học bù, tiếp tục bài dở và xin hoãn lời hứa.
- [x] Năm môn, 56 câu; mỗi môn ít nhất 10 câu cơ bản khác nhau, đáp án và giải thích hợp lệ.
- [x] Save cũ có thêm Sử/Địa; không nhận lại tiền sinh nhật tuổi 4 đã có.

## Sinh hoạt hằng ngày và tiền của bé (Sprint 1–2)

Đã kiểm tra tự động (`tests/life.test.ts`):

- [x] Không ngủ được trước 21:00; thông báo nêu đúng giờ trong game.
- [x] Ngủ từ 21:00 sang 06:30 hôm sau, hồi năng lượng; qua nửa đêm vẫn bị chặn.
- [x] Thông báo 21:00 xuất hiện một lần mỗi ngày; lịch ngày học/ngày nghỉ.
- [x] Sau giờ học có ≥3 gợi ý và ≥2 sự kiện động, không tạo trùng.
- [x] NPC trả tiền chỉ khi làm đúng địa điểm, một lần, thưởng theo điểm mini-game.
- [x] Mẹ nhờ đi chợ: nhận ở nhà, làm ở chợ, chi phí thật vào sổ gia đình.
- [x] Mua hàng cần đủ tiền và đứng tại nơi bán; ống heo chỉ dùng ở nhà; chuyển tiền giữ nguyên tài sản ròng.
- [x] Mục tiêu tiết kiệm có tiến độ, giới hạn theo tuổi, mua bằng quỹ tại nơi bán.
- [x] Mọi giao dịch cũ và mới ghi vào lịch sử.
- [x] Chỉ số/quan hệ thay đổi; từ chối và thất hứa có hậu quả; bỏ bữa, nghỉ học, đi muộn bị phạt một lần.
- [x] Lì xì có ba kết quả khác nhau; hội chợ có thể lãi hoặc lỗ.
- [x] Lưu/tải chính xác; save cũ được nâng cấp.

Đã chạy trong Edge headless (dev server): tạo nhân vật, HUD lịch, bảng Hoạt động, Ví tiền, giường từ chối lúc 10:00, nhận lợn đất ở bàn ăn, nhận việc ở nhà cô Hằng và chơi mini-game nhịp (+5.000đ, giao dịch được ghi), thông báo tối. Không có lỗi console. Chưa kiểm tra bằng thao tác tay của người chơi và trên điện thoại.

## Tối ưu cảnh phố

- Bỏ lớp Graphics nền cỏ trùng với tilemap; tilemap chỉ vẽ vùng camera.
- Nhà được rasterize một lần thành hai ảnh đệm (khu đất và thân nhà).
- Tái sử dụng scene trong/ngoài nhà khi chuyển cảnh, giữ nguyên texture đệm.
- Nhà ngoài vùng camera được ẩn; cập nhật vùng thấy được và thứ tự vẽ mỗi 100ms.
- Minimap giữ lại phần SVG tĩnh thay vì dựng lại tất cả nhà mỗi giây.
- Chưa đo FPS trực tiếp trên máy người dùng; các mục này mô tả thay đổi mã, không phải cam kết tốc độ khung hình.

Các bài kiểm tra tự động nằm trong `tests/`. Không coi build và kiểm tra logic là bằng chứng đã kiểm thử hình ảnh trong trình duyệt.

## Vỉa hè và việc vặt

Đã kiểm tra tự động (`tests/walkways.test.ts`, `tests/sidejobs.test.ts`):

- [x] Lòng đường chỉ đi được ở vạch qua đường; vỉa hè và bãi cỏ đi được.
- [x] Người đi bộ ở trên vỉa hè (≥80% thời gian, phần còn lại là đi ngang miệng ngõ), xe chạy trên lòng đường, xe dừng khi có người trên đường phía trước.
- [x] Mọi cửa nhà, NPC, mốc địa danh, bảng việc vặt, điểm giao hàng, nhà phát tờ rơi và ve chai đều nối vào một mạng vỉa hè từ cửa nhà.
- [x] Tuyến nhà → tạp hóa chỉ đi trên lối đi bộ.
- [x] Nhận việc chỉ ở bảng, lấy hàng đúng nơi, trả tiền một lần; trễ hạn nửa tiền; chạy làm vỡ hàng phải đền; tờ rơi có thưởng đúng hạn.
- [x] Ve chai nhặt khi đi qua, giới hạn túi, bán ở chợ theo giá ngày; lưu/tải `state.jobs`.

Đã chạy trong Edge headless: vỉa hè, vạch kẻ, lối đi, bảng việc vặt, nhận việc, mũi tên đi theo vỉa hè, bản đồ vẽ tuyến đi bộ, không lỗi console. Chưa thử hết một chuyến giao hàng bằng bàn phím thật và chưa thử trên điện thoại.
