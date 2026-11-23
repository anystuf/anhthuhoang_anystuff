---
title: ATH ESP Writing - Current Assessment and Black-box/XAI Research Guide for Claude
date: 2026-11-23
version: "1.0"
language: Vietnamese and English
status: Source-grounded audit + proposed improvements; no production change
privacy: No identifiable student data or secrets
---

# ATH ESP Writing: Cách AI đang chấm, sửa bài và đề xuất phát triển Black-box/XAI

> **Dành cho cô Hoàng Anh Thư và Claude Project Knowledge.** Tài liệu đối chiếu trực tiếp GitHub ATH, Supabase Edge Function v6 và phiếu PRE/POST bản pilot_2026_11 (kiểm tra ngày 23/11/2026). Luôn phân biệt **[ĐÃ KIỂM TRA] hiện trạng**, **[DIỄN GIẢI] điều có thể suy luận** và **[ĐỀ XUẤT] điều chưa triển khai**. Không đưa danh tính hay bài viết thật chưa ẩn danh vào Claude.

## 1. Tóm tắt quan trọng

**[ĐÃ KIỂM TRA]** ATH hiện có Black-box AI đánh giá essay tiếng Anh chuyên ngành ESP ở ba lựa chọn: **Law, Finance, Accounting**. Backend dùng Gemini, được hướng dẫn chấm bài **gốc** theo sáu tiêu chí và chỉnh sửa bài theo hướng chính xác, mạch lạc, chuyên nghiệp. Sinh viên **chỉ xem điểm tổng trên 100 và bài đã sửa**, không có lời giải thích.

**[ĐÃ KIỂM TRA]** Prompt nêu sáu trọng số, nhưng đầu ra hiện **chỉ có score và revised_text**; không có điểm thành phần. Vì vậy không thể biết chắc tại sao Gemini chấm 52/100 hay 62/100. Không được tự tạo 6 điểm thành phần để giải thích điểm tổng quá khứ.

**[ĐÃ KIỂM TRA]** XAI trên backend Supabase **chưa được triển khai**. Website cũ từng thiết kế giao diện giải thích lỗi, nhưng mã nguồn thực thi Firebase evaluator (functions/index.js) không có trong repo đã kiểm tra. Không được đồng nhất giao diện demo với năng lực backend đã được xác minh.

**[ĐỀ XUẤT]** Chấm sáu criterion riêng → cộng total bằng code → tạo một bản sửa chung → Black-box chỉ hiển thị total + bản sửa → XAI hiển thị **cùng total + cùng bản sửa** và **những giải thích có căn cứ**. Cấu trúc này giúp nghiên cứu khác biệt do **giải thích**, thay vì khác biệt cả điểm hoặc chất lượng bản sửa.

## 2. Bối cảnh khảo sát PRE/POST đã xác minh

- Quy trình mục tiêu: **PRE (trước khi viết) → ESP writing + AI feedback → POST (sau khi xem feedback)**.
- Phiếu PRE hiện có **14 nhận định**, thang Likert 1–5; chủ đề gồm self-confidence, hope, anxiety, boredom, control, perceived ESP competence, task value, planning và self-regulation.
- Phiếu POST có **18 nhận định + 1 attention-check** yêu cầu chọn mức **4 – Agree**; bao gồm phản ứng cảm xúc, perceived usefulness, trust, hiểu lỗi và mức độ sử dụng phản hồi.
- Database lưu phiên bản **pilot_2026_11**. Nếu cô có bộ câu hỏi đã phê duyệt khác, phải xem bản được duyệt là nguồn chuẩn; Claude phải chỉ rõ khác biệt.

