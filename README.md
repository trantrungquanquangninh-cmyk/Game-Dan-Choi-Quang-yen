# DÂN CHƠI QUẢNG YÊN

Game mô phỏng tuổi thơ chạy trên trình duyệt. Bản MVP tập trung vào một khu phố có thể đi lại, không phải trang giới thiệu. TypeScript + Phaser 3 + React + Vite; hình ảnh gốc được vẽ bằng Phaser Graphics/CSS, không cần tải sprite bên ngoài.

## Chạy game

Yêu cầu Node.js 22+ và npm.

```sh
npm install
npm run dev
```

Mở URL Vite hiển thị (mặc định http://127.0.0.1:5173). `npm run build` kiểm tra TypeScript và tạo `dist/`; thư mục này có thể được phục vụ trên static hosting. `npm test` kiểm tra các hệ thống nhiệm vụ, tiền, sinh nhật và save/load.

## Chơi

### Một ngày trong đời (mới)

**Chương tuổi thơ 7 ngày:** đến lớp → kết bạn với Nam → mua đồ giúp mẹ → viết thiệp → chuẩn bị cùng bố mẹ → hội chợ → sinh nhật. Nhiệm vụ chưa xong được tiếp tục vào những ngày sau, không buộc chơi lại. Sinh nhật mở sổ kỷ niệm và hoạt động chăm vườn cùng bác Bình. Phím **J** dùng chung tiến trình với HUD và bản đồ. Khi ngủ có tổng kết ngày, thay đổi quan hệ và việc ngày mai; sáng hôm sau cần xác nhận để tiếp tục thời gian. Xem [hướng dẫn chương truyện](docs/STORY_WEEK.md).

**Lớp học 5 môn, 56 câu hỏi:** Toán, Anh, Văn, Sử và Địa. Mỗi môn có ít nhất 10 câu cơ bản để xoay vòng theo ngày; Toán, Anh, Văn có thêm câu nâng mức ở tuổi 4. Trả lời chưa đúng có giải thích và được thử lại. Tổng buổi học vẫn 210 phút game.

**Cách tiếp tục khi gặp khó:** ở nhà, mở mục “Cần nghỉ hoặc xin hoãn?” để ăn nhẹ và nghỉ miễn phí (tối đa 2 lần/ngày). Thiếu năng lượng trong lớp có thể nhờ mẹ đón về nghỉ. Sau giờ bắt đầu học, báo mẹ hoặc cô để xin học bù ngày mai; không tính là đã học hay trao thưởng. Việc động đã nhận có thể xin hoãn trước hạn, ở nhà hoặc tại nơi nhận việc.

**Hết hoạt động nhưng chưa đến giờ ngủ:** mở **H** hoặc tương tác giường/mẹ/bàn ăn. Có thể nghe kể chuyện (30 phút), vẽ (20 phút), chơi và dọn góc chơi (30 phút), lặp lại đến giờ ngủ. Từ 18:00 có nút **Sinh hoạt cùng gia đình đến 21:00**, sau đó chọn **Đi ngủ**. Các lựa chọn này không thưởng tiền, XP hay chỉ số và không hoàn thành thay bài tập/bữa tối. HUD nhắc bữa tối và bài tập trước, rồi chuyển sang sinh hoạt nhẹ. Nếu còn nhiệm vụ mua đồ lúc tạp hóa đóng cửa, về nhà xin mẹ tiếp tục sáng mai; giữ nguyên đồ và tiền tạm ứng.

Ngày đi học tiến triển theo thứ tự: **đến trường → học Toán, Tiếng Anh, Văn, Sử, Địa → về nhà → hoạt động tự do hoặc giúp bố mẹ**. Chưa hoàn thành bước hiện tại thì bước sau bị khóa; chờ qua 16:00 không tự mở hoạt động. Khi nhận việc, phải làm xong trước khi nhận việc khác. Ngày nghỉ mở hoạt động tự do. Ăn sáng, ăn trưa và đồ ăn trong túi giúp hồi sức; giờ ngủ từ **21:00**, thức dậy lúc 06:30 hôm sau. Lớp bắt đầu từ 08:00, có thể học bù nếu bắt đầu trước 17:30.

HUD chỉ hiện một việc hiện tại và nút chỉ đường. Nhấn **H** để xem chuỗi nhiệm vụ, lịch và các lựa chọn. Mũi tên vàng dưới chân chỉ tới nơi cần đến; trong nhà mũi tên chỉ ra cửa. Đến đúng nơi, nhấn **E** và chơi mini-game để nhận thưởng. Bỏ bữa, nghỉ học, đi muộn, thất hứa hoặc thức quá nửa đêm đều có hậu quả.

Tiền của bé có ví, ống heo (bố mẹ tặng), mục tiêu tiết kiệm (bóng, xe đạp, điện thoại...), lịch sử giao dịch và tài sản ròng. Ống heo chỉ dùng khi ở nhà; đồ theo mục tiêu mua tại tạp hóa hoặc Chợ Rừng. **H**: Hoạt động; **V**: Ví tiền. Xem [docs/LIFE_AND_MONEY.md](docs/LIFE_AND_MONEY.md).

### Đi học và an toàn ngoài phố

Gặp mẹ và chọn **Cùng mẹ đến trường**, gặp cô Mai rồi bước vào lớp. Làm năm bài mỗi ngày và nhờ mẹ đón về. Gần Công viên Quảng Yên có NPC **Người chưa quen** cho tình huống mô phỏng từ chối / hỏi trước / đi theo. Kết quả cần trợ giúp được xử lý nhẹ nhàng, không mất tài sản hoặc tiến trình. Xem [hướng dẫn đi học và an toàn](docs/SCHOOL_AND_SAFETY.md).

Nhấn **F** hoặc nút **Gia đình** để xem công việc bố mẹ, tiền vào/ra, dự phòng và ba hũ tiền của bé. Nói chuyện với mẹ để chơi phối màu; gặp bố bên bàn mộc để học tính tiền vật liệu. Thu nhập trừ vật liệu và sinh hoạt được ghi vào sổ lúc 18:00 hoặc khi ngủ sang ngày mới. Tiền tiêu vặt, quà và tiền mẹ giao đi chợ đều lấy từ ví gia đình. Chi tiết cách chơi và quy tắc tại [docs/FAMILY_GAMEPLAY.md](docs/FAMILY_GAMEPLAY.md).

### Khám phá khu phố

- Chọn **Bắt đầu câu chuyện**, nhập tên, chọn giới tính, màu áo và màu tóc.
- WASD/phím mũi tên để đi, Shift để chạy, E để tương tác khi đứng gần. Camera luôn giữ nhân vật ở giữa, cố định tỷ lệ trong nhà và ngoài phố.
- Mở bản đồ bằng M: tự căn khung quanh bạn và điểm đến. Nút **Toàn khu phố** mở bản đồ tổng thể; nhấn một vị trí ngoài trời để chọn điểm đến rồi tự căn khung lại.
- I: túi đồ; J: nhiệm vụ; C: nhân vật; M: bản đồ; Esc: menu/đóng hộp thoại.
- Bắt đầu trong nhà lúc 3 tuổi. Đi học trước, trở về nhà rồi theo câu chuyện từng ngày. Ngày 3 mẹ giao 20.000đ mua đồ.
- Tạp hóa nằm bên phải nhà. Mua một sữa (8.000đ) và bánh mì (7.000đ), về đưa mẹ. Phần thưởng 5.000đ và 30 XP.
- Gặp Nam ở sân chơi phía nam. Vỗ tay khi chấm vàng vào vùng xanh, ba lần đúng để hoàn thành (+20 XP).
- Gặp cô Mai tại trường phía đông nam, học đủ năm môn. Buổi học đầu tiên hoàn thành nhiệm vụ nhập môn (+25 XP ngoài thưởng buổi học).
- Đến bên phải giường trong nhà, nhấn E và chọn ngủ (từ 21:00). Sinh nhật tuổi 4 nằm ở cuối câu chuyện 7 ngày, không còn tự kích hoạt ở ngày 4.
- Mua bánh gạo để ăn, ghé ghế sân chơi nghỉ, trò chuyện với bố và bác Bình.

Một ngày = 20 phút thực. Mở hộp thoại hoặc mất tiêu điểm cửa sổ sẽ dừng mô phỏng. Cô Lan đóng cửa từ 20:00 đến 06:00. Mưa vào mỗi ngày thứ 2 trong chu kỳ bốn ngày. NPC đi lại gần vị trí hoạt động, giảm đi lại buổi tối. Đây là lịch đơn giản; chưa có hệ thống di chuyển theo tuyến giữa nhà và công việc.

Tự lưu mỗi 30 giây, khi chuyển cảnh, hoàn thành nhiệm vụ và qua ngày; cũng có nút lưu trong menu. Save nằm trong LocalStorage của trình duyệt, không đồng bộ tài khoản. Tạo nhân vật mới thay thế lượt lưu khi có lần lưu tiếp theo. Xóa dữ liệu trình duyệt sẽ xóa tiến trình.

## Kiến trúc

Bản đồ đã được thay bằng bố cục đường phỏng theo ảnh Google Maps người dùng gửi, với Trần Khánh Dư, Phạm Ngũ Lão, Tiền Môn, Yết Kiêu và Đầm Rau Câu. `src/mapLayout.ts` là nguồn dữ liệu chung cho scene và minimap. Nhà và NPC nhiệm vụ vẫn là hư cấu; xem giới hạn vị trí trong `docs/GEOGRAPHY.md`. Trường hiện ở phía đông nam; cửa hàng vẫn ở bên phải nhà. Đi xuống cửa nhà để tự ra phố hoặc dùng nút **Ra khỏi nhà**.

- `src/drawRoads.ts`: vẽ đường: lề cỏ, vỉa hè lát gạch, bó vỉa, nhựa đường, vạch kẻ, vạch qua đường, đèn đường.
- `src/theme.css`: giao diện HUD/toolbar/modal.
- `src/game.ts`: Phaser scene, mũi tên chỉ đường, tilemap ground, các lớp hình ảnh đường/nước/công trình/trang trí, collision, nhân vật hoạt họa, NPC, camera, chuyển trong/ngoài nhà, hiệu ứng môi trường, tương tác.
- `src/data.ts`: cấu hình công trình, NPC, vật phẩm và nhiệm vụ; mở rộng dữ liệu tại đây.
- `src/state.ts`: trạng thái kiểu hóa, kinh tế, inventory, phần thưởng nhiệm vụ, tiến trình sinh nhật, lưu/tải có phiên bản.
- `src/main.tsx`: React menu, tạo nhân vật, HUD, bản đồ, hội thoại, mini-game và bảng quản lý.
- `src/clock.ts`: luật giờ ngủ, lịch sinh hoạt ngày học/ngày nghỉ.
- `src/activities.ts`: ActivityDirector — hoạt động theo lịch, sự kiện động, hoạt động tự do, phần thưởng, hậu quả, quan hệ.
- `src/finance.ts`: ví, ống heo, mục tiêu tiết kiệm, hàng hóa, sổ giao dịch, tài sản ròng.
- `src/places.ts`: điểm tương tác thật trên bản đồ và kiểm tra vị trí người chơi.
- `src/progression.ts`: chương truyện, điều kiện từng ngày, sinh nhật và tổng kết.
- `src/missions.ts`: nhật ký hợp nhất từ tiến trình truyện, nhiệm vụ hiện tại và hoạt động; giữ cờ nhiệm vụ cũ để tương thích save.
- `src/StoryPanel.tsx`: nhiệm vụ truyện tại địa điểm, tổng kết, sổ kỷ niệm và lựa chọn phục hồi.
- `src/minigames.ts`: sinh đề và chấm điểm mini-game.
- `src/LifePanel.tsx`: bảng Hoạt động, Ví tiền, HUD lịch, hoạt động tại từng địa điểm.
- `tests/systems.test.ts`: các kiểm tra logic cốt lõi; `tests/life.test.ts`: giờ ngủ, hoạt động, tiền, lưu/tải.
- `docs/CHECKLIST.md`: trạng thái triển khai và kiểm chứng.
- `docs/GEOGRAPHY.md`: nguồn địa lý và ranh giới giữa dữ liệu thật/hư cấu.

Không có backend hoặc tài khoản. Công việc người lớn, ngân hàng, đầu tư, kinh doanh và xây nhà (Sprint 3–6) chưa có gameplay; các tài khoản tương ứng hiện hiển thị trạng thái khóa theo tuổi. Những hệ thống này thuộc giai đoạn mở rộng; các chỉ số nền đã được khai báo nhưng chưa phải gameplay hoàn chỉnh. Chưa hỗ trợ joystick di động, âm thanh hoặc nhập bản đồ Tiled JSON. Animation được vẽ từ mã, hiện có đứng/đi/chạy; hành động khác qua hộp thoại. Tilemap nền tương thích Phaser, các lớp vật thể và va chạm là dữ liệu riêng.
