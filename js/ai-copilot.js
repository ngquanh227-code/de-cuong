// ==========================================================================
// CUONEDU PRO — MODULE: CUONEDU AI TUTOR & COPILOT (GEMINI API)
// ==========================================================================
// ==========================================================================
// 15. CUONEDU AI TUTOR & EXAM COPILOT (POWERED BY GOOGLE GEMINI 3.5 FLASH)
// ==========================================================================
const GEMINI_API_KEY = localStorage.getItem("cuonedu_gemini_api_key") || (typeof atob !== "undefined" ? atob("QVEuQWI4Uk42SWQyWmc1T0tBNk5YM0w0LVhpSFBSXzFmWlhNVXdTNG5zbC0wUG53MXU2VUE=") : "");
const GEMINI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.5-flash"
];

let aiChatHistory = [];
let isAIChatOpen = false;
let isAITyping = false;

function initDraggableAIFloatBtn() {
  const btn = document.getElementById("cuonedu-ai-btn");
  if (!btn) return;

  let isDragging = false;
  let startX = 0, startY = 0;
  let initialLeft = 0, initialTop = 0;
  let hasMoved = false;

  const onStart = (clientX, clientY) => {
    isDragging = true;
    hasMoved = false;
    startX = clientX;
    startY = clientY;

    const rect = btn.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;

    btn.classList.add("is-dragging");
  };

  const onMove = (clientX, clientY) => {
    if (!isDragging) return;
    const dx = clientX - startX;
    const dy = clientY - startY;

    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      hasMoved = true;
    }

    if (hasMoved) {
      let newLeft = initialLeft + dx;
      let newTop = initialTop + dy;

      const w = btn.offsetWidth || 44;
      const h = btn.offsetHeight || 44;
      const pad = 10;

      newLeft = Math.max(pad, Math.min(window.innerWidth - w - pad, newLeft));
      newTop = Math.max(pad, Math.min(window.innerHeight - h - pad, newTop));

      btn.style.left = `${newLeft}px`;
      btn.style.top = `${newTop}px`;
      btn.style.right = "auto";
      btn.style.bottom = "auto";
    }
  };

  const onEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    btn.classList.remove("is-dragging");

    if (hasMoved) {
      const rect = btn.getBoundingClientRect();
      const w = btn.offsetWidth || 44;
      const mid = window.innerWidth / 2;
      const snapX = rect.left < mid ? 12 : (window.innerWidth - w - 12);

      btn.style.transition = "left 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
      btn.style.left = snapX + "px";
      setTimeout(() => {
        btn.style.transition = "";
      }, 300);
    } else {
      // Tap / Click without dragging -> toggle AI panel immediately
      toggleAIChatbot();
    }
  };

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    if (!hasMoved) {
      toggleAIChatbot();
    }
  });
}

function toggleAIChatbot(forceState) {
  // Trợ lý AI luôn sẵn sàng hỗ trợ học tập, kể cả trong phòng thi/ôn luyện
  const panel = document.getElementById("cuonedu-ai-panel");
  if (!panel) return;

  if (typeof forceState === "boolean") {
    isAIChatOpen = forceState;
  } else {
    isAIChatOpen = !isAIChatOpen;
  }

  panel.style.display = isAIChatOpen ? "flex" : "none";

  if (isAIChatOpen) {
    const input = document.getElementById("ai-user-input");
    if (input) {
      setTimeout(() => input.focus(), 150);
    }
    scrollAIChatToBottom();
  }
}

function clearAIChatHistory() {
  aiChatHistory = [];
  const container = document.getElementById("ai-chat-messages");
  if (container) {
    container.innerHTML = `
      <div class="ai-msg ai-msg-bot">
        <div class="ai-msg-avatar">🤖</div>
        <div class="ai-msg-body">
          <div class="ai-msg-author">CuonEdu AI Gia Sư (Siêu Tốc ⚡)</div>
          <div class="ai-msg-bubble">
            Đã làm mới cuộc hội thoại! Bạn cần mình giải thích câu hỏi nào, tóm tắt bài học hay tạo bộ câu hỏi trắc nghiệm mới?
          </div>
          <div class="ai-msg-time">Vừa xong</div>
        </div>
      </div>
    `;
  }
  showToast("Đã xóa lịch sử trò chuyện AI", "info");
}

function autoResizeAITextarea(textarea) {
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
}

function handleAIChatKeyDown(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendUserAIMessage();
  }
}

function scrollAIChatToBottom() {
  const container = document.getElementById("ai-chat-messages");
  if (container) {
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 30);
  }
}