| POST item | Nội dung chính | Cách diễn giải đúng |
|---|---|---|
| POST_12 | Feedback helped me understand **why** my errors were wrong. | Black-box không đưa lý do, nhưng sinh viên có thể tự suy luận từ bản sửa. Đây là **cảm nhận hiểu lỗi**, không phải bài đo hiểu lỗi khách quan. |
| POST_13 | Feedback was useful for revising my text. | **Perceived usefulness**, không chứng minh kỹ năng viết tăng. |
| POST_14 | I trust that AI feedback is accurate. | **Perceived trust**, không phải kiểm định độ chính xác. |
| POST_15 | Compared original with feedback to identify weaknesses. | Hành vi **tự báo cáo**, không nhất thiết đã được quan sát. |
| POST_16 | I can identify causes of errors (terminology/register/syntax). | **Perceived diagnostic ability**. |
| POST_17 | Decided what I will do differently next time. | Dự định thay đổi, chưa phải hành vi thực tế. |
| POST_18 | Accepted AI corrections without really thinking about them. | Xu hướng tiếp nhận thiếu phản biện; cân nhắc chiều điểm. |
| POST_ATTENTION | Select 4 – Agree. | Đánh dấu chất lượng dữ liệu; không tính vào điểm construct. |

**Lưu ý phương pháp:** PRE/POST không phải hai bài kiểm tra tương đương hoàn toàn. Không lấy tất cả mục PRE trừ tất cả mục POST rồi khẳng định “mức tăng năng lực” khi chưa định nghĩa construct, item mapping, chiều điểm và điều kiện đo.

## 3. AI hiện tại đánh giá bài như thế nào? [ĐÃ KIỂM TRA]

### Luồng thực tế

~~~text
Supabase Auth, allowlist & PRE requirement
(một tài khoản kiểm thử có ngoại lệ được đánh dấu)
                 ↓
Chọn ESP domain: Law / Finance / Accounting
                 ↓
Gửi original essay: 50–12.000 ký tự
                 ↓
Supabase Edge Function: ath-blackbox-evaluate
                 ↓
Gemini nhận original essay + domain + 6 criterion weights
                 ↓
JSON: { score: integer 0..100, revised_text: text }
                 ↓
Lưu bài gốc, điểm, bài sửa, model_used, cờ is_test
                 ↓
Student view: TOTAL SCORE + REVISED ESSAY ONLY
~~~

**Cấu hình trong code:** Temperature 0.15, Gemini structured JSON output. Source đặt default model **gemini-3.8-flash**, nhưng cấu hình GEMINI_MODEL có thể ghi đè. Riêng tài khoản kiểm thử có fallback sang **gemini-3.5-flash-lite** khi model chính lỗi.

**Kiểm tra dữ liệu 23/11/2026:** có **4 lượt đánh giá đã lưu**, tất cả ghi **is_test=true** và **model_used=gemini-3.5-flash-lite**. Không dùng bốn lượt này làm dữ liệu kết quả nghiên cứu.

### Sáu tiêu chí ESP và trọng số

| Criterion (English) | Trọng số | Mục tiêu đánh giá |
|---|---:|---|
| **Task Achievement** | **20** | Đáp ứng đúng yêu cầu viết, ý chính, lập luận và bằng chứng |
| **Organization & Coherence** | **15** | Bố cục, logic, liên kết câu/đoạn, chuyển ý |
| **Grammar Range & Accuracy** | **15** | Ngữ pháp chính xác, cấu trúc câu, độ đa dạng và lỗi ảnh hưởng nghĩa |
| **Lexical Resource** | **20** | Từ vựng, collocation, độ chính xác và sự phù hợp |
| **ESP Domain Accuracy** | **20** | Thuật ngữ và quy ước nghề nghiệp/pháp lý/tài chính/kế toán |
| **Professional Tone** | **10** | Register, mức độ trang trọng, thể loại và đối tượng đọc |
| **Tổng** | **100** | Đánh giá bài viết gốc, không phải bản đã sửa |

**Công thức mong muốn:** Total = Task (0..20) + Organization (0..15) + Grammar (0..15) + Lexical (0..20) + ESP Accuracy (0..20) + Tone (0..10).

