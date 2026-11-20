# Sinh hoạt hằng ngày, hoạt động và tiền của bé (Sprint 1–2)

## Giờ giấc (`src/clock.ts`)

- Chỉ ngủ được từ **21:00 đến 23:59** theo đồng hồ trong game (`state.minutes`), không dùng giờ máy.
- Trước 21:00, giường hiện: “Chưa đến giờ ngủ đâu! Bây giờ mới là [giờ]...”.
- Lúc 21:00 có thông báo một lần: “Đã đến giờ nghỉ ngơi...”.
- Ngủ → **06:30 ngày hôm sau**, hồi đầy năng lượng, gia đình kết sổ.
- Quá 00:00 mà chưa ngủ: sang ngày mới, Năng lượng −20, Sức khỏe −4, Hạnh phúc −4, và phải chờ đến 21:00 mới ngủ được.
- Không có nút chỉnh đồng hồ. Hoạt động tiêu tốn thời gian thật trong game qua `passTime`.

Lịch ngày đi học: 06:30 thức dậy · 07:00 ăn sáng · 07:30 đến trường · 08:00–11:30 học Toán → Tiếng Anh → Văn → Lịch sử → Địa lý (mỗi môn 42 phút) · 11:30–13:00 ăn trưa · 13:00–18:00 tự do · 18:00–19:00 ăn tối · 19:00–21:00 bài tập/khám phá · 21:00 đi ngủ. Ngày thứ 7 mỗi tuần là ngày nghỉ, có sinh hoạt cộng đồng ở công viên.

Hậu quả (mỗi loại tối đa một lần/ngày): bỏ ăn sáng đến 09:00 (Năng lượng −10), đến lớp sau 08:30 (Kỷ luật −1, cô Mai −1), không đi học đến 16:00 (Kỷ luật −3, cô Mai −2, mẹ −1), không ăn tối đến 19:30 (Hạnh phúc −5, bố mẹ −1), đi học về mà quên bài tập tối khi đi ngủ (Kỷ luật −1).

## Đi học trước (`schoolLock`)

Ngày đi học, mọi hoạt động ngoài giờ chờ hoàn thành 5 môn rồi **về nhà**. Mốc 16:00 chỉ ghi nhận hậu quả bỏ học, không mở khóa bước tiếp theo. Có thể bắt đầu học bù trước 17:30; cửa lớp cho phép rời từ 15:00 nhưng vẫn phải học đủ mới mở hoạt động. Thức dậy, ăn sáng và ăn trưa ở lớp được làm trong lúc chờ. Một việc đã nhận phải hoàn thành trước khi nhận hoặc làm việc khác. Bước về nhà lưu theo ngày và tự đặt lại ngày hôm sau; ngày nghỉ mở hoạt động tự do.

## Chỉ đường

Nhấn một gợi ý hoặc “Chỉ đường”: mũi tên vàng vẽ trên mặt đất dưới chân nhân vật xoay về điểm đến và hiện khoảng cách; trong nhà/lớp mũi tên chỉ ra cửa. Khi chuyển cảnh, nhiệm vụ hiện tại cập nhật điểm đến cần thiết; điểm đánh dấu tự tắt kèm thông báo khi đến nơi.

## ActivityDirector (`src/activities.ts`)

Theo dõi tuổi, giờ, vị trí, chỉ số, tiền, đồ sở hữu, việc đã làm, người đã gặp và quan hệ để đề xuất hoạt động. Ba loại:

| Loại | Ví dụ |
|---|---|
| Theo lịch | Thức dậy, ăn sáng, ăn trưa, học chiều (phân loại hình), giúp mẹ phân loại quần áo, ăn tối, bài tập đếm tiền thừa, dọn công viên ngày nghỉ |
| Sự kiện động | Bố mẹ tặng lợn đất, ông bà mừng tuổi 50.000đ, cô Hằng nhờ mang đồ, Nam rủ đá bóng, mẹ nhờ đi chợ, bác Bình nhờ nhổ cỏ, anh Tú quán cà phê nhờ tính tiền, cô Lan giới thiệu việc, tạp hóa khuyến mãi, hội chợ trường bán vòng tay, sinh nhật Nam |
| Tự do | Chơi công viên, phụ cô Lan xếp kệ (sau khi được giới thiệu), hỏi giá ở chợ, chơi xếp hình / đọc sách (khi đã mua) |

