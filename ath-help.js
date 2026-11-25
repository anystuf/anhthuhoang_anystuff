/* ATH Help — local guidance bot; does not send or store messages. */
(()=>{
"use strict";
if(document.getElementById("ath-help-launcher"))return;
const faqs=[
 {words:["thuha","hub","teacher","giang vien","giao vien","co thu"],text:"Giảng viên dùng chính xác email thuha@hub.edu.vn (HUB). Chọn Tạo tài khoản, nhập lại mật khẩu và xác minh email. Đây là tài khoản kiểm thử được dùng AI mà không cần PRE.",go:"research-survey"},
 {words:["dang ky","tao tai khoan","register","sign up","nhap lai","xac nhan mat khau"],text:"Vào Đăng nhập ATH → Tạo tài khoản. Nhập email đã được cấp quyền, tạo mật khẩu tối thiểu 8 ký tự và nhập lại chính xác. Có nút Hiện / Ẩn để kiểm tra. Nhấn Tạo tài khoản & xác nhận email, sau đó kiểm tra hộp thư.",go:"research-survey"},
 {words:["quen mat khau","forgot","reset","doi mat khau","mat khau nao"],text:"Mật khẩu ATH là mật khẩu bạn tự đặt, không có mật khẩu chung. Nếu quên: nhập email trong tab Đăng nhập → Quên mật khẩu? → mở thư đặt lại từ Supabase Auth. Không chia sẻ mật khẩu.",go:"research-survey"},
 {words:["confirm","xac minh","xac nhan email","spam","localhost","khong nhan mail"],text:"Kiểm tra email từ Supabase Auth và mục Spam rồi nhấn Confirm email address. Nếu liên kết chuyển về localhost, tài khoản có thể đã xác minh; thử trở lại trang ATH đăng nhập. Nếu tiếp tục lỗi, nhờ quản trị kiểm tra cấu hình URL xác thực.",go:"research-survey"},
 {words:["pre","google form","truoc khi viet","pre test"],text:"Đăng nhập rồi mở tab PRE, điền Google Form trước khi viết bài. Khi Form hiển thị đã gửi, quay về ATH tích xác nhận đã gửi để mở AI. Câu trả lời thật được lưu trong Google Forms/Sheets.",go:"research-survey"},
 {words:["post","post test","sau khi cham"],text:"POST sẽ xuất hiện khi hệ thống đã lưu một lượt chấm AI thành công. Sau khi đọc điểm và bài đã sửa, mở tab POST, điền Google Form và nhấn Gửi.",go:"research-survey"},
 {words:["ai","cham bai","blackbox","bai viet","essay","diem"],text:"Trong AI Lab, chọn Law, Finance hoặc Accounting, dán bài tiếng Anh 50–12.000 ký tự, rồi nhấn Đánh giá bài viết. Bạn sẽ nhận điểm /100 và bài viết đã sửa. Đây không phải điểm thi chính thức.",go:"esp-writing-evaluator"},
 {words:["khong dang nhap","invalid login","sai mat khau","dang nhap loi","login"],text:"Kiểm tra email đăng ký và mật khẩu. Tài khoản cần xác minh email và phải có quyền ATH. Giảng viên dùng thuha@hub.edu.vn (HUB). Nếu chưa đăng ký hãy chọn Tạo tài khoản; nếu quên mật khẩu, chọn Quên mật khẩu?.",go:"research-survey"},
 {words:["sheet","csv","thong ke","ket qua","du lieu"],text:"Cô Thư xem câu trả lời PRE/POST trong Google Forms → Responses → Google Sheets. Có thể lọc, tạo biểu đồ và tải CSV. AI lưu điểm và bài đã sửa riêng trong Supabase."},
 {words:["loi","503","qua tai","error","khong duoc"],text:"Nếu gặp lỗi, chụp thông báo lỗi (không chứa mật khẩu hoặc access token) và gửi cho người quản trị. Đăng nhập lại nếu phiên hết hạn; nếu Gemini quá tải có thể thử lại sau."}
];
function norm(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").toLowerCase().trim()}
function reply(question){
 const q=norm(question);let chosen=null,best=0;
 for(const item of faqs){let score=0;for(const key of item.words){if(q.includes(norm(key)))score+=norm(key).length>9?3:2;}if(score>best){best=score;chosen=item}}
 return chosen||{text:"Bạn có thể hỏi về đăng ký ATH, email HUB, mật khẩu, PRE, AI Lab, POST hoặc Google Sheets. Đây là chatbot hướng dẫn tự động, không có quyền xem tài khoản hay mật khẩu của bạn."};
}
function element(tag,id,txt){const e=document.createElement(tag);if(id)e.id=id;if(txt)e.textContent=txt;return e}
const style=element("style",null,null);style.textContent="\n#ath-help-launcher{position:fixed;bottom:20px;right:20px;z-index:13000;border:1px solid #aed2ac;background:#174b35;color:#fff;cursor:pointer;padding:13px 17px;border-radius:999px;font:700 13px system-ui,sans-serif;box-shadow:0 10px 30px #113d2340}\n#ath-help-panel{position:fixed;bottom:78px;right:20px;z-index:13001;width:min(370px,calc(100vw - 28px));max-height:min(620px,calc(100dvh - 100px));display:flex;flex-direction:column;background:#fffefa;border:1px solid #d2e2d1;border-radius:17px;box-shadow:0 20px 50px #09291b4d;overflow:hidden;color:#244534;font:13px/1.6 system-ui,sans-serif}\n#ath-help-panel[hidden]{display:none!important}#ath-help-panel *{box-sizing:border-box}\n#ath-help-head{background:#174b35;color:white;padding:13px 16px;display:flex;justify-content:space-between;gap:12px;align-items:center}\n#ath-help-head strong{font-size:14px}#ath-help-head small{display:block;font-size:10px;opacity:.86}\n#ath-help-close{border:0;background:none;color:#fff;font-size:25px;cursor:pointer}\n#ath-help-messages{padding:14px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;min-height:130px;flex:1}\n.ath-guide-message{font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere;max-width:95%;padding:10px 12px;border-radius:12px}\n.ath-guide-message.bot{align-self:flex-start;background:#edf5ed;color:#21412f}.ath-guide-message.user{align-self:flex-end;background:#174b35;color:#fff}\n#ath-help-quick{padding:2px 12px 11px;display:flex;gap:6px;flex-wrap:wrap}\n#ath-help-quick button{background:white;border:1px solid #c9dfce;color:#194b33;border-radius:100px;cursor:pointer;font:600 11px system-ui,sans-serif;padding:6px 9px}\n#ath-help-form{display:flex;gap:7px;padding:10px 12px;border-top:1px solid #e5eee5}\n#ath-help-input{flex:1;min-width:0;border-radius:9px;border:1px solid #c4d9c9;padding:10px;font:12px system-ui,sans-serif}\n#ath-help-send{border:0;border-radius:9px;background:#174b35;color:white;font:700 12px system-ui,sans-serif;cursor:pointer;padding:9px 13px}\n#ath-help-note{padding:0 13px 10px;color:#6e8274;font-size:10px}\n.ath-help-jump{align-self:flex-start;border:1px solid #c9d8c9;border-radius:8px;background:white;color:#175b39;padding:7px 11px;cursor:pointer}\n@media(max-width:500px){#ath-help-launcher{bottom:12px;right:12px}#ath-help-panel{bottom:69px;right:10px;max-height:calc(100dvh - 88px)}}\n";document.head.append(style);
const toggle=element("button","ath-help-launcher","💬 Hướng dẫn ATH");
toggle.type="button";toggle.setAttribute("aria-expanded","false");toggle.setAttribute("aria-controls","ath-help-panel");
const panel=element("section","ath-help-panel");panel.hidden=true;panel.setAttribute("role","region");panel.setAttribute("aria-label","Trợ lý hướng dẫn ATH");
const head=element("div","ath-help-head");
const title=element("div");title.append(element("strong",null,"Trợ lý hướng dẫn ATH"),element("small",null,"Hỏi về đăng ký, khảo sát và AI Lab"));
const close=element("button","ath-help-close","×");close.type="button";close.setAttribute("aria-label","Đóng chatbot");head.append(title,close);
const messages=element("div","ath-help-messages");messages.setAttribute("role","log");messages.setAttribute("aria-live","polite");
const quick=element("div","ath-help-quick");
const form=element("form","ath-help-form");
const input=element("input","ath-help-input");input.type="text";input.maxLength=300;input.autocomplete="off";input.placeholder="Hỏi về ATH...";input.setAttribute("aria-label","Câu hỏi hướng dẫn");
const send=element("button","ath-help-send","Gửi");send.type="submit";form.append(input,send);
const note=element("div","ath-help-note","Hướng dẫn tự động trên trình duyệt · Không nhập mật khẩu hoặc API key.");
panel.append(head,messages,quick,form,note);document.body.append(toggle,panel);
function say(t,who){const b=element("div");b.className="ath-guide-message "+who;b.textContent=t;messages.append(b);messages.scrollTop=messages.scrollHeight}
function ask(q){
 q=String(q||"").trim();if(!q)return;say(q,"user");input.value="";
 const item=reply(q);say(item.text,"bot");
 if(item.go&&document.getElementById(item.go)){
  const jump=element("button",null,"Mở mục liên quan ↑");jump.type="button";jump.className="ath-help-jump";
  jump.addEventListener("click",()=>{open(false);document.getElementById(item.go).scrollIntoView({behavior:"smooth",block:"start"})});
  messages.append(jump);messages.scrollTop=messages.scrollHeight;
 }
}
function open(yes){panel.hidden=!yes;toggle.setAttribute("aria-expanded",String(yes));if(yes){if(messages.children.length===0)say("Xin chào! Bạn muốn được hướng dẫn tạo tài khoản, làm PRE, dùng AI hay làm POST?","bot");input.focus()}else toggle.focus()}
for(const q of ["Tạo tài khoản","Email HUB","Quên mật khẩu","PRE → AI → POST"]){const b=element("button",null,q);b.type="button";b.addEventListener("click",()=>ask(q));quick.append(b)}
toggle.addEventListener("click",()=>open(panel.hidden));
close.addEventListener("click",()=>open(false));
form.addEventListener("submit",e=>{e.preventDefault();ask(input.value)});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!panel.hidden)open(false)});
})();
