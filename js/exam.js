// ==========================================================================
// CUONEDU PRO — MODULE: EXAM ENGINE & ARENA (QUIZIZZ MODE)
// ==========================================================================
// ==========================================================================
// 7. PRE-EXAM PROMPT & ARENA START
// ==========================================================================
function openPreExamModal(subId) {
  if (subId !== undefined && subId !== null) {
    currentSubjectId = subId;
  } else if (!currentSubjectId) {
    currentSubjectId = selectedSubjectId || (appData.subjects && appData.subjects[0] ? appData.subjects[0].id : null);
  }

  let sub = appData.subjects.find(s => s.id == currentSubjectId || s.code == currentSubjectId);
  if (!sub && typeof DEFAULT_INITIAL_DATA !== "undefined" && Array.isArray(DEFAULT_INITIAL_DATA.subjects)) {
    const fallback = DEFAULT_INITIAL_DATA.subjects.find(s => s.id == currentSubjectId || s.code == currentSubjectId);
    if (fallback) {
      sub = JSON.parse(JSON.stringify(fallback));
      appData.subjects.push(sub);
      saveData(false);
    }
  }
  if (sub && (!sub.questions || sub.questions.length === 0)) {
    if (typeof DEFAULT_INITIAL_DATA !== "undefined" && Array.isArray(DEFAULT_INITIAL_DATA.subjects)) {
      const defMatch = DEFAULT_INITIAL_DATA.subjects.find(s => s.id == sub.id || s.code == sub.code);
      if (defMatch && defMatch.questions && defMatch.questions.length > 0) {
        sub.questions = JSON.parse(JSON.stringify(defMatch.questions));
        saveData(false);
      }
    }
  }
  if (!sub || !sub.questions || sub.questions.length === 0) {
    showToast("Môn này chưa có câu hỏi nào để bắt đầu!", "warning");
    return;
  }

  currentSubjectId = sub.id;

  const titleEl = document.getElementById("pre-exam-sub-title");
  if (titleEl) titleEl.textContent = sub.title;
  const codeEl = document.getElementById("pre-exam-code");
  if (codeEl) codeEl.textContent = sub.code || "101";
  const countEl = document.getElementById("pre-exam-qcount");
  if (countEl) countEl.textContent = sub.questions.length;

  const nameInput = document.getElementById("pre-exam-name");
  if (nameInput) {
    nameInput.value = userProfile.name || "";
    nameInput.placeholder = "Họ và tên thí sinh...";
  }

  const msvInput = document.getElementById("pre-exam-msv");
  if (msvInput) {
    msvInput.value = userProfile.msv || "";
    msvInput.placeholder = "Mã số sinh viên (MSV)...";
  }

  currentCandidateAvatar = userProfile.avatar || "🚀";
  const avatarInput = document.getElementById("pre-exam-selected-avatar");
  if (avatarInput) avatarInput.value = currentCandidateAvatar;
  renderAvatarPicker("pre-exam-avatar-grid", currentCandidateAvatar, (av) => {
    currentCandidateAvatar = av;
    if (avatarInput) avatarInput.value = av;
  });

  const toggle = document.getElementById("pre-exam-instant-toggle");
  if (toggle) {
    toggle.checked = currentScoringMode === "instant";
    handleModeToggleChange(toggle);
  }

  openModal("modal-pre-exam");
}

function handleModeToggleChange(checkbox) {
  const title = document.getElementById("pre-exam-mode-title");
  const desc = document.getElementById("pre-exam-mode-desc");
  const icon = document.getElementById("pre-exam-mode-icon");

  if (checkbox.checked) {
    currentScoringMode = "instant";
    if (icon) icon.textContent = "INSTANT";
    if (title) title.textContent = "Chế độ: Chấm điểm luôn";
    if (desc) desc.textContent = "Bật: Nhận đáp án ngay & Chuỗi Streak | Tắt: Nộp bài chấm sau";
  } else {
    currentScoringMode = "delayed";
    if (icon) icon.textContent = "EXAM";
    if (title) title.textContent = "Chế độ: Chấm điểm sau";
    if (desc) desc.textContent = "Làm bài tự do, gắn cờ xem lại & nộp bài chấm tổng kết sau";
  }
}

function handlePreExamSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const nameInput = document.getElementById("pre-exam-name");
  const msvInput = document.getElementById("pre-exam-msv");
  
  const name = nameInput ? nameInput.value.trim() : "";
  const msv = msvInput ? msvInput.value.trim() : "";
  
  currentCandidateName = name || (userProfile.name || "Thí Sinh");
  currentCandidateMsv = msv || (userProfile.msv || "");
  currentCandidateAvatar = document.getElementById("pre-exam-selected-avatar")?.value || (userProfile.avatar || "🚀");

  const toggle = document.getElementById("pre-exam-instant-toggle");
  currentScoringMode = (toggle && toggle.checked) ? "instant" : "delayed";

  if (!userProfile.isLoggedIn) {
    userProfile.name = currentCandidateName;
    userProfile.msv = currentCandidateMsv;
    userProfile.avatar = currentCandidateAvatar;
    saveUserProfile();
  }

  // Vào thẳng phòng thi mượt mà, không quảng cáo
  closeModal("modal-pre-exam");
  startExam(currentSubjectId);
}

function confirmShopeeAndStartExam() {
  closeModal("modal-pre-exam");
  startExam(currentSubjectId);
}

function cancelShopeeGate() {
  closeModal("modal-shopee-gate");
}

// ==========================================================================
// 8. WAYGROUND / QUIZIZZ ARENA ENGINE (WITH PER-QUESTION TIMER & BGM)
// ==========================================================================
function startExam(subId) {
  if (subId !== undefined && subId !== null) {
    currentSubjectId = subId;
  } else if (!currentSubjectId) {
    currentSubjectId = selectedSubjectId || (appData.subjects && appData.subjects[0] ? appData.subjects[0].id : null);
  }
  const sub = appData.subjects.find(s => s.id == currentSubjectId);
  if (!sub || !sub.questions || sub.questions.length === 0) {
    showToast("Môn này chưa có câu hỏi nào để làm bài!", "warning");
    return;
  }

  // Shuffle questions randomly strictly for the exam session (original bank is NOT shuffled)
  activeExamQuestions = shuffleArray(sub.questions).map(q => ({
    ...q,
    options: q.options ? [...q.options] : []
  }));

  examAnswers = {};
  examFlagged.clear();
  examEliminated = {};
  isExamSubmitted = false;
  isAnswerLockedForSlide = false;
  currentSlideIndex = 0;
  quizizzStreak = 0;
  quizizzMaxStreak = 0;
  quizizzScore = 0;
  examElapsedSeconds = 0;

  hideFeedbackBanner();
  resetPowerups();

  const bottomAvatar = document.getElementById("wg-candidate-avatar");
  const bottomName = document.getElementById("wg-candidate-name");
  if (bottomAvatar) bottomAvatar.textContent = currentCandidateAvatar || "🚀";
  if (bottomName) {
    let displayName = currentCandidateName || "Thí Sinh";
    if (currentCandidateMsv) displayName += ` (${currentCandidateMsv})`;
    bottomName.textContent = displayName;
  }

  const streakPill = document.getElementById("wg-streak-pill");
  const bonusBtn = document.getElementById("wg-bonus-btn");
  if (streakPill) streakPill.style.display = currentScoringMode === "instant" ? "inline-flex" : "none";
  if (bonusBtn) bonusBtn.style.display = currentScoringMode === "instant" ? "inline-flex" : "none";

  updateStreakBadge();
  startExamStopwatch();
  renderQuizizzSlide();
  renderExamMatrix();
  updateProgressBar();

  // Switch to exam room immediately
  switchView("exam");

  // Initialize audio safely without blocking exam entry if audio autoplay is restricted
  try {
    getAudioContext();
    startQuizizzBgm();
  } catch (err) {
    console.warn("Audio initialization warning:", err);
  }
}

function startExamStopwatch() {
  if (examStopwatchInterval) clearInterval(examStopwatchInterval);
  updateStopwatchDisplay();

  examStopwatchInterval = setInterval(() => {
    if (isTimerFrozen || isExamSubmitted) return;
    examElapsedSeconds++;
    updateStopwatchDisplay();
  }, 1000);
}