Mỗi hoạt động có điều kiện (tuổi, ngày, khung giờ, yêu cầu), thời gian chờ (cooldown / một lần), thời lượng, năng lượng, phần thưởng, hậu quả khi từ chối hoặc nhận lời mà không làm, và trạng thái (`offered / accepted / done / declined / expired`). Sự kiện động được tạo một lần mỗi ngày bằng số ngẫu nhiên có seed (tải lại vẫn thấy cùng ngày đó), ít nhất 2 và tối đa 5 sự kiện, không lặp cùng sự kiện hai ngày liên tiếp.

Hoạt động phải làm **tại đúng địa điểm trên bản đồ**: đến gần, nhấn E, chơi mini-game. Một số việc nhận lời ở một nơi và làm ở nơi khác (mẹ nhờ ở nhà → mua tại Chợ Rừng). Điểm mới có thể nhấn E: bàn ăn trong nhà, cửa nhà cô Hằng, cửa quán cà phê; chợ và công viên dùng các mốc sẵn có.

Mini-game (`src/minigames.ts`) cho điểm 0–3, nhân với phần thưởng: nhịp bước/sút bóng, đếm tiền thừa, nhớ danh sách đi chợ, phân loại. Phím **H** mở bảng Hoạt động (gợi ý, lịch hôm nay, quan hệ, nhật ký). HUD bên phải hiện một nhiệm vụ hiện tại; nút chỉ đường đánh dấu điểm đến. Bảng H có các lựa chọn hoạt động khác.

## Tiền của bé (`src/finance.ts`)

- **Ví tiền mặt** (`state.money`), **ống heo** (bố mẹ tặng ở tuổi 3–5, chỉ bỏ/lấy khi ở nhà), **quỹ mục tiêu**, ba hũ cũ trong sổ gia đình.
- Tài khoản ngân hàng (mở ở 15 tuổi), đầu tư và kinh doanh (18 tuổi) đã có trong bảng tài sản, hiện còn khóa.
- Mọi khoản thu/chi/chuyển của bé đi qua `transact` và được ghi vào lịch sử giao dịch (ngày, giờ, đối tác, số dư sau giao dịch). Các chức năng cũ (mua ở tạp hóa, tiền tiêu vặt, tạm ứng mua đồ, ba hũ, quà sinh nhật) cũng ghi vào sổ này.
- Chuyển tiền giữa ví, ống heo và quỹ không làm thay đổi tài sản ròng. Tài sản ròng = tài sản − nợ (tiền mẹ tạm ứng được tính là khoản phải trả).
- Mục tiêu: bóng 40.000đ, xếp hình 60.000đ, xe đạp 1.000.000đ, điện thoại 3.000.000đ (10 tuổi), xe máy 25.000.000đ (18 tuổi), đất 300.000.000đ (22 tuổi). Góp tiền khi ở nhà; đủ tiền thì mua tại đúng nơi bán (tạp hóa hoặc Chợ Rừng). Hủy mục tiêu trả tiền về ống heo.
- Đồ đã mua có tác dụng: bóng làm đá bóng vui hơn, xếp hình và sách tranh mở hoạt động mới, xe đạp đi ngoài phố nhanh hơn 30%.
- Rủi ro: hội chợ trường bỏ vốn 20.000đ, giá bán cao có thể lỗ; mua nhầm món ở chợ làm ví gia đình tốn thêm.

Phím **V** mở Ví tiền: tổng quan, ống heo, mục tiêu, giao dịch.

## Lưu trữ

`state.life` và `state.finance` được lưu cùng save `quang-yen-save-v1`. Save cũ không có hai trường này được nâng cấp với giá trị mặc định.
