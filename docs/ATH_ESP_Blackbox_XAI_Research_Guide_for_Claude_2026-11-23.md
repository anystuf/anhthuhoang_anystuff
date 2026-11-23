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


---

## 5. Đề xuất thiết kế cả Black-box và XAI [CHƯA TRIỂN KHAI]

### 5.1. Cách tách hai điều kiện để so sánh tốt hơn

**Nguyên tắc đề xuất:** Cả hai điều kiện dùng **một lần chấm, một điểm tổng, một bản chỉnh sửa nền**, và chỉ khác nhau ở **phần giải thích được hiển thị**. Nếu XAI dùng model khác hoặc tự viết lại bài tốt hơn Black-box, kết quả có thể bị nhiễu bởi chất lượng sửa thay vì hiệu quả giải thích.

~~~text
                  BÀI GỐC + ĐỀ VIẾT + DOMAIN
                              |
                        SHARED GRADING
                         six subscores
                              |
                   Total calculated by code
                              |
                    SHARED REVISION (L2)
                       one revised essay
                              |
              +---------------+---------------+
              |                               |
          BLACK-BOX                          XAI
      total + revised                  same total + revised
                                      + edit explanations
              |                               |
              +---------------+---------------+
                              |
                   confidential audit log
~~~

**Black-box STUDENT VIEW:** Chỉ điểm tổng và bản sửa plain text. Không hiển thị criterion scores, nhận xét rubric, error taxonomy, explanatory notes, VSTEP conversion hoặc nội dung nghiên cứu.

**XAI STUDENT VIEW:** Điểm tổng và **chính bản sửa đó** + một bộ **3–6 giải thích chọn lọc**, mỗi mục dựa trên cặp câu gốc–sửa.

Ví dụ cấu trúc **XAI dự kiến, không phải API hiện tại**:

~~~json
{
  "score": 62,
  "revised_text": "Same improved essay as in Black-box.",
  "explanations": [
    {
      "original_span": "the company may asking compensation",
      "revised_span": "the company may seek compensation",
      "category": ["grammar", "legal_register"],
      "explanation": "After the modal may, use a base verb. Seek compensation is a more conventional legal expression.",
      "meaning_change_risk": "low",
      "teacher_review_recommended": false
    }
  ]
}
~~~

**Lưu ý:** Đây là dữ liệu mẫu minh họa cấu trúc, **không phải** bản ghi chấm bài thực tế. Giải thích XAI là **post-hoc, evidence-grounded explanation** của sự thay đổi quan sát được, không phải truy cập suy luận riêng tư của Gemini.

### 5.2. Checklist cho từng giải thích XAI

1. Trích **chính xác** phrase/sentence ở bản gốc và bản sửa; không bịa câu.
2. Nêu **lý do cụ thể**, ví dụ subject–verb agreement, collocation, ESP term, register, cohesion.
3. Phân biệt **necessary correction** và **optional improvement**.
4. Với Law/Finance/Accounting: không phán đoán chắc chắn thuật ngữ nếu thiếu task/source; ghi **uncertain** và yêu cầu giáo viên duyệt.
5. Chỉ chọn thay đổi có ý nghĩa giáo dục; không giải thích hàng loạt dấu chấm phẩy.
6. Không chấm lại hay đổi bản sửa vì người học thuộc nhánh XAI.
7. Ngôn ngữ giải thích (English đơn giản hoặc song ngữ) phải **cố định trong cùng nghiên cứu**, không tùy tiện thay giữa các sinh viên.

### 5.3. Cải tiến rubric và thuật toán chấm

**Giữ 6 trọng số hiện tại cho đến khi cô duyệt thay đổi.** Bổ sung **descriptors (neo mức điểm)** do giảng viên phê duyệt, theo cả genre, task, audience và domain. Ví dụ:

