// ==========================================================================
// CUONEDU PRO — MODULE: SUBJECT & QUESTION BUILDER / EDITOR
// ==========================================================================
// ==========================================================================
// 11. SUBJECT & QUESTION BUILDER / EDITOR
// ==========================================================================
function quickRenameSubject(subId) {
  if (!subId) return;
  const sub = appData.subjects.find(s => s.id === subId);
  if (!sub) return;
  const currentTitle = sub.title || "";
  const newTitle = prompt("Nhập tên mới cho bộ đề thi / môn học:", currentTitle);
  if (newTitle !== null && newTitle.trim() !== "" && newTitle.trim() !== currentTitle) {
    sub.title = newTitle.trim();
    if (typeof currentSubjectId !== "undefined" && currentSubjectId === subId) {
      const titleEl = document.getElementById("editor-subject-title");
      if (titleEl) titleEl.textContent = sub.title;
      const metaEl = document.getElementById("editor-subject-meta");
      if (metaEl) {
        const cat = sub.category || detectCategory(sub.title, sub.code);
        metaEl.textContent = `Phân môn: ${cat} • Mã đề: ${sub.code} • ${sub.questions ? sub.questions.length : 0} câu hỏi`;
      }
    }
    saveData();
    renderApp();
    syncToCloud(false);
    showToast(`Đã đổi tên đề thành: "${sub.title}"`, "success");
  }
}

function openCreateSubjectModal(editSubId = null) {
  if (!requireTeacherAuth(() => openCreateSubjectModal(editSubId))) return;
  parsedQuestionsTemp = [];
  const badge = document.getElementById("create-sub-parsed-badge");
  const preview = document.getElementById("create-sub-preview-section");
  const fileGroup = document.getElementById("create-sub-file-group");
  const submitBtn = document.getElementById("btn-save-subject-main");

  if (badge) {
    badge.style.display = "none";
    badge.textContent = "";
  }
  if (preview) preview.style.display = "none";

  if (editSubId) {
    const sub = appData.subjects.find(s => s.id === editSubId);
    if (sub) {
      document.getElementById("modal-subject-title").textContent = "Chỉnh Sửa Thông Tin Bộ Đề";
      document.getElementById("subject-form-id").value = sub.id;
      document.getElementById("subject-input-name").value = sub.title || "";
      document.getElementById("subject-input-code").value = sub.code || "";
      document.getElementById("subject-input-category").value = sub.category || detectCategory(sub.title, sub.code);
      if (document.getElementById("subject-input-duration")) {
        document.getElementById("subject-input-duration").value = sub.durationMinutes || 15;
      }
      if (fileGroup) fileGroup.style.display = "none";
      if (submitBtn) submitBtn.textContent = "Cập Nhật Thông Tin";
      openModal("modal-subject");
      setTimeout(() => document.getElementById("subject-input-name")?.focus(), 150);
      return;
    }
  }

  document.getElementById("modal-subject-title").textContent = "Tạo Môn Học / Bộ Đề Mới";
  document.getElementById("subject-form-id").value = "";
  document.getElementById("subject-input-name").value = "";
  document.getElementById("subject-input-code").value = `SUB-${Math.floor(100 + Math.random() * 900)}`;
  document.getElementById("subject-input-category").value = currentCategoryFilter !== "all" ? currentCategoryFilter : "GDQP - An Ninh";
  if (document.getElementById("subject-input-duration")) {
    document.getElementById("subject-input-duration").value = "15";
  }
  if (fileGroup) fileGroup.style.display = "block";
  if (submitBtn) submitBtn.textContent = "Lưu Môn Học";

  openModal("modal-subject");
  setTimeout(() => document.getElementById("subject-input-name")?.focus(), 150);
}

