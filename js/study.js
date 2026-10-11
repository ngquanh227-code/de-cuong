// ==========================================================================
// CUONEDU PRO — MODULE: STUDY & FREE REVIEW MODE
// ==========================================================================
// ==========================================================================
// 12. STUDY / REVIEW MODE
// ==========================================================================
function startStudyMode(subId) {
  const sub = appData.subjects.find(s => s.id === subId);
  if (!sub || !sub.questions || sub.questions.length === 0) {
    showToast("Môn này chưa có câu hỏi nào để ôn tập!", "warning");
    return;
  }
  currentSubjectId = subId;

  document.getElementById("study-subject-title").textContent = sub.title;
  renderStudyFeed();
  switchView("study");
}

function renderStudyFeed() {
  const sub = appData.subjects.find(s => s.id === currentSubjectId);
  const container = document.getElementById("study-questions-feed");
  if (!sub || !container) return;

  container.innerHTML = "";
  sub.questions.forEach((q, idx) => {
    const card = document.createElement("div");
    card.className = "question-builder-card";
    card.style.marginBottom = "18px";

    let optionsHtml = "";
    (q.options || []).forEach(opt => {
      const isCorrect = opt.key === q.correctAnswer;
      optionsHtml += `
        <div class="qb-option-item ${isCorrect ? "correct" : ""}">
          <strong>${opt.key}.</strong>
          <span>${escapeHtml(opt.text)}</span>
          ${isCorrect ? `<span class="qb-correct-tag">ĐÁP ÁN CHUẨN</span>` : ""}
        </div>
      `;
    });

    card.innerHTML = `
      <div class="qb-card-top">
        <span class="qb-index-badge">Câu ${idx + 1} / ${sub.questions.length}</span>
        <span class="qb-level-badge level-nhan-biet">${q.level || "Nhận biết"}</span>
      </div>
      <div class="qb-content-text">${escapeHtml(q.question)}</div>
      <div class="qb-options-grid">${optionsHtml}</div>
      ${q.explanation ? `<div class="qb-explanation-box"><strong>Lời giải chi tiết:</strong> ${escapeHtml(q.explanation)}</div>` : ""}
    `;
    container.appendChild(card);
  });
}