**Tuy nhiên:** Đây mới là trọng số trong **prompt**. Backend hiện chỉ nhận **một số score**; nó **chưa tính total từ sáu số con** và **không lưu điểm từng tiêu chí**. Vì vậy câu “62 điểm vì Grammar 9/15…” là không có chứng cứ nếu không chấm lại độc lập.

**Giới hạn đáng chú ý:**
1. Không truyền đề viết/genre/audience thực tế vào API, nên **Task Achievement không thể được chấm đầy đủ theo yêu cầu đề bài**.
2. Chưa có **band descriptors** xác định thế nào là 5/20, 10/20, 15/20, 20/20.
3. Chưa có baseline chấm song song của giáo viên, kiểm định độ tin cậy hoặc mức tương đồng người–AI.
4. Rubric 100 điểm của ATH **không phải thang điểm VSTEP/CEFR đã xác thực**; không tự quy đổi điểm.
5. Điểm từ model generative có thể biến thiên; không so sánh bài qua các model/prompt khác nhau nếu không kiểm soát.

## 4. AI hiện tại sửa bài như thế nào? [ĐÃ KIỂM TRA / DIỄN GIẢI]

**Các lệnh sửa bài đang nằm trong prompt:**

- Cải thiện **grammar, clarity, terminology, cohesion, professional tone**.
- **Giữ nguyên** facts, claims, citations, intent, meaning và paragraph structure khi có thể.
- **Không tạo** thêm chứng cứ, điều luật, dữ kiện hoặc nguồn trích dẫn.
- Trả về **plain English text**, có đoạn văn tự nhiên, không Markdown asterisks hoặc dấu heading.
- Không trả lời “tại sao sửa” cho sinh viên trong Black-box.

**Chú ý:** Đây là yêu cầu mô hình, chưa có bộ kiểm tra tự động bắt buộc mọi revision đều giữ nguyên nghĩa.

### Ví dụ sửa và lý do có thể chấp nhận

| Original | Possible revised version | Vì sao? | Criterion |
|---|---|---|---|
| “Contract law play an important role ... it help companies ...” | “Contract law plays an important role ... it helps companies ...” | Chia động từ ngôi số ít đúng | Grammar |
| “the company may asking compensation” | “the company may seek compensation” | Sau **may** là base verb; “seek compensation” phù hợp legal register | Grammar, Lexical, ESP |
| “the party who break the contract” | “the party that breaches the contract” | “breach a contract” là legal collocation; chia động từ đúng | Grammar, ESP, Tone |
| “Some contracts are not clearly write.” | “Some contracts are poorly drafted.” | Sửa cách dùng bị động và diễn đạt tự nhiên về soạn thảo hợp đồng | Grammar, Lexical, ESP |
| “Contract law is very necessary.” | “Contract law is essential.” | Gọn và tự nhiên hơn; thay thế từ này **không bắt buộc trong mọi trường hợp** | Lexical, Tone |

**Cảnh báo ESP:** “Legal problems” không luôn tương đương “legal disputes”. Cách sửa nghe chuyên nghiệp hơn có thể **làm hẹp/đổi nghĩa**. Với khái niệm pháp lý, tài chính và kế toán, phải dùng chứng cứ và/hoặc giáo viên duyệt.

**Không được nói:** “Đây là lý do nội tại Gemini đã suy nghĩ.” Các giải thích trên là **diễn giải hậu nghiệm dựa trên ngôn ngữ và cặp câu quan sát được**.

### Ba mức chỉnh sửa để cô chọn [ĐỀ XUẤT]

| Mức | Phạm vi | Khuyến nghị |
|---|---|---|
| **L1 – Minimal correction** | Sửa lỗi sai thực sự, giữ giọng văn/cấu trúc tối đa | Phù hợp nếu chỉ muốn can thiệp nhẹ |
| **L2 – Controlled ESP refinement** | L1 + thuật ngữ, register, cohesion khi không đổi nghĩa | **Khuyến nghị**, cần cô phê duyệt |
| **L3 – Substantive rewriting** | Viết lại toàn bộ đoạn/lập luận | Không phù hợp nếu muốn tránh AI thay người học viết |