function handleSaveSubject(e) {
  e.preventDefault();
  const idStr = document.getElementById("subject-form-id").value;
  const title = document.getElementById("subject-input-name").value.trim();
  const code = document.getElementById("subject-input-code").value.trim();
  const category = document.getElementById("subject-input-category").value || detectCategory(title, code);
  const duration = parseInt(document.getElementById("subject-input-duration")?.value) || 15;

  if (!title) {
    showToast("Vui lòng nhập tên môn học!", "warning");
    return;
  }

  // Validate any parsed questions from file upload
  if (parsedQuestionsTemp.length > 0) {
    const unassigned = parsedQuestionsTemp.filter(q => !q.correctAnswer);
    if (unassigned.length > 0) {
      if (!confirm(`⚠️ Phát hiện ${unassigned.length} câu hỏi chưa được chọn đáp án!\n\nBạn có muốn hệ thống tự động gán đáp án mặc định (A) cho những câu này và tiếp tục lưu không?`)) {
        return;
      }
      parsedQuestionsTemp.forEach(q => {
        if (!q.correctAnswer) q.correctAnswer = "A";
      });
    }
  }

  let targetSub;

  if (idStr) {
    targetSub = appData.subjects.find(s => s.id === parseInt(idStr));
    if (targetSub) {
      targetSub.title = title;
      targetSub.code = code;
      targetSub.category = category;
      targetSub.durationMinutes = duration;
      if (parsedQuestionsTemp.length > 0) {
        targetSub.questions.push(...parsedQuestionsTemp);
      }
      if (typeof currentSubjectId !== "undefined" && currentSubjectId === targetSub.id) {
        const titleEl = document.getElementById("editor-subject-title");
        if (titleEl) titleEl.textContent = targetSub.title;
        const metaEl = document.getElementById("editor-subject-meta");
        if (metaEl) {
          metaEl.textContent = `Phân môn: ${category} • Mã đề: ${code} • ${targetSub.questions ? targetSub.questions.length : 0} câu hỏi`;
        }
      }
      showToast("Đã cập nhật thông tin bộ đề thành công!", "success");
    }
  } else {
    targetSub = {
      id: Date.now(),
      title,
      code,
      category,
      durationMinutes: duration,
      questions: parsedQuestionsTemp.length > 0 ? [...parsedQuestionsTemp] : []
    };
    appData.subjects.unshift(targetSub);
    showToast(`Đã tạo môn học mới${targetSub.questions.length > 0 ? ` kèm ${targetSub.questions.length} câu hỏi!` : '!'}`);
  }

  parsedQuestionsTemp = [];
  isLocalModificationActive = true;
  appData.lastUpdated = Date.now();
  saveData(false);
  closeModal("modal-subject");
  renderApp();

  if (targetSub) {
    openSubjectEditor(targetSub.id);
  }

  syncToCloud(false).finally(() => {
    isLocalModificationActive = false;
  });
}

async function deleteSubject(subId) {
  if (!requireTeacherAuth(() => deleteSubject(subId))) return;
  const sub = appData.subjects.find(s => String(s.id) === String(subId));
  if (!sub) return;

  if (!confirm(`Bạn có chắc chắn muốn xóa môn "${sub.title}" cùng toàn bộ câu hỏi?\nĐề này sẽ được xóa vĩnh viễn trên Cloud và tất cả thiết bị.`)) {
    return;
  }

  isLocalModificationActive = true;
  appData.subjects = appData.subjects.filter(s => String(s.id) !== String(subId));
  appData.lastUpdated = Date.now();
  saveData(false); // Lưu ngay lập tức vào localStorage máy này mà không debounce
  renderApp();

  showToast(`⏳ Đang xóa "${sub.title}" và đồng bộ lên Cloud...`, "info");

  try {
    await syncToCloud(false);
    showToast(`✅ Đã xóa vĩnh viễn môn "${sub.title}" trên Cloud và tất cả thiết bị!`, "success");
  } catch (err) {
    showToast(`Lỗi khi đồng bộ xóa lên Cloud: ${err.message}`, "error");
  } finally {
    isLocalModificationActive = false;
  }
}

function openSubjectEditor(subId) {
  if (!requireTeacherAuth(() => openSubjectEditor(subId))) return;
  const sub = appData.subjects.find(s => String(s.id) === String(subId));
  if (!sub) return;
  currentSubjectId = sub.id;

  const cat = sub.category || detectCategory(sub.title, sub.code);
  document.getElementById("editor-subject-title").textContent = sub.title;
  document.getElementById("editor-subject-meta").textContent = `Phân môn: ${cat} • Mã đề: ${sub.code} • ${sub.questions ? sub.questions.length : 0} câu hỏi`;

  renderEditorQuestionList();
  switchView("editor");
}

