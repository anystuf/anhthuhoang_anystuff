# ATH / AnyStuff — Supabase migration staging

**STATUS: PREPARATION ONLY — NO FIRESTORE DATA TRANSFER / NO PRODUCTION CUTOVER.**

This branch `migration/ath-supabase-staging-2026-11-22` isolates the proposed Firebase → Supabase work from `main` and live GitHub Pages.

## Source of truth
- Public frontend: https://github.com/anystuf/anhthuhoang_anystuff
- Firebase/GCP project: `nutrio-app-jarvis-2025`
- Firestore database: `(default)` (previously observed region `asia-southeast1`)
- From frontend code: collections `allowed_students`, `contacts`, `letters`; Cloud Functions `evaluateEspWriting`, `chatWithAI`.
- The full inventory of Firestore collections, subcollections, Auth accounts, rules, evaluation history and Cloud Functions implementation is **NOT verified**.

## Existing Supabase projects are off-limits
Two connected projects already contain unrelated LMS/coding and Design Thinking data. **Do not run SQL or import ATH data into either of them.**

Create a *new dedicated ATH project* only after selecting the target organization. Supabase currently quoted creation at **US$0/month** for the connected organization at the time of inquiry; check before creating because plan/usage billing may change.

## Step-by-step path
1. Obtain authorized, read-only Firestore access. Confirm whether errors are in Console, Firestore API, Firebase Auth, or browser network. A 403 alone does not prove data loss.
2. Enumerate **all** collections/subcollections, record counts, identify Firebase Auth UID ↔ document mappings, list rules and Functions names. Recover the missing Functions source.
3. Export a verified, access-controlled Firestore backup and Authentication backup. Record counts/checksums. Never store research participants' details or anonymous letters in this public repo.
4. Create dedicated Supabase ATH project and apply `sql/001_private_staging.sql`. This schema is private with default-deny access; it does **not** make existing website forms operational.
5. Convert trusted Firestore REST listDocuments JSON with `scripts/firestore_rest_to_jsonl.py`. It preserves IDs, paths, typed Firestore REST document JSON, and decoded convenience fields.
6. Write and test an idempotent privileged importer, preserve original Firestore paths, audit count/checksum and timezone/encoding. Do not assume only the three known collections exist.
7. Plan Supabase Auth migration; validate domain whitelist `@st.buh.edu.vn`, `@st.ueh.edu.vn`. A client-side whitelist alone is insufficient.
8. Implement protected submission endpoints (anti-spam, validation, no public read access to letters/contacts), AI evaluation and chat backend; keep Gemini secrets server-side.
9. Test end-to-end on a separate staging site, including anonymous/authorized/unauthorized users, research data fidelity and rollback. Switch production only after explicit go-live approval.

## Source gaps and security
- The frontend calls `evaluateEspWriting` and `chatWithAI`, but `functions/index.js` is absent from the tracked source on `main`; do not claim parity until recovered/reimplemented.
- Supabase `service_role`/secret key must never be committed or shipped in a static HTML app.
- No production Firebase data has been recovered, no Auth users migrated, and no Supabase schema applied.
- The existing website must remain working as-is throughout staging.

This branch contains only non-sensitive schema, offline conversion code and tests; real exports must be kept private.
