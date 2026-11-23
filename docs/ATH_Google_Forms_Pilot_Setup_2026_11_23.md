# ATH — Google Forms PRE/POST: Hướng dẫn dành cho cô Thư

*Cập nhật: 23/11/2026 — Giai đoạn kiểm thử; không gửi đại trà cho sinh viên trước khi xác minh Form.*

## 1. Luồng hoạt động

1. Sinh viên đăng nhập ATH bằng email trường đã được cấp quyền.
2. Tại mục **Khảo sát PRE / POST** trên trang chính, chọn **PRE** và điền Google Form nhúng. Nếu Form không hiển thị, chọn **Mở Google Form trong tab mới**.
3. Sau khi thấy Google Form thông báo đã nhận phản hồi, quay lại ATH, tích xác nhận và nhấn **Xác nhận đã gửi Google Form**.
4. ATH mở Black-box AI để sinh viên dán bài ESP và nhận **điểm /100 + bài viết đã chỉnh sửa**.
5. Sau khi xem phản hồi, sinh viên làm **POST** qua Google Form được nhúng và có thể xác nhận ở ATH.

## 2. Hai Google Form cũ hiện đang được nhúng để thử

- PRE: https://docs.google.com/forms/d/e/1FAIpQLSegQM04c-FAjJZ7vQTWgV4azBNtQXdkTe4r_aTPHCVQeJHtXg/viewform
- POST: https://docs.google.com/forms/d/e/1FAIpQLSdoQ8UpzXQnB2R4qlDnmUILr_pE7G5KvUfoaqO3ziv0crKdnw/viewform

Các URL này khôi phục từ mã nguồn ATH trước đây. **Chưa xác minh được quyền chủ sở hữu, khả năng nhận câu trả lời, hoặc việc nội dung tương ứng chính xác với bộ PRE 14 nhận định / POST 18 nhận định + 1 attention check trong Supabase.** Cần rà soát trước khi triển khai chính thức.

## 3. Thiết lập Google Sheets cho cô

Vào **tài khoản sở hữu từng Google Form**:

1. Mở Google Form → tab **Responses / Câu trả lời**.
2. Chọn biểu tượng **Link to Sheets / Liên kết đến Trang tính** (biểu tượng màu xanh). Tạo một Sheet cho PRE và một Sheet cho POST.
3. Trong Google Sheets dùng **Filter, Pivot table, Charts** để thống kê. **File → Download → Comma Separated Values (.csv)** để xuất CSV (từng tab).
4. Bật **Collect email addresses / Thu thập địa chỉ email**, cân nhắc chế độ **Verified** tùy quyền truy cập BUH/UEH, và cân nhắc giới hạn một phản hồi nếu phù hợp thiết kế nghiên cứu. 
5. Kiểm tra email trường, participant ID, nội dung đồng ý tham gia, câu hỏi PRE và POST (cùng thang Likert 1–5), attention check POST, cũng như thiết lập cho phép người dùng xem/gửi Form.
6. Chia sẻ *quyền xem Sheet* cho cô hoặc nhóm nghiên cứu theo nguyên tắc tối thiểu; không công khai phản hồi cá nhân.

## 4. Điểm quan trọng: hai nguồn dữ liệu khác nhau

| Hệ thống | Lưu gì? | Vai trò |
|---|---|---|
| Google Forms → Google Sheets | Câu trả lời PRE/POST thực tế | **Nguồn dữ liệu khảo sát chính** |
| Supabase `google_form_attestations` | Người học tự tích xác nhận đã gửi PRE/POST | Chỉ mở quy trình trên ATH, **không phải bằng chứng Google đã nhận Form** |
| Supabase `essay_evaluations` | Bài gốc, điểm AI, bài đã sửa, mô hình, thời gian | Nguồn dữ liệu chấm ESP |

**Không cộng số xác nhận trên ATH thành số người hoàn thành khảo sát.** Khi phân tích cần đối chiếu Google Sheet qua email trường hoặc participant ID và thời điểm; loại kết quả kiểm thử. Website không thể tự kiểm tra kết quả bên trong iframe Google Forms do giới hạn cross-origin. Muốn xác minh tự động phải làm integration do chủ sở hữu Form cấp quyền, chẳng hạn Apps Script onFormSubmit + một backend xác thực.

## 5. Kiểm tra trước khi phát link

- Mở form bằng tài khoản sinh viên BUH/UEH **không phải chủ sở hữu**; kiểm tra có gửi được thực không.
- Gửi một bài thử PRE, kiểm tra **1 dòng mới trong Sheet PRE**, sau đó đánh dấu bài thử để loại khỏi nghiên cứu.
- Xác nhận ATH mở AI sau khi sinh viên tự khai đã gửi PRE; gửi một bài ESP và kiểm tra điểm/bài sửa (chỉ Black-box).
- Gửi một POST thử và kiểm tra **1 dòng mới trong Sheet POST**.
- Đảm bảo cô có quyền xem, lọc, tải CSV và biểu đồ trên Google Sheets.
- Chốt nội dung câu hỏi trước ngày thu thập; không sửa Form giữa nghiên cứu mà không ghi phiên bản.

Trang chính: https://anystuf.github.io/anhthuhoang_anystuff/index.html#academics