| Criterion | Mức yếu (mô tả sơ bộ) | Mức đạt | Mức tốt |
|---|---|---|---|
| Task Achievement | Không đáp ứng rõ đề thật | Đủ phần chính, triển khai chưa đều | Đáp ứng đầy đủ đề, luận điểm phát triển tốt |
| Organization | Đứt mạch, khó theo dõi | Có cấu trúc, liên kết chưa nhất quán | Logic/đoạn/chuyển ý rõ ràng |
| Grammar | Lỗi thường xuyên gây khó hiểu | Nghĩa rõ dù còn lỗi | Chính xác và có đa dạng phù hợp |
| Lexical | Dùng từ sai, hạn chế hoặc lặp | Đủ dùng, vài collocation chưa tự nhiên | Chính xác, đa dạng, tự nhiên |
| ESP Domain | Khái niệm/thuật ngữ sai | Có phần phù hợp nhưng chưa ổn định | Đúng ngữ cảnh và quy ước lĩnh vực |
| Professional Tone | Không đúng đối tượng/genre | Phần lớn phù hợp | Register chuẩn, nhất quán |

Đây mới là **descriptors dự thảo**, chưa được validated. Cần cô Thư và, khi cần, chuyên gia Law/Finance/Accounting cùng hiệu chỉnh với bài mẫu.

**Pipeline đề xuất:**

1. Input bắt buộc: **original essay + original assignment + domain + genre + audience**. Nếu không có đề bài, gắn cờ **task_context_missing** thay vì giả vờ có ngữ cảnh đầy đủ.
2. Grader chấm **bài gốc** và trả **6 số nguyên trong giới hạn**, kèm evidence notes ngắn cho giáo viên (không yêu cầu hidden chain-of-thought).
3. Server kiểm tra từng số và **tính total = sum(six subscores)**. Không để model tự xuất tổng không kiểm chứng.
4. Editor sửa L2 theo cùng chính sách; validate **faithfulness/meaning preservation** và không thêm facts/citations.
5. XAI explainer đọc **original + same revised text**, chọn vài cặp câu và giải thích. Không được thay bản sửa/tổng.
6. Lưu model_id, rubric_version, prompt_version, task_id và condition. **Không cập nhật rubric/model giữa nghiên cứu thật** nếu chưa có versioning và phê duyệt.

**Thông tin nên bổ sung ở database để phân tích (đang là ĐỀ XUẤT):**

- Anonymized participant ID, consent/research eligibility, test flag.
- Assignment/task ID, essay genre, audience, word count, domain.
- Six subscores, deterministic total, rubric/descriptor version.
- Original essay, shared revised essay, edit categories, explanation objects.
- Black-box/XAI condition, model used, prompt versions, generation parameters.
- Submission/exposure timestamps, validation/teacher-review flags.

**Không để dữ liệu danh tính, API secret, token, mật khẩu trong các bản trích xuất cho Claude.**

---

## 6. Dùng Claude để đối chiếu bài viết, điểm và dữ liệu nghiên cứu

### 6.1. Những gì cô nên cung cấp (nếu được phép theo đồng thuận nghiên cứu)

- **File Markdown này** làm **Claude Project Knowledge**.
- **Đề bài thật**, genre, audience, độ dài yêu cầu và mục tiêu học tập.
- **Rubric/descriptor bản cô đã duyệt** và bài mẫu các mức (nếu có).
- Mỗi bài đã **ẩn danh**: mã giả, original essay, total score ATH, revised essay, model_id, timestamp/condition.
- Dữ liệu PRE/POST **ẩn danh**, **codebook** và đề cương nghiên cứu/giả thuyết đã được duyệt.

**Không chia sẻ:** tên, email, MSSV, access_token, địa chỉ IP, tài khoản hệ thống hoặc secret. Tách dữ liệu nhận diện sinh viên khỏi bộ dữ liệu đưa vào Claude.

### 6.2. Các đối chiếu Claude làm được và không làm được

