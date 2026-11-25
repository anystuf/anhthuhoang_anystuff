// ATH Google Forms + Black-box AI (2026 pilot).
// Google Form responses stay in Google. Completion acknowledgments here are self-reported only.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.2/+esm";
const db=createClient("https://aignaxmirbbnfuutvvdg.supabase.co","sb_publishable_StzzvgRqME3Dt241NZ8nnQ_yfvUYWzA",{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const byId=id=>document.getElementById(id);
const validEmail=/^(?:[^\s@]+@(st\.buh\.edu\.vn|st\.ueh\.edu\.vn)|thuha@hub\.edu\.vn)$/i;
const testEmails=new Set(["nguyentran.31231024329@st.ueh.edu.vn","thuha@hub.edu.vn"]);
const activateRedirect="https://anystuf.github.io/anhthuhoang_anystuff/survey.html";
const formUrls={
 PRE:"https://docs.google.com/forms/d/e/1FAIpQLSegQM04c-FAjJZ7vQTWgV4azBNtQXdkTe4r_aTPHCVQeJHtXg/viewform",
 POST:"https://docs.google.com/forms/d/e/1FAIpQLSdoQ8UpzXQnB2R4qlDnmUILr_pE7G5KvUfoaqO3ziv0crKdnw/viewform"
};
const instrumentVersion="google_forms_pilot_2026_11";
let user=null,eligibility=null,finished=new Set(),hasAiEvaluation=false,phase="PRE",refreshing=false;
const survey=byId("research-survey"),ai=byId("esp-writing-evaluator"),alerts=byId("ath-alert");
function notify(message,success=false){alerts.textContent=message;alerts.hidden=false;alerts.classList.toggle("ath-success",success)}
function clearNotice(){alerts.hidden=true;alerts.textContent=""}
function aiStatus(message){byId("ath-ai-message").textContent=message}
function completedPre(){return finished.has("PRE")}
function mayUseAi(){
 return Boolean(user&&eligibility&&(completedPre()||(testEmails.has((user.email||"").toLowerCase())&&eligibility.is_test===true)));
}
function updateAiAccess(){
 const ok=mayUseAi();
 byId("esp-analyze-btn").disabled=!ok;
 byId("esp-essay").disabled=!ok;
 byId("esp-domain").disabled=!ok;
 byId("ath-ai-signed-in").textContent=user&&eligibility?"Tài khoản: "+user.email:"";
 if(!user)aiStatus("Đăng nhập ATH ở mục Google Forms phía trên để sử dụng AI.");
 else if(!eligibility)aiStatus("Email này chưa được cấp quyền cho AI Lab.");
 else if(!ok)aiStatus("Điền Google Form PRE rồi xác nhận đã gửi tại ATH để mở Black-box AI.");
 else aiStatus("Black-box AI sẵn sàng: trả về điểm /100 và bài đã chỉnh sửa.");
}
async function refresh(){
 if(refreshing)return;refreshing=true;
 try{
  const {data:{user:current},error}=await db.auth.getUser();
  user=error?null:current;eligibility=null;finished=new Set();hasAiEvaluation=false;
  if(!user){
   byId("ath-login-panel").hidden=false;byId("ath-member-panel").hidden=true;updateAiAccess();return;
  }
  const email=String(user.email||"").trim().toLowerCase();
  const allowed=await db.from("allowed_students").select("email,status,class_code,is_test").eq("email",email).eq("status","active").maybeSingle();
  if(allowed.error)throw allowed.error;
  if(!allowed.data){
   byId("ath-login-panel").hidden=false;byId("ath-member-panel").hidden=true;
   updateAiAccess();notify("Email chưa có trong danh sách sinh viên được phép tham gia.");return;
  }
  eligibility=allowed.data;
  const [legacy,google,graded]=await Promise.all([
   db.from("survey_submissions").select("phase").eq("user_id",user.id),
   db.from("google_form_attestations").select("phase").eq("user_id",user.id).eq("instrument_version",instrumentVersion),
   db.from("essay_evaluations").select("id").eq("auth_user_id",user.id).eq("evaluation_mode","blackbox").limit(1)
  ]);
  if(legacy.error||google.error||graded.error)throw legacy.error||google.error||graded.error;
  finished=new Set([...(legacy.data||[]),...(google.data||[])].map(x=>x.phase));
  hasAiEvaluation=Boolean(graded.data?.length);
  byId("ath-login-panel").hidden=true;byId("ath-member-panel").hidden=false;
  byId("ath-member-email").textContent="Đã đăng nhập: "+email;
  byId("ath-test-message").hidden=!(allowed.data.is_test&&testEmails.has(email));
  byId("ath-pre-done").textContent=finished.has("PRE")?" ✓":"";
  byId("ath-post-done").textContent=finished.has("POST")?" ✓":"";
  byId("ath-post-tab").hidden=!hasAiEvaluation;
  byId("ath-post-tab").disabled=!hasAiEvaluation;
  byId("ath-post-go").hidden=!hasAiEvaluation;
  updateAiAccess();
  selectPhase(phase==="POST"&&byId("ath-post-tab").disabled?"PRE":phase);
 }catch(error){notify("Không tải được tài khoản: "+(error?.message||"Lỗi kết nối"));updateAiAccess()}
 finally{refreshing=false}
}
// Authentication forms are separate: never treat the login password as a new password.
let authMode="login";
function showAuthMode(mode){
 authMode=mode==="register"?"register":"login";
 const registering=authMode==="register";
 byId("ath-login-form").hidden=registering;
 byId("ath-register-form").hidden=!registering;
 byId("ath-mode-login").setAttribute("aria-pressed",String(!registering));
 byId("ath-mode-register").setAttribute("aria-pressed",String(registering));
 byId("ath-auth-heading").textContent=registering?"Tạo tài khoản ATH":"Đăng nhập ATH";
 clearNotice();
 if(registering&&!byId("ath-register-email").value){
   byId("ath-register-email").value=byId("ath-email").value.trim();
 } else if(!registering&&!byId("ath-email").value){
   byId("ath-email").value=byId("ath-register-email").value.trim();
 }
}
function registerFeedback(){
 const pass=byId("ath-register-password").value,confirm=byId("ath-register-confirm").value;
 const label=byId("ath-register-feedback");
 label.classList.remove("ath-valid","ath-invalid");
 if(!pass&&!confirm){label.textContent="Tạo mật khẩu ít nhất 8 ký tự, sau đó nhập lại để xác nhận.";return false}
 if(pass.length<8){label.textContent="Mật khẩu phải có ít nhất 8 ký tự.";label.classList.add("ath-invalid");return false}
 if(pass.length>72){label.textContent="Mật khẩu không được dài quá 72 ký tự.";label.classList.add("ath-invalid");return false}
 if(!confirm){label.textContent="Vui lòng nhập lại mật khẩu để xác nhận.";return false}
 if(pass!==confirm){label.textContent="Hai mật khẩu chưa trùng khớp.";label.classList.add("ath-invalid");return false}
 label.textContent="✓ Hai mật khẩu trùng khớp.";label.classList.add("ath-valid");return true;
}
async function signIn(){
 clearNotice();
 const email=byId("ath-email").value.trim().toLowerCase();
 const password=byId("ath-password").value;
 if(!validEmail.test(email))return notify("Email chưa hợp lệ. Giảng viên: thuha@hub.edu.vn; sinh viên: email BUH/UEH đã đăng ký.");
 if(!password)return notify("Hãy nhập mật khẩu ATH bạn đã tự tạo. Nếu quên, chọn Quên mật khẩu?");
 const b=byId("ath-login-button");b.disabled=true;
 try{
   const {error}=await db.auth.signInWithPassword({email,password});
   if(error)throw error;
   byId("ath-password").value="";
   await refresh();
 }catch(error){
   const message=(error?.message||"Lỗi đăng nhập");
   notify(message.toLowerCase().includes("invalid login credentials")
     ?"Email hoặc mật khẩu không đúng, hoặc tài khoản chưa xác minh email. Nếu quên mật khẩu, chọn Quên mật khẩu?."
     :"Đăng nhập không thành công: "+message);
 }finally{b.disabled=false}
}
async function signUp(){
 clearNotice();
 const email=byId("ath-register-email").value.trim().toLowerCase();
 if(!validEmail.test(email))return notify("Email đăng ký chưa hợp lệ. Chỉ cho phép email sinh viên BUH/UEH đã đăng ký và email giảng viên thuha@hub.edu.vn.");
 if(!registerFeedback())return notify("Kiểm tra lại mật khẩu và ô xác nhận mật khẩu.");
 const password=byId("ath-register-password").value;
 const b=byId("ath-complete-signup");b.disabled=true;
 try{
   const {data,error}=await db.auth.signUp({email,password,options:{emailRedirectTo:activateRedirect}});
   if(error)throw error;
   byId("ath-register-password").value="";
   byId("ath-register-confirm").value="";
   registerFeedback();
   byId("ath-email").value=email;
   showAuthMode("login");
   if(data?.user&&data?.session){
     notify("Tài khoản đã được tạo và đăng nhập. Đang kiểm tra quyền truy cập...",true);
     await refresh();
   }else{
     notify("Đã tiếp nhận đăng ký. Hãy mở email xác nhận từ Supabase Auth (kiểm tra cả Spam), bấm xác nhận rồi quay lại đăng nhập. Nếu email đã đăng ký, hãy dùng Quên mật khẩu?.",true);
   }
 }catch(error){
   const msg=(error?.message||"Lỗi đăng ký");
   notify(msg.toLowerCase().includes("already registered")
     ?"Email này đã có tài khoản. Hãy đăng nhập hoặc chọn Quên mật khẩu?."
     :"Đăng ký chưa thành công: "+msg);
 }finally{b.disabled=false}
}
async function forgotPassword(){
 const email=byId("ath-email").value.trim().toLowerCase();
 if(!validEmail.test(email))return notify("Nhập email trường trước khi khôi phục mật khẩu.");
 const b=byId("ath-forgot-button");b.disabled=true;
 try{
  const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:activateRedirect+"?recovery=1"});if(error)throw error;
  notify("Nếu tài khoản tồn tại, email hướng dẫn đặt lại mật khẩu sẽ được gửi.",true);
 }catch(error){notify("Không thể gửi yêu cầu: "+(error?.message||"Lỗi gửi"))}finally{b.disabled=false}
}
async function signOut(){
 await db.auth.signOut();user=null;eligibility=null;finished=new Set();
 const result=byId("esp-result");result.replaceChildren();result.classList.remove("ath-has-result");result.classList.add("result-empty");result.textContent="Kết quả sẽ hiển thị ở đây.";hasAiEvaluation=false;byId("ath-post-tab").hidden=true;byId("ath-post-tab").disabled=true;
 byId("ath-post-go").hidden=true;await refresh();notify("Đã đăng xuất.",true)
}
function selectPhase(next){
 if(next==="POST"&&!hasAiEvaluation)return notify("POST chỉ xuất hiện sau khi bạn đã nhận kết quả đánh giá AI.");
 phase=next;clearNotice();
 byId("ath-pre-tab").setAttribute("aria-selected",String(phase==="PRE"));
 byId("ath-post-tab").setAttribute("aria-selected",String(phase==="POST"));
 byId("ath-phase-title").textContent=phase==="PRE"?"PRE — Trước khi viết bài":"POST — Sau khi xem phản hồi AI";
 byId("ath-phase-intro").textContent=phase==="PRE"?"Hãy hoàn thành khảo sát này trước khi viết bài và dùng Black-box AI.":"Hãy trả lời sau khi đọc điểm và bài viết đã chỉnh sửa.";
 const url=formUrls[phase];
 byId("ath-google-form-frame").src=url+"?embedded=true";
 byId("ath-form-open").href=url;
 byId("ath-phase-check-label").textContent=phase;
 byId("ath-google-confirm-check").checked=false;
 byId("ath-google-confirm-button").disabled=finished.has(phase);
 byId("ath-google-confirm-button").textContent=finished.has(phase)?"Đã xác nhận":"Xác nhận đã gửi Google Form";
 byId("ath-google-completed").hidden=!finished.has(phase);
 if(finished.has(phase))byId("ath-google-completed").textContent="Đã ghi nhận xác nhận của bạn. Cô Thư sẽ đối chiếu câu trả lời thật trong Google Sheets.";
 byId("ath-next-ai").hidden=!(phase==="PRE"&&completedPre());
}
async function confirmGoogleForm(){
 if(!user||!eligibility)return notify("Đăng nhập trước khi xác nhận khảo sát.");
 if(finished.has(phase))return;
 if(!byId("ath-google-confirm-check").checked)return notify("Hãy xác nhận bạn đã bấm Gửi (Submit) trên Google Form.");
 const btn=byId("ath-google-confirm-button");btn.disabled=true;
 try{
  const {error}=await db.from("google_form_attestations").insert({
    user_id:user.id,phase,instrument_version:instrumentVersion
  });
  if(error)throw error;
  finished.add(phase);
  notify("ATH đã lưu xác nhận tự khai báo. Kết quả khảo sát thật nằm trên Google Forms/Sheets.",true);
  byId("ath-pre-done").textContent=finished.has("PRE")?" ✓":"";
  byId("ath-post-done").textContent=finished.has("POST")?" ✓":"";
  byId("ath-post-tab").hidden=!hasAiEvaluation;
  byId("ath-post-tab").disabled=!hasAiEvaluation;
  selectPhase(phase);
  updateAiAccess();
  if(phase==="PRE")scrollToAi();
 }catch(error){notify("Không ghi nhận được xác nhận: "+(error?.message||"Lỗi lưu"))}
 finally{btn.disabled=finished.has(phase)}
}
function scrollToAi(){ai.scrollIntoView({behavior:"smooth",block:"start"})}
async function evaluateEssay() {
  const essay = byId("esp-essay").value.trim();
  const domain = byId("esp-domain").value;
  if (!mayUseAi()) return notify("Vui lòng đăng nhập và hoàn thành Google Form PRE trước khi đánh giá.");
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
    // The API returns success only after the AI result has been saved to Supabase.
    hasAiEvaluation=true;
    byId("ath-post-tab").hidden=false;
    byId("ath-post-tab").disabled=false;
    byId("ath-post-go").hidden=false;
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

byId("ath-login-form").addEventListener("submit",event=>{event.preventDefault();signIn()});
byId("ath-register-form").addEventListener("submit",event=>{event.preventDefault();signUp()});
byId("ath-mode-login").addEventListener("click",()=>showAuthMode("login"));
byId("ath-mode-register").addEventListener("click",()=>showAuthMode("register"));
byId("ath-back-to-login").addEventListener("click",()=>showAuthMode("login"));
byId("ath-forgot-button").addEventListener("click",forgotPassword);
byId("ath-logout").addEventListener("click",signOut);
for(const id of ["ath-register-password","ath-register-confirm"]){
 byId(id).addEventListener("input",registerFeedback);
}
for(const toggle of document.querySelectorAll("#ath-login-panel .ath-password-toggle")){
 toggle.addEventListener("click",()=>{
   const input=byId(toggle.dataset.passwordTarget);
   const reveal=input.type==="password";
   input.type=reveal?"text":"password";
   toggle.textContent=reveal?"Ẩn":"Hiện";
   toggle.setAttribute("aria-pressed",String(reveal));
   toggle.setAttribute("aria-label",reveal?"Ẩn mật khẩu":"Hiện mật khẩu");
 });
}
byId("ath-pre-tab").addEventListener("click",()=>selectPhase("PRE"));
byId("ath-post-tab").addEventListener("click",()=>selectPhase("POST"));
byId("ath-google-confirm-button").addEventListener("click",confirmGoogleForm);
byId("ath-next-ai").addEventListener("click",scrollToAi);
byId("esp-analyze-btn").addEventListener("click",evaluateEssay);
byId("esp-reset-btn").addEventListener("click",resetEssay);
byId("ath-post-go").addEventListener("click",()=>{
 selectPhase("POST");survey.scrollIntoView({behavior:"smooth",block:"start"});
});
refresh();
