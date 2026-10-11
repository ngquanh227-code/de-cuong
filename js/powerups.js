// ==========================================================================
// CUONEDU PRO — MODULE: POWER-UPS & MYSTERY BOX
// ==========================================================================
// ==========================================================================
// 6. POWER-UPS & MYSTERY BOX
// ==========================================================================
function resetPowerups() {
  userPowerups = { shield: 2, fiftyFifty: 2, doubleScore: 2, freeze: 2 };
  isShieldActive = false;
  isDoubleScoreActive = false;
  isTimerFrozen = false;
  if (timerFreezeTimeout) clearTimeout(timerFreezeTimeout);
  updatePowerupsUI();
}

function updatePowerupsUI() {
  const rack = document.getElementById("wg-powerups-rack");
  if (!rack) return;

  if (currentScoringMode !== "instant") {
    rack.style.display = "none";
    return;
  }
  rack.style.display = "flex";

  const shieldBadge = document.getElementById("pup-count-shield");
  const fiftyBadge = document.getElementById("pup-count-5050");
  const doubleBadge = document.getElementById("pup-count-2x");
  const freezeBadge = document.getElementById("pup-count-freeze");

  if (shieldBadge) shieldBadge.textContent = userPowerups.shield;
  if (fiftyBadge) fiftyBadge.textContent = userPowerups.fiftyFifty;
  if (doubleBadge) doubleBadge.textContent = userPowerups.doubleScore;
  if (freezeBadge) freezeBadge.textContent = userPowerups.freeze;

  const btnShield = document.getElementById("pup-shield");
  const btnDouble = document.getElementById("pup-2x");
  const btnFifty = document.getElementById("pup-5050");
  const btnFreeze = document.getElementById("pup-freeze");

  if (btnShield) btnShield.classList.toggle("active-pu", isShieldActive);
  if (btnDouble) btnDouble.classList.toggle("active-pu", isDoubleScoreActive);
  if (btnFreeze) btnFreeze.classList.toggle("active-pu", isTimerFrozen);
}

function usePowerup(type) {
  if (currentScoringMode !== "instant" || isExamSubmitted || isAnswerLockedForSlide) return;

  if (!activeExamQuestions || !activeExamQuestions[currentSlideIndex]) return;
  const q = activeExamQuestions[currentSlideIndex];

  if (type === "shield" || type === "immunity") {
    if (userPowerups.shield <= 0) return showToast("Bạn đã hết Khiên Bảo Vệ!", "warning");
    userPowerups.shield--;
    isShieldActive = true;
    playQuizizzTone("powerup");
    showToast("Đã bật Khiên: Trả lời sai câu này không bị gãy chuỗi Streak!", "success");
    updatePowerupsUI();
  } 
  else if (type === "doubleScore" || type === "doublePoints") {
    if (userPowerups.doubleScore <= 0) return showToast("Bạn đã hết lượt Nhân Đôi Điểm!", "warning");
    userPowerups.doubleScore--;
    isDoubleScoreActive = true;
    playQuizizzTone("powerup");
    showToast("Đã bật 2x: Nhân đôi điểm số cho câu trả lời đúng tiếp theo!", "success");
    updatePowerupsUI();
  } 
  else if (type === "fiftyFifty") {
    if (userPowerups.fiftyFifty <= 0) return showToast("Bạn đã hết lượt 50/50!", "warning");
    if (!examEliminated[q.id]) examEliminated[q.id] = new Set();
    const wrongKeys = (q.options || []).map(o => o.key).filter(k => k !== q.correctAnswer);
    const eliminateCount = Math.max(1, Math.min(2, Math.max(1, wrongKeys.length - 1)));
    const shuffled = wrongKeys.sort(() => Math.random() - 0.5).slice(0, eliminateCount);
    shuffled.forEach(k => examEliminated[q.id].add(k));

    userPowerups.fiftyFifty--;
    playQuizizzTone("powerup");
    showToast("50/50: Đã xóa bớt 2 đáp án sai trên màn hình!", "info");
    updatePowerupsUI();
    renderQuizizzSlide();
  } 
  else if (type === "freeze" || type === "timeFreeze") {
    if (userPowerups.freeze <= 0) return showToast("Bạn đã hết Đóng Băng Thời Gian!", "warning");
    userPowerups.freeze--;
    isTimerFrozen = true;
    playQuizizzTone("powerup");
    showToast("Đã đóng băng đếm ngược 15 giây!", "success");
    updatePowerupsUI();

    if (timerFreezeTimeout) clearTimeout(timerFreezeTimeout);
    timerFreezeTimeout = setTimeout(() => {
      isTimerFrozen = false;
      showToast("Hết thời gian đóng băng!", "info");
      updatePowerupsUI();
    }, 15000);
  }
}

function triggerMysteryBoxDrop() {
  playQuizizzTone("mystery");
  openModal("modal-mystery-box");
}

function pickReward(rewardType) {
  try {
    if (rewardType === "shield") {
      userPowerups.shield = (userPowerups.shield || 0) + 1;
      showToast("Đã nhận: +1 Khiên Bảo Vệ 🛡️", "success");
    } else if (rewardType === "fiftyFifty") {
      userPowerups.fiftyFifty = (userPowerups.fiftyFifty || 0) + 1;
      showToast("Đã nhận: +1 Trợ Giúp 50/50 🌓", "success");
    } else if (rewardType === "doubleScore") {
      userPowerups.doubleScore = (userPowerups.doubleScore || 0) + 1;
      showToast("Đã nhận: +1 Nhân Đôi Điểm 2X ⚡", "success");
    } else if (rewardType === "freeze") {
      userPowerups.freeze = (userPowerups.freeze || 0) + 1;
      showToast("Đã nhận: +1 Đóng Băng ❄️", "success");
    } else if (rewardType === "bonusPts") {
      quizizzScore = (quizizzScore || 0) + 800;
      showToast("Đã nhận: +800 Điểm Thưởng 💎", "success");
    }

    playQuizizzTone("victory");
    if (typeof launchConfetti === "function") launchConfetti();
    updatePowerupsUI();
  } catch (err) {
    console.error("pickReward error:", err);
  }

  // Always close the modal
  closeModal("modal-mystery-box");

  // Advance smoothly to next question
  setTimeout(() => {
    if (currentSlideIndex < activeExamQuestions.length - 1) {
      currentSlideIndex++;
      renderQuizizzSlide();
    } else {
      submitExam();
    }
  }, 250);
}

function pickMysteryBox(boxNum) {
  const options = ["shield", "fiftyFifty", "doubleScore"];
  pickReward(options[(boxNum - 1) % options.length]);
}

function closeMysteryBoxModal() {
  const m = document.getElementById("modal-mystery-box");
  if (m) m.classList.remove("active");

  // Advance smoothly to next question so the exam never freezes
  setTimeout(() => {
    if (currentSlideIndex < activeExamQuestions.length - 1) {
      currentSlideIndex++;
      renderQuizizzSlide();
    } else {
      submitExam();
    }
  }, 250);
}

function openBonusShopModal() {
  openModal("modal-bonus-shop");
}