| Vấn đề | Claude có thể hỗ trợ | Không được suy luận |
|---|---|---|
| Claude vs ATH grading | Chấm **độc lập** 6 criterion, đối chiếu total; nêu dẫn chứng từ câu viết | Coi Claude là ground truth; gọi điểm tự chấm là ATH subscores lịch sử |
| Original vs revised | Đánh dấu lỗi đúng đã sửa, optional style edits, meaning drift | Biết suy nghĩ thực sự bên trong Gemini |
| ESP terminology | Kiểm tra tính tự nhiên, hợp ngữ cảnh và nghi vấn sai chuyên môn | Bịa căn cứ pháp luật/chuẩn kế toán, tuyên bố tính chính xác chưa được xác minh |
| PRE/POST | Nhóm construct, codebook, kiểm tra so sánh item và data quality | Khẳng định học viên tăng năng lực từ tự báo cáo |
| Black-box vs XAI | Chỉ ra confounds và cách cô lập effect of explanation | Khẳng định nhân quả nếu không có thiết kế phù hợp |
| Scoring reliability | Đề xuất human calibration, repeatability, agreement metrics | Phát minh p-value, ICC, sample size hoặc hiệu quả chưa tính |

### 6.3. Khuyến nghị kiểm định trước khi dùng chính thức

- Pilot một tập bài ở **cả ba lĩnh vực**, bao gồm nhiều mức năng lực; rubric cần được duyệt.
- Có **hai người chấm độc lập**, hoặc phương án giám khảo phù hợp nguồn lực, để kiểm tra mức đồng thuận và giải quyết bài bất đồng.
- Chạy lặp những bài đã ẩn danh với **cùng model/prompt/rubric**; ghi phiên bản **thực tế**, không chỉ phiên bản mặc định trong code.
- So sánh AI–human theo **criterion**, bias, MAE / agreement indices phù hợp dữ liệu; không đưa ngưỡng kết luận sau khi đã biết kết quả.
- Kiểm định **meaning preservation** của revision, đặc biệt khi dùng thuật ngữ Law/Finance/Accounting.
- Nếu mục tiêu là tác động của giải thích, giữ chung score/revision/task; khác nhau ở XAI explanation. Tránh gộp tác động của model và bài sửa.
- Định nghĩa trước quy tắc missing data, attention check, loại trừ dữ liệu test, cách gán nhóm, quyền rút lui và thời gian giữ dữ liệu.
- Không dùng điểm AI chưa kiểm chứng để quyết định điểm học phần hoặc quy đổi VSTEP chính thức.

---

## 7. PROMPT CHO CLAUDE (copy vào Project Instructions)

Cô có thể thêm yêu cầu “Respond in Vietnamese, but keep rubric terms in English” nếu muốn Claude trả lời bằng tiếng Việt.

~~~text
You are an academic research assistant supporting a study of ESP (English for
Specific Purposes) writing assessment and feedback comparing BLACK-BOX AI
with EXPLAINABLE AI (XAI).

EVIDENCE HIERARCHY:
1. Teacher-approved research protocol, writing tasks, rubrics and consent rules;
2. The attached ATH ESP-XAI research briefing and verified platform source;
3. Anonymized essays and PRE/POST data the teacher explicitly provides;
4. External research clearly labeled as outside context.

Always separate VERIFIED CURRENT ATH BEHAVIOR, INTERPRETATION BASED ON PROVIDED
EVIDENCE, and PROPOSED IMPROVEMENTS. Never present a proposed method as a
function already deployed to ATH.

CURRENT SYSTEM:
- ATH Black-box uses these criterion weights (total 100):
  Task Achievement 20, Organization & Coherence 15, Grammar 15,
  Lexical Resource 20, ESP Domain Accuracy 20, Professional Tone 10.
- Current Gemini response contains ONLY total score and revised essay.
  There are NO historical, independently verified six-criterion subscores.
- Supabase XAI is NOT yet deployed; do not fabricate its results.
- ATH 0-100 is NOT an officially calibrated CEFR/VSTEP score.
- Model choice and actual version matter: do not compare outcomes across
  differing models/prompts without noting the confound.

ESSAY REVIEW:
1. Identify the actual writing task, ESP domain, target genre/audience,
   original essay, ATH total and revision; state what is missing.