function formatAIMarkdown(text) {
  if (!text) return "";
  let formatted = text
    // Escape HTML special characters
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Code blocks
    .replace(/```([a-z]*)\n([\s\S]*?)```/gi, '<pre style="background: rgba(0,0,0,0.5); padding: 10px; border-radius: 8px; overflow-x: auto; font-size: 0.82rem; margin: 6px 0;"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.15); padding: 2px 6px; border-radius: 4px; font-size: 0.85em; color: #fde047;">$1</code>')
    // Bold with ** or __
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #ffffff; font-weight: 800;">$1</strong>')
    .replace(/__(.*?)__/g, '<strong style="color: #ffffff; font-weight: 800;">$1</strong>')
    // Italics
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Bullet lists
    .replace(/^\s*[\-\*•]\s+(.*)$/gm, '<li style="margin-left: 18px; margin-bottom: 4px;">$1</li>')
    // Numbered lists
    .replace(/^\s*(\d+)\.\s+(.*)$/gm, '<li style="margin-left: 18px; margin-bottom: 4px; list-style-type: decimal;">$2</li>')
    // Linebreaks
    .replace(/\n/g, "<br>");

  return formatted;
}

function playAIReplyChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    [659.25, 880.00, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.08, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.2);
    });
  } catch (e) {}
}

/**
 * Open Chatbot specifically to explain the question currently on screen
 */
function openAIChatForCurrentQuestion() {
  toggleAIChatbot(true);
  askAISuggestion("explain_current");
}

/**
 * Handle Preset Quick Action Chips
 */
function askAISuggestion(type) {
  if (isAITyping) return;
  toggleAIChatbot(true);

  if (type === "explain_current") {
    const examView = document.getElementById("view-exam");
    const isExamActive = examView && examView.classList.contains("active");

    if (isExamActive && activeExamQuestions && activeExamQuestions[currentSlideIndex]) {
      const q = activeExamQuestions[currentSlideIndex];
      const optsText = (q.options || []).map(o => `${o.key}. ${o.text}`).join("\n");
      const prompt = `Hãy giải thích ngắn gọn, súc tích câu hỏi sau đây, vì sao đáp án đúng lại là đáp án đó và chia sẻ 1 mẹo nhớ nhanh:\n\n` +
        `Câu hỏi: ${q.question}\n` +
        `${optsText}\n` +
        (q.correctAnswer ? `Đáp án chính xác: ${q.correctAnswer}` : "") +
        (q.explanation ? `\nGhi chú: ${q.explanation}` : "");
      sendUserAIMessage(prompt, `💡 Giải thích câu hỏi #${currentSlideIndex + 1}`);
    } else {
      const sub = appData.subjects.find(s => s.id === currentSubjectId) || appData.subjects[0];
      if (sub && sub.questions && sub.questions.length > 0) {
        const q = sub.questions[0];
        const optsText = (q.options || []).map(o => `${o.key}. ${o.text}`).join("\n");
        const prompt = `Hãy giải thích ngắn gọn câu hỏi mẫu này của môn "${sub.title}":\n\nCâu hỏi: ${q.question}\n${optsText}\nĐáp án: ${q.correctAnswer || 'A'}`;
        sendUserAIMessage(prompt, `💡 Giải thích câu hỏi mẫu môn ${sub.title}`);
      } else {
        sendUserAIMessage("Hãy chia sẻ ngắn gọn 3 mẹo làm bài thi trắc nghiệm đạt điểm cao nhất?", "💡 Mẹo làm bài thi trắc nghiệm");
      }
    }
  } 
  else if (type === "summarize_sub") {
    const sub = appData.subjects.find(s => s.id === currentSubjectId) || appData.subjects[0];
    const subTitle = sub ? sub.title : "Môn Học Đang Chọn";
    const prompt = `Hãy tóm tắt ngắn gọn các ý chính cốt lõi, trọng tâm nhất của môn "${subTitle}" để ôn thi cấp tốc hiệu quả.`;
    sendUserAIMessage(prompt, `⚡ Tóm tắt kiến thức trọng tâm môn ${subTitle}`);
  } 
  else if (type === "generate_5q") {
    const sub = appData.subjects.find(s => s.id === currentSubjectId) || appData.subjects[0];
    const subTitle = sub ? sub.title : "Kiến thức Đại cương";
    const prompt = `Hãy tạo nhanh 5 câu hỏi trắc nghiệm (4 phương án A, B, C, D) cho môn "${subTitle}". Định dạng chuẩn theo mẫu:\n\n` +
      `Câu 1: [Nội dung câu hỏi]\nA. [Phương án A]\nB. [Phương án B]\nC. [Phương án C]\nD. [Phương án D]\nĐáp án: [A/B/C/D]\nGiải thích: [Ngắn gọn]\n\n` +
      `(Tương tự cho Câu 2, 3, 4, 5)`;
    sendUserAIMessage(prompt, `📝 Tạo 5 câu trắc nghiệm mới cho môn ${subTitle}`);
  } 
  else if (type === "study_tips") {
    const prompt = `Chia sẻ ngắn gọn 3 mẹo học nhanh, nhớ lâu (Active Recall, Feynman) và kỹ thuật loại trừ đáp án trắc nghiệm chuẩn nhất.`;
    sendUserAIMessage(prompt, `🎯 Mẹo ghi nhớ & chiến thuật thi cử`);
  }
}

