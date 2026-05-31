const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// [QUAN TRỌNG]: Nguyễn hãy dán API Key mới (bắt đầu bằng AIzaSy...) vào đây nhé!
const GOOGLE_AI_API_KEY = "YOUR_SECURE_GEMINI_API_KEY_HERE";
const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);

// ============================================================================
// HÀM 1: ĐÁNH GIÁ BÀI VIẾT ESP (BLACK-BOX & XAI)
// ============================================================================
exports.evaluateEspWriting = onCall(async (request) => {
  const { participantId, domain, mode, taskPrompt, essayText } = request.data;

  if (!essayText || essayText.length < 50) {
    throw new HttpsError("invalid-argument", "Bài viết quá ngắn để hệ thống AI có thể đánh giá chính xác.");
  }

  const jsonSchemaDefinition = `
  {
    "estimated_vstep_level": "string (Ví dụ: Bậc 4 / B2)",
    "confidence": "string (low/medium/high)",
    "total_score": number (0-100),
    "overall_comment": "string",
    "rubric_scores": {
      "task_achievement": { "score": number, "comment": "string" },
      "organization_coherence": { "score": number, "comment": "string" },
      "grammar_accuracy": { "score": number, "comment": "string" },
      "lexical_resource": { "score": number, "comment": "string" },
      "esp_domain_accuracy": { "score": number, "comment": "string" },
      "professional_tone": { "score": number, "comment": "string" }
    },
    "error_explanations": [
      { 
        "error_type": "string", 
        "original_sentence": "string", 
        "corrected_sentence": "string", 
        "why_correction_is_better": "string", 
        "domain_note": "string", 
        "vstep_impact": "string" 
      }
    ],
    "revised_version": "string",
    "learning_notes": ["string"],
    "teacher_review_recommended": boolean
  }`;

  let modeInstruction = "";
  if (mode === "xai") {
    modeInstruction = `
    CRITICAL EXPERIMENTAL MODE: You are operating in EXPLAINABLE AI (XAI) mode. 
    - You MUST thoroughly populate the 'error_explanations' array with detailed sentence-level corrections.
    - Explain the grammar issues and the specific terminology related to the ${domain} domain.
    - Provide deep conceptual insights in 'learning_notes' so the student understands exactly why the correction was made.`;
  } else {
    modeInstruction = `
    CRITICAL EXPERIMENTAL MODE: You are operating in BLACK-BOX mode. 
    - You MUST leave the 'error_explanations' array completely EMPTY []. Do not explain any errors or corrections under any circumstances.
    - You MUST leave the 'learning_notes' array completely EMPTY [].
    - Only output the numerical scores, the overall evaluation comment, and the completely corrected text in 'revised_version'.`;
  }

  const prompt = `
  You are an expert professor in English for Specific Purposes (ESP) and an official VSTEP examiner.
  Evaluate the student's essay strictly based on the technical and structural context of the following domain: ${domain}.

  [Writing Task / Prompt]:
  ${taskPrompt || "Evaluate the professional and academic quality of the text."}

  [Student Essay]:
  ${essayText}

  [Strict Experimental Rules]:
  ${modeInstruction}

  You must respond ONLY with a valid JSON object matching this exact schema. Do not include any extra text, conversational phrases, or markdown block ticks like \`\`\`json.
  ${jsonSchemaDefinition}
  `;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.15 
      }
    });

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    
    // BỘ LỌC TỐI ƯU: Gọt sạch toàn bộ dấu markdown block và các ký tự điều khiển xuống dòng lỗi
    responseText = responseText.replace(/```json/gi, "")
                               .replace(/```/g, "")
                               .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
                               .trim();
    
    const aiResponseData = JSON.parse(responseText);
    return aiResponseData;

  } catch (error) {
    console.error("AI Evaluation Error Backend Pipeline:", error);
    throw new HttpsError("internal", "Hệ thống AI đang bận hoặc gặp lỗi phân tích cú pháp. Vui lòng thử lại sau.");
  }
});

// ============================================================================
// HÀM 2: CHATBOT TƯ VẤN HỌC ĐƯỜNG & NGHỀ NGHIỆP
// ============================================================================
exports.chatWithAI = onCall(async (request) => {
  const { messages } = request.data;

  if (!messages || messages.length === 0) {
    throw new HttpsError("invalid-argument", "Lịch sử trò chuyện không được để trống.");
  }

  const priorMessages = messages.slice(0, -1);
  const latestUserMessage = messages[messages.length - 1].content;

  const historyContents = priorMessages.map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }]
  }));

  const systemInstruction = `
    You are an expert, empathetic School Counselor and Career Orientation Assistant working as an AI representative for Ms. Hoang Anh Thu.
    Your tone must be warm, encouraging, professional, and culturally appropriate for Vietnamese students.
    
    Guidelines:
    1. Help students outline career goals, discover personal strengths, choose university majors, or structure English learning paths.
    2. Active listening: validate their academic stress and language anxiety. Do not judge.
    3. Keep answers concise, readable, and structured using bullet points if needed.
    4. If the student indicates a severe mental health crisis, gently advise them to seek face-to-face guidance from parents, professional teachers, or clinical experts.
    
    Respond in the language the student uses (primarily Vietnamese or English).
  `;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction
    });

    const chat = model.startChat({ history: historyContents });
    const result = await chat.sendMessage(latestUserMessage);
    
    return {
      reply: result.response.text()
    };

  } catch (error) {
    console.error("Chatbot Core Error Pipeline:", error);
    throw new HttpsError("internal", "Trợ lý AI đang bận xử lý thông tin. Vui lòng thử lại sau.");
  }
});