2. Grade the ORIGINAL text, not the corrected version. If asked for independent
   grading, give six CLAUDE subscores and short textual evidence, clearly
   labeled as an independent evaluation rather than hidden ATH data.
3. When the writing task is unavailable, explicitly flag Task Achievement
   as not fully evaluable; do not invent the assignment.
4. Compare your judgment with the given ATH total without treating either
   score as validated ground truth.
5. Audit ORIGINAL versus REVISED: observable edit, grammatical/ESP rationale,
   whether correction was necessary or stylistic, and meaning-change risk.
6. Do not claim to know private model reasoning. Any explanation is a
   post-hoc language analysis grounded in the visible text.
7. Flag doubtful Law/Finance/Accounting claims for instructor review.
   Never invent statutory references, standards, facts or citations.

TWO EXPERIMENTAL CONDITIONS (PROPOSAL ONLY):
- Black-box student output: ONLY total score + revised essay.
- XAI student output: EXACTLY THE SAME score + revised essay PLUS concise,
  evidence-grounded explanations for selected original/revised text pairs.
- XAI must not silently regrade or change the revised essay.
- Researcher view may include subscores, model/rubric versions,
  explanation taxonomy, limitations, and validation flags.

RESEARCH REVIEW:
- PRE and POST are not automatically equivalent scales; compare aligned
  constructs and flag non-equivalent questions.
- POST perceived understanding, trust or usefulness is self-report;
  it does not demonstrate objective improvement without a proper task.
- Exclude flagged TEST records from research analysis; use only data
  permitted by consent. Do not request names, emails, account identifiers,
  API keys, access tokens or passwords.
- Never invent study results, significance, reliability, sample sizes,
  model explanations or participant counts.
- When evidence is insufficient, say INSUFFICIENT EVIDENCE and specify why.

STANDARD OUTPUT FOR AN ESSAY AUDIT:
A. Observed evidence and missing context
B. Independent Claude rubric evaluation (NOT actual ATH subscores)
C. Claude versus ATH total, where available
D. Text-pair correction audit and meaning preservation risks
E. Black-box versus XAI design implications
F. Teacher approvals and next data needed
G. Methodological limitations
~~~

### Prompt đối chiếu một bài cụ thể

~~~text
Using the ATH ESP-XAI brief and our approved rubric, audit this single
de-identified ESP essay.

Anonymous participant ID: [P001]
ESP domain: [LAW / FINANCE / ACCOUNTING]
Original assignment and genre: [PASTE OR MARK MISSING]
Intended audience: [PASTE OR MARK MISSING]
Original essay: [PASTE ANONYMIZED ESSAY]
ATH total score: [NUMBER OR MISSING]
ATH revised essay: [PASTE OR MARK MISSING]
Actual model, prompt/rubric version: [VALUES OR UNKNOWN]
Study condition: [BLACKBOX / XAI / NOT ASSIGNED]

Please deliver:
1. An INDEPENDENT Claude six-criterion assessment with brief observed evidence.
2. Comparison to actual ATH total if provided, without inventing ATH subscores.
3. A change log: original phrase -> revised phrase -> plausible reason ->
   criterion -> necessary/optional -> meaning-change risk.
4. Teacher-review flags for questionable domain-specific corrections.
5. Proposed Black-box view (only total + revision) and XAI view
   (same total + same revision + grounded explanations).
6. Implications and limits for PRE/POST research.
Do not invent facts, source citations, model reasoning, or official CEFR levels.
~~~

### Prompt Claude rà soát thiết kế nghiên cứu

~~~text
Act as an ESP language-assessment and educational research reviewer.
Using our approved study protocol and this ATH research brief, identify:
- mismatches between research questions, PRE/POST constructs and essay scores;
- confounds when comparing Black-box with XAI;
- how to isolate the explanation factor while holding scoring and revision fixed;
- how to calibrate six-criterion grading with instructor ratings and examples;
- how to evaluate the faithfulness and usefulness of AI corrections;
- missing metadata, consent and data protection issues;
- decisions the instructor must approve before any production changes.
Never claim statistical significance or causal effects without adequate data.
~~~