function saveAndReturnDashboard() {
  isLocalModificationActive = true;
  appData.lastUpdated = Date.now();
  saveData(false);
  renderApp();
  switchView("dashboard");
  showToast("Đã lưu toàn bộ đề thi an toàn!");
  syncToCloud(false).finally(() => {
    isLocalModificationActive = false;
  });
}


function renderEditorQuestionList() {
  const sub = appData.subjects.find(s => s.id === currentSubjectId);
  const container = document.getElementById("editor-questions-list");
  const emptyState = document.getElementById("editor-empty-state");
  if (!sub || !container || !emptyState) return;

  if (!sub.questions || sub.questions.length === 0) {
    container.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";
  container.innerHTML = "";

  sub.questions.forEach((q, idx) => {
    const card = document.createElement("div");
    card.className = "question-builder-card";

    let optionsHtml = "";
    (q.options || []).forEach(opt => {
      const isCorrect = opt.key === q.correctAnswer;
      optionsHtml += `
        <div class="qb-option-item ${isCorrect ? "correct" : ""}" onclick="setCorrectAnswerQuick(${idx}, '${opt.key}')" style="cursor: pointer;" title="Bấm để chọn làm đáp án đúng">
          <strong class="qb-opt-key">${opt.key}.</strong>
          <span class="qb-opt-text">${escapeHtml(opt.text)}</span>
          ${isCorrect ? `<span class="qb-correct-tag">ĐÚNG</span>` : ""}
        </div>
      `;
    });

    card.innerHTML = `
      <div class="qb-card-top">
        <div class="qb-card-top-left">
          <span class="qb-index-badge">Câu ${idx + 1}</span>
          <span class="qb-level-badge level-thong-hieu">${q.level || "Thông hiểu"}</span>
        </div>
        <div class="qb-card-top-right">
          <button class="btn btn-ghost btn-sm" onclick="editQuestion(${idx})">Sửa</button>
          <button class="btn btn-ghost btn-sm" onclick="deleteQuestion(${idx})" style="color: var(--danger);">Xóa</button>
        </div>
      </div>
      <div class="qb-content-text">${escapeHtml(q.question)}</div>
      <div class="qb-options-grid">${optionsHtml}</div>
      ${q.explanation ? `<div class="qb-explanation-box"><strong>Giải thích:</strong> ${escapeHtml(q.explanation)}</div>` : ""}
    `;
    container.appendChild(card);
  });
}

function setCorrectAnswerQuick(questionIdx, optKey) {
  if (!requireTeacherAuth(() => setCorrectAnswerQuick(questionIdx, optKey))) return;
  const sub = appData.subjects.find(s => s.id === currentSubjectId);
  if (!sub || !sub.questions[questionIdx]) return;
  sub.questions[questionIdx].correctAnswer = optKey;
  saveData();
  renderEditorQuestionList();
  showToast(`Đã chọn đáp án ${optKey} cho Câu #${questionIdx + 1}`);
}

function openAddQuestionModal() {
  if (!requireTeacherAuth(() => openAddQuestionModal())) return;
  document.getElementById("modal-question-title").textContent = "Thêm Câu Hỏi Mới";
  document.getElementById("question-edit-index").value = "-1";
  document.getElementById("q-input-text").value = "";
  document.getElementById("q-input-opt-a").value = "";
  document.getElementById("q-input-opt-b").value = "";
  document.getElementById("q-input-opt-c").value = "";
  document.getElementById("q-input-opt-d").value = "";
  document.getElementById("q-input-opt-e").value = "";
  document.getElementById("q-input-correct").value = "A";
  document.getElementById("q-input-level").value = "Nhận biết";
  document.getElementById("q-input-explanation").value = "";
  openModal("modal-question");
}

function editQuestion(idx) {
  if (!requireTeacherAuth(() => editQuestion(idx))) return;
  const sub = appData.subjects.find(s => s.id === currentSubjectId);
  if (!sub || !sub.questions[idx]) return;
  const q = sub.questions[idx];

  document.getElementById("modal-question-title").textContent = `Sửa Câu Hỏi #${idx + 1}`;
  document.getElementById("question-edit-index").value = idx;
  document.getElementById("q-input-text").value = q.question || "";
  
  const optA = q.options.find(o => o.key === "A")?.text || "";
  const optB = q.options.find(o => o.key === "B")?.text || "";
  const optC = q.options.find(o => o.key === "C")?.text || "";
  const optD = q.options.find(o => o.key === "D")?.text || "";
  const optE = q.options.find(o => o.key === "E")?.text || "";

  document.getElementById("q-input-opt-a").value = optA;
  document.getElementById("q-input-opt-b").value = optB;
  document.getElementById("q-input-opt-c").value = optC;
  document.getElementById("q-input-opt-d").value = optD;
  document.getElementById("q-input-opt-e").value = optE;
  document.getElementById("q-input-correct").value = q.correctAnswer || "A";
  document.getElementById("q-input-level").value = q.level || "Nhận biết";
  document.getElementById("q-input-explanation").value = q.explanation || "";

  openModal("modal-question");
}

function handleSaveQuestion(e) {
  e.preventDefault();
  const sub = appData.subjects.find(s => s.id === currentSubjectId);
  if (!sub) return;

  const idx = parseInt(document.getElementById("question-edit-index").value);
  const questionText = document.getElementById("q-input-text").value.trim();
  const optA = document.getElementById("q-input-opt-a").value.trim();
  const optB = document.getElementById("q-input-opt-b").value.trim();
  const optC = document.getElementById("q-input-opt-c").value.trim();
  const optD = document.getElementById("q-input-opt-d").value.trim();
  const optE = document.getElementById("q-input-opt-e").value.trim();
  const correctAnswer = document.getElementById("q-input-correct").value;
  const level = document.getElementById("q-input-level").value;
  const explanation = document.getElementById("q-input-explanation").value.trim();

  if (!questionText || !optA || !optB) {
    showToast("Vui lòng nhập nội dung câu hỏi và ít nhất 2 đáp án A, B!", "warning");
    return;
  }

  const options = [
    { key: "A", text: optA },
    { key: "B", text: optB }
  ];
  if (optC) options.push({ key: "C", text: optC });
  if (optD) options.push({ key: "D", text: optD });
  if (optE) options.push({ key: "E", text: optE });

  const questionObj = {
    id: idx >= 0 && sub.questions[idx] ? sub.questions[idx].id : Date.now(),
    question: questionText,
    options,
    correctAnswer,
    level,
    explanation
  };

  if (idx >= 0 && idx < sub.questions.length) {
    sub.questions[idx] = questionObj;
    showToast("Đã cập nhật câu hỏi!");
  } else {
    sub.questions.push(questionObj);
    showToast("Đã thêm câu hỏi mới!");
  }

  isLocalModificationActive = true;
  appData.lastUpdated = Date.now();
  saveData(false);
  closeModal("modal-question");
  renderEditorQuestionList();
  renderStats();
  syncToCloud(false).finally(() => {
    isLocalModificationActive = false;
  });
}

async function deleteQuestion(idx) {
  if (!requireTeacherAuth(() => deleteQuestion(idx))) return;
  const sub = appData.subjects.find(s => String(s.id) === String(currentSubjectId));
  if (!sub || !sub.questions[idx]) return;
  if (!confirm(`Bạn có chắc chắn muốn xóa câu hỏi #${idx + 1}?`)) return;

  isLocalModificationActive = true;
  sub.questions.splice(idx, 1);
  appData.lastUpdated = Date.now();
  saveData(false);
  renderEditorQuestionList();
  renderStats();
  showToast("⏳ Đang xóa câu hỏi và cập nhật lên Cloud...", "info");

  try {
    await syncToCloud(false);
    showToast("✅ Đã xóa câu hỏi trên Cloud và tất cả thiết bị!", "success");
  } catch (err) {
    showToast(`Lỗi đồng bộ xóa câu hỏi: ${err.message}`, "error");
  } finally {
    isLocalModificationActive = false;
  }
}