/**
 * Ultra-Fast Streaming Caller for Google Gemini API
 * Streams response in real-time chunk-by-chunk for instant feedback
 */
async function callGeminiStreaming(messagesPayload, systemInstructionText, onChunk) {
  let lastError = null;

  for (const modelName of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;
      const bodyData = {
        contents: messagesPayload,
        generationConfig: {
          maxOutputTokens: 800,
          temperature: 0.7
        }
      };

      if (systemInstructionText) {
        bodyData.systemInstruction = {
          parts: [{ text: systemInstructionText }]
        };
      }

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyData)
      });

      if (!resp.ok) {
        const errText = await resp.text();
        lastError = new Error(`HTTP ${resp.status}: ${errText}`);
        continue;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // Keep incomplete trailing line

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data:")) {
            const dataStr = trimmed.slice(5).trim();
            if (!dataStr || dataStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content && parsed.candidates[0].content.parts) {
                const chunkText = parsed.candidates[0].content.parts.map(p => p.text || "").join("");
                if (chunkText) {
                  fullText += chunkText;
                  onChunk(fullText);
                }
              }
            } catch (e) {}
          }
        }
      }

      if (fullText.trim()) {
        return fullText;
      } else {
        throw new Error("Không nhận được nội dung từ AI.");
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Không thể kết nối đến máy chủ AI.");
}

/**
 * Send User Message to AI Chatbot with Real-time Token Streaming
 */
