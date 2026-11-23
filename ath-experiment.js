// ATH Research inline PRE -> Black-box AI -> POST experience.
// This module shares the existing Supabase Auth session with survey.html and blackbox.html.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.2/+esm";

const db = createClient(
  "https://aignaxmirbbnfuutvvdg.supabase.co",
  "sb_publishable_StzzvgRqME3Dt241NZ8nnQ_yfvUYWzA",
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);
const byId = (id) => document.getElementById(id);
const validEmail = /^[^\s@]+@(st\.buh\.edu\.vn|st\.ueh\.edu\.vn)$/i;
const testEmail = "nguyentran.31231024329@st.ueh.edu.vn";
const activateRedirect = "https://anystuf.github.io/anhthuhoang_anystuff/survey.html";
let user = null;
let eligibility = null;
let finished = new Set();
let phase = "PRE";
let questions = [];
let formVersion = "pilot_2026_11";
let refreshing = false;
const survey = byId("research-survey");
const ai = byId("esp-writing-evaluator");
const alerts = byId("ath-alert");
function notify(message, success = false) {
  alerts.textContent = message;
  alerts.hidden = false;
  alerts.classList.toggle("ath-success", success);
}
function clearNotice() {
  alerts.hidden = true;
  alerts.textContent = "";
}
function aiStatus(message) {
  byId("ath-ai-message").textContent = message;
}
function completedPre() {
  return finished.has("PRE");
}
function mayUseAi() {
  return Boolean(user && eligibility && (completedPre() || 
    ((user.email || "").toLowerCase() === testEmail && eligibility.is_test === true)));
}
function updateAiAccess() {
  const allowed = mayUseAi();
  byId("esp-analyze-btn").disabled = !allowed;
  byId("esp-essay").disabled = !allowed;
  byId("esp-domain").disabled = !allowed;
  byId("ath-ai-signed-in").textContent = user && eligibility ? "Tài khoản: " + user.email : "";
  if (!user) aiStatus("Đăng nhập tài khoản nghiên cứu ở phần khảo sát bên trên để sử dụng Black-box AI.");
  else if (!eligibility) aiStatus("Email này chưa được cấp quyền sử dụng AI Lab.");
  else if (!allowed) aiStatus("Bạn cần hoàn thành PRE trước khi nhận đánh giá AI.");
  else aiStatus("Black-box AI đã sẵn sàng: chỉ trả về điểm /100 và bài viết đã chỉnh sửa.");
}
async function refresh() {
  if (refreshing) return;
  refreshing = true;
  try {
    const { data: { user: current }, error } = await db.auth.getUser();
    user = error ? null : current;
    eligibility = null;
    finished = new Set();
    if (!user) {
      byId("ath-login-panel").hidden = false;
      byId("ath-member-panel").hidden = true;
      updateAiAccess();
      return;
    }
    const email = String(user.email || "").trim().toLowerCase();
    const { data: allowed, error: allowedError } = await db
      .from("allowed_students")
      .select("email,status,class_code,is_test")
      .eq("email", email).eq("status", "active").maybeSingle();
    if (allowedError) throw new Error("Chưa xác minh được quyền truy cập: " + allowedError.message);
    if (!allowed) {
      byId("ath-login-panel").hidden = false;
      byId("ath-member-panel").hidden = true;
      updateAiAccess();
      notify("Email chưa nằm trong danh sách sinh viên được phép tham gia. Vui lòng liên hệ người phụ trách.");
      return;
    }
    eligibility = allowed;
    const { data: submissions, error: submissionError } = await db
      .from("survey_submissions").select("phase")
      .eq("user_id", user.id);
    if (submissionError) throw submissionError;
    finished = new Set((submissions || []).map((item) => item.phase));
    byId("ath-login-panel").hidden = true;
    byId("ath-member-panel").hidden = false;
    byId("ath-member-email").textContent = "Đã đăng nhập: " + email;
    byId("ath-test-message").hidden = !(allowed.is_test && email === testEmail);
    byId("ath-pre-done").textContent = completedPre() ? " ✓" : "";
    byId("ath-post-done").textContent = finished.has("POST") ? " ✓" : "";
    byId("ath-post-tab").disabled = !completedPre();
    updateAiAccess();
    await selectPhase(phase === "POST" && !completedPre() ? "PRE" : phase);
  } catch (error) {
    notify("Không tải được tài khoản hoặc khảo sát: " + (error?.message || "Lỗi kết nối"));
    updateAiAccess();
  } finally {
    refreshing = false;
  }
}
async function signIn() {
  clearNotice();
  const email = byId("ath-email").value.trim().toLowerCase();
  const password = byId("ath-password").value;
  if (!validEmail.test(email) || !password) return notify("Vui lòng nhập email trường và mật khẩu.");
  const button = byId("ath-login-button");
  button.disabled = true;
  try {
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await refresh();
  } catch (error) {
    notify("Đăng nhập không thành công: " + (error?.message || "Lỗi đăng nhập"));
  } finally { button.disabled = false; }
}
async function signUp() {
  clearNotice();
  const email = byId("ath-email").value.trim().toLowerCase();
  const password = byId("ath-password").value;
  if (!validEmail.test(email)) return notify("Chỉ sử dụng email sinh viên BUH hoặc UEH.");
  if (password.length < 8) return notify("Mật khẩu phải dài ít nhất 8 ký tự.");
  const button = byId("ath-signup-button"); button.disabled = true;
  try {
    const { error } = await db.auth.signUp({
      email, password, options: { emailRedirectTo: activateRedirect }
    });
    if (error) throw error;
    notify("Đã tiếp nhận đăng ký. Nếu nhận được thư xác minh, hãy xác nhận email trường rồi quay lại trang này đăng nhập.", true);
  } catch (error) {
    notify("Không tạo được tài khoản: " + (error?.message || "Lỗi đăng ký"));
  } finally { button.disabled = false; }
}
async function forgotPassword() {
  const email = byId("ath-email").value.trim().toLowerCase();
  if (!validEmail.test(email)) return notify("Nhập email trường trước khi chọn Quên mật khẩu.");
  const button = byId("ath-forgot-button");button.disabled = true;
  try {
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: activateRedirect + "?recovery=1"
    });
    if (error) throw error;
    notify("Nếu email đã đăng ký, bạn sẽ nhận thư hướng dẫn đặt lại mật khẩu.", true);
  } catch (error) {
    notify("Không gửi được yêu cầu: " + (error?.message || "Lỗi gửi email"));
  } finally { button.disabled = false; }
}
async function signOut() {
  await db.auth.signOut();
  user = null;
  eligibility = null;
  finished.clear();
  byId("esp-result").replaceChildren();
  byId("esp-result").classList.remove("ath-has-result");
  byId("esp-result").classList.add("result-empty");
  byId("esp-result").textContent = "Kết quả đánh giá sẽ hiển thị ở đây.";
  byId("ath-post-go").hidden = true;
  await refresh();
  notify("Đã đăng xuất.", true);
}
async function selectPhase(next) {
  clearNotice();
  if (next === "POST" && !completedPre()) {
    return notify("Hoàn thành khảo sát PRE trước khi thực hiện POST.");
  }
  phase = next;
  byId("ath-pre-tab").setAttribute("aria-selected", String(phase === "PRE"));
  byId("ath-post-tab").setAttribute("aria-selected", String(phase === "POST"));
  byId("ath-done").hidden = !finished.has(phase);
  byId("ath-survey-form").hidden = finished.has(phase);
  byId("ath-next-ai").hidden = !(phase === "PRE" && finished.has("PRE"));
  if (finished.has(phase)) {
    byId("ath-done-text").textContent = "Bạn đã hoàn thành " + phase + ". Cảm ơn bạn!";
    return;
  }
  try {
    const [forms, questionResults] = await Promise.all([
      db.from("survey_forms").select("phase,title_vi,introduction_vi,introduction_en,instrument_version")
        .eq("phase",phase).maybeSingle(),
      db.from("survey_questions").select("question_id,ordinal,display_number,statement_vi,statement_en")
        .eq("phase", phase).order("ordinal")
    ]);
    if (forms.error || questionResults.error) throw new Error(forms.error?.message || questionResults.error?.message);
    if (!forms.data || questionResults.data?.length !== (phase === "PRE" ? 14 : 19)) {
      throw new Error("Bộ câu hỏi đang được kiểm tra, vui lòng thử lại.");
    }
    formVersion = forms.data.instrument_version || "pilot_2026_11";
    questions = questionResults.data;
    byId("ath-phase-title").textContent = forms.data.title_vi;
    byId("ath-phase-intro").textContent = forms.data.introduction_vi + " " + forms.data.introduction_en;
    byId("ath-pre-fields").hidden = phase !== "PRE";
    byId("ath-post-fields").hidden = phase !== "POST";
    byId("ath-open-label").textContent = phase === "PRE"
      ? "Bạn lo lắng hoặc mong đợi điều gì ở bài viết này? (Không bắt buộc)"
      : "Điều gì trong phản hồi của AI khiến bạn có cảm xúc như trên? (Không bắt buộc)";
    byId("ath-survey-form").reset();
    const mount = byId("ath-questions");
    mount.replaceChildren();
    for (const question of questions) {
      const fieldset = document.createElement("fieldset");
      fieldset.className = "ath-question";
      const legend = document.createElement("legend");
      legend.textContent = (question.display_number === "–" ? "★" : question.display_number + ".") + " " + question.statement_vi;
      fieldset.append(legend);
      const english = document.createElement("p");
      english.className = "ath-english";
      english.textContent = question.statement_en;
      fieldset.append(english);
      const ratings = document.createElement("div");
      ratings.className = "ath-ratings";
      ratings.setAttribute("role", "radiogroup");
      ratings.setAttribute("aria-label", question.statement_vi);
      for (let rating = 1; rating <= 5; rating++) {
        const label = document.createElement("label");
        label.className = "ath-rating";
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = question.question_id;
        radio.value = String(rating);
        radio.required = true;
        label.append(radio, document.createTextNode(String(rating)));
        ratings.append(label);
      }
      fieldset.append(ratings);
      mount.append(fieldset);
    }
  } catch (error) {
    notify("Không tải được câu hỏi: " + (error?.message || "Lỗi kết nối"));
  }
}
async function submitSurvey(event) {
  event.preventDefault();
  clearNotice();
  if (!user || !eligibility || finished.has(phase)) return;
  const answers = {};
  for (const q of questions) {
    const selected = byId("ath-survey-form").querySelector(
      'input[name="' + q.question_id + '"]:checked'
    );
    if (!selected) return notify("Bạn cần trả lời toàn bộ câu hỏi trước khi gửi.");
    answers[q.question_id] = Number(selected.value);
  }
  if (phase === "PRE") {
    if (!byId("ath-consent").checked) return notify("Vui lòng xác nhận đồng ý tham gia khảo sát.");
    if (!byId("ath-gender").value || !byId("ath-ai-use").value) return notify("Vui lòng chọn giới tính và mức sử dụng AI.");
  } else if (!byId("ath-feedback-read").checked) {
    return notify("Chỉ gửi POST sau khi bạn đã đọc phản hồi AI.");
  }
  const submit = byId("ath-submit"); submit.disabled = true;
  try {
    const payload = {
      user_id: user.id,
      phase,
      instrument_version: formVersion,
      answers,
      consent_confirmed: true,
      feedback_read_confirmed: phase === "POST",
      gender: phase === "PRE" ? byId("ath-gender").value : null,
      ai_usage_frequency: phase === "PRE" ? byId("ath-ai-use").value : null,
      open_response: byId("ath-open-response").value.trim() || null,
      pilot_clarity_note: byId("ath-pilot-note").value.trim() || null
    };
    const { error } = await db.from("survey_submissions").insert(payload);
    if (error) throw error;
    finished.add(phase);
    notify("Đã lưu câu trả lời " + phase + " thành công.", true);
    await refresh();
    if (phase === "PRE") scrollToAi();
  } catch (error) {
    notify("Chưa lưu được khảo sát: " + (error?.code === "23505" ? "Bài này đã được nộp." : error?.message || "Lỗi lưu"));
  } finally { submit.disabled = false; }
}
function scrollToAi() {
  ai.scrollIntoView({behavior:"smooth",block:"start"});
}
async function evaluateEssay() {
  const essay = byId("esp-essay").value.trim();
  const domain = byId("esp-domain").value;
  if (!mayUseAi()) return notify("Vui lòng đăng nhập và hoàn thành PRE trước khi đánh giá.");
  if (essay.length < 50 || essay.length > 12000) {
    aiStatus("Bài viết phải dài từ 50 đến 12.000 ký tự.");
    return;
  }
  const button = byId("esp-analyze-btn"); button.disabled = true;
  const status = byId("esp-status");status.textContent = "AI đang đánh giá...";
  byId("esp-result").classList.remove("ath-has-result");
  byId("esp-result").classList.add("result-empty");
  byId("esp-result").textContent = "Đang đánh giá bài viết...";
  byId("ath-post-go").hidden = true;
  try {
    const { data, error } = await db.functions.invoke("ath-blackbox-evaluate", {
      body: {domain, essayText: essay}
    });
    if (error) {
      let detail = "Không gọi được dịch vụ đánh giá AI.";
      try {
        const body = await error.context?.json();
        if (typeof body?.error === "string") detail = body.error;
      } catch { /* ignore */ }
      throw new Error(detail);
    }
    if (!Number.isInteger(data?.score) || data.score < 0 || data.score > 100 ||
        typeof data?.revised_text !== "string" || data.revised_text.trim().length < 30) {
      throw new Error("Kết quả AI không hợp lệ, vui lòng thử lại.");
    }
    // One self-contained results card: legacy result-card and flex styles cannot squeeze the score.
    const result = byId("esp-result");
    result.classList.remove("result-empty");
    result.classList.add("ath-has-result");
    result.replaceChildren();

    const report = document.createElement("section");
    report.className = "ath-blackbox-report";
    report.setAttribute("aria-label", "Kết quả Black-box AI");

    const scoreRow = document.createElement("div");
    scoreRow.className = "ath-blackbox-score-row";
    const scoreLabel = document.createElement("h4");
    scoreLabel.className = "ath-blackbox-score-label";
    scoreLabel.textContent = "Điểm đánh giá";
    const scoreValue = document.createElement("div");
    scoreValue.className = "ath-blackbox-score-value";
    const scoreNumber = document.createElement("span");
    scoreNumber.className = "ath-blackbox-score-number";
    scoreNumber.textContent = String(data.score);
    const scoreMax = document.createElement("span");
    scoreMax.className = "ath-blackbox-score-max";
    scoreMax.textContent = " / 100";
    scoreValue.append(scoreNumber, scoreMax);
    scoreRow.append(scoreLabel, scoreValue);

    const revision = document.createElement("div");
    revision.className = "ath-blackbox-revision";
    const revisedTitle = document.createElement("h4");
    revisedTitle.textContent = "Bài viết đã chỉnh sửa";
    const revisedBody = document.createElement("div");
    revisedBody.className = "ath-blackbox-revised-text";
    revisedBody.textContent = data.revised_text.replace(/\*\*/g, "").replace(/(^|\n)#{1,6}[ \t]+/g, "$1");
    revision.append(revisedTitle, revisedBody);
    report.append(scoreRow, revision);
    result.append(report);
    byId("ath-post-go").hidden = !completedPre();
    status.textContent = "Hoàn tất.";
    result.scrollIntoView({behavior:"smooth",block:"start"});
  } catch (error) {
    byId("esp-result").classList.remove("ath-has-result");
  byId("esp-result").classList.add("result-empty");
    byId("esp-result").textContent = "Chưa nhận được kết quả.";
    status.textContent = "Đánh giá chưa thành công.";
    aiStatus(error?.message || "Lỗi kết nối. Vui lòng thử lại.");
  } finally {
    button.disabled = !mayUseAi();
  }
}
function resetEssay() {
  byId("esp-essay").value = "";
  byId("esp-status").textContent = "";
  byId("esp-result").classList.remove("ath-has-result");
  byId("esp-result").classList.add("result-empty");
  byId("esp-result").textContent = "Kết quả đánh giá sẽ hiển thị tại đây.";
  byId("ath-post-go").hidden = true;
}
byId("ath-login-button").addEventListener("click", signIn);
byId("ath-signup-button").addEventListener("click", signUp);
byId("ath-forgot-button").addEventListener("click", forgotPassword);
byId("ath-logout").addEventListener("click", signOut);
byId("ath-email").addEventListener("keydown", (event) => { if (event.key === "Enter") signIn(); });
byId("ath-password").addEventListener("keydown", (event) => { if (event.key === "Enter") signIn(); });
byId("ath-pre-tab").addEventListener("click", () => selectPhase("PRE"));
byId("ath-post-tab").addEventListener("click", () => selectPhase("POST"));
byId("ath-survey-form").addEventListener("submit", submitSurvey);
byId("esp-analyze-btn").addEventListener("click", evaluateEssay);
byId("esp-reset-btn").addEventListener("click", resetEssay);
byId("ath-next-ai").addEventListener("click", scrollToAi);
byId("ath-post-go").addEventListener("click", () => {
  selectPhase("POST");
  survey.scrollIntoView({behavior:"smooth",block:"start"});
});
refresh();