function updateStopwatchDisplay() {
  const display = document.getElementById("exam-timer-display");
  if (!display) return;
  const mins = Math.floor(examElapsedSeconds / 60);
  const secs = examElapsedSeconds % 60;
  display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function startQuestionTimer() {
  if (questionTimerInterval) clearInterval(questionTimerInterval);
  questionTotalSeconds = 30;
  questionRemainingSeconds = 30;
  questionStartTime = Date.now();
  let frozenAccumulated = 0;
  let lastFrozenTime = Date.now();

  updateQuestionTimerUI();

  let lastReportedSec = 30;

  questionTimerInterval = setInterval(() => {
    if (isExamSubmitted || isAnswerLockedForSlide) {
      clearInterval(questionTimerInterval);
      return;
    }

    const now = Date.now();
    if (isTimerFrozen) {
      frozenAccumulated += (now - lastFrozenTime);
    }
    lastFrozenTime = now;

    if (!isTimerFrozen) {
      const elapsedMs = now - questionStartTime - frozenAccumulated;
      const remainingSec = Math.max(0, questionTotalSeconds - (elapsedMs / 1000));
      questionRemainingSeconds = Math.ceil(remainingSec);

      // Smooth percentage for 60fps fluid bar glide
      const fill = document.getElementById("q-timer-fill");
      if (fill) {
        const percent = Math.max(0, (remainingSec / questionTotalSeconds) * 100);
        fill.style.width = `${percent}%`;
        if (percent < 25) fill.style.background = "#ef4444";
        else if (percent < 55) fill.style.background = "#f59e0b";
        else fill.style.background = "linear-gradient(90deg, #10b981, #f59e0b, #ef4444)";
      }

      // Update text badge & ticks once per whole second
      if (questionRemainingSeconds !== lastReportedSec) {
        lastReportedSec = questionRemainingSeconds;
        const secBadge = document.getElementById("q-timer-seconds");
        const timerWrap = document.getElementById("wg-q-timer-badge");
        if (secBadge) secBadge.textContent = `${questionRemainingSeconds}s`;
        if (timerWrap) {
          if (questionRemainingSeconds <= 5) {
            timerWrap.classList.add("timer-urgent");
          } else {
            timerWrap.classList.remove("timer-urgent");
          }
        }
        if (questionRemainingSeconds <= 5 && questionRemainingSeconds > 0) {
          playQuizizzTone("tick");
        }
      }

      if (remainingSec <= 0) {
        clearInterval(questionTimerInterval);
        if (currentScoringMode === "instant" && !isAnswerLockedForSlide) {
          showToast("Hết thời gian 30s cho câu hỏi này!", "warning");
          handleOptionSelect(null); // time out
        } else if (currentScoringMode === "delayed") {
          showToast("Đã hết 30s gợi ý cho câu hỏi này!", "warning");
        }
      }
    }
  }, 50);
}

function updateQuestionTimerUI() {
  const fill = document.getElementById("q-timer-fill");
  const secBadge = document.getElementById("q-timer-seconds");
  const timerWrap = document.getElementById("wg-q-timer-badge");

  if (secBadge) secBadge.textContent = `${questionRemainingSeconds}s`;
  if (timerWrap) {
    if (questionRemainingSeconds <= 5) {
      timerWrap.classList.add("timer-urgent");
    } else {
      timerWrap.classList.remove("timer-urgent");
    }
  }

  if (fill) {
    const percent = Math.max(0, (questionRemainingSeconds / questionTotalSeconds) * 100);
    fill.style.width = `${percent}%`;
    if (percent < 25) fill.style.background = "#ef4444";
    else if (percent < 55) fill.style.background = "#f59e0b";
    else fill.style.background = "linear-gradient(90deg, #10b981, #f59e0b, #ef4444)";
  }
}

function updateStreakBadge() {
  const streakVal = document.getElementById("quizizz-streak-val");
  const streakPill = document.getElementById("wg-streak-pill");
  if (!streakVal || !streakPill) return;

  streakVal.textContent = quizizzStreak;

  // Dynamic colors: both fire icon & number have the same color, changing every 10 streaks
  let streakColor = "#f59e0b"; // 0-9: Amber Warm Flame
  let streakGlow = "rgba(245, 158, 11, 0.6)";

  if (quizizzStreak >= 50) {
    streakColor = "#38bdf8"; // 50+: Electric Ice / Godlike
    streakGlow = "rgba(56, 189, 248, 0.9)";
  } else if (quizizzStreak >= 40) {
    streakColor = "#a855f7"; // 40-49: Cosmic Violet
    streakGlow = "rgba(168, 85, 247, 0.85)";
  } else if (quizizzStreak >= 30) {
    streakColor = "#ec4899"; // 30-39: Cyber Pink
    streakGlow = "rgba(236, 72, 153, 0.85)";
  } else if (quizizzStreak >= 20) {
    streakColor = "#f43f5e"; // 20-29: Crimson Flame
    streakGlow = "rgba(244, 63, 94, 0.8)";
  } else if (quizizzStreak >= 10) {
    streakColor = "#ff5722"; // 10-19: Vivid Blaze Orange
    streakGlow = "rgba(255, 87, 34, 0.8)";
  }

  streakPill.style.color = streakColor;
  streakVal.style.color = streakColor;
  streakPill.style.textShadow = `0 0 10px ${streakGlow}`;

  if (quizizzStreak >= 3) streakPill.classList.add("streak-fire");
  else streakPill.classList.remove("streak-fire");
}

function renderQuizizzSlide() {
  hideFeedbackBanner();
  const container = document.getElementById("quizizz-slide-card");
  if (!container || !activeExamQuestions || activeExamQuestions.length === 0) return;

  const total = activeExamQuestions.length;
  const q = activeExamQuestions[currentSlideIndex];
  if (!q) return;

  // Toggle question palette button: Hide in instant scoring mode, show in delayed mode
  const paletteBtn = document.querySelector(".btn-arena-palette");
  if (paletteBtn) {
    paletteBtn.style.display = currentScoringMode === "instant" ? "none" : "inline-flex";
  }

  isAnswerLockedForSlide = false;
  startQuestionTimer();

  let imageHtml = "";
  if (q.image) {
    imageHtml = `
      <div class="wg-q-image-wrap">
        <img src="${escapeHtml(q.image)}" alt="Hình minh họa" onerror="this.style.display='none'">
        <button class="wg-zoom-btn" onclick="openImageZoomModal('${escapeHtml(q.image)}')" title="Phóng to ảnh">Phóng to</button>
      </div>
    `;
  }

  const optionsCount = q.options ? q.options.length : 4;
  const gridClass = optionsCount >= 5 ? "grid-5-cols" : "grid-4-cols";
  const eliminatedSet = examEliminated[q.id] || new Set();

  let optionsHtml = "";
  (q.options || []).forEach((opt, idx) => {
    const colorClass = `wg-opt-color-${(idx % 5) + 1}`;
    const isEliminated = eliminatedSet.has(opt.key);
    const isSelected = examAnswers[q.id] === opt.key;

    optionsHtml += `
      <button class="wg-option-btn ${colorClass} ${isEliminated ? "eliminated-5050" : ""} ${isSelected ? "selected-delayed" : ""}" 
              id="opt-btn-${opt.key}"
              onclick="handleOptionSelect('${opt.key}')"
              ${isEliminated ? "disabled" : ""}>
        <span class="opt-key-badge">${opt.key}</span>
        <span class="opt-text">${escapeHtml(opt.text)}</span>
      </button>
    `;
  });

  let delayedNavHtml = "";
  if (currentScoringMode === "delayed") {
    delayedNavHtml = `
      <div class="wg-delayed-nav-bar">
        <button class="btn btn-secondary btn-sm" onclick="navSlide(-1)" ${currentSlideIndex === 0 ? "disabled" : ""}>
          <span>Câu trước</span>
        </button>
        <button class="btn btn-secondary btn-sm" onclick="toggleFlagCurrentQuestion()">
          <span>${examFlagged.has(q.id) ? "Đã gắn cờ" : "Gắn cờ xem lại"}</span>
        </button>
        <button class="btn btn-primary btn-sm" onclick="navSlide(1)" ${currentSlideIndex === total - 1 ? "disabled" : ""}>
          <span>Câu tiếp</span>
        </button>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="wg-question-card" style="font-size: ${examFontSizePercent}%;">
      ${imageHtml}
      <div class="wg-q-text-wrap">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span class="qb-level-badge level-thong-hieu">${q.level || "Thông hiểu"}</span>
        </div>
        <div class="wg-q-text">${escapeHtml(q.question)}</div>
      </div>
    </div>

    <div class="wg-options-grid ${gridClass}">
      ${optionsHtml}
    </div>

    ${delayedNavHtml}
  `;

  updateProgressBar();
  renderExamMatrix();
  renderMathInView(container);
}

function handleOptionSelect(optKey) {
  if (isAnswerLockedForSlide || isExamSubmitted) return;

  if (!activeExamQuestions || !activeExamQuestions[currentSlideIndex]) return;
  const q = activeExamQuestions[currentSlideIndex];

  if (optKey) playQuizizzTone("click");
  if (optKey) examAnswers[q.id] = optKey;

  if (currentScoringMode === "instant") {
    isAnswerLockedForSlide = true;
    if (questionTimerInterval) clearInterval(questionTimerInterval);

    const isCorrect = optKey === q.correctAnswer;
    const chosenBtn = optKey ? document.getElementById(`opt-btn-${optKey}`) : null;
    const correctBtn = document.getElementById(`opt-btn-${q.correctAnswer}`);

    // Dim out all remaining non-relevant options
    const allBtns = document.querySelectorAll(".wg-option-btn");
    allBtns.forEach(btn => {
      btn.disabled = true;
      if (btn !== chosenBtn && btn !== correctBtn) {
        btn.classList.add("dimmed-option");
      }
    });

    const timeSpent = (Date.now() - questionStartTime) / 1000;
    const speedBonus = Math.max(0, Math.round((20 - timeSpent) * 15));

    if (isCorrect) {
      if (chosenBtn) chosenBtn.classList.add("instant-correct");
      playQuizizzTone("correct");

      quizizzStreak++;
      if (quizizzStreak > quizizzMaxStreak) quizizzMaxStreak = quizizzStreak;

      let pointsEarned = 1000 + (quizizzStreak * 100) + speedBonus;
      if (isDoubleScoreActive) {
        pointsEarned *= 2;
        isDoubleScoreActive = false;
        showToast("2x Đã nhân đôi điểm số!", "success");
      }
      quizizzScore += pointsEarned;

      updateStreakBadge();
      showFeedbackBanner(true, `+${pointsEarned.toLocaleString()} ĐIỂM! ${quizizzStreak >= 3 ? "STREAK x" + quizizzStreak : "CHÍNH XÁC!"}`);

      if (quizizzStreak === 3 || quizizzStreak === 5 || quizizzStreak === 10) {
        setTimeout(() => playQuizizzTone("streak"), 200);
      }

      const answeredCount = Object.keys(examAnswers).length;
      if (answeredCount % 4 === 0 && currentSlideIndex < activeExamQuestions.length - 1) {
        updatePowerupsUI();
        setTimeout(() => {
          hideFeedbackBanner();
          triggerMysteryBoxDrop();
        }, 1100);
        return; // Pause auto-advance so user can pick their reward!
      }
    } 
    else {
      if (chosenBtn) chosenBtn.classList.add("instant-wrong");
      if (correctBtn) correctBtn.classList.add("instant-correct");

      if (isShieldActive) {
        isShieldActive = false;
        playQuizizzTone("powerup");
        showToast("Khiên bảo vệ kích hoạt! Chuỗi đúng không bị mất.", "info");
        showFeedbackBanner(false, "KHIÊN ĐÃ CỨU CHUỖI ĐÚNG CỦA BẠN!");
      } else {
        playQuizizzTone("wrong");
        quizizzStreak = 0;
        updateStreakBadge();
        showFeedbackBanner(false, `TIẾC QUÁ! ĐÁP ÁN ĐÚNG LÀ: ${q.correctAnswer}`);
      }
    }

    updatePowerupsUI();

    setTimeout(() => {
      hideFeedbackBanner();
      if (currentSlideIndex < activeExamQuestions.length - 1) {
        currentSlideIndex++;
        renderQuizizzSlide();
      } else {
        submitExam();
      }
    }, 1300);
  } else {
    renderQuizizzSlide();
    showToast(`Đã ghi nhận đáp án câu hỏi`, "info");
  }
}

function navSlide(delta) {
  if (!activeExamQuestions) return;
  const nextIdx = currentSlideIndex + delta;
  if (nextIdx >= 0 && nextIdx < activeExamQuestions.length) {
    currentSlideIndex = nextIdx;
    renderQuizizzSlide();
  }
}

function jumpToSlide(idx) {
  if (!activeExamQuestions || idx < 0 || idx >= activeExamQuestions.length) return;
  currentSlideIndex = idx;
  renderQuizizzSlide();
  closeModal("modal-matrix-palette");
}

function toggleFlagCurrentQuestion() {
  if (!activeExamQuestions || !activeExamQuestions[currentSlideIndex]) return;
  const q = activeExamQuestions[currentSlideIndex];
  if (!q) return;

  if (examFlagged.has(q.id)) {
    examFlagged.delete(q.id);
    showToast("Đã bỏ cờ xem lại", "info");
  } else {
    examFlagged.add(q.id);
    showToast("Đã gắn cờ câu hỏi để xem lại", "warning");
  }
  renderQuizizzSlide();
}

function adjustFontSize(delta) {
  examFontSizePercent = Math.min(150, Math.max(80, examFontSizePercent + delta));
  const card = document.querySelector(".wg-question-card");
  if (card) card.style.fontSize = `${examFontSizePercent}%`;
  showToast(`Cỡ chữ: ${examFontSizePercent}%`, "info");
}

let feedbackBannerTimer = null;
function showFeedbackBanner(isCorrect, text) {
  const banner = document.getElementById("quizizz-feedback-banner");
  if (!banner) return;
  if (feedbackBannerTimer) {
    clearTimeout(feedbackBannerTimer);
    feedbackBannerTimer = null;
  }
  banner.className = `quizizz-feedback-banner show ${isCorrect ? "correct feedback-correct" : "wrong feedback-wrong"}`;
  banner.innerHTML = `<span class="feedback-icon">${isCorrect ? "✨" : "💡"}</span><span class="feedback-text">${text}</span>`;
  banner.style.setProperty("display", "flex", "important");

  // Guaranteed failsafe auto-dismiss after 1.25s
  feedbackBannerTimer = setTimeout(() => {
    hideFeedbackBanner();
  }, 1250);
}

function hideFeedbackBanner() {
  if (feedbackBannerTimer) {
    clearTimeout(feedbackBannerTimer);
    feedbackBannerTimer = null;
  }
  const banner = document.getElementById("quizizz-feedback-banner");
  if (banner) {
    banner.classList.remove("show");
    banner.style.setProperty("display", "none", "important");
    banner.innerHTML = "";
  }
}

function updateProgressBar() {
  const bar = document.getElementById("exam-progress-bar");
  if (!activeExamQuestions || activeExamQuestions.length === 0 || !bar) return;

  const total = activeExamQuestions.length;
  const answered = Object.keys(examAnswers).length;
  const percent = Math.min(100, Math.round((answered / total) * 100));
  bar.style.width = `${percent}%`;
}

function openMatrixPaletteModal() {
  renderExamMatrix();
  openModal("modal-matrix-palette");
}

function renderExamMatrix() {
  const container = document.getElementById("matrix-palette-grid");
  if (!activeExamQuestions || !container) return;

  container.innerHTML = "";
  activeExamQuestions.forEach((q, idx) => {
    const isAnswered = examAnswers[q.id] !== undefined;
    const isCurrent = idx === currentSlideIndex;
    const isFlagged = examFlagged.has(q.id);

    const bubble = document.createElement("button");
    bubble.className = `matrix-bubble ${isAnswered ? "answered" : ""} ${isCurrent ? "active-current" : ""}`;
    bubble.innerHTML = `${idx + 1} ${isFlagged ? "•" : ""}`;
    bubble.onclick = () => jumpToSlide(idx);
    container.appendChild(bubble);
  });
}

// ==========================================================================
// 9. SUBMIT EXAM & CLEAN EXIT / REVIEWS
// ==========================================================================
function submitExam() {
  hideFeedbackBanner();
  let sub = appData.subjects.find(s => String(s.id) === String(currentSubjectId));
  if (!sub) {
    sub = { title: "Bài Kiểm Tra", id: currentSubjectId, questions: activeExamQuestions };
  }
  if (!activeExamQuestions || activeExamQuestions.length === 0) return;

  const totalQ = activeExamQuestions.length;
  const answeredQ = Object.keys(examAnswers).length;

  if (currentScoringMode === "delayed" && answeredQ < totalQ && !confirm(`Bạn còn ${totalQ - answeredQ} câu chưa hoàn thành. Bạn có chắc chắn muốn nộp bài thi ngay?`)) {
    return;
  }

  // Clear all timers and stop BGM
  if (examStopwatchInterval) clearInterval(examStopwatchInterval);
  if (questionTimerInterval) clearInterval(questionTimerInterval);
  if (timerFreezeTimeout) clearTimeout(timerFreezeTimeout);
  stopQuizizzBgm();

  isExamSubmitted = true;

  let correctCount = 0;
  activeExamQuestions.forEach(q => {
    if (examAnswers[q.id] === q.correctAnswer) {
      correctCount++;
    }
  });

  const score10 = ((correctCount / totalQ) * 10).toFixed(1);
  const accuracy = Math.round((correctCount / totalQ) * 100);
  const mins = Math.floor(examElapsedSeconds / 60);
  const secs = examElapsedSeconds % 60;

  playQuizizzTone("victory");
  launchConfetti();

  const resScore = document.getElementById("res-score-number");
  const resAccuracy = document.getElementById("res-accuracy-val");
  const resCorrect = document.getElementById("res-correct-val");
  const resStreak = document.getElementById("res-streak-val");
  const resTime = document.getElementById("res-time-val");

  if (resScore) resScore.textContent = score10;
  if (resAccuracy) resAccuracy.textContent = `${accuracy}%`;
  if (resCorrect) resCorrect.textContent = `${correctCount}/${totalQ}`;
  if (resStreak) resStreak.textContent = `${quizizzMaxStreak}`;
  if (resTime) resTime.textContent = `${mins} phút ${secs}s`;

  let candidateLabel = currentCandidateName || userProfile.name || "Thí Sinh";
  if (currentCandidateMsv) candidateLabel += ` (${currentCandidateMsv})`;

  const candidateRank = saveScoreToWeeklyLeaderboard({
    name: candidateLabel,
    avatar: currentCandidateAvatar || userProfile.avatar || "🚀",
    score: parseFloat(score10),
    accuracy: accuracy,
    correctCount: correctCount,
    totalQuestions: totalQ,
    timeUsedSecs: examElapsedSeconds,
    subjectTitle: sub.title,
    date: new Date().toISOString()
  });

  const rankBanner = document.getElementById("res-rank-banner");
  const rankText = document.getElementById("res-rank-text");
  if (rankBanner && rankText) {
    rankBanner.style.display = "flex";
    if (candidateRank === 1) {
      rankText.innerHTML = `Vinh danh <strong>TOP 1 👑</strong> trên Bảng Xếp Hạng tuần!`;
    } else if (candidateRank <= 3) {
      rankText.innerHTML = `Xuất sắc! Bạn đạt <strong>TOP ${candidateRank} 🏅</strong> trên Bảng Xếp Hạng tuần!`;
    } else if (candidateRank <= 10) {
      rankText.innerHTML = `Chúc mừng! Bạn lọt vào <strong>TOP ${candidateRank}</strong> Bảng Xếp Hạng tuần!`;
    } else {
      rankText.innerHTML = `Bạn đang đứng thứ <strong>#${candidateRank}</strong> trên Bảng Xếp Hạng tuần này!`;
    }
  }

  openModal("modal-result");
}

function startReviewAfterExam() {
  closeModal("modal-result", false);
  const sub = appData.subjects.find(s => s.id === currentSubjectId);
  if (!sub) return;

  renderStudyFeed();
  switchView("study");
  showToast("Đang hiển thị toàn bộ đáp án và giải thích chi tiết!", "info");
}

function confirmExitExam() {
  hideFeedbackBanner();
  if (isExamSubmitted) {
    if (examStopwatchInterval) clearInterval(examStopwatchInterval);
    if (questionTimerInterval) clearInterval(questionTimerInterval);
    if (timerFreezeTimeout) clearTimeout(timerFreezeTimeout);
    stopQuizizzBgm();
    switchView("dashboard");
    return;
  }
  if (confirm("Bạn có chắc chắn muốn rời phòng thi không? Kết quả làm bài sẽ không được lưu.")) {
    if (examStopwatchInterval) clearInterval(examStopwatchInterval);
    if (questionTimerInterval) clearInterval(questionTimerInterval);
    if (timerFreezeTimeout) clearTimeout(timerFreezeTimeout);
    stopQuizizzBgm();
    switchView("dashboard");
  }
}

