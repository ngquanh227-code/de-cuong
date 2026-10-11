// ==========================================================================
// CUONEDU PRO — MODULE: WEEKLY LEADERBOARD SYSTEM (3D MEDALS)
// ==========================================================================
// ==========================================================================
// 10. WEEKLY LEADERBOARD SYSTEM (AUTO 7-DAY RESET)
// ==========================================================================
function getCurrentWeekKey() {
  const d = new Date();
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getFullYear()}_W${String(weekNo).padStart(2, '0')}`;
}

function getWeeklyResetRemaining() {
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday, 1 is Monday...
  const daysUntilNextMonday = day === 0 ? 1 : (8 - day);
  const nextMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilNextMonday, 0, 0, 0, 0);
  const diffMs = Math.max(0, nextMonday.getTime() - now.getTime());
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, mins };
}

function getLeaderboardData() {
  const weekKey = getCurrentWeekKey();
  const storageKey = LEADERBOARD_PREFIX + weekKey;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveScoreToWeeklyLeaderboard(entry) {
  const weekKey = getCurrentWeekKey();
  const storageKey = LEADERBOARD_PREFIX + weekKey;
  const list = getLeaderboardData();

  list.push(entry);
  list.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.timeUsedSecs - b.timeUsedSecs;
  });

  const rankIdx = list.indexOf(entry);
  const rank = rankIdx >= 0 ? rankIdx + 1 : list.length;

  try {
    localStorage.setItem(storageKey, JSON.stringify(list.slice(0, 100)));
    // Prune old leaderboard weeks
    const lbKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LEADERBOARD_PREFIX)) lbKeys.push(k);
    }
    if (lbKeys.length > 4) {
      lbKeys.sort().slice(0, lbKeys.length - 4).forEach(oldKey => localStorage.removeItem(oldKey));
    }
  } catch (e) {
    console.error("Lỗi lưu BXH:", e);
  }

  return rank;
}

function openLeaderboardModal() {
  renderLeaderboard();
  openModal("modal-leaderboard");
}

function renderLeaderboard() {
  const list = getLeaderboardData();
  const container = document.getElementById("leaderboard-list-container");
  const emptyState = document.getElementById("leaderboard-empty");
  const timerDisplay = document.getElementById("lb-timer-display");

  if (timerDisplay) {
    const { days, hours, mins } = getWeeklyResetRemaining();
    timerDisplay.textContent = `${days} ngày ${hours} giờ ${mins} phút`;
  }

  if (!container || !emptyState) return;

  if (list.length === 0) {
    container.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";
  container.innerHTML = "";

  list.forEach((item, idx) => {
    const row = document.createElement("div");
    const isTop1 = idx === 0;
    const isTop2 = idx === 1;
    const isTop3 = idx === 2;

    let rankClass = "rank-other-row";
    let badgeClass = "rank-other";
    let badgeIcon = `${idx + 1}`;

    let medalTierClass = "medal-titanium";
    let avatarClass = "lb-avatar";

    if (isTop1) {
      rankClass = "rank-1-row";
      avatarClass = "lb-avatar avatar-top-1";
      medalTierClass = "medal-gold";
    } else if (isTop2) {
      rankClass = "rank-2-row";
      avatarClass = "lb-avatar avatar-top-2";
      medalTierClass = "medal-silver";
    } else if (isTop3) {
      rankClass = "rank-3-row";
      avatarClass = "lb-avatar avatar-top-3";
      medalTierClass = "medal-bronze";
    } else {
      rankClass = "rank-other-row";
      medalTierClass = "medal-titanium";
    }

    const rankBadgeHtml = `
      <div class="lb-medal-disc ${medalTierClass}" title="Hạng ${idx + 1}">
        <div class="medal-inner-ring">
          <span class="medal-rank-digit">${idx + 1}</span>
        </div>
      </div>
    `;

    const mins = Math.floor(item.timeUsedSecs / 60);
    const secs = item.timeUsedSecs % 60;
    const timeStr = `${mins > 0 ? mins + 'p ' : ''}${secs}s`;

    row.className = `leaderboard-row ${rankClass}`;
    row.innerHTML = `
      <div class="lb-col-left">
        ${rankBadgeHtml}
        <span class="${avatarClass}">${item.avatar || "🚀"}</span>
        <div class="lb-info">
          <div class="lb-name">${escapeHtml(item.name)}</div>
          <div class="lb-meta">${escapeHtml(item.subjectTitle || "Đề thi")} • ⏱️ ${timeStr}</div>
        </div>
      </div>
      <div class="lb-col-right">
        <div class="lb-score-val">${item.score.toFixed(1)} <span class="lb-score-unit">đ</span></div>
        <div class="lb-acc-val">Đúng ${item.accuracy}% (${item.correctCount || 0}/${item.totalQuestions || 0})</div>
      </div>
    `;
    container.appendChild(row);
  });
}