async function sendUserAIMessage(overrideText, displayLabel) {
  if (isAITyping) return;

  const inputEl = document.getElementById("ai-user-input");
  const textToSend = (overrideText || (inputEl ? inputEl.value : "")).trim();
  if (!textToSend) return;

  if (inputEl && !overrideText) {
    inputEl.value = "";
    autoResizeAITextarea(inputEl);
  }

  const userDisplayText = displayLabel || textToSend;
  const messagesContainer = document.getElementById("ai-chat-messages");
  const typingIndicator = document.getElementById("ai-typing-indicator");
  const sendBtn = document.getElementById("ai-send-btn");

  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Append User Bubble
  if (messagesContainer) {
    const userMsgEl = document.createElement("div");
    userMsgEl.className = "ai-msg ai-msg-user";
    userMsgEl.innerHTML = `
      <div class="ai-msg-avatar">👤</div>
      <div class="ai-msg-body">
        <div class="ai-msg-author">Bạn</div>
        <div class="ai-msg-bubble">${formatAIMarkdown(userDisplayText)}</div>
        <div class="ai-msg-time">${nowTime}</div>
      </div>
    `;
    messagesContainer.appendChild(userMsgEl);
    scrollAIChatToBottom();
  }

  // Update State & Show Typing Indicator
  isAITyping = true;
  if (typingIndicator) typingIndicator.style.display = "flex";
  if (sendBtn) sendBtn.disabled = true;
  scrollAIChatToBottom();

  // Build Payload
  aiChatHistory.push({ role: "user", parts: [{ text: textToSend }] });

  // Provide System Context
  const activeSub = appData.subjects.find(s => s.id === currentSubjectId) || appData.subjects[0];
  const subInfo = activeSub ? `Môn: "${activeSub.title}" (Mã: ${activeSub.code}, Thể loại: ${activeSub.category})` : "Chưa chọn môn";

  const systemInstruction = `Bạn là CuonEdu AI — Gia Sư & Trợ Lý Học Tập Siêu Tốc của nền tảng thi trắc nghiệm CuonEdu Pro.
Bối cảnh: ${subInfo}

Nguyên tắc phản hồi:
1. Trả lời bằng tiếng Việt ngắn gọn, súc tích, đi thẳng vào trọng tâm vấn đề, không dài dòng lan man.
2. Khi giải thích câu hỏi: Nói ngay đáp án đúng và lý do chính trong 2-3 câu ngắn.
3. Khi sinh câu hỏi trắc nghiệm: Viết theo định dạng chuẩn (Câu 1:... A. B. C. D. Đáp án: Giải thích:).
4. Sử dụng định dạng in đậm (**từ khóa**) và gạch đầu dòng để dễ đọc lướt.`;

  // Create empty bot bubble for real-time streaming
  let botMsgEl = null;
  let botBubbleEl = null;

  function initBotBubble() {
    if (!botMsgEl && messagesContainer) {
      if (typingIndicator) typingIndicator.style.display = "none";
      botMsgEl = document.createElement("div");
      botMsgEl.className = "ai-msg ai-msg-bot";
      botMsgEl.innerHTML = `
        <div class="ai-msg-avatar">⚡</div>
        <div class="ai-msg-body">
          <div class="ai-msg-author">CuonEdu AI (Siêu Tốc)</div>
          <div class="ai-msg-bubble"></div>
          <div class="ai-msg-time">${nowTime}</div>
        </div>
      `;
      messagesContainer.appendChild(botMsgEl);
      botBubbleEl = botMsgEl.querySelector(".ai-msg-bubble");
      scrollAIChatToBottom();
    }
  }

  try {
    const recentHistory = aiChatHistory.slice(-8);
    const replyText = await callGeminiStreaming(recentHistory, systemInstruction, (currentStreamText) => {
      initBotBubble();
      if (botBubbleEl) {
        botBubbleEl.innerHTML = formatAIMarkdown(currentStreamText);
        scrollAIChatToBottom();
      }
    });

    aiChatHistory.push({ role: "model", parts: [{ text: replyText }] });

    // Check if AI generated quiz questions that can be imported
    const parsedGenQuestions = parseSmartText(replyText);
    const canImport = parsedGenQuestions.length >= 2;

    if (canImport && botBubbleEl) {
      const encodedData = encodeURIComponent(JSON.stringify(parsedGenQuestions));
      const importBtnDiv = document.createElement("div");
      importBtnDiv.style.marginTop = "10px";
      importBtnDiv.innerHTML = `
        <button type="button" class="ai-import-btn" onclick="importAIQuestionsFromEncoded('${encodedData}')">
          <span>📥 Thêm ngay ${parsedGenQuestions.length} câu này vào môn "${escapeHtml(activeSub ? activeSub.title : 'Bộ Đề Mới')}"</span>
        </button>
      `;
      botBubbleEl.appendChild(importBtnDiv);
    }

    playAIReplyChime();
    scrollAIChatToBottom();
  } catch (error) {
    if (typingIndicator) typingIndicator.style.display = "none";
    if (messagesContainer) {
      const errEl = document.createElement("div");
      errEl.className = "ai-msg ai-msg-bot";
      errEl.innerHTML = `
        <div class="ai-msg-avatar">⚠️</div>
        <div class="ai-msg-body">
          <div class="ai-msg-author">Hệ Thống AI</div>
          <div class="ai-msg-bubble" style="background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.4); color: #fca5a5;">
            Lỗi kết nối: <strong>${escapeHtml(error.message || 'Lỗi mạng')}</strong>. Đang tự động kết nối lại...
          </div>
          <div class="ai-msg-time">${nowTime}</div>
        </div>
      `;
      messagesContainer.appendChild(errEl);
      scrollAIChatToBottom();
    }
  } finally {
    isAITyping = false;
    if (typingIndicator) typingIndicator.style.display = "none";
    if (sendBtn) sendBtn.disabled = false;
    scrollAIChatToBottom();
  }
}

/**
 * 1-Click Import AI Generated Questions Directly into Active Subject
 */
function importAIQuestionsFromEncoded(encodedData) {
  try {
    const questions = JSON.parse(decodeURIComponent(encodedData));
    if (!questions || questions.length === 0) {
      showToast("Không tìm thấy câu hỏi hợp lệ để nhập!", "warning");
      return;
    }

    let targetSub = appData.subjects.find(s => s.id === currentSubjectId) || appData.subjects[0];
    if (!targetSub) {
      targetSub = {
        id: Date.now(),
        title: "Bộ Đề AI Khởi Tạo",
        code: `AI-${Math.floor(100 + Math.random() * 900)}`,
        category: "Đại Cương & Khác",
        durationMinutes: 15,
        questions: []
      };
      appData.subjects.unshift(targetSub);
    }

    targetSub.questions.push(...questions);
    saveData();
    renderApp();
    showToast(`⚡ Đã thêm thành công ${questions.length} câu hỏi mới từ AI vào "${targetSub.title}"!`, "success");
    playQuizizzTone("powerup");
  } catch (e) {
    showToast("Lỗi khi nhập câu hỏi từ AI: " + e.message, "danger");
  }
}


