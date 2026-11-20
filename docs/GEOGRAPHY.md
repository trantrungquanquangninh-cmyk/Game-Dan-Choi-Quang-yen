# Địa lý và nguồn tham khảo

## Bổ sung từ hai ảnh toàn khu mới

Bản đồ gameplay đã mở rộng về phía tây và bắc để nối khu Chợ Rừng với khu Om’s Cake. Tên đường Lê Lợi, Trần Hưng Đạo, Bạch Đằng, An Hưng, Nguyễn Du, Hồ Xuân Hương, Trần Nhật Duật, Lê Lai, Lê Hoàn, Quang Trung, Dã Tượng và Lê Thánh Tông được diễn giải từ ảnh do người dùng cung cấp. Công viên Quảng Yên và Giếng Rừng được đặt theo quan hệ tương đối với Ngô Quyền và Trần Hưng Đạo trên ảnh. Không có xác minh GPS độc lập cho các điểm này.

Các điểm đánh dấu Chợ Rừng, công viên, Giếng Rừng và Om’s Cake cho phép đọc mô tả khi đến gần và nhấn E. Công viên có hành động nghỉ. Đây là các công trình cách điệu từ tham chiếu, chưa phải mô phỏng hoạt động từng địa điểm thật. Không dựng gameplay hoặc mô hình các cơ sở quân sự trên ảnh.

Kích thước thế giới mới là 4096 × 2560 đơn vị game. Khu phố nhiệm vụ cũ được dịch 1400 đơn vị sang phải và 480 đơn vị xuống dưới; save ngoài trời được nâng phiên bản vị trí một lần. Tiền, túi đồ, tuổi và nhiệm vụ được giữ lại.

Nghiên cứu ngày 20/11/2026, cho MVP tuổi thơ.

## Đã xác minh ở mức đơn vị hành chính

Phường Quảng Yên hiện hành được hình thành từ toàn bộ phường Yên Giang, phường Quảng Yên và xã Tiền An năm 2025. Không dùng ranh giới toàn thị xã Quảng Yên trước đây làm ranh giới phường hiện nay.

- [Nguồn người dùng cung cấp: Wikipedia — Quảng Yên (phường)](https://vi.wikipedia.org/wiki/Qu%E1%BA%A3ng_Y%C3%AAn_(ph%C6%B0%E1%BB%9Dng))
- [Cổng phổ biến giáo dục pháp luật Quảng Ninh — Nghị quyết 1679](https://pbgdpl.quangninh.gov.vn/toan-van-nghi-quyet-1679-nq-ubtvqh15-sap-xep-cac-don-vi-hanh-chinh-cap-xa-cua-tinh-quang-ninh-nam-2025/)
- [Báo Quảng Ninh — Đại hội phường Quảng Yên](https://baoquangninh.vn/dai-hoi-dai-bieu-dang-bo-phuong-quang-yen-lan-thu-i-nhiem-ky-2025-2030-dien-ra-thanh-cong-tot-dep-post3369949.html)
- [Cổng thông tin Quảng Ninh — tuyến Chợ Rộc đến vườn hoa Kim Lăng](https://doanhnghiep.quangninh.gov.vn/Trang/ChiTietTinTuc.aspx?nid=8150)

## Bản đồ hiện tại là hư cấu

Cập nhật theo yêu cầu sửa map: `src/mapLayout.ts` nay diễn giải mạng đường từ ảnh Google Maps người dùng gửi. Các tên Trần Khánh Dư, Ngô Quyền, Phạm Ngũ Lão, Tiền Môn, Yết Kiêu và Đầm Rau Câu được đọc từ ảnh; hình học là sơ đồ vẽ lại bằng mã, hướng bắc ở trên. Bản đồ không còn là lưới đường vuông ban đầu. Minimap và scene dùng cùng một bộ đường và polygon đầm.

Link Om’s Cake chứa tọa độ địa điểm **20.9384777, 106.8072544**; tọa độ camera URL là **20.9384262, 106.805922**. Hai điểm này không được đánh đồng. Công cụ web không mở được trang Google Maps tương tác, vì vậy không tuyên bố đã xác minh trực tiếp trang hoặc trích xuất đường từ Google. Chưa có phép chiếu GPS hoặc ranh giới hành chính cho khu vực ảnh. Không đặt tên doanh trại và không tạo gameplay cho cơ sở đó. Các POI thương mại trên ảnh không tự động trở thành cửa hàng trong game.

Nhà, lối nhỏ kết nối nhiệm vụ, sân chơi và vị trí NPC tiếp tục là hư cấu. Mầm non nằm phía đông nam và đầm ở tây nam theo bố cục ảnh, nhưng chưa tuyên bố vị trí công trình game đúng tọa độ thực. Nội dung dưới đây ghi lại giới hạn của bản nền ban đầu.

Nhà người chơi, tạp hóa cô Lan, mầm non Hoa Nắng, chợ khu phố, sân chơi, đường phố, vườn rau và lối ven sông đều là địa điểm hư cấu. Các tên vùng Quảng Yên/Yên Giang/Tiền An gợi bối cảnh; vị trí tương đối trên bản đồ gameplay **chưa phải tái hiện địa lý đã xác minh**. Không có tọa độ GPS hoặc polygon hành chính trong bản này.

Đã thử truy cập [OpenStreetMap](https://www.openstreetmap.org/search?query=Qu%E1%BA%A3ng%20Y%C3%AAn) nhưng công cụ nghiên cứu không đọc được dữ liệu trang. Không nhập dữ liệu OSM và không khẳng định bản đồ được dựng từ OSM. Bước tiếp theo cần lấy dữ liệu đường và ranh giới từ Overpass/OSM, ghi ngày trích xuất, giữ attribution và tuân thủ ODbL nếu sử dụng.

Chưa đặt Cầu Kim Lăng, Chợ Rừng, Chợ Rộc hay di tích Bạch Đằng vào thế giới. Cần kiểm chứng riêng tọa độ và quan hệ với ranh giới phường trước khi thêm. Phong Cốc, Hà An, Hiệp Hòa chưa được mô phỏng. Không suy ra vị trí cầu từ thông tin về vườn hoa cùng tên.

## Tài nguyên

Đồ họa game được vẽ riêng bằng mã trong repository; không dùng tài sản từ Stardew Valley/The Sims hay ảnh bản đồ. Font Be Vietnam Pro từ Google Fonts (SIL Open Font License); có font hệ thống dự phòng để chạy khi offline. React, Phaser, Vite và TypeScript sử dụng giấy phép nguồn mở tương ứng trong node_modules.
