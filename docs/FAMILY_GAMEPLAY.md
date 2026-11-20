# Công việc và dòng tiền gia đình

Module giáo dục tài chính trong bối cảnh game, dùng số tiền cân bằng cho gameplay; không phải dữ liệu thu nhập hoặc giá sinh hoạt thực tế ở Quảng Yên.

## Chơi

- Nói chuyện với mẹ trong nhà: xem nghề may, chơi phối màu ba lượt, nhận nhiệm vụ mua đồ và xem sổ gia đình.
- Gặp bố ở bàn mộc gần khu nhà: học tính phần tiền còn lại sau vật liệu, chọn đơn bình thường hoặc nhận thêm đơn buổi tối. Bàn mộc đặt trên đất trống, tránh lòng đường.
- Phím **F**, nút **Gia đình**, thẻ số tiền ở góc trái hoặc đến cạnh sổ trong nhà và nhấn **E**: mở sổ gia đình.
- Trong **Ngày hôm nay**, xem tiền khách trả, vật liệu, sinh hoạt và phần còn lại. Xin tiền tiêu vặt, chuyển quỹ dự phòng, cân nhắc đồ chơi hoặc sửa xe.
- **Sổ thu – chi** ghi giao dịch thật, số dư sau mỗi giao dịch, phân biệt thu nhập / chi tiêu / chuyển tiền / khoản còn chờ.
- **Ba hũ của bé**: tiền chi tiêu, tiết kiệm và chia sẻ. Chuyển từng 5.000đ, có thể lấy lại. Hũ chia sẻ chưa tự động tặng cho người khác; mục tiêu tiết kiệm 30.000đ chỉ đánh dấu tiến độ, không tiêu mất tiền.

## Quy tắc mô phỏng

Ví gia đình bắt đầu 500.000đ, quỹ dự phòng 100.000đ. Tiền riêng của bé tách biệt. Save cũ được thêm module tại ngày hiện tại, không tự truy thu toàn bộ ngày đã chơi.

Ngày làm việc bình thường: bố thu 300.000đ, vật liệu 100.000đ; mẹ thu 180.000đ, vật liệu 60.000đ. Chi sinh hoạt 250.000đ/ngày. Ngày thứ 2 trong chu kỳ bốn ngày mẹ ít đơn: thu 140.000đ, vật liệu 50.000đ. Mỗi ngày thứ 7 bố mẹ nghỉ, chi sinh hoạt vẫn tiếp tục.

Tiền công và các khoản sinh hoạt được ghi một lần lúc 18:00 hoặc khi ngủ bỏ qua phần còn lại của ngày. Bố mẹ làm tự động, bé không phải làm nhiệm vụ để gia đình có thu nhập. Hoạt động cùng bố mẹ tối đa một lần mỗi người/ngày làm việc, 15 phút game và 5 năng lượng. Bé không vận hành máy may hoặc dụng cụ mộc.

Phối màu cùng mẹ làm đơn tăng 20.000đ. Học tính vật liệu cùng bố giúp đơn tiết kiệm 10.000đ gỗ. Đơn thêm của bố thu thêm 80.000đ nhưng tốn thêm 20.000đ vật liệu, chỉ còn 60.000đ và giảm 10 điểm nghỉ ngơi. Ngày thường hồi 2, ngày nghỉ hồi 12, giới hạn 0–100. Đây là lựa chọn để quan sát đánh đổi tiền và thời gian nghỉ, không phải điều kiện bắt buộc.

Tiêu vặt 10.000đ/ngày chuyển từ ví gia đình sang tiền của bé, không tạo tiền mới. Đồ chơi 50.000đ là mong muốn, mua tối đa một lần/ngày. Mỗi ngày chia hết cho 3 có lựa chọn sửa xe 70.000đ. Chưa có hệ thống xe bị hỏng hoặc trì hoãn gây hậu quả; đây là tình huống phân biệt khoản cần và khoản muốn, chưa phải nhiệm vụ xe hoàn chỉnh.

Nếu chi thiết yếu thiếu tiền, hệ thống dùng quỹ dự phòng, rồi ghi phần chưa thanh toán; ví không âm. Thu nhập ngày tiếp theo ưu tiên trả phần còn chờ, không tính lãi. Chuyển quỹ không được tính là thu nhập hoặc chi tiêu. Bé có thể xem đầy đủ các dòng chuyển tiền trong sổ.

Tiền 20.000đ mẹ giao mua sữa/bánh mì được giữ riêng khỏi khả năng chi tiêu cá nhân. Không bỏ tiền đó vào hũ hoặc mua bánh ăn riêng. Khi giao hàng, phần tiền thừa được trả mẹ, sau đó quà 5.000đ lấy từ ví gia đình. Nhiệm vụ mua đồ cũ đang dở từ trước cập nhật vẫn được tiếp tục, không truy thu tạm ứng cũ.

## Kiểm tra

`tests/family.test.ts` kiểm tra kết sổ một lần, lợi nhuận sau vật liệu, ngày ít đơn/ngày nghỉ, thiếu tiền, dùng dự phòng, nhận thêm đơn, giới hạn hoạt động, tạm ứng/tiền thừa, ba hũ và tương thích save. Chưa kiểm thử trực tiếp toàn bộ giao diện và hoạt động trong trình duyệt.
