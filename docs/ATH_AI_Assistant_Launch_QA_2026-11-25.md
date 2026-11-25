# ATH AI Assistant — Launch QA (2026-11-25)

## Scope and version
- Website: https://anystuf.github.io/anhthuhoang_anystuff/index.html#academics
- Backend: Supabase ATH project `aignaxmirbbnfuutvvdg`
- AI Help Edge Function: `ath-help-chat` v1, public help endpoint with request quota and restricted origins
- ESP Edge Function: `ath-blackbox-evaluate` v9, requires a signed-in, allowlisted user; keeps the Black-box feedback boundary
- Both functions read the same `GEMINI_API_KEY` Supabase secret, server-side.
- The browser displays results using `textContent` and strips `*`, `#`, `_`, and code-fence delimiters. Server-side output is sanitized as well.

## Real HTTP integration tests (Supabase database -> published endpoint)

| Test | Observed | Verdict |
|---|---|---|
| Vietnamese staff registration help using `thuha@hub.edu.vn` | HTTP 200, Gemini gives correct sign-up guidance and email confirmation | PASS |
| Vietnamese forgotten-password guidance | HTTP 200, Gemini gives correct reset guidance | PASS |
| POST guidance, with an explicit instruction to output Markdown `** __ #` | HTTP 200, plain text returned without Markdown markers | PASS |
| Request to grade and explain specific writing mistakes | HTTP 200, explicitly refuses individualized essay explanation | PASS |
| Empty request JSON | HTTP 400 validation error | PASS |
| Request with unapproved Origin | HTTP 403 and no Access-Control-Allow-Origin header | PASS |
| OPTIONS preflight with Origin `https://anystuf.github.io` | HTTP 200; Access-Control-Allow-Origin matches site | PASS |
| Public rate-limit table and RPC permissions | RLS active; no read/write/execute granted to `anon` or `authenticated`; service role has RPC execute | PASS |
| GitHub UI script syntax and references | No syntax errors, no missing referenced HTML IDs; cache-busted script | PASS |
| Black-box evaluator deploy and login requirement | Edge Function ACTIVE v9, `verify_jwt=true`; scored essay sample earlier via live UI | PASS for prior pilot; no new authenticated E2E test this run |

The new help endpoint was invoked with real HTTP requests. These are not merely static unit-test claims.

## Privacy and cost controls
- No Gemini key or service-role key appears in published HTML/JavaScript.
- Only server-side Edge Functions call Gemini with the key.
- User messages are not persisted by ATH; only keyed client digests and quota counters are stored.
- Quota: 5 requests/minute and 35/day per hashed client identity, 400/day globally. Model fallback may be used for help, not for production research scoring.
- The chatbot is a site helper, not an essay assessor, and should not produce XAI feedback during the Black-box experiment.

## Important blockers before officially recruiting students
1. **POST Form instrument mismatch**: the linked POST form currently has the title `POST-WRITING & XAI INTERACTION SURVEY / KHẢO SÁT SAU KHI VIẾT VÀ TƯƠNG TÁC VỚI XAI`. Research lead must verify/revise the POST questions and provide the correct URL for the Black-box condition.
2. **Google ownership + analysis access**: the researcher must verify edit ownership and Response-to-Google-Sheets linkage. Although both Forms returned HTTP 200, this does not prove the study's latest instruments or the ability to store a new response.
3. **Authentication email**: no live sign-up → email confirmation → sign-in → reset test was completed in this QA turn. An authorized owner of a real test inbox must do it; do not disclose passwords or tokens.
4. **Full student journey**: PRE Form submission confirmed in the owner Sheet → student self-attests → signs in → Gemini score saved → POST appears → POST response confirmed in owner Sheet must be tested once with a designated pilot user, then excluded from research data.
5. **Password protection**: Supabase security advisor warns that leaked-password protection is disabled. The project owner should review enabling it in Auth settings before wider launch.

## Release judgment
- **Gemini-powered ATH Help chatbot**: function successfully deployed, tested via real HTTP, and integrated into the GitHub source; suitable for a limited pilot.
- **Formal PRE → Black-box AI → POST research collection**: HOLD until form validation/ownership and live sign-up-to-POST parity test complete. Do not report student completion from ATH self-attestation alone.

No private participant records, API keys, or passwords are embedded in this document.