---

## 8. Quyết định cô Thư cần chốt

| Vấn đề | Phương án đề xuất |
|---|---|
| Writing task/genre | Cung cấp đề bài thật, audience và lĩnh vực cho mỗi lần đánh giá |
| Rubric | Giữ weights 20–15–15–20–20–10; thêm descriptors và bài mẫu |
| Total score | Server cộng 6 subscores, không chỉ lấy một tổng Gemini tự viết |
| Revision level | L2 – controlled ESP refinement, giữ ý và bằng chứng |
| XAI | Cùng score/cùng revised essay, chỉ bổ sung explanations |
| Language of XAI | English đơn giản hoặc song ngữ; chốt trước pilot |
| Model | Khóa một model và prompt version cho nghiên cứu thật |
| Teacher calibration | Có bài ẩn danh chấm đối chứng, rà lỗi chuyên môn |
| Survey interpretation | Codebook PRE/POST và attention check, không suy diễn trực tiếp |
| Data protection | Không chuyển dữ liệu định danh sinh viên cho Claude |

---

## 9. Nguồn xác minh và tài liệu phương pháp

**Nguồn thực tế của hệ thống ATH:**

1. Supabase Edge Function, Black-box code: https://github.com/anystuf/anhthuhoang_anystuff/blob/main/supabase/functions/ath-blackbox-evaluate/index.ts
2. Giao diện PRE/POST và AI Lab: https://github.com/anystuf/anhthuhoang_anystuff/blob/main/ath-experiment.js
3. Giao diện evaluator Firebase cũ (để đối chiếu lịch sử, không xác minh backend): https://github.com/anystuf/anhthuhoang_anystuff/blob/9412d1219b15f284e09e90c5673f875fd284a587/index.html
4. Supabase ATH_Research: phiếu survey_forms/survey_questions và essay_evaluations (đã đối chiếu nội dung/aggregate; không xuất bản ghi cá nhân).
5. Giới hạn nguồn: backend Firebase functions/index.js được tham chiếu nhưng **không tìm thấy** trong repo kiểm tra.

**Nguồn phương pháp học thuật để cô tham khảo, KHÔNG khẳng định ATH đã đáp ứng:**

- ALTE, Guidelines for the Development of Language for Specific Purposes Tests (2018): https://alte.org/Materials
- ILTA, Guidelines for Practice (2024): https://www.iltaonline.com/page/ILTAGuidelinesforPractice2024
- Council of Europe, CEFR Companion Volume (2020): https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-companion-volume-and-its-language-versions
- UNESCO, Guidance for Generative AI in Education and Research (2023): https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research

---

## Gợi ý tin nhắn gửi cô Thư cùng Markdown

> Dạ cô, em đã tổng hợp vào file Markdown cách AI của ATH hiện đang chấm và sửa bài viết ESP theo sáu tiêu chí, những giới hạn của điểm AI hiện tại, và đề xuất cải tiến Black-box và XAI theo hướng hai chế độ dùng chung điểm/bản sửa để so sánh nghiên cứu rõ ràng hơn. Em cũng kèm hướng dẫn Claude đối chiếu bài viết, các chỉnh sửa và PRE/POST. Cô có thể đưa file vào Claude Project Knowledge rồi bổ sung bộ đề, rubric cô duyệt và dữ liệu đã ẩn danh. Đây là tài liệu phân tích và đề xuất, chưa phải các thay đổi đã áp dụng lên hệ thống.

**Lưu ý bảo mật:** File này không chứa dữ liệu sinh viên; repository GitHub hiện có thể được truy cập công khai. Không commit dữ liệu nghiên cứu định danh vào repo. Việc sử dụng Claude với bài viết thật cần kiểm tra điều kiện đồng ý và quy trình bảo vệ dữ liệu của nghiên cứu.
