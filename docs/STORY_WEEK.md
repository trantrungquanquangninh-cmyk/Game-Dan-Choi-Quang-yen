# Chương tuổi thơ 7 ngày

## Tiến trình

| Ngày mở sớm nhất | Nhiệm vụ | Hoàn thành bằng |
|---|---|---|
| 1 | Ngày đầu đến lớp | Học đủ 5 môn |
| 2 | Người bạn đầu tiên | Chơi bắt nhịp với Nam |
| 3 | Một việc nhỏ cho mẹ | Nhận tạm ứng, mua đủ sữa/bánh mì, trả hàng và tiền thừa |
| 4 | Tấm thiệp của cả nhà | Chọn lời mời thân thiện ở nhà |
| 5 | Chuẩn bị hội chợ | Cùng mẹ xếp màu và cùng bố tính số ghế |
| 6 | Gian hàng nhỏ | Tính tiền thừa tại cổng trường, nhận 10.000đ tiền bán thiệp |
| 7 | Sinh nhật | Về nhà đón tuổi 4, mở sổ kỷ niệm và chăm vườn |

Mỗi chương cần chương trước hoàn thành và đạt ngày mở. Bỏ lỡ ngày không làm mất chương: ngày 8 vẫn có thể tiếp tục nhiệm vụ của ngày 2. Trong ngày học, phải học và về nhà trước các hành động truyện mới. Một việc động đang làm hoặc nhiệm vụ mua đồ đang dở được ưu tiên hoàn thành trước. Hội chợ trong truyện dùng đồ cả nhà chuẩn bị, không yêu cầu bỏ vốn; tách với hoạt động kinh doanh vòng tay có rủi ro sẵn có.

Sinh nhật không còn phụ thuộc mốc 75 XP/ngày 4. Quà tối đa 20.000đ lấy từ ví gia đình; save cũ đã 4 tuổi không nhận lại quà tuổi 4. Sau sinh nhật, đến bác Bình để chăm vườn bằng mini-game phân loại rau/cỏ, một lần/ngày.

## Trạng thái và tương thích

`state.story`: ngày hoàn thành mỗi chương, dấu việc đã chuẩn bị, tổng kết 14 ngày gần nhất, ngày tổng kết đã đọc và mốc quan hệ đầu ngày. Save thiếu trường này được thêm mặc định; nhiệm vụ cũ đã xong được ghi nhận khi chương tương ứng mở. `state.quests` còn giữ để tương thích; HUD, bản đồ và nhật ký J lấy nhiệm vụ từ cùng `dailyTask`/`missionJournal`.

Tổng kết ghi khi ngủ hoặc qua nửa đêm. Nội dung gồm hoạt động đã làm, chương đã xong, thay đổi quan hệ và nhiệm vụ tiếp theo. Màn tổng kết sáng dừng mô phỏng đến khi nhấn bắt đầu ngày. Tổng kết hiện tại cũng xem được tại giường từ 21:00.

## Phục hồi

- Ăn nhẹ/nghỉ ở nhà: 30 phút, +30 năng lượng, tối đa 2 lần/ngày, không dùng tiền riêng.
- Thiếu 10 năng lượng trong lớp: có thể nhờ mẹ đón về nhà nghỉ.
- Quá giờ bắt đầu: báo mẹ/cô xin học bù hôm sau, không đánh dấu chuyên cần hoặc trao thưởng. Khóa học trở lại vào ngày học tiếp theo.
- Bài học đang dở có thể tiếp tục sau 17:30 nếu phần còn lại vẫn kết thúc trước 21:00.
- Xin hoãn việc động trước hạn tại nhà hoặc nơi nhận: không phạt thất hứa, việc được đề nghị lại ngày hôm sau. Nếu không báo trước hạn, hậu quả cũ vẫn áp dụng.

## Kiểm chứng

Khi hết việc: các sinh hoạt miễn phí ở nhà có thể lặp lại, chỉ tiêu thời gian và không tạo thêm tài nguyên. Từ 18:00 có lựa chọn sinh hoạt đến đúng 21:00 trong cùng ngày; không tự chuyển sang sáng hôm sau và không làm hộ nhiệm vụ còn thiếu. Thời lượng sinh hoạt ngắn được cắt ở 21:00. Nhiệm vụ mua đồ được mẹ đồng ý hoãn giữ nguyên tiền/đồ và tự tiếp tục ngày sau. `tests/free-time.test.ts` kiểm tra tình huống 19:36, giới hạn giờ ngủ, việc chưa hoàn thành, chống tăng thưởng qua lặp lại và lưu/tải việc được hoãn.

`tests/story.test.ts` đi xuyên 7 ngày bằng các hàm gameplay thật, kiểm tra thứ tự chương, địa điểm, đáp án sai, quà một lần, vườn, tổng kết, lưu/tải, save cũ, nghỉ miễn phí, học bù và xin hoãn. Kiểm thử logic không thay thế kiểm tra hình ảnh và thao tác trong trình duyệt.
