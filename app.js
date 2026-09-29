/**
 * CUONEDU PRO — CORE ENGINE (Make by QuangCuon)
 * Features:
 * 1. Single "Làm Bài" button on subject cards -> opens Pre-Exam Setup with Avatar, Name, and Toggle Switch for "Chấm điểm luôn".
 * 2. Super-Enhanced Multi-Format Vietnamese Word (.docx) & Text Regex Parser (same line options, tables, trailing answer keys).
 * 3. Interactive Question Preview & Answer Checker before saving (in both Create Subject modal and Smart Import modal).
 * 4. Per-Question Animated Countdown Timer + Live Clock + Web Audio Synthesizer (BGM Background Loop & SFX).
 * 5. Instant Scoring (Streak combo + Multipliers + Mystery Drops) vs Delayed Exam Grading.
 * 6. Clean Exam Submission Flow (Result Victory modal + direct return to Dashboard or full explanation Review feed).
 * 7. Power-ups (Shield, 50:50, 2x Score, Time Freeze).
 * 8. JSON Backup/Restore, QR Code Mobile Sharing, Weekly Leaderboard (7-day auto-reset).
 */

// ==========================================================================
// 1. STATE & STORAGE KEYS
// ==========================================================================
const STORAGE_KEY = "cuonedu_pro_database_v3";
const USER_KEY = "cuonedu_user_profile";
const LEADERBOARD_PREFIX = "cuonedu_leaderboard_";

const AVATARS_LIST = ["🚀", "🦁", "⚡", "👑", "🔥", "🎮", "🎯", "💎", "🦊", "🐉", "🐺", "🦄", "🏆", "🌟", "🦅", "🥋"];

// Preset Categories
const STANDARD_CATEGORIES = [
  { id: "all", name: "Tất Cả" },
  { id: "gdqp", name: "GDQP - An Ninh" },
  { id: "cntt", name: "Công Nghệ & Tin Học" },
  { id: "xahoi", name: "Khoa Học Xã Hội" },
  { id: "triet", name: "Lý Luận & Triết Học" },
  { id: "tunhien", name: "Khoa Học Tự Nhiên" },
  { id: "khac", name: "Đại Cương & Khác" }
];

function detectCategory(title = "", code = "") {
  const t = (title + " " + code).toLowerCase();
  if (/hp\d|quân\s*sự|an\s*ninh|quốc\s*phòng|gdqp|sĩ\s*quan|chiến\s*thuật|hpo/i.test(t)) {
    return "GDQP - An Ninh";
  }
  if (/tin\s*học|cntt|lập\s*trình|web|code|python|java|c\+\+|thuật\s*toán|database|csdl|máy\s*tính/i.test(t)) {
    return "Công Nghệ & Tin Học";
  }
  if (/địa\s*lý|lịch\s*sử|văn\s*học|văn\s*hóa|du\s*lịch|xã\s*hội|ngoại\s*ngữ|tiếng\s*anh/i.test(t)) {
    return "Khoa Học Xã Hội";
  }
  if (/triết\s*học|mác|lênin|tư\s*tưởng|đảng|chính\s*trị|kinh\s*tế\s*chính\s*trị|chủ\s*nghĩa/i.test(t)) {
    return "Lý Luận & Triết Học";
  }
  if (/toán|vật\s*lý|hóa\s*học|sinh\s*học|giải\s*tích|đại\s*số/i.test(t)) {
    return "Khoa Học Tự Nhiên";
  }
  return "Đại Cương & Khác";
}

// Fisher-Yates Array Shuffle Helper (Used only during exam mode)
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Initial Sample Subject
const INITIAL_DEMO_SUBJECTS = [
  {
    id: 1710000000001,
    title: "Khám Phá Địa Lý & Kỳ Quan Thế Giới",
    code: "GEO-204",
    category: "Khoa Học Xã Hội",
    durationMinutes: 15,
    questions: [
      {
        id: 101,
        question: "Một đất nước không có sông theo đúng nghĩa. Đất nước này nổi tiếng với những tòa nhà cao nhất thế giới, những hòn đảo nhân tạo độc đáo và những chiếc siêu xe cảnh sát ấn tượng.",
        image: "assets/purple_desert_showcase.jpg",
        options: [
          { key: "A", text: "Ả Rập Saudi" },
          { key: "B", text: "Ai Cập" },
          { key: "C", text: "Qatar" },
          { key: "D", text: "các Tiểu Vương Quốc Ả Rập Thống Nhất (UAE)" },
          { key: "E", text: "Bahrain" }
        ],
        correctAnswer: "D",
        level: "Thông hiểu",
        explanation: "UAE (Các Tiểu Vương Quốc Ả Rập Thống Nhất) với thành phố Dubai nổi tiếng sở hữu tòa tháp cao nhất thế giới Burj Khalifa, đảo cọ Palm Jumeirah và không có con sông tự nhiên nào chảy qua."
      },
      {
        id: 102,
        question: "Kim tự tháp vĩ đại Giza và tượng Nhân sư nổi tiếng thuộc về quốc gia cổ đại nào?",
        image: "assets/purple-desert.jpg",
        options: [
          { key: "A", text: "Hy Lạp" },
          { key: "B", text: "Ai Cập" },
          { key: "C", text: "La Mã" },
          { key: "D", text: "Ấn Độ" }
        ],
        correctAnswer: "B",
        level: "Nhận biết",
        explanation: "Kim tự tháp Giza và tượng Nhân sư là những kỳ quan thế giới cổ đại tọa lạc tại Ai Cập."
      },
      {
        id: 103,
        question: "Đại dương nào có diện tích lớn nhất và sâu nhất trên Trái Đất?",
        options: [
          { key: "A", text: "Đại Tây Dương" },
          { key: "B", text: "Ấn Độ Dương" },
          { key: "C", text: "Thái Bình Dương" },
          { key: "D", text: "Bắc Băng Dương" }
        ],
        correctAnswer: "C",
        level: "Nhận biết",
        explanation: "Thái Bình Dương là đại dương lớn nhất và sâu nhất trên Trái Đất, chiếm hơn một phần ba diện tích bề mặt hành tinh."
      },
      {
        id: 104,
        question: "Ngọn núi Everest - đỉnh núi cao nhất thế giới nằm trên dãy núi nào?",
        options: [
          { key: "A", text: "Dãy Alps" },
          { key: "B", text: "Dãy Andes" },
          { key: "C", text: "Dãy Himalaya" },
          { key: "D", text: "Dãy Rocky" }
        ],
        correctAnswer: "C",
        level: "Nhận biết",
        explanation: "Everest (8.848m) nằm trên dãy Himalaya, ở biên giới giữa Nepal và Tây Tạng (Trung Quốc)."
      },
      {
        id: 105,
        question: "Dòng sông nào dài nhất thế giới chảy qua khu vực châu Phi?",
        options: [
          { key: "A", text: "Sông Amazon" },
          { key: "B", text: "Sông Nile (Nin)" },
          { key: "C", text: "Sông Dương Tử" },
          { key: "D", text: "Sông Mississippi" }
        ],
        correctAnswer: "B",
        level: "Thông hiểu",
        explanation: "Sông Nile (châu Phi) dài khoảng 6.650 km, là dòng sông dài nhất thế giới."
      }
    ]
  }
];

let appData = {
  subjects: []
};

// Filter and View States
let currentCategoryFilter = "all";
let currentSearchQuery = "";
let currentSubjectViewMode = "grid"; // "grid" | "grouped"

let userProfile = {
  name: "",
  avatar: "🚀",
  msv: "",
  email: "",
  isLoggedIn: false
};

// Exam State
let currentSubjectId = null;
let currentCandidateName = "";
let currentCandidateMsv = "";
let currentCandidateAvatar = "🚀";
let activeExamQuestions = []; // Shuffled questions used strictly during exam session
let currentScoringMode = "instant"; // "instant" | "delayed"
let currentSlideIndex = 0;
let examAnswers = {};
let examFlagged = new Set();
let examEliminated = {};
let isExamSubmitted = false;
let isAnswerLockedForSlide = false;
let examFontSizePercent = 100;

// Streak & Score
let quizizzStreak = 0;
let quizizzMaxStreak = 0;
let quizizzScore = 0;

// Timers
let examElapsedSeconds = 0;
let examStopwatchInterval = null;
let questionTimerInterval = null;
let questionTotalSeconds = 30;
let questionRemainingSeconds = 30;
let questionStartTime = 0;

// Power-ups
let userPowerups = {
  shield: 2,
  fiftyFifty: 2,
  doubleScore: 2,
  freeze: 2
};
let isShieldActive = false;
let isDoubleScoreActive = false;
let isTimerFrozen = false;
let timerFreezeTimeout = null;

// Audio
let quizizzSoundEnabled = true;
let quizizzBgmEnabled = false;
let bgmInterval = null;
let audioCtx = null;

// Temporary parsed questions for review before saving
let parsedQuestionsTemp = [];

// ==========================================================================
// TEACHER AUTHENTICATION SYSTEM (PASSCODE: 6666)
// ==========================================================================
let isTeacherAuthenticated = false;
let pendingTeacherAction = null;

function requireTeacherAuth(callback) {
  if (isTeacherAuthenticated || sessionStorage.getItem("cuonedu_teacher_auth") === "true") {
    isTeacherAuthenticated = true;
    return true;
  }
  pendingTeacherAction = callback;
  const input = document.getElementById("teacher-pass-input");
  if (input) input.value = "";
  const err = document.getElementById("teacher-auth-error");
  if (err) {
    err.style.display = "none";
    err.textContent = "";
  }
  openModal("modal-teacher-auth");
  setTimeout(() => {
    if (input) input.focus();
  }, 180);
  return false;
}

function handleTeacherAuthSubmit(e) {
  if (e) e.preventDefault();
  const input = document.getElementById("teacher-pass-input");
  const err = document.getElementById("teacher-auth-error");
  const val = input ? input.value.trim() : "";

  if (val === "6666") {
    isTeacherAuthenticated = true;
    try {
      sessionStorage.setItem("cuonedu_teacher_auth", "true");
    } catch (e) {}
    closeModal("modal-teacher-auth");
    showToast("Đã mở khóa quyền Giáo Viên thành công!", "success");
    if (typeof pendingTeacherAction === "function") {
      const cb = pendingTeacherAction;
      pendingTeacherAction = null;
      cb();
    }
  } else {
    if (err) {
      err.textContent = "Mật khẩu không chính xác! Vui lòng thử lại hoặc liên hệ Admin.";
      err.style.display = "block";
    }
    if (input) {
      input.classList.remove("shake-animation");
      void input.offsetWidth;
      input.classList.add("shake-animation");
      input.value = "";
      input.focus();
    }
    showToast("Sai mật khẩu Giáo Viên!", "warning");
  }
}

// ==========================================================================
// 2. INITIALIZATION
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initLayout();
  loadUserProfile();
  loadData();
  renderApp();
  setupGlobalEvents();
});

function loadUserProfile() {
  try {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) userProfile = JSON.parse(saved);
  } catch (e) {
    console.error("Lỗi đọc profile:", e);
  }
  renderUserHeader();
}

function saveUserProfile() {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(userProfile));
  } catch (e) {
    console.error("Lỗi lưu profile:", e);
  }
  renderUserHeader();
}

function renderUserHeader() {
  const loginBtn = document.getElementById("btn-google-login");
  const profilePill = document.getElementById("user-profile-pill");
  const avatarBadge = document.getElementById("user-avatar-badge");
  const nameDisplay = document.getElementById("user-name-display");

  // Drawer Elements
  const drawerLoggedOut = document.getElementById("drawer-user-logged-out");
  const drawerLoggedIn = document.getElementById("drawer-user-logged-in");
  const drawerAvatar = document.getElementById("drawer-avatar-badge");
  const drawerName = document.getElementById("drawer-user-name");

  if (userProfile.isLoggedIn) {
    if (loginBtn) loginBtn.style.display = "none";
    if (profilePill) profilePill.style.display = "flex";
    if (avatarBadge) avatarBadge.textContent = userProfile.avatar || "QN";
    if (nameDisplay) nameDisplay.textContent = userProfile.name || "Học sinh";

    if (drawerLoggedOut) drawerLoggedOut.style.display = "none";
    if (drawerLoggedIn) drawerLoggedIn.style.display = "flex";
    if (drawerAvatar) drawerAvatar.textContent = userProfile.avatar || "QN";
    if (drawerName) drawerName.textContent = userProfile.name || "Học sinh";
  } else {
    if (loginBtn) loginBtn.style.display = "flex";
    if (profilePill) profilePill.style.display = "none";

    if (drawerLoggedOut) drawerLoggedOut.style.display = "flex";
    if (drawerLoggedIn) drawerLoggedIn.style.display = "none";
  }
}

// ==========================================================================
// DRAWER MENU (3 GẠCH) LOGIC
// ==========================================================================
let _lastDrawerToggle = 0;

function toggleMainDrawer(e) {
  if (e) {
    if (e.stopPropagation) e.stopPropagation();
    if (e.preventDefault) e.preventDefault();
  }
  const now = Date.now();
  if (now - _lastDrawerToggle < 300) return; // Ignore duplicate calls within 300ms
  _lastDrawerToggle = now;

  const drawer = document.getElementById("main-drawer");
  if (!drawer) {
    console.error("Không tìm thấy #main-drawer!");
    return;
  }
  
  const isCurrentlyOpen = drawer.classList.contains("active");
  if (isCurrentlyOpen) {
    closeMainDrawer();
  } else {
    openMainDrawer();
  }
}

function openMainDrawer() {
  const drawer = document.getElementById("main-drawer");
  const backdrop = document.getElementById("drawer-backdrop");
  if (drawer) {
    drawer.classList.add("active");
    drawer.style.transform = "translateX(0)";
    drawer.style.visibility = "visible";
    drawer.style.pointerEvents = "auto";
  }
  if (backdrop) {
    backdrop.classList.add("active");
    backdrop.style.opacity = "1";
    backdrop.style.pointerEvents = "auto";
  }
  document.body.style.overflow = "hidden";
}

function closeMainDrawer() {
  const drawer = document.getElementById("main-drawer");
  const backdrop = document.getElementById("drawer-backdrop");
  if (drawer) {
    drawer.classList.remove("active");
    drawer.style.transform = "translateX(100%)";
    drawer.style.visibility = "hidden";
    drawer.style.pointerEvents = "none";
  }
  if (backdrop) {
    backdrop.classList.remove("active");
    backdrop.style.opacity = "0";
    backdrop.style.pointerEvents = "none";
  }
  document.body.style.overflow = "";
}

function toggleDrawerAccordion(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.toggle("open");
  }
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      appData = JSON.parse(saved);
      if (!Array.isArray(appData.subjects) || appData.subjects.length === 0) {
        appData.subjects = INITIAL_DEMO_SUBJECTS;
        saveData();
      }
    } else {
      appData = { subjects: INITIAL_DEMO_SUBJECTS };
      saveData();
    }
    // Migration: ensure all subjects have valid category & sanitize emojis
    if (Array.isArray(appData.subjects)) {
      let hasChanges = false;
      appData.subjects.forEach(s => {
        if (!s.category) {
          s.category = detectCategory(s.title, s.code);
          hasChanges = true;
        } else {
          // Strip any leading emoji or symbols from previous versions
          const cleanCat = s.category.replace(/^[^\w\s\u00C0-\u1EF9-]+/gu, '').trim();
          if (cleanCat && cleanCat !== s.category) {
            s.category = cleanCat;
            hasChanges = true;
          }
        }
      });
      if (hasChanges) saveData();
    }
  } catch (e) {
    console.error("Lỗi nạp database:", e);
    appData = { subjects: INITIAL_DEMO_SUBJECTS };
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  } catch (e) {
    console.error("Lỗi lưu database:", e);
  }
}

function renderApp() {
  renderCategoryFilterTabs();
  renderMasterDetailSystem();
  renderStats();
}

// ==========================================================================
// 3. STATS & DASHBOARD WITH CATEGORY FILTERING & LIVE SEARCH
// ==========================================================================
function setCategoryFilter(catName) {
  currentCategoryFilter = catName;
  renderCategoryFilterTabs();
  renderMasterDetailSystem();
}

function handleSubjectSearch(query) {
  currentSearchQuery = (query || "").trim().toLowerCase();
  const clearBtn = document.getElementById("btn-clear-search");
  if (clearBtn) clearBtn.style.display = currentSearchQuery ? "inline-block" : "none";
  renderMasterDetailSystem();
}

function clearSubjectSearch() {
  const input = document.getElementById("subject-search-input");
  if (input) input.value = "";
  currentSearchQuery = "";
  const clearBtn = document.getElementById("btn-clear-search");
  if (clearBtn) clearBtn.style.display = "none";
  renderMasterDetailSystem();
}

function filterByCardCategory(catName) {
  currentCategoryFilter = catName;
  renderCategoryFilterTabs();
  renderMasterDetailSystem();
}

function renderStats() {
  const totalSubEl = document.getElementById("stat-total-subjects");
  const totalQEl = document.getElementById("stat-total-questions");
  const avgTimeEl = document.getElementById("stat-total-time");

  const totalSubs = appData.subjects.length;
  let totalQs = 0;
  let totalMins = 0;

  appData.subjects.forEach(s => {
    totalQs += s.questions ? s.questions.length : 0;
    totalMins += parseInt(s.durationMinutes) || 15;
  });

  const avgMins = totalSubs > 0 ? Math.round(totalMins / totalSubs) : 0;

  if (totalSubEl) totalSubEl.textContent = totalSubs;
  if (totalQEl) totalQEl.textContent = totalQs;
  if (avgTimeEl) avgTimeEl.textContent = `${avgMins} ph`;
}

function renderCategoryFilterTabs() {
  const container = document.getElementById("subject-category-filter-bar");
  if (!container) return;

  const totalCount = appData.subjects.length;
  
  // Calculate counts for preset categories
  const categoryCounts = {};
  STANDARD_CATEGORIES.forEach(c => {
    if (c.id === "all") {
      categoryCounts[c.id] = totalCount;
    } else {
      categoryCounts[c.name] = 0;
    }
  });

  // Count existing subjects
  appData.subjects.forEach(s => {
    let cat = s.category || detectCategory(s.title, s.code);
    cat = cat.replace(/^[^\w\s\u00C0-\u1EF9-]+/gu, '').trim();
    if (categoryCounts[cat] !== undefined) {
      categoryCounts[cat]++;
    } else {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
  });

  // Build list of pills to display
  let pillsHtml = `
    <button class="cat-pill ${currentCategoryFilter === 'all' ? 'active' : ''}" onclick="setCategoryFilter('all')">
      <span>Tất Cả</span>
      <span class="cat-pill-count">${totalCount}</span>
    </button>
  `;

  STANDARD_CATEGORIES.filter(c => c.id !== "all").forEach(c => {
    const count = categoryCounts[c.name] || 0;
    const isActive = currentCategoryFilter === c.name;
    const safeEnc = encodeURIComponent(c.name);
    pillsHtml += `
      <button class="cat-pill ${isActive ? 'active' : ''}" onclick="setCategoryFilter(decodeURIComponent('${safeEnc}'))">
        <span>${escapeHtml(c.name)}</span>
        <span class="cat-pill-count">${count}</span>
      </button>
    `;
  });

  // Any custom category not in standard list
  Object.keys(categoryCounts).forEach(catName => {
    if (catName !== "all" && !STANDARD_CATEGORIES.some(c => c.name === catName)) {
      const count = categoryCounts[catName];
      const isActive = currentCategoryFilter === catName;
      const safeEnc = encodeURIComponent(catName);
      pillsHtml += `
        <button class="cat-pill ${isActive ? 'active' : ''}" onclick="setCategoryFilter(decodeURIComponent('${safeEnc}'))">
          <span>${escapeHtml(catName)}</span>
          <span class="cat-pill-count">${count}</span>
        </button>
      `;
    }
  });

  container.innerHTML = pillsHtml;
}

// ==========================================================================
// 4. DYNAMIC MULTI-LAYOUT SYSTEM (4 BỐ CỤC: 2 CỘT, LƯỚI THẺ, BẢNG NGANG, TIÊU ĐIỂM)
// ==========================================================================
const LAYOUT_MODES = [
  { id: "master-detail", name: "2 Cột (Master - Detail)", icon: "📱", badge: "2 Cột (iPadOS)" },
  { id: "grid-cards", name: "Lưới Thẻ Lớn (App Store)", icon: "🔲", badge: "Lưới Thẻ (App Store)" },
  { id: "compact-table", name: "Bảng Ngang (macOS Finder)", icon: "📋", badge: "Bảng Ngang (macOS Finder)" },
  { id: "focus-stage", name: "Tiêu Điểm (Focus Stage)", icon: "🎯", badge: "Tiêu Điểm (Focus Stage)" }
];

function getAdaptiveDefaultLayout() {
  // Máy tính (desktop/laptop > 768px): Mặc định là Bảng Ngang (compact-table)
  // Điện thoại (mobile <= 768px): Mặc định là 2 Cột (master-detail) như cũ
  return window.innerWidth > 768 ? "compact-table" : "master-detail";
}

let currentLayoutMode = getAdaptiveDefaultLayout();
let selectedSubjectId = null;

function initLayout() {
  let saved = localStorage.getItem("cuonedu_layout_mode_v2");
  if (!saved) {
    saved = getAdaptiveDefaultLayout();
    try {
      localStorage.setItem("cuonedu_layout_mode_v2", saved);
    } catch (e) {}
  }
  setLayoutMode(saved, false);
}

function setLayoutMode(mode, showNotification = false) {
  const matched = LAYOUT_MODES.find(m => m.id === mode) || LAYOUT_MODES[0];
  currentLayoutMode = matched.id;
  try {
    localStorage.setItem("cuonedu_layout_mode_v2", matched.id);
  } catch (e) {
    console.error("Lỗi lưu layout mode:", e);
  }

  // Update layout pill buttons in catalog control bar
  document.querySelectorAll(".layout-pill-btn").forEach(btn => {
    if (btn.id === `layout-pill-${matched.id}`) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Update drawer layout buttons
  document.querySelectorAll(".layout-choice-btn").forEach(btn => {
    if (btn.getAttribute("data-layout-id") === matched.id) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Update badge label
  const badgeEl = document.getElementById("catalog-mode-badge");
  if (badgeEl) badgeEl.textContent = matched.badge;

  // Re-render catalog view
  renderMasterDetailSystem();

  if (showNotification) {
    showToast(`Đã chuyển bố cục: ${matched.name}`, "info");
  }
}

function getFilteredSubjects() {
  if (!appData || !Array.isArray(appData.subjects)) return [];
  return appData.subjects.filter(sub => {
    let cat = sub.category || detectCategory(sub.title, sub.code);
    cat = cat.replace(/^[^\w\s\u00C0-\u1EF9-]+/gu, '').trim();
    const matchCategory = currentCategoryFilter === "all" || cat === currentCategoryFilter;
    const matchSearch = !currentSearchQuery || 
      (sub.title && sub.title.toLowerCase().includes(currentSearchQuery)) ||
      (sub.code && sub.code.toLowerCase().includes(currentSearchQuery)) ||
      (cat && cat.toLowerCase().includes(currentSearchQuery));
    return matchCategory && matchSearch;
  });
}

function selectSubject(id) {
  selectedSubjectId = id;
  renderMasterDetailSystem();
  if (currentLayoutMode === "master-detail" && window.innerWidth <= 900) {
    const detailEl = document.getElementById("sub-detail-panel");
    if (detailEl) {
      detailEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}

function focusNextSubject() {
  const filtered = getFilteredSubjects();
  if (filtered.length <= 1) return;
  const currentIdx = filtered.findIndex(s => s.id === selectedSubjectId);
  const nextIdx = (currentIdx + 1) % filtered.length;
  selectedSubjectId = filtered[nextIdx].id;
  renderMasterDetailSystem();
}

function focusPrevSubject() {
  const filtered = getFilteredSubjects();
  if (filtered.length <= 1) return;
  const currentIdx = filtered.findIndex(s => s.id === selectedSubjectId);
  const prevIdx = (currentIdx - 1 + filtered.length) % filtered.length;
  selectedSubjectId = filtered[prevIdx].id;
  renderMasterDetailSystem();
}

// Generate shared top bar (category filter pills + quick search) for alternative layouts
function buildLayoutToolbarHtml(filteredCount) {
  const totalCount = appData.subjects.length;
  const categoryCounts = {};
  STANDARD_CATEGORIES.forEach(c => {
    if (c.id === "all") {
      categoryCounts[c.id] = totalCount;
    } else {
      categoryCounts[c.name] = 0;
    }
  });

  appData.subjects.forEach(s => {
    let cat = s.category || detectCategory(s.title, s.code);
    cat = cat.replace(/^[^\w\s\u00C0-\u1EF9-]+/gu, '').trim();
    if (categoryCounts[cat] !== undefined) {
      categoryCounts[cat]++;
    } else {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
  });

  let pillsHtml = `
    <button class="cat-pill ${currentCategoryFilter === 'all' ? 'active' : ''}" onclick="setCategoryFilter('all')">
      <span>Tất Cả</span>
      <span class="cat-pill-count">${totalCount}</span>
    </button>
  `;

  STANDARD_CATEGORIES.filter(c => c.id !== "all").forEach(c => {
    const count = categoryCounts[c.name] || 0;
    const isActive = currentCategoryFilter === c.name;
    const safeEnc = encodeURIComponent(c.name);
    pillsHtml += `
      <button class="cat-pill ${isActive ? 'active' : ''}" onclick="setCategoryFilter(decodeURIComponent('${safeEnc}'))">
        <span>${escapeHtml(c.name)}</span>
        <span class="cat-pill-count">${count}</span>
      </button>
    `;
  });

  return `
    <div class="custom-layout-toolbar">
      <div class="custom-layout-cat-tabs">
        ${pillsHtml}
      </div>
      <div class="custom-layout-search-wrap">
        <span class="custom-layout-search-icon">🔍</span>
        <input type="text" class="custom-layout-search-input" placeholder="Tìm kiếm nhanh môn học..." value="${escapeHtml(currentSearchQuery)}" oninput="handleSubjectSearch(this.value)">
      </div>
    </div>
  `;
}

function renderMasterDetailSystem() {
  const examLayout = document.getElementById("exam-system-layout");
  const masterSidebar = document.getElementById("sub-master-sidebar");
  const detailPanel = document.getElementById("sub-detail-panel");
  const customContainer = document.getElementById("custom-layout-container");
  const countBadge = document.getElementById("sub-count-badge");
  if (!examLayout) return;

  const filtered = getFilteredSubjects();
  if (countBadge) countBadge.textContent = `${filtered.length} môn`;

  // Route to the active layout mode
  if (currentLayoutMode === "grid-cards") {
    examLayout.className = "exam-system-layout layout-grid-cards";
    if (masterSidebar) masterSidebar.style.display = "none";
    if (detailPanel) detailPanel.style.display = "none";
    if (customContainer) {
      customContainer.style.display = "block";
      renderGridCardsLayout(filtered, customContainer);
    }
    return;
  }

  if (currentLayoutMode === "compact-table") {
    examLayout.className = "exam-system-layout layout-compact-table";
    if (masterSidebar) masterSidebar.style.display = "none";
    if (detailPanel) detailPanel.style.display = "none";
    if (customContainer) {
      customContainer.style.display = "block";
      renderCompactTableLayout(filtered, customContainer);
    }
    return;
  }

  if (currentLayoutMode === "focus-stage") {
    examLayout.className = "exam-system-layout layout-focus-stage";
    if (masterSidebar) masterSidebar.style.display = "none";
    if (detailPanel) detailPanel.style.display = "none";
    if (customContainer) {
      customContainer.style.display = "block";
      renderFocusStageLayout(filtered, customContainer);
    }
    return;
  }

  // Default: Master - Detail (2 Cột)
  examLayout.className = "exam-system-layout layout-master-detail";
  if (masterSidebar) masterSidebar.style.display = "";
  if (detailPanel) detailPanel.style.display = "";
  if (customContainer) customContainer.style.display = "none";

  const masterContainer = document.getElementById("sub-master-items-list");
  if (!masterContainer || !detailPanel) return;

  if (filtered.length === 0) {
    masterContainer.innerHTML = `
      <div style="padding: 24px 12px; text-align: center; color: var(--wg-text-subtle); font-size: 0.85rem;">
        Không tìm thấy môn học nào phù hợp.
      </div>
    `;
    detailPanel.innerHTML = `
      <div style="padding: 40px 20px; text-align: center;">
        <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--theme-text-main); margin-bottom: 8px;">Không Tìm Thấy Môn Học</h3>
        <p style="font-size: 0.88rem; color: var(--wg-text-subtle); max-width: 400px; margin: 0 auto 20px;">
          Hãy chọn danh mục phân môn khác hoặc mở Menu 3 gạch để tải đề từ file Word.
        </p>
        <button class="btn btn-primary" onclick="openSmartImportModal()">Tải Đề Word Ngay</button>
      </div>
    `;
    return;
  }

  const subjectStillExists = filtered.some(s => s.id === selectedSubjectId);
  if (!subjectStillExists) {
    selectedSubjectId = filtered[0].id;
  }

  // 1. Render Left Sidebar List
  let listHtml = "";
  filtered.forEach(sub => {
    const isActive = sub.id === selectedSubjectId;
    const qCount = sub.questions ? sub.questions.length : 0;
    const duration = sub.durationMinutes || 15;
    let category = sub.category || detectCategory(sub.title, sub.code);
    category = category.replace(/^[^\w\s\u00C0-\u1EF9-]+/gu, '').trim();

    listHtml += `
      <div class="sub-item-card ${isActive ? 'active' : ''}" onclick="selectSubject(${sub.id})" title="${escapeHtml(sub.title)}">
        <div class="sub-item-top">
          <span class="sub-item-category">${escapeHtml(category)}</span>
          <span class="sub-item-code">${escapeHtml(sub.code || "SUB-" + sub.id.toString().slice(-3))}</span>
        </div>
        <div class="sub-item-body-row">
          <div class="sub-item-title">${escapeHtml(sub.title)}</div>
        </div>
        <div class="sub-item-meta">
          <span>${qCount} câu hỏi</span>
        </div>
      </div>
    `;
  });
  masterContainer.innerHTML = listHtml;

  // 2. Render Right Detail Panel
  const activeSub = filtered.find(s => s.id === selectedSubjectId) || filtered[0];
  if (!activeSub) return;

  const activeQCount = activeSub.questions ? activeSub.questions.length : 0;
  let activeCategory = activeSub.category || detectCategory(activeSub.title, activeSub.code);
  activeCategory = activeCategory.replace(/^[^\w\s\u00C0-\u1EF9-]+/gu, '').trim();

  let questionsPreviewHtml = "";
  if (activeSub.questions && activeSub.questions.length > 0) {
    questionsPreviewHtml = activeSub.questions.map((q, idx) => `
      <div class="detail-q-item">
        <span class="detail-q-num">Câu ${idx + 1}:</span>
        <div class="detail-q-text">${escapeHtml(q.question || q.text || "")}</div>
        <span class="detail-q-badge">${escapeHtml(q.level || "Thông hiểu")}</span>
      </div>
    `).join("");
  } else {
    questionsPreviewHtml = `
      <div style="padding: 20px; text-align: center; color: var(--wg-text-subtle); font-size: 0.85rem;">
        Môn học này chưa có câu hỏi. Nhấn "Chỉnh Sửa Đề" để thêm hoặc nạp từ file Word.
      </div>
    `;
  }

  detailPanel.innerHTML = `
    <div class="detail-subject-header">
      <div class="detail-tags-row">
        <span class="detail-category-badge">${escapeHtml(activeCategory)}</span>
        <span class="detail-code-badge">${escapeHtml(activeSub.code || "SUB-" + activeSub.id.toString().slice(-4))}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <h2 class="detail-title" style="margin: 0; cursor: pointer;" onclick="quickRenameSubject(${activeSub.id})" title="Bấm để đổi tên đề">${escapeHtml(activeSub.title)}</h2>
        <button class="btn btn-ghost btn-sm" onclick="quickRenameSubject(${activeSub.id})" style="padding: 2px 6px; font-size: 0.85rem;" title="Đổi tên bộ đề">✏️</button>
      </div>
      
      <div class="detail-stats-chips">
        <div class="detail-chip">
          <div class="detail-chip-val" style="color: var(--theme-primary, #38bdf8);">${activeQCount}</div>
          <div class="detail-chip-lbl">Tổng số câu hỏi</div>
        </div>
        <div class="detail-chip">
          <div class="detail-chip-val" style="color: var(--brand-accent, #10b981);">Trắc nghiệm</div>
          <div class="detail-chip-lbl">Hình thức thi</div>
        </div>
        ${activeQCount > 50 ? `
        <div class="detail-chip" onclick="splitCurrentSubject(${activeSub.id})" style="cursor: pointer; border-color: rgba(250, 204, 21, 0.4);" title="Bấm để tách đề làm đôi">
          <div class="detail-chip-val" style="color: #facc15;">✂️ Tách Đề</div>
          <div class="detail-chip-lbl">${activeQCount} câu gộp</div>
        </div>` : ''}
      </div>
    </div>

    <!-- Main Exam Action Area -->
    <div class="detail-cta-banner">
      <button class="btn btn-primary btn-exam-hero" onclick="openPreExamModal(${activeSub.id})" title="Bắt đầu vào phòng thi">
        <span>Bắt Đầu Làm Bài</span>
      </button>

      <div class="detail-actions-row">
        <button class="btn btn-secondary" onclick="startStudyMode(${activeSub.id})" title="Xem đáp án & học nhanh không tính giờ">
          <span>Ôn Tập Tự Do</span>
        </button>
        <button class="btn btn-secondary" onclick="openSubjectEditor(${activeSub.id})" title="Chỉnh sửa ngân hàng câu hỏi">
          <span>Chỉnh Sửa Đề</span>
        </button>
        ${activeSub.questions && activeSub.questions.length > 50 ? `
        <button class="btn btn-secondary" onclick="splitCurrentSubject(${activeSub.id})" title="Tách đề này thành 2 đề riêng nếu bị gộp nhầm" style="color: #facc15; border-color: rgba(250, 204, 21, 0.4);">
          <span>✂️ Tách Đề</span>
        </button>` : ''}
        <button class="btn btn-secondary btn-del-subject" onclick="deleteSubject(${activeSub.id})" title="Xóa môn học này">
          <span>Xóa Môn</span>
        </button>
      </div>
    </div>

    <!-- Questions Structure / Outline -->
    <div class="detail-questions-section">
      <div class="detail-q-header">
        <span class="detail-q-title">Cấu Trúc & Danh Sách Câu Hỏi Trong Đề</span>
        <span style="font-size: 0.78rem; color: var(--wg-text-subtle);">${activeQCount} câu</span>
      </div>
      <div class="detail-q-list">
        ${questionsPreviewHtml}
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// RENDER LAYOUT 2: GRID CARDS (APP STORE RESPONSIVE SHOWCASE)
// --------------------------------------------------------------------------
function renderGridCardsLayout(filtered, container) {
  let toolbarHtml = buildLayoutToolbarHtml(filtered.length);

  if (filtered.length === 0) {
    container.innerHTML = `
      ${toolbarHtml}
      <div style="padding: 60px 20px; text-align: center; background: var(--theme-card-bg); border-radius: 20px; border: 1px solid var(--theme-border);">
        <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--theme-text-main); margin-bottom: 8px;">Không Tìm Thấy Môn Học</h3>
        <p style="font-size: 0.9rem; color: var(--wg-text-subtle); max-width: 400px; margin: 0 auto 20px;">
          Không có đề thi nào khớp với bộ lọc danh mục hoặc từ khóa tìm kiếm.
        </p>
        <button class="btn btn-primary" onclick="openSmartImportModal()">Tải Đề Word Mới</button>
      </div>
    `;
    return;
  }

  let cardsHtml = filtered.map(sub => {
    const qCount = sub.questions ? sub.questions.length : 0;
    const duration = sub.durationMinutes || 15;
    let category = sub.category || detectCategory(sub.title, sub.code);
    category = category.replace(/^[^\w\s\u00C0-\u1EF9-]+/gu, '').trim();

    let sampleQuestion = "Chưa có câu hỏi.";
    if (sub.questions && sub.questions.length > 0) {
      sampleQuestion = sub.questions[0].question || sub.questions[0].text || "";
    }

    return `
      <div class="grid-subject-card">
        <div>
          <div class="grid-card-top-row">
            <span class="grid-card-cat-badge">${escapeHtml(category)}</span>
            <span class="grid-card-code-badge">${escapeHtml(sub.code || "SUB-" + sub.id.toString().slice(-4))}</span>
          </div>

          <h3 class="grid-card-title" title="${escapeHtml(sub.title)}">${escapeHtml(sub.title)}</h3>

          <div class="grid-card-meta-chips">
            <div class="grid-card-meta-item">
              <span>📝</span>
              <span>${qCount} câu</span>
            </div>
            ${qCount > 50 ? `
            <div class="grid-card-meta-item" onclick="splitCurrentSubject(${sub.id})" style="cursor: pointer; color: #facc15; border-color: rgba(250, 204, 21, 0.4);" title="Tách đề này">
              <span>✂️ Tách đề</span>
            </div>` : ''}
          </div>

          <div class="grid-card-q-preview" title="Xem trước câu hỏi">
            "${escapeHtml(sampleQuestion)}"
          </div>
        </div>

        <div class="grid-card-actions">
          <button class="grid-card-btn-primary" onclick="openPreExamModal(${sub.id})" title="Bắt đầu thi">
            <span>Bắt Đầu Làm Bài</span>
            <span>→</span>
          </button>
          <div class="grid-card-btn-row">
            <button class="grid-card-btn-sub" onclick="startStudyMode(${sub.id})" title="Ôn tập không tính giờ">Ôn Tập</button>
            <button class="grid-card-btn-sub" onclick="openSubjectEditor(${sub.id})" title="Chỉnh sửa ngân hàng câu hỏi">Sửa</button>
            ${qCount > 50 ? `<button class="grid-card-btn-sub" onclick="splitCurrentSubject(${sub.id})" title="Tách đề" style="color: #facc15;">✂️ Tách</button>` : ''}
            <button class="grid-card-btn-sub btn-del" onclick="deleteSubject(${sub.id})" title="Xóa đề này">✕</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  container.innerHTML = `
    ${toolbarHtml}
    <div class="grid-cards-grid">
      ${cardsHtml}
    </div>
  `;
}

// --------------------------------------------------------------------------
// RENDER LAYOUT 3: COMPACT TABLE (MACOS FINDER / NOTION TABLE)
// --------------------------------------------------------------------------
function renderCompactTableLayout(filtered, container) {
  let toolbarHtml = buildLayoutToolbarHtml(filtered.length);

  if (filtered.length === 0) {
    container.innerHTML = `
      ${toolbarHtml}
      <div style="padding: 60px 20px; text-align: center; background: var(--theme-card-bg); border-radius: 20px; border: 1px solid var(--theme-border);">
        <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--theme-text-main); margin-bottom: 8px;">Không Tìm Thấy Môn Học</h3>
        <p style="font-size: 0.9rem; color: var(--wg-text-subtle); max-width: 400px; margin: 0 auto 20px;">
          Thử tìm kiếm với từ khóa khác hoặc bấm nút bên dưới để nhập đề thi.
        </p>
        <button class="btn btn-primary" onclick="openSmartImportModal()">Tải Đề Word Mới</button>
      </div>
    `;
    return;
  }

  let rowsHtml = filtered.map(sub => {
    const qCount = sub.questions ? sub.questions.length : 0;
    let category = sub.category || detectCategory(sub.title, sub.code);
    category = category.replace(/^[^\w\s\u00C0-\u1EF9-]+/gu, '').trim();

    let sampleQuestion = "";
    if (sub.questions && sub.questions.length > 0) {
      sampleQuestion = sub.questions[0].question || sub.questions[0].text || "";
    }

    return `
      <tr>
        <td style="font-weight: 800; font-family: monospace; color: var(--theme-primary, #38bdf8); font-size: 0.82rem;">
          ${escapeHtml(sub.code || "SUB-" + sub.id.toString().slice(-4))}
        </td>
        <td>
          <div class="table-sub-title-cell">
            <span class="table-sub-title" onclick="quickRenameSubject(${sub.id})" title="Bấm để đổi tên nhanh" style="cursor: pointer;">${escapeHtml(sub.title)} <span style="font-size: 0.72rem; opacity: 0.65;" title="Đổi tên">✏️</span></span>
            ${sampleQuestion ? `<span class="table-sub-preview">${escapeHtml(sampleQuestion)}</span>` : ''}
          </div>
        </td>
        <td>
          <span class="grid-card-cat-badge" style="font-size: 0.72rem;">${escapeHtml(category)}</span>
        </td>
        <td style="font-weight: 700; color: var(--theme-text-main);">
          ${qCount} câu
        </td>
        <td>
          <div class="table-action-group">
            <button class="table-btn-play" onclick="openPreExamModal(${sub.id})" title="Bắt đầu thi">Vào Thi</button>
            <button class="table-btn-icon" onclick="startStudyMode(${sub.id})" title="Ôn tập tự do">Ôn Tập</button>
            <button class="table-btn-icon" onclick="openSubjectEditor(${sub.id})" title="Chỉnh sửa đề">Sửa</button>
            ${qCount > 50 ? `<button class="table-btn-icon" onclick="splitCurrentSubject(${sub.id})" title="Tách đề này thành 2 đề riêng nếu bị gộp nhầm" style="color: #facc15;">✂️ Tách</button>` : ''}
            <button class="table-btn-icon table-btn-del" onclick="deleteSubject(${sub.id})" title="Xóa môn">✕</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  container.innerHTML = `
    ${toolbarHtml}
    <div class="compact-table-card">
      <div class="compact-table-scroll">
        <table class="compact-table">
          <thead>
            <tr>
              <th>Mã Đề</th>
              <th>Môn Học & Đề Thi</th>
              <th>Phân Môn</th>
              <th>Số Câu</th>
              <th style="text-align: right;">Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// RENDER LAYOUT 4: FOCUS STAGE (APPLE CAROUSEL & HERO STAGE)
// --------------------------------------------------------------------------
function renderFocusStageLayout(filtered, container) {
  let toolbarHtml = buildLayoutToolbarHtml(filtered.length);

  if (filtered.length === 0) {
    container.innerHTML = `
      ${toolbarHtml}
      <div style="padding: 60px 20px; text-align: center; background: var(--theme-card-bg); border-radius: 20px; border: 1px solid var(--theme-border);">
        <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--theme-text-main); margin-bottom: 8px;">Không Tìm Thấy Môn Học</h3>
        <p style="font-size: 0.9rem; color: var(--wg-text-subtle); max-width: 400px; margin: 0 auto 20px;">
          Vui lòng chọn danh mục khác hoặc tạo đề thi mới.
        </p>
        <button class="btn btn-primary" onclick="openSmartImportModal()">Tải Đề Word Mới</button>
      </div>
    `;
    return;
  }

  const activeIdx = Math.max(0, filtered.findIndex(s => s.id === selectedSubjectId));
  const activeSub = filtered[activeIdx] || filtered[0];
  selectedSubjectId = activeSub.id;

  const activeQCount = activeSub.questions ? activeSub.questions.length : 0;
  const activeDuration = activeSub.durationMinutes || 15;
  let activeCategory = activeSub.category || detectCategory(activeSub.title, activeSub.code);
  activeCategory = activeCategory.replace(/^[^\w\s\u00C0-\u1EF9-]+/gu, '').trim();

  let questionsPreviewHtml = "";
  if (activeSub.questions && activeSub.questions.length > 0) {
    questionsPreviewHtml = activeSub.questions.slice(0, 4).map((q, idx) => `
      <div class="detail-q-item">
        <span class="detail-q-num">Câu ${idx + 1}:</span>
        <div class="detail-q-text">${escapeHtml(q.question || q.text || "")}</div>
        <span class="detail-q-badge">${escapeHtml(q.level || "Thông hiểu")}</span>
      </div>
    `).join("");
    if (activeSub.questions.length > 4) {
      questionsPreviewHtml += `
        <div style="padding: 8px; text-align: center; color: var(--wg-text-subtle); font-size: 0.8rem;">
          + và còn ${activeSub.questions.length - 4} câu hỏi khác...
        </div>
      `;
    }
  } else {
    questionsPreviewHtml = `
      <div style="padding: 16px; text-align: center; color: var(--wg-text-subtle); font-size: 0.85rem;">
        Đề thi này chưa có câu hỏi. Nhấn "Chỉnh Sửa Đề" để thêm.
      </div>
    `;
  }

  // Thumbnails Strip
  let thumbsHtml = filtered.map(sub => {
    const isThisActive = sub.id === activeSub.id;
    return `
      <div class="focus-thumb-item ${isThisActive ? 'active' : ''}" onclick="selectSubject(${sub.id})" title="${escapeHtml(sub.title)}">
        <div class="focus-thumb-code">${escapeHtml(sub.code || "SUB-" + sub.id.toString().slice(-4))}</div>
        <div class="focus-thumb-title">${escapeHtml(sub.title)}</div>
        <div style="font-size: 0.72rem; color: var(--theme-text-muted); margin-top: 3px;">
          ${sub.questions ? sub.questions.length : 0} câu hỏi
        </div>
      </div>
    `;
  }).join("");

  container.innerHTML = `
    ${toolbarHtml}
    <div class="focus-stage-wrapper">
      <!-- Top Navigation Switcher Bar -->
      <div class="focus-stage-nav-bar">
        <button class="focus-nav-btn" onclick="focusPrevSubject()" title="Môn trước (Phím mũi tên trái)">‹</button>
        <div class="focus-counter-pill">
          Môn ${activeIdx + 1} / ${filtered.length}
        </div>
        <button class="focus-nav-btn" onclick="focusNextSubject()" title="Môn tiếp theo (Phím mũi tên phải)">›</button>
      </div>

      <!-- Main Central Hero Card -->
      <div class="focus-stage-card">
        <div class="detail-subject-header" style="border-bottom: none; margin-bottom: 20px; padding-bottom: 0;">
          <div class="detail-tags-row">
            <span class="detail-category-badge">${escapeHtml(activeCategory)}</span>
            <span class="detail-code-badge">${escapeHtml(activeSub.code || "SUB-" + activeSub.id.toString().slice(-4))}</span>
          </div>
          <h2 class="detail-title" style="font-size: 1.6rem; margin-top: 8px;">${escapeHtml(activeSub.title)}</h2>

          <div class="detail-stats-chips" style="margin-top: 18px;">
            <div class="detail-chip">
              <div class="detail-chip-val" style="color: var(--theme-primary, #38bdf8);">${activeQCount}</div>
              <div class="detail-chip-lbl">Tổng số câu hỏi</div>
            </div>
            <div class="detail-chip">
              <div class="detail-chip-val" style="color: var(--brand-accent, #10b981);">Trắc nghiệm</div>
              <div class="detail-chip-lbl">Hình thức thi</div>
            </div>
            ${activeQCount > 50 ? `
            <div class="detail-chip" onclick="splitCurrentSubject(${activeSub.id})" style="cursor: pointer; border-color: rgba(250, 204, 21, 0.4);" title="Bấm để tách đề">
              <div class="detail-chip-val" style="color: #facc15;">✂️ Tách Đề</div>
              <div class="detail-chip-lbl">${activeQCount} câu</div>
            </div>` : ''}
          </div>
        </div>

        <!-- Action Banner -->
        <div class="detail-cta-banner" style="margin-bottom: 24px;">
          <button class="btn btn-primary btn-exam-hero" onclick="openPreExamModal(${activeSub.id})" style="font-size: 1.05rem; padding: 14px 28px;" title="Vào thi ngay">
            <span>Bắt Đầu Làm Bài</span>
            <span style="font-size: 1.2rem;">→</span>
          </button>

          <div class="detail-actions-row">
            <button class="btn btn-secondary" onclick="startStudyMode(${activeSub.id})" title="Ôn tập tự do">
              <span>Ôn Tập Tự Do</span>
            </button>
            <button class="btn btn-secondary" onclick="openSubjectEditor(${activeSub.id})" title="Chỉnh sửa ngân hàng câu hỏi">
              <span>Chỉnh Sửa Đề</span>
            </button>
            <button class="btn btn-secondary btn-del-subject" onclick="deleteSubject(${activeSub.id})" title="Xóa môn này">
              <span>Xóa Môn</span>
            </button>
          </div>
        </div>

        <!-- Questions Outline Preview -->
        <div class="detail-questions-section" style="background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 16px;">
          <div class="detail-q-header">
            <span class="detail-q-title">Trích Đoạn Nội Dung Đề Thi</span>
            <span style="font-size: 0.78rem; color: var(--wg-text-subtle);">${activeQCount} câu</span>
          </div>
          <div class="detail-q-list" style="max-height: 220px;">
            ${questionsPreviewHtml}
          </div>
        </div>
      </div>

      <!-- Quick Thumbnail Strip Below Stage -->
      <div style="margin-top: 4px;">
        <div style="font-size: 0.78rem; font-weight: 700; color: var(--wg-text-subtle); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          Danh Sách Chuyển Nhanh (${filtered.length} Môn):
        </div>
        <div class="focus-thumbnails-strip">
          ${thumbsHtml}
        </div>
      </div>
    </div>
  `;
}

// Fallback alias for any old callers
function renderSubjectsGrid() {
  renderMasterDetailSystem();
}

function switchView(viewName) {
  document.querySelectorAll(".view-section").forEach(sec => sec.classList.remove("active"));
  const target = document.getElementById(`view-${viewName}`);
  if (target) {
    target.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const navbar = document.querySelector(".main-navbar");
  if (navbar) {
    navbar.style.display = viewName === "exam" ? "none" : "block";
  }

  const aiBtn = document.getElementById("cuonedu-ai-btn");
  const aiPanel = document.getElementById("cuonedu-ai-panel");

  if (viewName === "exam") {
    document.body.classList.add("in-exam-mode");
    document.documentElement.classList.add("in-exam-mode");
    if (typeof toggleAIChatbot === "function") toggleAIChatbot(false);
    if (aiBtn) aiBtn.style.display = "none";
    if (aiPanel) aiPanel.style.display = "none";
  } else {
    document.body.classList.remove("in-exam-mode");
    document.documentElement.classList.remove("in-exam-mode");
    if (aiBtn) aiBtn.style.display = "flex";
  }
}

function scrollToCatalog() {
  const el = document.getElementById("catalog-section");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// ==========================================================================
// 4. SUPER-ENHANCED VIETNAMESE WORD & TEXT PARSER WITH INTERACTIVE REVIEW
// ==========================================================================
let smartImportTargetSubjectId = null;

function setSmartImportAsNewSubject() {
  smartImportTargetSubjectId = null;
  const targetModeContainer = document.getElementById("import-target-mode-container");
  if (targetModeContainer) {
    targetModeContainer.style.display = "none";
    targetModeContainer.innerHTML = "";
  }
  const btnLabel = document.getElementById("btn-import-label");
  if (btnLabel) {
    btnLabel.textContent = `Tạo Bộ Đề Mới (${parsedQuestionsTemp.length} câu)`;
  }
  const titleInput = document.getElementById("import-input-title");
  if (titleInput) titleInput.value = "";
  showToast("Đã chuyển sang chế độ tạo Đề Mới riêng biệt", "info");
}

function openSmartImportModal(targetSubId = null) {
  if (!requireTeacherAuth(() => openSmartImportModal(targetSubId))) return;
  parsedQuestionsTemp = [];
  smartImportTargetSubjectId = targetSubId;

  const titleInput = document.getElementById("import-input-title");
  if (titleInput) titleInput.value = "";

  const targetModeContainer = document.getElementById("import-target-mode-container");
  if (smartImportTargetSubjectId) {
    const existingSub = appData.subjects.find(s => s.id === smartImportTargetSubjectId);
    if (targetModeContainer && existingSub) {
      targetModeContainer.style.display = "block";
      targetModeContainer.innerHTML = `
        <div style="background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.35); padding: 10px 14px; border-radius: 8px; font-size: 0.88rem; color: #bae6fd; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
          <span>Đang chọn thêm vào môn: <strong style="color: #ffffff;">${escapeHtml(existingSub.title)}</strong></span>
          <button type="button" class="btn btn-ghost btn-sm" onclick="setSmartImportAsNewSubject()" style="font-size: 0.78rem; text-decoration: underline; color: #facc15;">Chuyển thành Tạo Môn / Đề Mới</button>
        </div>
      `;
      if (titleInput) titleInput.value = existingSub.title;
    }
  } else {
    if (targetModeContainer) {
      targetModeContainer.style.display = "none";
      targetModeContainer.innerHTML = "";
    }
  }

  document.getElementById("import-raw-text").value = "";
  document.getElementById("file-upload-input").value = "";
  document.getElementById("file-upload-status").style.display = "none";
  document.getElementById("import-preview-section").style.display = "none";
  document.getElementById("btn-submit-smart-import").disabled = true;
  document.getElementById("btn-import-label").textContent = smartImportTargetSubjectId ? "Lưu Vào Môn Hiện Tại (0 câu)" : "Tạo Đề Mới (0 câu)";
  
  switchImportTab("file");
  openModal("modal-smart-import");
}

function switchImportTab(tab) {
  const paneFile = document.getElementById("import-pane-file");
  const paneText = document.getElementById("import-pane-text");
  const btnFile = document.getElementById("tab-btn-file");
  const btnText = document.getElementById("tab-btn-text");

  if (tab === "file") {
    paneFile.style.display = "block";
    paneText.style.display = "none";
    btnFile.className = "btn btn-primary btn-sm";
    btnText.className = "btn btn-secondary btn-sm";
  } else {
    paneFile.style.display = "none";
    paneText.style.display = "block";
    btnFile.className = "btn btn-secondary btn-sm";
    btnText.className = "btn btn-primary btn-sm";
  }
}

function convertMammothHtmlToText(html) {
  if (!html) return "";

  let formatted = html
    // Mark bold / underline / mark / style highlights as starred for answer detection
    .replace(/<(strong|b|u|mark|em)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi, "*$2*")
    .replace(/<span\s+style="[^"]*(?:underline|bold|background|color:\s*(?:red|#f|#e|#d|#008000|green))[^"]*">([\s\S]*?)<\/span>/gi, "*$1*")
    // Convert table cells to tab
    .replace(/<\/t[dh]>/gi, "\t")
    // Convert block elements and line breaks to newlines
    .replace(/<\/(p|tr|li|div|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    // Strip remaining HTML tags
    .replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  formatted = formatted
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return formatted;
}

/**
 * Convert OMML Math nodes in Word XML to LaTeX string ($...$)
 */
function convertOmmlToLatex(oMathNode) {
  if (!oMathNode) return "";
  
  function process(node) {
    if (!node) return "";
    const name = node.localName || node.nodeName.split(":").pop();

    if (name === "t") {
      return node.textContent || "";
    }
    if (name === "f") { // Fraction
      const numNode = node.getElementsByTagName("m:num")[0] || node.getElementsByTagName("num")[0];
      const denNode = node.getElementsByTagName("m:den")[0] || node.getElementsByTagName("den")[0];
      const num = numNode ? processChildren(numNode) : "";
      const den = denNode ? processChildren(denNode) : "";
      return `\\frac{${num}}{${den}}`;
    }
    if (name === "rad") { // Radical / Square Root
      const degNode = node.getElementsByTagName("m:deg")[0] || node.getElementsByTagName("deg")[0];
      const baseNode = node.getElementsByTagName("m:e")[0] || node.getElementsByTagName("e")[0];
      const deg = degNode ? processChildren(degNode).trim() : "";
      const base = baseNode ? processChildren(baseNode) : "";
      return deg ? `\\sqrt[${deg}]{${base}}` : `\\sqrt{${base}}`;
    }
    if (name === "sSup") { // Superscript
      const baseNode = node.getElementsByTagName("m:e")[0] || node.getElementsByTagName("e")[0];
      const supNode = node.getElementsByTagName("m:sup")[0] || node.getElementsByTagName("sup")[0];
      return `${baseNode ? processChildren(baseNode) : ""}^{${supNode ? processChildren(supNode) : ""}}`;
    }
    if (name === "sSub") { // Subscript
      const baseNode = node.getElementsByTagName("m:e")[0] || node.getElementsByTagName("e")[0];
      const subNode = node.getElementsByTagName("m:sub")[0] || node.getElementsByTagName("sub")[0];
      return `${baseNode ? processChildren(baseNode) : ""}_{${subNode ? processChildren(subNode) : ""}}`;
    }
    if (name === "sSubSup") {
      const baseNode = node.getElementsByTagName("m:e")[0] || node.getElementsByTagName("e")[0];
      const subNode = node.getElementsByTagName("m:sub")[0] || node.getElementsByTagName("sub")[0];
      const supNode = node.getElementsByTagName("m:sup")[0] || node.getElementsByTagName("sup")[0];
      return `${baseNode ? processChildren(baseNode) : ""}_{${subNode ? processChildren(subNode) : ""}}^{${supNode ? processChildren(supNode) : ""}}`;
    }
    if (name === "d") { // Delimiter / parentheses
      const baseNode = node.getElementsByTagName("m:e")[0] || node.getElementsByTagName("e")[0];
      return `(${baseNode ? processChildren(baseNode) : ""})`;
    }

    return processChildren(node);
  }

  function processChildren(parent) {
    let s = "";
    if (!parent || !parent.childNodes) return s;
    for (let i = 0; i < parent.childNodes.length; i++) {
      s += process(parent.childNodes[i]);
    }
    return s;
  }

  const latex = processChildren(oMathNode).trim();
  return latex ? `$${latex}$` : "";
}

function extractParagraphTextWithMath(pNode) {
  if (!pNode) return "";
  let text = "";
  for (let i = 0; i < pNode.childNodes.length; i++) {
    const child = pNode.childNodes[i];
    const name = child.localName || child.nodeName.split(":").pop();
    if (name === "oMath" || name === "oMathPara") {
      text += " " + convertOmmlToLatex(child) + " ";
    } else if (name === "r") {
      const tNodes = child.getElementsByTagName("w:t");
      for (let j = 0; j < tNodes.length; j++) {
        text += tNodes[j].textContent;
      }
    } else if (name === "t") {
      text += child.textContent;
    }
  }
  return text.trim();
}

/**
 * Universal KaTeX Math Formula Renderer Helper
 */
function renderMathInView(container) {
  if (typeof renderMathInElement !== "function") return;
  const target = container || document.body;
  try {
    renderMathInElement(target, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true }
      ],
      throwOnError: false,
      ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "input"]
    });
  } catch (err) {
    console.warn("KaTeX render error:", err);
  }
}

/**
 * Interactive Glowing Progress Bar Helper
 */
function showProgressBar(containerId, percent, label, subtext) {
  const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
  if (!container) return;
  container.style.display = "block";
  const p = Math.min(100, Math.max(0, Math.round(percent)));
  container.innerHTML = `
    <div class="cuonedu-progress-container">
      <div class="cuonedu-progress-header">
        <span class="cuonedu-progress-label">${escapeHtml(label || "Đang xử lý...")}</span>
        <span class="cuonedu-progress-percent">${p}%</span>
      </div>
      <div class="cuonedu-progress-track">
        <div class="cuonedu-progress-bar" style="width: ${p}%;"></div>
      </div>
      ${subtext ? `<div class="cuonedu-progress-subtext">${escapeHtml(subtext)}</div>` : ''}
    </div>
  `;
}

function hideProgressBar(containerId) {
  const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
  if (container) container.style.display = "none";
}

/**
 * Direct Word XML Multi-Level List & Paragraph Parser (Supports 100% of Word exam templates + Math)
 */
function parseDocxXmlDirectly(xmlString) {
  if (!xmlString) return [];
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");
    const paragraphs = Array.from(xmlDoc.getElementsByTagName("w:p"));
    const questions = [];
    let curQ = null;

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      let pText = extractParagraphTextWithMath(p);
      if (!pText) continue;

      // Check if paragraph is part of a Word list (<w:numPr>)
      const numPr = p.getElementsByTagName("w:numPr")[0];
      const ilvlNode = numPr ? numPr.getElementsByTagName("w:ilvl")[0] : null;
      const ilvl = ilvlNode ? ilvlNode.getAttribute("w:val") : (numPr ? "0" : null);

      // Check bold / underline / highlight / custom colors / shading
      const isBold = p.getElementsByTagName("w:b").length > 0 || p.getElementsByTagName("w:bCs").length > 0;
      const isUnderline = p.getElementsByTagName("w:u").length > 0;
      const isHighlight = p.getElementsByTagName("w:highlight").length > 0 || p.getElementsByTagName("w:shd").length > 0;
      const colorNodes = p.getElementsByTagName("w:color");
      let isColorMarked = false;
      for (let c = 0; c < colorNodes.length; c++) {
        const val = (colorNodes[c].getAttribute("w:val") || "").toUpperCase();
        if (val && val !== "000000" && val !== "AUTO" && val !== "222222" && val !== "333333") {
          isColorMarked = true;
          break;
        }
      }

      // Check Answer line: ANSWER: A, Đáp án: B, Đ/A: C, Key: D, [Đáp án: A]
      const ansMatch = pText.match(/^(?:ANSWER|Answer|ĐÁP\s*ÁN|Đáp\s*án|ĐÁP\s*ÁN\s*ĐÚNG|Đáp\s*án\s*đúng|Đ\/?A|ĐA|Key|KEY|Chọn|CHỌN|Chọn\s*đáp\s*án)[\s:.\-_=]+([A-Fa-f])(?:\b|\.|\)|$)/i)
        || pText.match(/^[\[\(](?:ANSWER|Đáp\s*án|Key|Đ\/A)[\s:.\-_=]+([A-Fa-f])[\]\)]/i);
      if (ansMatch) {
        if (curQ) {
          curQ.correctAnswer = ansMatch[1].toUpperCase();
        }
        continue;
      }

      const isExplicitQ = /^(?:(?:câu|bài|question|q|c)\s*\d+|\d+[\s.:\-_)\/]+)/i.test(pText);
      const isExplicitOpt = /^([*]?)\s*(?:([A-Fa-f])[\.,\)\/:\-]|\[([A-Fa-f])\]|\(([A-Fa-f])\)|([A-Fa-f])[*])\s*([*]?)/i.test(pText);

      if (ilvl === "0" || (!numPr && isExplicitQ)) {
        if (curQ && curQ.options.length >= 2) {
          questions.push(curQ);
        }
        curQ = {
          id: Date.now() + (questions.length * 1000) + Math.floor(Math.random() * 999),
          question: pText.replace(/^(?:(?:câu|bài|question|q|c)\s*\d+|\d+)[\s.:\-_)\/]*\s*/i, "").trim(),
          options: [],
          correctAnswer: "",
          level: "Thông hiểu",
          explanation: ""
        };
      } else if (ilvl === "1" || (!numPr && isExplicitOpt)) {
        if (curQ) {
          const optKeys = ["A", "B", "C", "D", "E", "F"];
          let k = optKeys[curQ.options.length] || "A";
          const explicitKeyMatch = pText.match(/^([*]?)\s*(?:([A-Fa-f])[\.,\)\/:\-]|\[([A-Fa-f])\]|\(([A-Fa-f])\)|([A-Fa-f])[*])\s*([*]?)/i);
          if (explicitKeyMatch) {
            k = (explicitKeyMatch[2] || explicitKeyMatch[3] || explicitKeyMatch[4] || explicitKeyMatch[5]).toUpperCase();
          }

          let cleanOpt = pText
            .replace(/^[*_]?\s*(?:[A-Fa-f][\.,\)\/:\-]|\[[A-Fa-f]\]|\([A-Fa-f]\)|[A-Fa-f][*])\s*[*_]?\s*/, "")
            .trim();

          let isCorrect = isBold || isUnderline || isHighlight || isColorMarked;
          if (pText.includes("*") || /\((?:đúng|đáp\s*án\s*đúng|x|v|✓|true)\)|\[(?:đúng|đáp\s*án\s*đúng|x|v|✓|true)\]/i.test(pText)) {
            isCorrect = true;
          }
          cleanOpt = cleanOpt.replace(/\*/g, "").replace(/\((?:đúng|đáp\s*án\s*đúng|x|v|✓|true)\)|\[(?:đúng|đáp\s*án\s*đúng|x|v|✓|true)\]/ig, "").trim();

          curQ.options.push({ key: k, text: cleanOpt });
          if (isCorrect) {
            curQ.correctAnswer = k;
          }
        }
      } else {
        if (!curQ) {
          if ((pText.endsWith("?") || pText.endsWith(":")) && pText.length > 10) {
            curQ = {
              id: Date.now() + (questions.length * 1000) + Math.floor(Math.random() * 999),
              question: pText,
              options: [],
              correctAnswer: "",
              level: "Thông hiểu",
              explanation: ""
            };
          }
        } else {
          if (curQ.options.length === 0) {
            curQ.question += " " + pText;
          }
        }
      }
    }

    if (curQ && curQ.options.length >= 2) {
      questions.push(curQ);
    }

    return questions;
  } catch (err) {
    console.error("Lỗi phân tích trực tiếp Word XML:", err);
    return [];
  }
}

/**
 * Parses Mammoth Nested HTML Lists (<ol><li>...<ol><li>...</li></ol></li></ol>) with Image & Answer Support
 */
function parseMammothHtmlLists(html) {
  if (!html || !html.trim()) return [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const questions = [];

    const listItems = Array.from(doc.querySelectorAll("li"));
    
    listItems.forEach(li => {
      const subList = li.querySelector("ol, ul");
      if (subList) {
        const clone = li.cloneNode(true);
        const cloneSub = clone.querySelector("ol, ul");
        if (cloneSub) cloneSub.remove();
        
        // Extract embedded image if present in the question
        let qImage = "";
        const imgEl = clone.querySelector("img");
        if (imgEl && imgEl.src) {
          qImage = imgEl.src;
          imgEl.remove();
        }

        const prompt = clone.textContent.replace(/^[*_]+|[*_]+$/g, "").trim();

        const subItems = Array.from(subList.querySelectorAll("li"));
        if (prompt && subItems.length >= 2) {
          const optKeys = ["A", "B", "C", "D", "E", "F"];
          const opts = [];
          let ans = "";

          subItems.forEach((subLi, sIdx) => {
            let key = optKeys[sIdx] || String.fromCharCode(65 + sIdx);
            const rawLiText = subLi.textContent.trim();
            const explicitKeyMatch = rawLiText.match(/^([*]?)\s*(?:([A-Fa-f])[\.,\)\/:\-]|\[([A-Fa-f])\]|\(([A-Fa-f])\)|([A-Fa-f])[*])\s*([*]?)/i);
            if (explicitKeyMatch) {
              key = (explicitKeyMatch[2] || explicitKeyMatch[3] || explicitKeyMatch[4] || explicitKeyMatch[5]).toUpperCase();
            }

            const isMarked = !!subLi.querySelector("strong, u, b, em, mark") 
              || subLi.style.textDecoration?.includes("underline") 
              || subLi.style.fontWeight === "bold"
              || !!subLi.querySelector("[style*='underline'], [style*='bold'], [style*='background'], [style*='color']")
              || rawLiText.includes("*")
              || /\((?:đúng|đáp\s*án\s*đúng|x|v|✓|true)\)|\[(?:đúng|đáp\s*án\s*đúng|x|v|✓|true)\]/i.test(rawLiText);

            let optText = rawLiText
              .replace(/^[*_]?\s*(?:[A-Fa-f][\.,\)\/:\-]|\[[A-Fa-f]\]|\([A-Fa-f]\)|[A-Fa-f][*])\s*[*_]?\s*/, "")
              .replace(/\*/g, "")
              .replace(/\((?:đúng|đáp\s*án\s*đúng|x|v|✓|true)\)|\[(?:đúng|đáp\s*án\s*đúng|x|v|✓|true)\]/ig, "")
              .trim();

            opts.push({ key, text: optText });
            if (isMarked) ans = key;
          });

          questions.push({
            id: Date.now() + (questions.length * 1000) + Math.floor(Math.random() * 999),
            question: prompt.replace(/^(?:(?:câu|bài|question|q|c)\s*\d+|\d+)[\s.:\-_)\/]*\s*/i, "").trim(),
            options: opts,
            image: qImage,
            correctAnswer: ans,
            level: "Thông hiểu",
            explanation: ""
          });
        }
      }
    });

    return questions;
  } catch (err) {
    console.error("Lỗi parse Mammoth HTML lists:", err);
    return [];
  }
}

/**
 * Parses Mammoth HTML Paragraphs with inline images & answer recognition
 */
function parseDocxParagraphsWithImages(html) {
  if (!html || !html.trim()) return [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const elements = Array.from(doc.body.children);
    const questions = [];

    let curPrompt = "";
    let curImage = "";
    let curOptions = [];
    let curAns = "";

    function flushPQuestion() {
      if (curPrompt && curOptions.length >= 2) {
        questions.push({
          id: Date.now() + (questions.length * 1000) + Math.floor(Math.random() * 999),
          question: curPrompt.replace(/^(?:(?:câu|bài|question|q|c)\s*\d+|\d+)[\s.:\-_)\/]*\s*/i, "").trim(),
          options: [...curOptions],
          image: curImage,
          correctAnswer: curAns,
          level: "Thông hiểu",
          explanation: ""
        });
      }
      curPrompt = "";
      curImage = "";
      curOptions = [];
      curAns = "";
    }

    elements.forEach(el => {
      const text = el.textContent.trim();
      const img = el.querySelector("img");
      if (img && img.src) {
        curImage = img.src;
      }

      // Check Answer line: ANSWER: A, Đáp án: B, Đ/A: C, Key: D
      const ansMatch = text.match(/^(?:ANSWER|Answer|ĐÁP\s*ÁN|Đáp\s*án|ĐÁP\s*ÁN\s*ĐÚNG|Đáp\s*án\s*đúng|Đ\/?A|ĐA|Key|KEY|Chọn|CHỌN|Chọn\s*đáp\s*án)[\s:.\-_=]+([A-Fa-f])(?:\b|\.|\)|$)/i)
        || text.match(/^[\[\(](?:ANSWER|Đáp\s*án|Key|Đ\/A)[\s:.\-_=]+([A-Fa-f])[\]\)]/i);
      if (ansMatch) {
        curAns = ansMatch[1].toUpperCase();
        return;
      }

      const qMatch = text.match(/^[*_]?(?:(?:câu|bài|question|q|c)\s*(\d+)[\s.:\-_)\/]*|(\d+)[\s.:\-_)\/]+)[*_]?(.*)/i);
      if (qMatch) {
        if (curOptions.length >= 2) flushPQuestion();
        curPrompt = (qMatch[3] || "").trim();
        return;
      }

      const optMatch = text.match(/^([*]?)\s*(?:([A-Fa-f])[\.,\)\/:\-]|\[([A-Fa-f])\]|\(([A-Fa-f])\)|([A-Fa-f])[*])\s*([*]?)\s*(.*)/i);
      if (optMatch) {
        const key = (optMatch[2] || optMatch[3] || optMatch[4] || optMatch[5]).toUpperCase();
        let optText = (optMatch[7] || "").trim();
        const isBoldOrMarked = !!el.querySelector("strong, b, u, mark, em") 
          || !!el.querySelector("[style*='underline'], [style*='bold'], [style*='background'], [style*='color']")
          || optMatch[1] === "*" || optMatch[6] === "*" || optMatch[5] === "*"
          || optText.startsWith("*") || optText.endsWith("*")
          || /\((?:đúng|đáp\s*án\s*đúng|x|v|✓|true)\)|\[(?:đúng|đáp\s*án\s*đúng|x|v|✓|true)\]/i.test(optText);

        if (isBoldOrMarked) curAns = key;
        optText = optText.replace(/\*/g, "").replace(/\((?:đúng|đáp\s*án\s*đúng|x|v|✓|true)\)|\[(?:đúng|đáp\s*án\s*đúng|x|v|✓|true)\]/ig, "").trim();
        curOptions.push({ key, text: optText });
        return;
      }

      if (curOptions.length === 0 && text) {
        curPrompt = (curPrompt ? curPrompt + " " : "") + text;
      }
    });

    flushPQuestion();
    return questions;
  } catch (e) {
    return [];
  }
}

/**
 * Direct Word 97-2003 (.doc) Binary Stream Text Extractor
 * Uses authentic OLE CFB (Compound File Binary) parser to read the Piece Table from 0Table/1Table streams.
 */
function parseDocBinaryDirectly(arrayBuffer) {
  if (!arrayBuffer || arrayBuffer.byteLength < 512) return [];
  try {
    const u8 = new Uint8Array(arrayBuffer);
    const view = new DataView(arrayBuffer);

    // If authentic Word 97-2003 OLE CFB container (Header: 0xD0 0xCF 0x11 0xE0)
    if (u8[0] === 0xD0 && u8[1] === 0xCF && u8[2] === 0x11 && u8[3] === 0xE0) {
      const sectorShift = view.getUint16(0x1E, true);
      const sectorSize = 1 << sectorShift;
      const dirStart = view.getUint32(0x30, true);

      // Read Sector Allocation Table (SAT)
      const sat = [];
      for (let i = 0; i < 109; i++) {
        const sec = view.getUint32(0x4C + i * 4, true);
        if (sec < 0xFFFFFFFC) {
          const secOffset = (sec + 1) * sectorSize;
          const count = sectorSize / 4;
          for (let j = 0; j < count; j++) {
            if (secOffset + j * 4 + 4 <= u8.length) {
              sat.push(view.getUint32(secOffset + j * 4, true));
            }
          }
        }
      }

      function getStream(startSec, size) {
        let cur = startSec;
        const chunks = [];
        let total = 0;
        while (cur < 0xFFFFFFFC && total < size) {
          const secOffset = (cur + 1) * sectorSize;
          if (secOffset >= u8.length) break;
          const readLen = Math.min(sectorSize, size - total, u8.length - secOffset);
          chunks.push(u8.subarray(secOffset, secOffset + readLen));
          total += readLen;
          cur = cur < sat.length ? sat[cur] : 0xFFFFFFFE;
        }
        const res = new Uint8Array(total);
        let offset = 0;
        for (const c of chunks) {
          res.set(c, offset);
          offset += c.length;
        }
        return res;
      }

      // Read Directory Stream
      const dirBytes = getStream(dirStart, 131072);
      const dirView = new DataView(dirBytes.buffer, dirBytes.byteOffset, dirBytes.byteLength);

      let wdSec = null, wdSize = 0;
      let table1Sec = null, table1Size = 0;
      let table0Sec = null, table0Size = 0;

      for (let i = 0; i + 128 <= dirBytes.length; i += 128) {
        const nameLen = dirView.getUint16(i + 0x40, true);
        if (nameLen > 0) {
          let name = "";
          for (let j = 0; j < nameLen - 2; j += 2) {
            name += String.fromCharCode(dirView.getUint16(i + j, true));
          }
          const start = dirView.getUint32(i + 0x74, true);
          const size = dirView.getUint32(i + 0x78, true);
          if (name === "WordDocument") { wdSec = start; wdSize = size; }
          else if (name === "1Table") { table1Sec = start; table1Size = size; }
          else if (name === "0Table") { table0Sec = start; table0Size = size; }
        }
      }

      if (wdSec !== null) {
        const wdBytes = getStream(wdSec, wdSize);
        if (wdBytes.length >= 0x01AA) {
          const wdView = new DataView(wdBytes.buffer, wdBytes.byteOffset, wdBytes.byteLength);
          const flags = wdView.getUint16(0x000A, true);
          const isTable1 = !!(flags & 0x0200);
          const tableSec = isTable1 ? table1Sec : table0Sec;
          const tableSize = isTable1 ? table1Size : table0Size;

          if (tableSec !== null) {
            const tableBytes = getStream(tableSec, tableSize);
            const tableView = new DataView(tableBytes.buffer, tableBytes.byteOffset, tableBytes.byteLength);
            const fcClx = wdView.getUint32(0x01A2, true);
            const lcbClx = wdView.getUint32(0x01A6, true);

            if (fcClx + lcbClx <= tableBytes.length) {
              let pos = fcClx;
              const endClx = fcClx + lcbClx;
              let docText = "";
              const decoderUtf16 = new TextDecoder("utf-16le");
              const decoderLatin = new TextDecoder("windows-1252");

              while (pos < endClx) {
                const clxt = tableBytes[pos++];
                if (clxt === 1) {
                  const cb = tableView.getUint16(pos, true);
                  pos += 2 + cb;
                } else if (clxt === 2) {
                  const lcb = tableView.getUint32(pos, true);
                  pos += 4;
                  const n = Math.floor((lcb - 4) / 12);
                  const cps = [];
                  for (let k = 0; k <= n; k++) {
                    cps.push(tableView.getUint32(pos + k * 4, true));
                  }
                  const pcdStart = pos + (n + 1) * 4;
                  for (let k = 0; k < n; k++) {
                    const cpLen = cps[k + 1] - cps[k];
                    const fc = tableView.getUint32(pcdStart + k * 8 + 2, true);
                    const isCompressed = !!(fc & 0x40000000);
                    const fcActual = (fc & ~0x40000000);
                    if (isCompressed) {
                      const actualOffset = Math.floor(fcActual / 2);
                      docText += decoderLatin.decode(wdBytes.subarray(actualOffset, actualOffset + cpLen));
                    } else {
                      docText += decoderUtf16.decode(wdBytes.subarray(fcActual, fcActual + cpLen * 2));
                    }
                  }
                  break;
                }
              }

              if (docText.trim().length > 20) {
                const cleanText = docText
                  .replace(/\r\n/g, "\n")
                  .replace(/\r/g, "\n")
                  .replace(/\x07/g, "\t")
                  .replace(/\x0b/g, "\n")
                  .replace(/[\x00-\x08\x0e-\x1f]/g, "");

                const docQuestions = parseSmartText(cleanText);
                if (docQuestions.length > 0) {
                  return docQuestions;
                }
              }
            }
          }
        }
      }
    }

    // Fallback: TextDecoder brute force extraction
    const decoder16 = new TextDecoder("utf-16le", { fatal: false });
    const str16 = decoder16.decode(arrayBuffer);
    const decoderUtf8 = new TextDecoder("utf-8", { fatal: false });
    const str8 = decoderUtf8.decode(arrayBuffer);
    
    const score16 = (str16.match(/(?:câu|đáp án|answer|[A-D][\.,\)])/gi) || []).length;
    const score8 = (str8.match(/(?:câu|đáp án|answer|[A-D][\.,\)])/gi) || []).length;
    const chosenText = score16 >= score8 ? str16 : str8;
    
    const cleanText = chosenText
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");
      
    return parseSmartText(cleanText);
  } catch (err) {
    console.error("Lỗi phân tích tệp .doc binary:", err);
    return [];
  }
}

/**
 * PDF Parser via PDF.js with Full Text, Math & Diagram Support + Real-time Progress Bar
 */
async function parsePdfFile(file) {
  if (typeof pdfjsLib === "undefined") {
    showToast("Thư viện PDF.js chưa sẵn sàng!", "warning");
    return;
  }

  showProgressBar("file-upload-status", 10, `Đang đọc tệp PDF: ${file.name}`, "Khởi tạo công cụ đọc PDF và bóc tách nội dung...");

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullPdfText = "";
    const totalPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      // Group text items by their Y-coordinate to preserve line structure
      const lineMap = {};
      textContent.items.forEach(item => {
        const y = Math.round(item.transform[5]); // Y-coordinate
        if (!lineMap[y]) lineMap[y] = [];
        lineMap[y].push(item.str);
      });
      // Sort by Y descending (PDF Y origin is at bottom)
      const sortedYs = Object.keys(lineMap).map(Number).sort((a, b) => b - a);
      const pageText = sortedYs.map(y => lineMap[y].join(" ")).join("\n");
      fullPdfText += `\n\n--- Trang ${pageNum} ---\n` + pageText;
      
      const pct = Math.round(15 + (pageNum / totalPages) * 55);
      showProgressBar("file-upload-status", pct, `Đang đọc trang ${pageNum}/${totalPages} PDF`, "Nhận diện văn bản, ký hiệu toán học & câu hỏi...");
    }

    const textInput = document.getElementById("import-raw-text");
    if (textInput) textInput.value = fullPdfText;

    showProgressBar("file-upload-status", 75, "Đang phân tích cấu trúc đề thi...", "Kiểm tra danh sách câu hỏi & công thức toán học...");

    // Try local smart text parser first
    const localQuestions = parseSmartText(fullPdfText);
    if (localQuestions.length >= 2) {
      showProgressBar("file-upload-status", 100, `Hoàn tất! Bóc tách thành công ${localQuestions.length} câu hỏi`, "Đã hiển thị bảng xem trước câu hỏi");
      setTimeout(() => {
        handleParsedResults(localQuestions, `Tệp PDF "${file.name}"`, false);
      }, 350);
    } else {
      // If local parser found 0 or few questions, invoke AI Gemini
      showProgressBar("file-upload-status", 85, "Kích hoạt AI Gemini Flash-Lite...", "Tệp PDF cấu trúc đặc biệt, chuyển qua AI bóc tách thông minh");
      parseWithAIGemini(fullPdfText, `Tệp PDF "${file.name}"`);
    }
  } catch (err) {
    console.error("PDF Read error:", err);
    showProgressBar("file-upload-status", 0, "Lỗi đọc tệp PDF", err.message);
  }
}

function processUploadedFile(file) {
  if (!file) return;

  showProgressBar("file-upload-status", 15, `Đang tải lên: ${file.name}`, "Kiểm tra định dạng và khởi tạo bộ giải mã...");

  const fileName = file.name.toLowerCase();

  // If creating a subject or importing, suggest subject name from filename
  const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
  const subNameInput = document.getElementById("subject-input-name");
  if (subNameInput && !subNameInput.value.trim()) {
    subNameInput.value = cleanTitle;
  }
  const importTitleInput = document.getElementById("import-input-title");
  if (importTitleInput && (!smartImportTargetSubjectId || !importTitleInput.value.trim())) {
    importTitleInput.value = cleanTitle;
  }

  if (fileName.endsWith(".pdf")) {
    parsePdfFile(file);
  } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
    showProgressBar("file-upload-status", 30, `Đang xử lý tệp Word: ${file.name}`, "Bóc tách cấu trúc tài liệu, hình vẽ hình học, bảng biểu & công thức toán...");
    const reader = new FileReader();
    reader.onload = async function(e) {
      const arrayBuffer = e.target.result;
      let candidates = [];

      // Strategy 1: Direct Word XML List Parser via JSZip (with OMML math formula converter)
      if (typeof JSZip !== "undefined") {
        try {
          showProgressBar("file-upload-status", 50, "Đang bóc tách Word XML & Công thức...", "Chuyển đổi công thức toán học sang LaTeX và nhận diện cây danh sách...");
          const zip = await JSZip.loadAsync(arrayBuffer);
          const docXmlEntry = zip.file("word/document.xml");
          if (docXmlEntry) {
            const xmlText = await docXmlEntry.async("string");
            const xmlQuestions = parseDocxXmlDirectly(xmlText);
            if (xmlQuestions && xmlQuestions.length > 0) {
              candidates.push(xmlQuestions);
            }
          }
        } catch (zipErr) {
          console.warn("JSZip direct read failed, fallback to Mammoth / Binary doc:", zipErr);
        }
      }

      // Strategy 2: Mammoth HTML with Image Converter (preserves geometric figures & diagrams)
      if (typeof mammoth !== "undefined") {
        try {
          showProgressBar("file-upload-status", 70, "Đang trích xuất hình vẽ hình học & bảng biểu...", "Giữ nguyên ảnh minh họa và các ký hiệu đặc biệt...");
          const mammothOptions = {
            convertImage: mammoth.images.imgElement(function(image) {
              return image.read("base64").then(function(imageBuffer) {
                return {
                  src: "data:" + image.contentType + ";base64," + imageBuffer
                };
              });
            })
          };

          const [htmlRes, textRes] = await Promise.all([
            mammoth.convertToHtml({ arrayBuffer: arrayBuffer }, mammothOptions).catch(() => ({ value: "" })),
            mammoth.extractRawText({ arrayBuffer: arrayBuffer }).catch(() => ({ value: "" }))
          ]);

          const html = htmlRes ? htmlRes.value : "";
          const rawText = textRes ? textRes.value : "";

          const htmlListQuestions = parseMammothHtmlLists(html);
          if (htmlListQuestions.length > 0) candidates.push(htmlListQuestions);

          const htmlParagraphQuestions = parseDocxParagraphsWithImages(html);
          if (htmlParagraphQuestions.length > 0) candidates.push(htmlParagraphQuestions);

          const tableQuestions = parseDocxTables(html);
          if (tableQuestions.length > 0) candidates.push(tableQuestions);

          const htmlConvertedText = convertMammothHtmlToText(html);
          const htmlTextQuestions = parseSmartText(htmlConvertedText);
          if (htmlTextQuestions.length > 0) candidates.push(htmlTextQuestions);

          const rawTextQuestions = parseSmartText(rawText);
          if (rawTextQuestions.length > 0) candidates.push(rawTextQuestions);

          const textInput = document.getElementById("import-raw-text");
          if (textInput) {
            textInput.value = htmlConvertedText || rawText;
          }
        } catch (mammothErr) {
          console.error("Mammoth error:", mammothErr);
        }
      }

      // Strategy 3: Direct Word 97-2003 Binary Stream Parser (.doc)
      try {
        const docBinaryQuestions = parseDocBinaryDirectly(arrayBuffer);
        if (docBinaryQuestions && docBinaryQuestions.length > 0) {
          candidates.push(docBinaryQuestions);
        }
      } catch (docBinErr) {
        console.warn("Doc binary extraction failed:", docBinErr);
      }

      // Pick candidate strategy with MAXIMUM number of questions & highest quality answers
      let bestQuestions = [];
      let bestScore = -1;
      candidates.forEach(cand => {
        if (cand && cand.length > 0) {
          const ansCount = cand.filter(q => q.correctAnswer).length;
          // Prioritize question count, but strongly favor strategies that successfully identified answers
          const score = (cand.length * 10) + (ansCount * 3);
          if (score > bestScore) {
            bestScore = score;
            bestQuestions = cand;
          }
        }
      });

      // If hardcoded parser found questions, use them immediately!
      if (bestQuestions.length > 0) {
        showProgressBar("file-upload-status", 100, `Hoàn tất! Tìm thấy ${bestQuestions.length} câu hỏi`, "Đã bóc tách thành công đầy đủ ảnh, đáp án và công thức");
        setTimeout(() => {
          handleParsedResults(bestQuestions, `Tệp Word "${file.name}"`, false);
        }, 350);
      } else {
        // If hardcoded parser failed to recognize questions, automatically invoke AI Auto-Parser!
        showProgressBar("file-upload-status", 85, "Kích hoạt AI Gemini Flash-Lite...", "Cấu trúc Word đặc biệt, chuyển qua AI nhận diện thông minh");
        const textToAnalyze = document.getElementById("import-raw-text")?.value || "";
        if (textToAnalyze.trim().length > 30) {
          parseWithAIGemini(textToAnalyze, `Tệp Word "${file.name}"`);
        } else {
          handleParsedResults([], `Tệp Word "${file.name}"`, false);
        }
      }
    };
    reader.readAsArrayBuffer(file);
  } else if (fileName.endsWith(".json")) {
    showProgressBar("file-upload-status", 50, "Đang đọc tệp JSON...", "Phân tích cấu trúc dữ liệu JSON...");
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const json = JSON.parse(e.target.result);
        let questions = [];
        if (Array.isArray(json)) questions = json;
        else if (json.questions && Array.isArray(json.questions)) questions = json.questions;
        showProgressBar("file-upload-status", 100, `Hoàn tất! Đã nạp ${questions.length} câu hỏi`, "Định dạng JSON hợp lệ");
        setTimeout(() => {
          handleParsedResults(questions, `Tệp JSON "${file.name}"`, false);
        }, 300);
      } catch (err) {
        showProgressBar("file-upload-status", 0, "Lỗi định dạng JSON", "Tệp JSON không đúng cấu trúc!");
      }
    };
    reader.readAsText(file);
  } else {
    showProgressBar("file-upload-status", 40, "Đang đọc tệp văn bản...", "Nhận diện định dạng đề thi và câu hỏi...");
    const reader = new FileReader();
    reader.onload = function(e) {
      const rawText = e.target.result;
      const textInput = document.getElementById("import-raw-text");
      if (textInput) textInput.value = rawText;
      const questions = parseSmartText(rawText);
      if (questions.length > 0) {
        showProgressBar("file-upload-status", 100, `Hoàn tất! Bóc tách thành công ${questions.length} câu hỏi`, "Đã hiển thị bảng xem trước câu hỏi");
        setTimeout(() => {
          handleParsedResults(questions, `Tệp "${file.name}"`, false);
        }, 300);
      } else if (rawText.trim().length > 30) {
        showProgressBar("file-upload-status", 80, "Kích hoạt AI Gemini Flash-Lite...", "Chuyển văn bản qua AI nhận diện");
        parseWithAIGemini(rawText, `Tệp "${file.name}"`);
      } else {
        handleParsedResults([], `Tệp "${file.name}"`, false);
      }
    };
    reader.readAsText(file);
  }
}

/**
 * AI-Assisted Smart Document Parser & Pattern Extractor
 * When hard-coded parsing cannot recognize complex/non-standard formats,
 * this function uses Gemini 3.1 Flash-Lite to read and structure questions + math formulas into JSON.
 */
async function parseWithAIGemini(rawText, sourceDesc) {
  if (!rawText || !rawText.trim()) return [];

  showProgressBar("file-upload-status", 25, "AI Gemini 3.1 Flash-Lite đang nhận diện...", "Đang phân đoạn và phân tích ngữ nghĩa câu hỏi & công thức toán học...");
  showToast("Đang kích hoạt AI Gemini để nhận diện tự động bộ đề...", "info");

  // Chunk text into pieces if very large (e.g. 12,000 chars each ~ 30-40 questions)
  const MAX_CHUNK_SIZE = 12000;
  const chunks = [];
  if (rawText.length <= MAX_CHUNK_SIZE) {
    chunks.push(rawText);
  } else {
    const paragraphs = rawText.split(/\n\s*\n/);
    let currentChunk = "";
    for (const p of paragraphs) {
      if ((currentChunk + "\n\n" + p).length > MAX_CHUNK_SIZE && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = p;
      } else {
        currentChunk += (currentChunk ? "\n\n" : "") + p;
      }
    }
    if (currentChunk) chunks.push(currentChunk);
  }

  const allParsedQuestions = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunkPct = Math.round(30 + ((i + 1) / chunks.length) * 60);
    showProgressBar("file-upload-status", chunkPct, `AI đang xử lý đoạn ${i + 1}/${chunks.length}...`, "Bóc tách câu hỏi, phương án, đáp án đúng & công thức LaTeX...");

    const chunkText = chunks[i];
    const prompt = `Bạn là hệ thống bóc tách dữ liệu đề thi trắc nghiệm tiếng Việt tự động chuyên nghiệp.
Hãy đọc kỹ đoạn văn bản đề thi bên dưới (có thể có cấu trúc bảng, câu hỏi không đánh số, phương án trên cùng 1 dòng, đáp án in đậm, dấu * hoặc bảng tra cứu đáp án ở cuối).
Hãy trích xuất tất cả các câu hỏi trắc nghiệm thành mảng JSON hợp lệ theo cấu trúc:
[
  {
    "question": "Nội dung câu hỏi (đã bỏ tiền tố Câu 1, Câu 2...)",
    "options": [
      { "key": "A", "text": "Nội dung phương án A" },
      { "key": "B", "text": "Nội dung phương án B" },
      { "key": "C", "text": "Nội dung phương án C" },
      { "key": "D", "text": "Nội dung phương án D" }
    ],
    "correctAnswer": "A",
    "explanation": "Giải thích chi tiết nếu có trong bài"
  }
]
Quy tắc:
1. Đảm bảo options có đủ các phương án (ít nhất 2 phương án).
2. Viết đúng chính tả tiếng Việt.
3. CÔNG THỨC TOÁN HỌC / VẬT LÝ / HÓA HỌC: Nếu có phân số, căn bậc hai, tích phân, đạo hàm, hệ phương trình, số mũ, chỉ số dưới, vector, ma trận, ký hiệu Hy Lạp (α, β, Δ, π, Ω...), phương trình hóa học, hãy chuyển đổi và định dạng sang chuẩn LaTeX kẹp giữa cặp dấu $...$ (ví dụ: $x^2 + 2x - 3 = 0$, $\\frac{a}{b}$, $\\sqrt{x^2+1}$, $\\int_0^1 f(x)dx$, $\\Delta > 0$, $H_2SO_4$).
4. Chỉ trả về JSON thuần túy.

Văn bản đề thi:
${chunkText}`;

    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2
          }
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
          const jsonText = data.candidates[0].content.parts[0].text;
          const parsed = JSON.parse(jsonText);
          if (Array.isArray(parsed)) {
            parsed.forEach(q => {
              if (q.question && q.options && q.options.length >= 2) {
                allParsedQuestions.push({
                  id: Date.now() + (allParsedQuestions.length * 1000) + Math.floor(Math.random() * 999),
                  question: (q.question || "").trim(),
                  options: (q.options || []).map(o => ({
                    key: (o.key || "A").toUpperCase().trim(),
                    text: (o.text || "").trim()
                  })),
                  correctAnswer: (q.correctAnswer || "").toUpperCase().trim(),
                  level: "Thông hiểu",
                  explanation: (q.explanation || "").trim()
                });
              }
            });
          }
        }
      }
    } catch (err) {
      console.warn("AI chunk parse error:", err);
    }
  }

  if (allParsedQuestions.length > 0) {
    showProgressBar("file-upload-status", 100, `Hoàn tất! AI nhận diện thành công ${allParsedQuestions.length} câu hỏi`, "Đã bóc tách cấu trúc câu hỏi và công thức toán học");
    setTimeout(() => {
      handleParsedResults(allParsedQuestions, `${sourceDesc} (Đã phân tích bằng Gemini AI)`, true);
      showToast(`AI đã nhận diện thành công ${allParsedQuestions.length} câu hỏi từ tệp!`, "success");
      playQuizizzTone("victory");
    }, 350);
    return allParsedQuestions;
  } else {
    handleParsedResults([], sourceDesc, false);
    showToast("AI không phát hiện được câu hỏi nào từ định dạng này!", "warning");
    return [];
  }
}

/**
 * Multimodal AI Image OCR & Question Parser
 */
async function parseImageWithAIGemini(base64Data, mimeType, sourceDesc) {
  const prompt = `Bạn là hệ thống OCR & Bóc tách đề thi trắc nghiệm tiếng Việt từ hình ảnh chụp hoặc bản scan.
Hãy nhận diện tất cả các câu hỏi trắc nghiệm trong ảnh và trích xuất thành mảng JSON theo cấu trúc:
[
  {
    "question": "Nội dung câu hỏi (bỏ tiền tố Câu 1, Câu 2...)",
    "options": [
      { "key": "A", "text": "Phương án A" },
      { "key": "B", "text": "Phương án B" },
      { "key": "C", "text": "Phương án C" },
      { "key": "D", "text": "Phương án D" }
    ],
    "correctAnswer": "A",
    "explanation": "Giải thích ngắn"
  }
]
Quy tắc:
1. Nếu có công thức toán/lý/hóa hãy chuyển sang LaTeX kẹp giữa $...$.
2. Chỉ trả về JSON thuần túy.`;

  try {
    const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, "");
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: cleanBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      })
    });

    if (resp.ok) {
      const data = await resp.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        const jsonText = data.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(jsonText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const qs = parsed.map(q => ({
            id: Date.now() + Math.floor(Math.random() * 99999),
            question: (q.question || "").trim(),
            options: (q.options || []).map(o => ({
              key: (o.key || "A").toUpperCase().trim(),
              text: (o.text || "").trim()
            })),
            correctAnswer: (q.correctAnswer || "").toUpperCase().trim(),
            level: "Thông hiểu",
            explanation: (q.explanation || "").trim()
          }));
          handleParsedResults(qs, `${sourceDesc} (Đã OCR bằng Gemini Vision)`, true);
          showToast(`AI đã OCR thành công ${qs.length} câu hỏi từ hình ảnh!`, "success");
          playQuizizzTone("victory");
          return qs;
        }
      }
    }
  } catch (err) {
    console.error("AI Image OCR Error:", err);
  }

  handleParsedResults([], sourceDesc, false);
  showToast("Không tìm thấy câu hỏi nào trong hình ảnh tải lên!", "warning");
  return [];
}

/**
 * AI Solver for Single Question (User actively clicks to solve)
 */
async function solveSingleQuestionWithAI(qIdx, containerId, countId) {
  const q = parsedQuestionsTemp[qIdx];
  if (!q) return;

  showToast(`AI đang phân tích và giải câu #${qIdx + 1}...`, "info");
  
  const optsText = (q.options || []).map(o => `${o.key}. ${o.text}`).join("\n");
  const prompt = `Bạn là chuyên gia khảo thí và giải đề thi. Hãy giải câu trắc nghiệm sau và chọn đáp án đúng nhất (A, B, C, D hoặc E) cùng lời giải thích ngắn gọn (chuyển công thức toán sang LaTeX kẹp $...$ nếu có):
Câu hỏi: ${q.question}
${optsText}

Hãy trả về JSON theo mẫu:
{
  "correctAnswer": "A",
  "explanation": "Lý do ngắn gọn vì sao đáp án này đúng"
}`;

  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      })
    });

    if (resp.ok) {
      const data = await resp.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
        if (parsed.correctAnswer) {
          q.correctAnswer = parsed.correctAnswer.toUpperCase().trim();
          if (parsed.explanation) q.explanation = parsed.explanation.trim();
          renderInteractiveQuestionReviewList(parsedQuestionsTemp, containerId, countId);
          showToast(`AI đã giải xong câu #${qIdx + 1}: Đáp án [${q.correctAnswer}]`, "success");
          playQuizizzTone("correct");
          return;
        }
      }
    }
  } catch (err) {
    showToast("Không thể giải câu hỏi qua AI: " + err.message, "danger");
  }
}

/**
 * AI Batch Solver for All Unanswered Questions (User actively clicks to solve all)
 */
async function solveAllMissingAnswersWithAI(containerId, countId) {
  const missingIndexes = [];
  parsedQuestionsTemp.forEach((q, idx) => {
    if (!q.correctAnswer) missingIndexes.push(idx);
  });

  if (missingIndexes.length === 0) {
    showToast("Tất cả câu hỏi đều đã có đáp án!", "info");
    return;
  }

  showToast(`Đang dùng AI tự động giải ${missingIndexes.length} câu chưa có đáp án...`, "info");

  const questionsToSolve = missingIndexes.map(idx => {
    const q = parsedQuestionsTemp[idx];
    return {
      index: idx + 1,
      question: q.question,
      options: q.options
    };
  });

  const prompt = `Hãy giải các câu trắc nghiệm sau và chọn đáp án đúng nhất cho từng câu (công thức toán giữ nguyên dạng LaTeX $...$):
${JSON.stringify(questionsToSolve)}

Hãy trả về JSON mảng theo mẫu:
[
  { "index": 1, "correctAnswer": "A", "explanation": "..." }
]`;

  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      })
    });

    if (resp.ok) {
      const data = await resp.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        const answers = JSON.parse(data.candidates[0].content.parts[0].text);
        let solvedCount = 0;
        if (Array.isArray(answers)) {
          answers.forEach(item => {
            const actualIdx = item.index - 1;
            if (parsedQuestionsTemp[actualIdx]) {
              parsedQuestionsTemp[actualIdx].correctAnswer = (item.correctAnswer || "").toUpperCase().trim();
              if (item.explanation) parsedQuestionsTemp[actualIdx].explanation = item.explanation.trim();
              solvedCount++;
            }
          });
        }

        renderInteractiveQuestionReviewList(parsedQuestionsTemp, containerId, countId);
        showToast(`AI đã giải và điền xong đáp án cho ${solvedCount} câu hỏi!`, "success");
        playQuizizzTone("victory");
      }
    }
  } catch (err) {
    showToast("Lỗi khi nhờ AI giải đáp án: " + err.message, "danger");
  }
}

/**
 * Trigger AI Extraction from pasted text inside textarea
 */
function triggerAIExtractFromTextarea() {
  const textarea = document.getElementById("import-raw-text");
  if (!textarea || !textarea.value.trim()) {
    showToast("Vui lòng dán nội dung bộ đề vào ô văn bản trước khi quét!", "warning");
    return;
  }
  parseWithAIGemini(textarea.value, "Văn bản nhập trực tiếp");
}

/**
 * Parses structured Word Tables (only if rows actually represent exam questions)
 */
function parseDocxTables(html) {
  if (!html || !html.trim()) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const questions = [];

  const tables = doc.querySelectorAll("table");
  if (tables.length > 0) {
    tables.forEach(table => {
      const rows = table.querySelectorAll("tr");
      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll("td, th")).map(c => ({
          text: c.textContent.trim(),
          hasUnderlineOrBold: !!c.querySelector("strong, u, b, em, mark")
        }));

        if (cells.length >= 4) {
          const firstText = cells[0].text.toLowerCase();
          if (firstText.includes("stt") || firstText.includes("câu hỏi") || firstText.includes("tiêu đề") || firstText.includes("giám thị") || firstText.includes("trường")) {
            return;
          }

          let prompt = "";
          let opts = [];
          let ans = "";

          // If row is [STT, Question, A, B, C, D, Answer]
          if (cells.length >= 6 && /^\d+$/.test(cells[0].text)) {
            prompt = cells[1].text;
            const optKeys = ["A", "B", "C", "D", "E"];
            for (let k = 2; k < Math.min(cells.length, 6); k++) {
              const key = optKeys[k - 2];
              opts.push({ key, text: cells[k].text.replace(/^[A-Ea-e][\.,\)\/:\-]\s*/, "").trim() });
              if (cells[k].hasUnderlineOrBold) ans = key;
            }
            if (cells.length >= 7 && /^[A-Ea-e]$/i.test(cells[6].text)) {
              ans = cells[6].text.toUpperCase();
            }
          }
          // If row is [Question, A, B, C, D]
          else if (cells.length >= 5) {
            prompt = cells[0].text;
            const optKeys = ["A", "B", "C", "D"];
            for (let k = 1; k <= 4; k++) {
              const key = optKeys[k - 1];
              opts.push({ key, text: cells[k].text.replace(/^[A-Ea-e][\.,\)\/:\-]\s*/, "").trim() });
              if (cells[k].hasUnderlineOrBold) ans = key;
            }
            if (cells.length >= 6 && /^[A-Ea-e]$/i.test(cells[5].text)) {
              ans = cells[5].text.toUpperCase();
            }
          }

          if (prompt && opts.length >= 2) {
            questions.push({
              id: Date.now() + (questions.length * 1000) + Math.floor(Math.random() * 999),
              question: prompt.replace(/^[*_]+|[*_]+$/g, "").replace(/^(?:(?:câu|bài|question|q|c)\s*\d+|\d+)[\s.:\-_)\/]*\s*/i, "").trim(),
              options: opts,
              correctAnswer: ans,
              level: "Thông hiểu",
              explanation: ""
            });
          }
        }
      });
    });
  }

  return questions;
}

/**
 * Super-Enhanced Resilient Vietnamese Exam Text & Word Parser (State-Machine Engine)
 * Accurately parses all Vietnamese question and answer formats without losing any question.
 * Handles files with or without predefined answers, inline options, table headers, and varied punctuation.
 */
function parseSmartText(rawText) {
  if (!rawText || !rawText.trim()) return [];

  // Step 1: Normalize line breaks, unicode spaces, quotes, and clean symbols
  let text = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ")
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .trim();

  // Step 2: Extract Trailing or Leading Answer Table & Explanation Block (Azota standard)
  const answerMap = {};
  const explanationMap = {};

  // Extract Explanation section if present at the end
  const expBlockRegex = /(?:HƯỚNG\s+DẪN\s+GIẢI\s+CHI\s+TIẾT|LỜI\s+GIẢI\s+CHI\s+TIẾT|ĐÁP\s+ÁN\s+VÀ\s+LỜI\s+GIẢI|HƯỚNG\s+DẪN\s+CHẤM|GIẢI\s+THÍCH\s+CHI\s+TIẾT)[\s\S]*$/i;
  const expBlockMatch = text.match(expBlockRegex);
  if (expBlockMatch) {
    const expText = expBlockMatch[0];
    const expItemRegex = /(?:^|\n)\s*(?:(?:câu|bài|question|q)\s*)?(\d+)[\s.:\-_)\/]+([\s\S]*?)(?=(?:\n\s*(?:(?:câu|bài|question|q)\s*)?\d+[\s.:\-_)\/]+)|$)/gi;
    let ep;
    while ((ep = expItemRegex.exec(expText)) !== null) {
      const qNum = parseInt(ep[1]);
      const content = ep[2].replace(/^[*_]+|[*_]+$/g, "").trim();
      if (content && !content.toUpperCase().startsWith("HƯỚNG DẪN") && !content.toUpperCase().startsWith("LỜI GIẢI")) {
        explanationMap[qNum] = content;
      }
    }
    text = text.replace(expBlockRegex, "").trim();
  }

  // Extract Answer Table if present
  const ansKeyBlockRegex = /(?:BẢNG\s+ĐÁP\s+ÁN|ĐÁP\s+ÁN\s+CÁC\s+CÂU|KEY\s+ANSWER|BẢNG\s+TRA\s+ĐÁP\s+ÁN|ĐÁP\s+ÁN\s+CHI\s+TIẾT|BẢNG\s+TỔNG\s+KẾT\s+ĐÁP\s+ÁN)[\s\S]*$/i;
  const trailingBlockMatch = text.match(ansKeyBlockRegex);
  if (trailingBlockMatch) {
    const blockText = trailingBlockMatch[0];
    const keyPairRegex = /(?:câu\s*)?(\d+)[\s.:\-_)\/]*([A-Fa-f])(?:\b|\s|$)/gi;
    let kp;
    while ((kp = keyPairRegex.exec(blockText)) !== null) {
      answerMap[parseInt(kp[1])] = kp[2].toUpperCase();
    }
    text = text.replace(ansKeyBlockRegex, "").trim();
  }

  // Step 3: Put inline options on separate lines (Handles "A. ... B. ...", "A) ... B) ...", "[A] ... [B] ...", "(A) ... (B) ...", "*A. ...", "A* ...")
  // Using lookbehind to ensure preceding punctuation (?, :, etc.) is NOT consumed/deleted
  text = text.replace(/(?<=[\s\n\?\.:;!]|^)\s*(?:(\*+)?\s*\[([A-Fa-f])\]|(\*+)?\s*\(([A-Fa-f])\)|(\*+)?\s*([A-Fa-f])(\*+)?(?:[\.,\)\/:\-]|(?<=\*)))\s+/g, (m, s1, g1, s2, g2, s3, g3, s4) => {
    const letter = (g1 || g2 || g3).toUpperCase();
    const isStar = !!(s1 || s2 || s3 || s4);
    return `\n${isStar ? "*" : ""}${letter}. `;
  });

  const rawLines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const questions = [];

  let curQNum = null;
  let curPromptLines = [];
  let curOptions = [];
  let curAnswer = null;
  let curLevel = "Thông hiểu";
  let curExplanation = "";
  let trailingPromptBuffer = [];

  function flushQuestion() {
    if (curPromptLines.length > 0 || curOptions.length >= 2) {
      let prompt = curPromptLines.join(" ").trim();

      // Extract Cognitive Level tags (Azota standard: [NB], (NB), [TH], (TH), [VD], (VD), [VDC], (VDC))
      let detectedLevel = curLevel;
      const levelMatch = prompt.match(/[\[\(](NB|TH|VD|VDC|Nhận\s*biết|Thông\s*hiểu|Vận\s*dụng|Vận\s*dụng\s*cao)[\]\)]/i);
      if (levelMatch) {
        const tag = levelMatch[1].toUpperCase().replace(/\s+/g, "");
        if (tag === "NB" || tag.includes("NHẬNBIẾT")) detectedLevel = "Nhận biết";
        else if (tag === "TH" || tag.includes("THÔNGHIỂU")) detectedLevel = "Thông hiểu";
        else if (tag === "VD" || tag === "VẬNDỤNG") detectedLevel = "Vận dụng";
        else if (tag === "VDC" || tag.includes("VẬNDỤNGCAO")) detectedLevel = "Vận dụng cao";
        prompt = prompt.replace(levelMatch[0], "").trim();
      }

      // Extract points / score tags: [1.0 điểm], (0.25đ), (0,5 điểm), [2 điểm], (1pt)
      prompt = prompt.replace(/[\[\(]\s*\d+(?:[\.,]\d+)?\s*(?:điểm|đ|pts?|points?)\s*[\]\)]/ig, "").trim();

      prompt = prompt
        .replace(/^[*_#~]+|[*_#~]+$/g, "")
        .replace(/^(?:(?:câu|bài|question|q|c)\s*\d+|\d+)[\s.:\-_)\/]*\s*/i, "")
        .replace(/^[*_#~]+|[*_#~]+$/g, "")
        .trim();

      if (!prompt) {
        prompt = `Câu hỏi số ${questions.length + 1}`;
      }

      const qIndex = questions.length + 1;
      const finalAns = (curAnswer || answerMap[curQNum || qIndex] || "").toUpperCase();
      const finalExp = (curExplanation || explanationMap[curQNum || qIndex] || "").trim();

      const finalOptions = [...curOptions];
      if (finalOptions.length >= 2) {
        questions.push({
          id: Date.now() + (questions.length * 1000) + Math.floor(Math.random() * 999),
          question: prompt,
          options: finalOptions,
          correctAnswer: finalAns,
          level: detectedLevel,
          explanation: finalExp
        });
      }
    }

    curQNum = null;
    curPromptLines = [...trailingPromptBuffer];
    trailingPromptBuffer = [];
    curOptions = [];
    curAnswer = null;
    curLevel = "Thông hiểu";
    curExplanation = "";
  }

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Check Question Header: "Câu 1:", "Câu 1.", "Câu 1-", "*Câu 1:*", "1.", "1:", "1)", "1/", "1 -", "C1:", "C1."
    const qHeaderMatch = line.match(/^[*_]?(?:(?:câu|bài|question|q|c)\s*(\d+)[\s.:\-_)\/]*|(\d+)[\s.:\-_)\/]+)[*_]?(.*)/i);
    if (qHeaderMatch) {
      const num = parseInt(qHeaderMatch[1] || qHeaderMatch[2]);
      const rest = (qHeaderMatch[3] || "").replace(/^[*_]+|[*_]+$/g, "").trim();

      if (curOptions.length >= 2) {
        trailingPromptBuffer = rest ? [rest] : [];
        flushQuestion();
        curQNum = num; // Preserve the new question number after flush
      } else {
        curQNum = num;
        curPromptLines = rest ? [rest] : [];
      }
      continue;
    }

    // Check Option Header: "A.", "A,", "A)", "A:", "A/", "[A]", "(A)", "*A.*", "*A.", "A.*", "A*"
    const optMatch = line.match(/^([*]?)\s*(?:([A-Fa-f])[\.,\)\/:\-]|\[([A-Fa-f])\]|\(([A-Fa-f])\)|([A-Fa-f])[*])\s*([*]?)\s*(.*)/i);
    if (optMatch) {
      const isStar1 = optMatch[1] === "*";
      const key = (optMatch[2] || optMatch[3] || optMatch[4] || optMatch[5]).toUpperCase();
      const isStar2 = optMatch[6] === "*";
      let optText = (optMatch[7] || "").trim();

      // If we see Option A and we already have options for previous question:
      if (key === "A" && (curOptions.some(o => o.key === "A") || curOptions.length >= 2)) {
        const savedQNum = curQNum;
        flushQuestion();
        if (!curQNum) curQNum = savedQNum ? savedQNum + 1 : null; // Increment question number if no new header was set
      }

      // Check all correct answer indicator patterns on the option:
      let isCorrect = isStar1 || isStar2 || Boolean(optMatch[5]);

      if (optText.startsWith("*") || optText.endsWith("*")) {
        isCorrect = true;
        optText = optText.replace(/^\*+|\*+$/g, "").trim();
      }

      // Check [x], (x), (đúng), [đúng], (đáp án đúng), (true), (correct), (v), [v], [✓], (✓)
      if (/\((?:đúng|đáp\s*án\s*đúng|x|v|✓|true|correct)\)|\[(?:đúng|đáp\s*án\s*đúng|x|v|✓|true|correct)\]/i.test(optText)) {
        isCorrect = true;
        optText = optText.replace(/\((?:đúng|đáp\s*án\s*đúng|x|v|✓|true|correct)\)|\[(?:đúng|đáp\s*án\s*đúng|x|v|✓|true|correct)\]/ig, "").trim();
      }

      // Check underline or bold or highlight markdown wraps like *...*, _..._, ==...==, <u>...</u>, <b>...</b>, <mark>...</mark>
      if (/^(\*|_|==|<u>|<b>|<strong>|<mark>).+(\*|_|==|<\/u>|<\/b>|<\/strong>|<\/mark>)$/i.test(optText)) {
        isCorrect = true;
        optText = optText.replace(/^(\*|_|==|<u>|<b>|<strong>|<mark>)+|(\*|_|==|<\/u>|<\/b>|<\/strong>|<\/mark>)+$/ig, "").trim();
      }

      if (isCorrect) {
        curAnswer = key;
      }

      curOptions.push({ key, text: optText });
      continue;
    }

    // Check Answer keyword line: "ANSWER: D", "Đáp án: A", "Đ/A: B", "Key: C", "Chọn: A", etc.
    const ansMatch = line.match(/^(?:ANSWER|Answer|ĐÁP\s*ÁN|Đáp\s*án|ĐÁP\s*ÁN\s*ĐÚNG|Đáp\s*án\s*đúng|Đ\/?A|ĐA|Key|KEY|Chọn|CHỌN|Chọn\s*đáp\s*án)[\s:.\-_=]+([A-Fa-f])(?:\b|\.|\)|$)/i);
    if (ansMatch) {
      curAnswer = ansMatch[1].toUpperCase();
      continue;
    }

    // Check Bracketed Answer: "[Đáp án: A]", "(Đáp án: B)", "[ANSWER: D]"
    const bracketAnsMatch = line.match(/^[\[\(](?:ANSWER|Đáp\s*án|Key|Đ\/A)[\s:.\-_=]+([A-Fa-f])[\]\)]/i);
    if (bracketAnsMatch) {
      curAnswer = bracketAnsMatch[1].toUpperCase();
      continue;
    }

    // Check Explanation keyword line (Azota: "Lời giải: ...", "Hướng dẫn giải: ...", "Giải thích: ...", "HD: ...")
    const expMatch = line.match(/^(?:Lời\s*giải|Hướng\s*dẫn\s*giải|Giải\s*thích|Explanation|Hướng\s*dẫn|HD|Lý\s*do|Giải)[\s:.-]+(.*)/i);
    if (expMatch) {
      curExplanation = (curExplanation ? curExplanation + " " : "") + (expMatch[1] || "").trim();
      continue;
    }

    // Ignore section headers like "PHẦN I. TRẮC NGHIỆM", "HẾT", "TRANG 1/3"
    if (/^(?:PHẦN\s+[IVXLCDM\d]+|PART\s+\d+|HẾT|---\s*HẾT\s*---|\*{3,}|={3,}|TRANG\s+\d+)/i.test(line)) {
      continue;
    }

    // Regular text line
    if (curOptions.length === 0) {
      curPromptLines.push(line);
    } else {
      if (curOptions.length >= 4 || curOptions.some(o => o.key === "D")) {
        trailingPromptBuffer.push(line);
      } else {
        const lastOpt = curOptions[curOptions.length - 1];
        if (lastOpt) {
          lastOpt.text += " " + line;
        } else {
          curPromptLines.push(line);
        }
      }
    }
  }

  flushQuestion();
  return questions;
}

/**
 * Handle Parsed Questions and Render Interactive Preview UI
 * Allows teacher to inspect every question, edit text, click pills to assign answers, or batch auto-fill answers.
 */
function handleParsedResults(questions, sourceDesc, isAIParsed = false) {
  parsedQuestionsTemp = questions;
  const statusEl = document.getElementById("file-upload-status");
  const previewSec = document.getElementById("import-preview-section");
  const submitBtn = document.getElementById("btn-submit-smart-import");
  const btnLabel = document.getElementById("btn-import-label");

  if (!questions || questions.length === 0) {
    if (statusEl) {
      statusEl.style.display = "block";
      statusEl.innerHTML = `<span style="color: var(--danger); font-weight: bold;">Không phát hiện được câu hỏi nào từ ${sourceDesc}. Hãy kiểm tra định dạng hoặc dán văn bản trực tiếp.</span>`;
    }
    if (previewSec) previewSec.style.display = "none";
    if (submitBtn) submitBtn.disabled = true;
    if (btnLabel) btnLabel.textContent = "Lưu Vào Môn Học (0 câu)";
    return;
  }

  const missingAnswersCount = questions.filter(q => !q.correctAnswer).length;
  const isAIBased = isAIParsed || (typeof sourceDesc === "string" && sourceDesc.includes("AI"));
  const aiBadgeHtml = isAIBased
    ? `<div class="ai-parsed-indicator-banner">
         <div>
           <strong>Đã dùng Trí Tuệ Nhân Tạo (Gemini AI)</strong> để tự động bóc tách & nhận diện cấu trúc ${questions.length} câu hỏi từ tài liệu này!
         </div>
       </div>`
    : "";

  if (statusEl) {
    statusEl.style.display = "block";
    statusEl.innerHTML = `
      ${aiBadgeHtml}
      <span style="color: var(--brand-accent, #10b981); font-weight: 800;">Đã nhận diện thành công ${questions.length} câu hỏi từ ${sourceDesc}!</span>
      ${missingAnswersCount > 0 ? `<br><span style="color: #f59e0b; font-size: 0.85rem; font-weight: 700;">Có ${missingAnswersCount} câu chưa có đáp án. Bạn có thể bấm nút [ AI Giải ] ở từng câu hoặc [ AI Điền Hết Câu Thiếu ] ở trên.</span>` : ''}
    `;
  }
  const targetActionText = smartImportTargetSubjectId ? "Lưu Vào Môn Hiện Tại" : "Tạo Bộ Đề Mới";
  if (btnLabel) btnLabel.textContent = `${targetActionText} (${questions.length} câu)`;
  if (submitBtn) submitBtn.disabled = false;

  // Render in Smart Import Modal
  renderInteractiveQuestionReviewList(questions, "import-parsed-list", "parsed-count-badge", () => {
    if (btnLabel) btnLabel.textContent = `${targetActionText} (${parsedQuestionsTemp.length} câu)`;
  }, isAIBased);
  if (previewSec) previewSec.style.display = "block";

  // Also render inside Create Subject Modal if open
  const createBadge = document.getElementById("create-sub-parsed-badge");
  const createSubPreview = document.getElementById("create-sub-preview-section");
  if (createBadge) {
    createBadge.style.display = "block";
    createBadge.innerHTML = `${aiBadgeHtml}Đã nhận diện <strong>${questions.length} câu hỏi</strong> từ tệp! ${missingAnswersCount > 0 ? `<span style="color: #f59e0b;">(Còn ${missingAnswersCount} câu chưa có đáp án)</span>` : ''}`;
  }
  if (createSubPreview) {
    createSubPreview.style.display = "block";
    renderInteractiveQuestionReviewList(questions, "create-sub-parsed-list", "create-sub-count", () => {
      if (createBadge) createBadge.innerHTML = `Đã đọc sẵn <strong>${parsedQuestionsTemp.length} câu hỏi</strong> từ tệp!`;
    }, isAIBased);
  }
}

/**
 * Interactive Question Review & Answer Checker Component
 * Enables inline review, instant answer switching with click, A/B/C/D pill selectors, AI solve buttons, and text editing.
 */
function renderInteractiveQuestionReviewList(questions, containerId, countId, onUpdate, isAIBased = false) {
  const container = document.getElementById(containerId);
  const countBadge = document.getElementById(countId);
  if (!container) return;

  if (countBadge) countBadge.textContent = questions.length;
  container.innerHTML = "";

  // Update Missing Badge in header
  const isSmart = containerId.includes("import");
  const missingBadge = document.getElementById(isSmart ? "import-missing-badge" : "create-sub-missing-badge");
  const missingCount = questions.filter(q => !q.correctAnswer).length;

  if (missingBadge) {
    if (missingCount > 0) {
      missingBadge.className = "badge-missing-warning";
      missingBadge.innerHTML = `Còn <strong>${missingCount}</strong> câu chưa có đáp án`;
      missingBadge.style.display = "inline-flex";
    } else {
      missingBadge.className = "badge-missing-success";
      missingBadge.innerHTML = `Đã chọn đủ đáp án cho tất cả câu`;
      missingBadge.style.display = "inline-flex";
    }
  }

  questions.forEach((q, qIdx) => {
    const card = document.createElement("div");
    const hasAnswer = !!q.correctAnswer;
    card.className = `parsed-review-card ${hasAnswer ? "" : "missing-ans"}`;
    card.setAttribute("role", "region");
    card.setAttribute("aria-label", `Câu hỏi số ${qIdx + 1}`);

    const optKeys = (q.options && q.options.length > 0) ? q.options.map(o => o.key) : ["A", "B", "C", "D"];

    // Quick Pill Buttons for this question
    const pillsHtml = optKeys.map(k => {
      const isSelected = q.correctAnswer === k;
      return `
        <button type="button" class="parsed-pill-btn ${isSelected ? "active" : ""}" 
                role="radio"
                aria-checked="${isSelected ? "true" : "false"}"
                aria-label="Chọn đáp án ${k}"
                onclick="event.stopPropagation(); setParsedCorrectAnswer(${qIdx}, '${k}', '${containerId}', '${countId}')" 
                title="Chọn ${k} làm đáp án đúng">
          ${k}
        </button>
      `;
    }).join("");

    let optionsRowsHtml = "";
    (q.options || []).forEach((opt) => {
      const isCorrect = opt.key === q.correctAnswer;
      optionsRowsHtml += `
        <div class="parsed-opt-row ${isCorrect ? "is-correct" : ""}" 
             onclick="setParsedCorrectAnswer(${qIdx}, '${opt.key}', '${containerId}', '${countId}')">
          <span class="parsed-opt-key">${opt.key}.</span>
          <input type="text" class="parsed-opt-input" value="${escapeHtml(opt.text)}" 
                 aria-label="Nội dung phương án ${opt.key} câu ${qIdx + 1}"
                 onclick="event.stopPropagation()" 
                 oninput="updateParsedOptionText(${qIdx}, '${opt.key}', this.value)" 
                 placeholder="Nội dung phương án ${opt.key}">
          <button type="button" class="btn-sm parsed-opt-select-btn ${isCorrect ? 'active-correct' : ''}" 
                  aria-label="${isCorrect ? 'Đáp án đúng' : `Chọn phương án ${opt.key} làm đáp án đúng`}"
                  onclick="event.stopPropagation(); setParsedCorrectAnswer(${qIdx}, '${opt.key}', '${containerId}', '${countId}')">
            ${isCorrect ? "ĐÁP ÁN ĐÚNG" : "Chọn Đ/A này"}
          </button>
        </div>
      `;
    });

    const levelColor = q.level === "Nhận biết" ? "#3b82f6" : (q.level === "Vận dụng" ? "#f59e0b" : (q.level === "Vận dụng cao" ? "#ef4444" : "#10b981"));

    card.innerHTML = `
      <div class="parsed-review-header">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span class="parsed-q-badge-num">Câu ${qIdx + 1}</span>
          
          <!-- Azota Level Selector Badge -->
          <select class="form-input" style="width: auto; padding: 2px 8px; font-size: 0.75rem; font-weight: 800; border-radius: 6px; background: rgba(0,0,0,0.3); color: ${levelColor}; border: 1px solid ${levelColor}; cursor: pointer;"
                  aria-label="Mức độ nhận thức câu ${qIdx + 1}"
                  onchange="updateParsedLevel(${qIdx}, this.value, '${containerId}', '${countId}')">
            <option value="Nhận biết" ${q.level === "Nhận biết" ? "selected" : ""}>[NB] Nhận biết</option>
            <option value="Thông hiểu" ${(!q.level || q.level === "Thông hiểu") ? "selected" : ""}>[TH] Thông hiểu</option>
            <option value="Vận dụng" ${q.level === "Vận dụng" ? "selected" : ""}>[VD] Vận dụng</option>
            <option value="Vận dụng cao" ${q.level === "Vận dụng cao" ? "selected" : ""}>[VDC] Vận dụng cao</option>
          </select>

          ${hasAnswer 
            ? `<span class="parsed-q-badge-ans-ok">Đáp án: <strong>[ ${q.correctAnswer} ]</strong></span>` 
            : `<span class="parsed-q-badge-ans-warn">Chưa chọn đáp án</span>`}
        </div>

        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <button type="button" class="btn-ai-solve-card" onclick="solveSingleQuestionWithAI(${qIdx}, '${containerId}', '${countId}')" title="Nhờ AI Gemini phân tích câu này và tự động điền đáp án đúng">
            AI Giải
          </button>
          <div class="parsed-ans-pills-group" role="radiogroup" aria-label="Chọn đáp án đúng câu ${qIdx + 1}">
            <span class="parsed-pills-label">Chọn Đ/A:</span>
            ${pillsHtml}
          </div>
          <button type="button" class="btn btn-ghost btn-sm" onclick="deleteParsedQuestion(${qIdx}, '${containerId}', '${countId}')" style="color: var(--danger); padding: 4px 8px; font-weight: 700;" title="Xóa câu này khỏi danh sách">
            Xóa
          </button>
        </div>
      </div>

      <textarea class="parsed-q-textarea" rows="2" 
                aria-label="Nội dung câu hỏi ${qIdx + 1}"
                onclick="event.stopPropagation()" 
                oninput="updateParsedQuestionText(${qIdx}, this.value)" 
                placeholder="Nội dung câu hỏi...">${escapeHtml(q.question)}</textarea>

      ${q.image ? `
        <div style="margin: 6px 0 10px; max-height: 180px; overflow: hidden; border-radius: 8px; border: 1.5px solid #eab308; display: inline-block; background: #0b0714; position: relative;">
          <img src="${escapeHtml(q.image)}" style="max-height: 180px; max-width: 100%; object-fit: contain; cursor: pointer; display: block;" onclick="openImageZoomModal('${escapeHtml(q.image)}')" alt="Hình minh họa câu ${qIdx + 1}">
          <div style="position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,0.75); color: #fde047; font-size: 0.7rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; pointer-events: none;">Hình minh họa / Hình học</div>
        </div>
      ` : ''}

      <div class="parsed-options-grid">
        ${optionsRowsHtml}
      </div>

      <div style="margin-top: 8px; display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 0.75rem; color: var(--wg-text-subtle);">Lời giải / Giải thích:</span>
        <input type="text" class="form-input form-input-sm" value="${escapeHtml(q.explanation || '')}" 
               aria-label="Lời giải chi tiết câu ${qIdx + 1}"
               onclick="event.stopPropagation()" 
               oninput="updateParsedExplanationText(${qIdx}, this.value)" 
               placeholder="Lời giải chi tiết (tùy chọn)..." style="flex: 1; font-size: 0.78rem; padding: 4px 8px;">
      </div>
    `;

    container.appendChild(card);
  });

  renderMathInView(container);
}

/**
 * Quick Batch Answer Key Parser
 * Accepts string formats like "1A 2B 3C...", "1.A 2.B 3.C...", or "ABCDABCD..."
 */
function applyQuickAnswerKey(containerId, countId) {
  const isSmart = containerId.includes("import");
  const inputEl = document.getElementById(isSmart ? "quick-key-input-smart" : "quick-key-input-sub");
  if (!inputEl) return;
  const raw = inputEl.value.trim();
  if (!raw) {
    showToast("Vui lòng nhập chuỗi đáp án (Ví dụ: 1A 2B 3C... hoặc ABCD...)", "warning");
    return;
  }

  // Check Pattern 1: Numbered pairs e.g. "1A 2B 3C", "1.A, 2.B", "Câu 1: A"
  const pairRegex = /(?:câu\s*)?(\d+)[\s.:\-_)\/]*([A-Ea-e])/gi;
  let matches = [];
  let m;
  while ((m = pairRegex.exec(raw)) !== null) {
    matches.push({ num: parseInt(m[1]), ans: m[2].toUpperCase() });
  }

  let filledCount = 0;
  if (matches.length > 0) {
    matches.forEach(item => {
      const idx = item.num - 1;
      if (idx >= 0 && idx < parsedQuestionsTemp.length) {
        parsedQuestionsTemp[idx].correctAnswer = item.ans;
        filledCount++;
      }
    });
  } else {
    // Pattern 2: Raw letters e.g. "ABCDABCD..." or "A B C D"
    const letters = raw.replace(/[^A-Ea-e]/g, "").toUpperCase().split("");
    letters.forEach((ans, idx) => {
      if (idx < parsedQuestionsTemp.length) {
        parsedQuestionsTemp[idx].correctAnswer = ans;
        filledCount++;
      }
    });
  }

  if (filledCount > 0) {
    renderInteractiveQuestionReviewList(parsedQuestionsTemp, containerId, countId);
    showToast(`Đã tự động điền đáp án cho ${filledCount} câu hỏi!`, "success");
  } else {
    showToast("Không tìm thấy đáp án hợp lệ trong chuỗi nhập vào!", "warning");
  }
}

function clearAllParsedAnswers(containerId, countId) {
  parsedQuestionsTemp.forEach(q => q.correctAnswer = "");
  renderInteractiveQuestionReviewList(parsedQuestionsTemp, containerId, countId);
  showToast("Đã xóa toàn bộ đáp án. Bạn có thể tự chọn lại hoặc dán chuỗi mới!", "info");
}

function setParsedCorrectAnswer(qIdx, optKey, containerId, countId) {
  if (parsedQuestionsTemp[qIdx]) {
    parsedQuestionsTemp[qIdx].correctAnswer = optKey;
    renderInteractiveQuestionReviewList(parsedQuestionsTemp, containerId, countId);
    showToast(`Đã chọn đáp án [${optKey}] cho Câu #${qIdx + 1}`, "success");
  }
}

function updateParsedQuestionText(qIdx, newText) {
  if (parsedQuestionsTemp[qIdx]) {
    parsedQuestionsTemp[qIdx].question = newText.trim();
  }
}

function updateParsedOptionText(qIdx, optKey, newText) {
  if (parsedQuestionsTemp[qIdx]) {
    const opt = parsedQuestionsTemp[qIdx].options.find(o => o.key === optKey);
    if (opt) opt.text = newText;
  }
}

function updateParsedExplanationText(qIdx, newText) {
  if (parsedQuestionsTemp[qIdx]) {
    parsedQuestionsTemp[qIdx].explanation = newText.trim();
  }
}

function updateParsedLevel(qIdx, level, containerId, countId) {
  if (parsedQuestionsTemp[qIdx]) {
    parsedQuestionsTemp[qIdx].level = level;
    renderInteractiveQuestionReviewList(parsedQuestionsTemp, containerId, countId);
    showToast(`Đã đổi mức độ câu #${qIdx + 1} thành [${level}]`, "info");
  }
}

function deleteParsedQuestion(qIdx, containerId, countId) {
  if (parsedQuestionsTemp[qIdx]) {
    parsedQuestionsTemp.splice(qIdx, 1);
    renderInteractiveQuestionReviewList(parsedQuestionsTemp, containerId, countId);
    const submitBtn = document.getElementById("btn-submit-smart-import");
    const btnLabel = document.getElementById("btn-import-label");
    if (btnLabel) btnLabel.textContent = `Lưu Vào Môn Học (${parsedQuestionsTemp.length} câu)`;
    if (submitBtn) submitBtn.disabled = parsedQuestionsTemp.length === 0;
    showToast("Đã xóa câu hỏi khỏi danh sách xem trước!", "warning");
  }
}

function handleSmartImportSubmit() {
  if (parsedQuestionsTemp.length === 0) {
    showToast("Chưa có câu hỏi nào để nhập!", "warning");
    return;
  }

  // Check if any question is missing answer
  const unassigned = parsedQuestionsTemp.filter(q => !q.correctAnswer);
  if (unassigned.length > 0) {
    if (!confirm(`⚠️ Phát hiện ${unassigned.length} câu hỏi chưa được chọn đáp án!\n\nBạn có muốn hệ thống tự động gán đáp án mặc định (A) cho những câu này và tiếp tục lưu không?`)) {
      return;
    }
    parsedQuestionsTemp.forEach(q => {
      if (!q.correctAnswer) q.correctAnswer = "A";
    });
  }

  const inputTitle = document.getElementById("import-input-title")?.value?.trim() || "";
  const selectedCat = document.getElementById("import-input-category")?.value || "auto";

  let targetSub = null;
  if (smartImportTargetSubjectId) {
    targetSub = appData.subjects.find(s => s.id === smartImportTargetSubjectId);
  }

  if (!targetSub) {
    // Luôn tạo Đề Mới riêng biệt khi không chỉ định môn hiện tại
    const finalTitle = inputTitle || "Bộ Đề Mới Tải Lên";
    const detected = detectCategory(finalTitle);
    targetSub = {
      id: Date.now(),
      title: finalTitle,
      code: `SUB-${Math.floor(100 + Math.random() * 900)}`,
      category: selectedCat === "auto" ? detected : selectedCat,
      durationMinutes: 15,
      questions: []
    };
    appData.subjects.unshift(targetSub);
    selectedSubjectId = targetSub.id;
  } else {
    if (inputTitle && targetSub.title !== inputTitle) {
      targetSub.title = inputTitle;
    }
    if (selectedCat !== "auto") {
      targetSub.category = selectedCat;
    } else if (!targetSub.category) {
      targetSub.category = detectCategory(targetSub.title, targetSub.code);
    }
  }

  targetSub.questions.push(...parsedQuestionsTemp);
  saveData();
  closeModal("modal-smart-import");
  renderApp();
  showToast(`Đã lưu thành công ${parsedQuestionsTemp.length} câu hỏi vào đề "${targetSub.title}"!`, "success");
  parsedQuestionsTemp = [];
  smartImportTargetSubjectId = null;

  openSubjectEditor(targetSub.id);
}

function loadSampleImportText() {
  const sample = `Câu 1: Một đất nước không có sông theo đúng nghĩa nhưng nổi tiếng với các tòa nhà cao nhất thế giới và đảo nhân tạo?
A. Ả Rập Saudi
B. Ai Cập
C. Qatar
D. Các Tiểu Vương Quốc Ả Rập Thống Nhất (UAE)
Đáp án: D
Giải thích: UAE sở hữu tháp Burj Khalifa và đảo cọ Palm Jumeirah.

Câu 2: Kim tự tháp Giza và tượng Nhân sư nổi tiếng thuộc về quốc gia nào?
A. Hy Lạp
B. Ai Cập
C. La Mã
D. Ấn Độ
Đáp án: B
Giải thích: Tọa lạc tại Ai Cập cổ đại.

Câu 3: Đại dương nào lớn nhất và sâu nhất thế giới?
A. Đại Tây Dương
B. Ấn Độ Dương
C. Thái Bình Dương
D. Bắc Băng Dương
Đáp án: C`;

  const textarea = document.getElementById("import-raw-text");
  if (textarea) {
    textarea.value = sample;
    const parsed = parseSmartText(sample);
    handleParsedResults(parsed, "Văn bản mẫu");
  }
}

// ==========================================================================
// 5. WEB AUDIO API SYNTHESIZER (BGM & SFX ENGINE)
// ==========================================================================
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playQuizizzTone(type) {
  if (!quizizzSoundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.07);
    } 
    else if (type === "correct") {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.055);
        gain.gain.setValueAtTime(0.2, now + i * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.22);
        osc.start(now + i * 0.055);
        osc.stop(now + i * 0.055 + 0.24);
      });
    } 
    else if (type === "wrong") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(140, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.3);
    } 
    else if (type === "streak") {
      [587.33, 739.99, 880.00, 1174.66, 1479.98].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.065);
        gain.gain.setValueAtTime(0.28, now + i * 0.065);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.065 + 0.28);
        osc.start(now + i * 0.065);
        osc.stop(now + i * 0.065 + 0.3);
      });
    } 
    else if (type === "powerup") {
      [400, 600, 850, 1200, 1600].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.04);
        gain.gain.setValueAtTime(0.2, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.04 + 0.16);
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.18);
      });
    }
    else if (type === "mystery") {
      [659.25, 830.61, 987.77, 1318.51, 1661.22].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.25, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.38);
      });
    }
    else if (type === "victory") {
      [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.09);
        gain.gain.setValueAtTime(0.3, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.4);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.42);
      });
    }
  } catch (e) {}
}

/**
 * Lively Quizizz-style Synthesizer Background Music Loop
 */
function startQuizizzBgm() {
  stopQuizizzBgm();
  quizizzBgmEnabled = true;
  const ctx = getAudioContext();
  if (!ctx) return;

  const btnBgm = document.getElementById("btn-quizizz-bgm");
  const iconBgm = document.getElementById("quizizz-bgm-icon");
  if (btnBgm) btnBgm.classList.add("bgm-pulsing");
  if (iconBgm) iconBgm.textContent = "BGM";

  try {
    if (ctx.state === "suspended") ctx.resume();

    const chords = [
      [261.63, 329.63, 392.00, 523.25], // C Major
      [220.00, 261.63, 329.63, 440.00], // A Minor
      [174.61, 220.00, 261.63, 349.23], // F Major
      [196.00, 246.94, 293.66, 392.00]  // G Major
    ];
    let step = 0;

    const playStep = () => {
      if (!quizizzBgmEnabled) return;
      const now = ctx.currentTime;
      const currentChord = chords[step % chords.length];

      // Arpeggiated soft synth chimes
      currentChord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.22);
        gain.gain.setValueAtTime(0.025, now + i * 0.22);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.22 + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.22);
        osc.stop(now + i * 0.22 + 1.3);
      });

      // Warm Bass pulse
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = "triangle";
      bassOsc.frequency.setValueAtTime(currentChord[0] / 2, now);
      bassGain.gain.setValueAtTime(0.035, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      bassOsc.connect(bassGain);
      bassGain.connect(ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + 1.6);

      step++;
    };

    playStep();
    bgmInterval = setInterval(playStep, 1800);
  } catch (e) {}
}

function stopQuizizzBgm() {
  quizizzBgmEnabled = false;
  if (bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
  const btnBgm = document.getElementById("btn-quizizz-bgm");
  const iconBgm = document.getElementById("quizizz-bgm-icon");
  if (btnBgm) btnBgm.classList.remove("bgm-pulsing");
  if (iconBgm) iconBgm.textContent = "BGM";
}

function toggleQuizizzSound() {
  quizizzSoundEnabled = !quizizzSoundEnabled;
  const icon = document.getElementById("quizizz-sound-icon");
  if (icon) icon.textContent = quizizzSoundEnabled ? "SFX" : "MUTE";
  showToast(quizizzSoundEnabled ? "Đã bật hiệu ứng âm thanh" : "Đã tắt hiệu ứng âm thanh", "info");
}

function toggleQuizizzBgm() {
  if (quizizzBgmEnabled) {
    stopQuizizzBgm();
    showToast("Đã tắt nhạc nền phòng thi", "info");
  } else {
    startQuizizzBgm();
    showToast("Đã bật nhạc nền phòng thi", "success");
  }
}

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

// ==========================================================================
// 7. PRE-EXAM PROMPT & ARENA START
// ==========================================================================
function openPreExamModal(subId) {
  const sub = appData.subjects.find(s => s.id === subId);
  if (!sub || !sub.questions || sub.questions.length === 0) {
    showToast("Môn này chưa có câu hỏi nào để bắt đầu!", "warning");
    return;
  }

  currentSubjectId = subId;

  document.getElementById("pre-exam-sub-title").textContent = sub.title;
  document.getElementById("pre-exam-code").textContent = sub.code || "101";
  document.getElementById("pre-exam-qcount").textContent = sub.questions.length;

  const nameInput = document.getElementById("pre-exam-name");
  if (nameInput) {
    nameInput.value = "";
    nameInput.placeholder = "Họ và tên thí sinh...";
  }

  const msvInput = document.getElementById("pre-exam-msv");
  if (msvInput) {
    msvInput.value = "";
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
  e.preventDefault();
  const nameInput = document.getElementById("pre-exam-name");
  const msvInput = document.getElementById("pre-exam-msv");
  
  const name = nameInput ? nameInput.value.trim() : "";
  const msv = msvInput ? msvInput.value.trim() : "";
  
  currentCandidateName = name || "Thí Sinh";
  currentCandidateMsv = msv;
  currentCandidateAvatar = document.getElementById("pre-exam-selected-avatar")?.value || "🚀";

  const toggle = document.getElementById("pre-exam-instant-toggle");
  currentScoringMode = (toggle && toggle.checked) ? "instant" : "delayed";

  if (!userProfile.isLoggedIn) {
    userProfile.name = currentCandidateName;
    userProfile.msv = currentCandidateMsv;
    userProfile.avatar = currentCandidateAvatar;
    saveUserProfile();
  }

  try {
    window.open("https://s.shopee.vn/1AkCwLocI", "_blank");
  } catch (err) {
    console.error("Error opening link:", err);
  }

  closeModal("modal-pre-exam");
  startExam(currentSubjectId);
}

// ==========================================================================
// 8. WAYGROUND / QUIZIZZ ARENA ENGINE (WITH PER-QUESTION TIMER & BGM)
// ==========================================================================
function startExam(subId) {
  if (subId) currentSubjectId = subId;
  const sub = appData.subjects.find(s => s.id === currentSubjectId);
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

  // Initialize audio and automatically start lively BGM synthesizer
  getAudioContext();
  startQuizizzBgm();

  switchView("exam");
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

    if (isTop1) {
      rankClass = "rank-1-row";
      badgeClass = "rank-1";
      badgeIcon = "👑 1";
    } else if (isTop2) {
      rankClass = "rank-2-row";
      badgeClass = "rank-2";
      badgeIcon = "🥈 2";
    } else if (isTop3) {
      rankClass = "rank-3-row";
      badgeClass = "rank-3";
      badgeIcon = "🥉 3";
    }

    const mins = Math.floor(item.timeUsedSecs / 60);
    const secs = item.timeUsedSecs % 60;
    const timeStr = `${mins > 0 ? mins + 'p ' : ''}${secs}s`;

    row.className = `leaderboard-row ${rankClass}`;
    row.innerHTML = `
      <div class="lb-col-left">
        <span class="rank-badge ${badgeClass}">${badgeIcon}</span>
        <span class="lb-avatar">${item.avatar || "🚀"}</span>
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
  saveData();
  closeModal("modal-subject");
  renderApp();

  if (targetSub) {
    openSubjectEditor(targetSub.id);
  }
}

function deleteSubject(subId) {
  if (!requireTeacherAuth(() => deleteSubject(subId))) return;
  const sub = appData.subjects.find(s => s.id === subId);
  if (!sub) return;
  if (confirm(`Bạn có chắc chắn muốn xóa môn "${sub.title}" cùng toàn bộ câu hỏi?`)) {
    appData.subjects = appData.subjects.filter(s => s.id !== subId);
    saveData();
    renderApp();
    showToast("Đã xóa môn học!", "warning");
  }
}

function openSubjectEditor(subId) {
  if (!requireTeacherAuth(() => openSubjectEditor(subId))) return;
  const sub = appData.subjects.find(s => s.id === subId);
  if (!sub) return;
  currentSubjectId = subId;

  const cat = sub.category || detectCategory(sub.title, sub.code);
  document.getElementById("editor-subject-title").textContent = sub.title;
  document.getElementById("editor-subject-meta").textContent = `Phân môn: ${cat} • Mã đề: ${sub.code} • ${sub.questions ? sub.questions.length : 0} câu hỏi`;

  renderEditorQuestionList();
  switchView("editor");
}

function saveAndReturnDashboard() {
  saveData();
  renderApp();
  switchView("dashboard");
  showToast("Đã lưu toàn bộ đề thi an toàn!");
}

function splitCurrentSubject(subId = null) {
  const targetId = subId || currentSubjectId;
  const sub = appData.subjects.find(s => s.id === targetId);
  if (!sub || !sub.questions || sub.questions.length < 2) {
    showToast("Đề này có quá ít câu hỏi để tách!", "warning");
    return;
  }

  const defaultSplit = Math.floor(sub.questions.length / 2);
  const promptSplit = prompt(
    `Bộ đề "${sub.title}" hiện có ${sub.questions.length} câu hỏi.\n\nNhập số lượng câu hỏi muốn giữ lại cho Đề 1 (phần còn lại sẽ tách thành Đề thứ 2 riêng biệt):`,
    defaultSplit
  );
  if (promptSplit === null) return;

  const splitCount = parseInt(promptSplit.trim(), 10);
  if (isNaN(splitCount) || splitCount <= 0 || splitCount >= sub.questions.length) {
    alert(`Số lượng câu hỏi không hợp lệ! Phải là số từ 1 đến ${sub.questions.length - 1}.`);
    return;
  }

  const defaultTitle1 = sub.title.includes(" - Đề") ? sub.title : `${sub.title} (Đề 1)`;
  const defaultTitle2 = sub.title.includes(" - Đề") ? `${sub.title.replace(/Đề \d+/, '')} Đề 2` : `${sub.title} (Đề 2)`;

  const newTitlePart1 = prompt("Nhập tên cho Đề thứ nhất:", defaultTitle1);
  if (newTitlePart1 === null) return;

  const newTitlePart2 = prompt("Nhập tên cho Đề thứ hai:", defaultTitle2);
  if (newTitlePart2 === null) return;

  const q1 = sub.questions.slice(0, splitCount);
  const q2 = sub.questions.slice(splitCount);

  // Cập nhật đề thứ nhất
  sub.title = newTitlePart1.trim() || defaultTitle1;
  sub.questions = q1;

  // Tạo đề thứ 2 riêng biệt
  const newSub = {
    id: Date.now(),
    title: newTitlePart2.trim() || defaultTitle2,
    code: `SUB-${Math.floor(100 + Math.random() * 900)}`,
    category: sub.category || detectCategory(newTitlePart2),
    questions: q2
  };
  appData.subjects.unshift(newSub);

  saveData();
  renderApp();
  if (currentView === "editor" && currentSubjectId === sub.id) {
    openSubjectEditor(sub.id);
  }
  showToast(`Đã tách thành 2 đề: "${sub.title}" (${q1.length} câu) và "${newSub.title}" (${q2.length} câu)!`, "success");
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
        <div class="qb-option-item ${isCorrect ? "correct" : ""}" onclick="setCorrectAnswerQuick(${idx}, '${opt.key}')" style="cursor: pointer;" title="Bấm để đặt đáp án đúng">
          <strong>${opt.key}.</strong>
          <span>${escapeHtml(opt.text)}</span>
          ${isCorrect ? `<span class="qb-correct-tag">ĐÚNG</span>` : ""}
        </div>
      `;
    });

    card.innerHTML = `
      <div class="qb-card-top">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="qb-index-badge">Câu ${idx + 1}</span>
          <span class="qb-level-badge level-thong-hieu">${q.level || "Thông hiểu"}</span>
          <span style="font-size: 0.75rem; color: var(--wg-text-subtle);">(Bấm vào ô A/B/C/D để đổi đáp án đúng)</span>
        </div>
        <div style="display: flex; gap: 6px;">
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

  saveData();
  closeModal("modal-question");
  renderEditorQuestionList();
  renderStats();
}

function deleteQuestion(idx) {
  if (!requireTeacherAuth(() => deleteQuestion(idx))) return;
  const sub = appData.subjects.find(s => s.id === currentSubjectId);
  if (!sub || !sub.questions[idx]) return;
  if (confirm(`Bạn có chắc chắn muốn xóa câu hỏi #${idx + 1}?`)) {
    sub.questions.splice(idx, 1);
    saveData();
    renderEditorQuestionList();
    renderStats();
    showToast("Đã xóa câu hỏi!", "warning");
  }
}

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

// ==========================================================================
// 13. JSON BACKUP & RESTORE, QR MODAL, UTILS
// ==========================================================================
function exportDatabaseJson() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `CuonEdu_Backup_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast("Đã xuất file sao lưu JSON thành công!");
}

function importDatabaseJson(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const imported = JSON.parse(event.target.result);
      if (imported && Array.isArray(imported.subjects)) {
        appData = imported;
        saveData();
        renderApp();
        showToast("Đã khôi phục dữ liệu thành công!");
      } else {
        showToast("Tệp JSON không đúng định dạng!", "danger");
      }
    } catch (err) {
      showToast("Lỗi khi đọc file JSON!", "danger");
    }
  };
  reader.readAsText(file);
}

function openQrModal() {
  const currentUrl = window.location.href;
  const qrImg = document.getElementById("qr-modal-image");
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(currentUrl)}`;
  }
  openModal("modal-qr");
}

function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.add("active");
}

function closeModal(modalId, returnToDashboard = true) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove("active");
  // If explicitly closing result modal, return to dashboard
  if (modalId === "modal-result" && returnToDashboard) {
    switchView("dashboard");
  }
  // If closing mystery box via any means, guarantee exam proceeds and does not freeze
  if (modalId === "modal-mystery-box") {
    setTimeout(() => {
      if (document.body.classList.contains("in-exam-mode") && isAnswerLockedForSlide) {
        if (currentSlideIndex < activeExamQuestions.length - 1) {
          currentSlideIndex++;
          renderQuizizzSlide();
        } else {
          submitExam();
        }
      }
    }, 250);
  }
}

function openImageZoomModal(imgSrc) {
  const imgEl = document.getElementById("zoom-modal-img");
  if (imgEl) imgEl.src = imgSrc;
  openModal("modal-image-zoom");
}

function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  else document.exitFullscreen().catch(() => {});
}

function escapeHtml(text) {
  if (!text) return "";
  return text.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "toastFadeOut 0.3s forwards";
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

function renderAvatarPicker(containerId, selectedAvatar, onSelect) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  AVATARS_LIST.forEach(av => {
    const item = document.createElement("div");
    item.className = `avatar-option-item ${av === selectedAvatar ? "selected" : ""}`;
    item.textContent = av;
    item.onclick = () => {
      container.querySelectorAll(".avatar-option-item").forEach(i => i.classList.remove("selected"));
      item.classList.add("selected");
      onSelect(av);
    };
    container.appendChild(item);
  });
}

function openGoogleAuthModal() { openModal("modal-google-auth"); }

function handleGoogleAuthSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("google-auth-name").value.trim() || "Quang Nguyễn";
  const email = document.getElementById("google-auth-email").value.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`;

  userProfile = { name, avatar: "QN", email, isLoggedIn: true };
  saveUserProfile();
  closeModal("modal-google-auth");
  showToast(`Chào mừng ${name}! Đăng nhập thành công.`);
}

function openProfileModal() {
  document.getElementById("profile-edit-name").value = userProfile.name || "";
  document.getElementById("profile-selected-avatar").value = userProfile.avatar || "QN";
  renderAvatarPicker("profile-avatar-grid", userProfile.avatar || "QN", (av) => {
    document.getElementById("profile-selected-avatar").value = av;
  });
  openModal("modal-profile");
}

function handleSaveProfile(e) {
  e.preventDefault();
  const name = document.getElementById("profile-edit-name").value.trim();
  const avatar = document.getElementById("profile-selected-avatar").value;
  if (!name) return showToast("Vui lòng nhập tên hiển thị!", "warning");

  userProfile.name = name;
  userProfile.avatar = avatar;
  saveUserProfile();
  closeModal("modal-profile");
  showToast("Đã lưu hồ sơ thành công!");
}

function handleLogout() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
    userProfile = { name: "Quang Nguyễn", avatar: "QN", email: "", isLoggedIn: false };
    saveUserProfile();
    closeModal("modal-profile");
    showToast("Đã đăng xuất tài khoản.");
  }
}

function launchConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ["#8ea604", "#9d4edd", "#f97316", "#06b6d4", "#d91b70", "#fde047"];

  for (let i = 0; i < 120; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.7) * 18,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: Math.random() * 0.015 + 0.008
    });
  }

  let animFrame;
  function updateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35;
      p.alpha -= p.decay;

      if (p.alpha > 0) {
        active = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      }
    });

    if (active) animFrame = requestAnimationFrame(updateConfetti);
    else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animFrame);
    }
  }

  updateConfetti();
}

function setupGlobalEvents() {
  document.getElementById("form-subject")?.addEventListener("submit", handleSaveSubject);
  document.getElementById("form-question")?.addEventListener("submit", handleSaveQuestion);
  document.getElementById("btn-submit-smart-import")?.addEventListener("click", handleSmartImportSubmit);
  document.getElementById("json-file-input")?.addEventListener("change", importDatabaseJson);
  
  // File inputs & Drop zones (both in smart import modal and create subject modal)
  const fileInputs = [
    document.getElementById("file-upload-input"),
    document.getElementById("create-sub-file-input")
  ];

  fileInputs.forEach(input => {
    if (input) {
      input.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) processUploadedFile(e.target.files[0]);
      });
    }
  });

  const dropZones = [
    document.getElementById("file-drop-zone"),
    document.getElementById("create-sub-drop-zone")
  ];

  dropZones.forEach(zone => {
    if (zone) {
      zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("dragover"); });
      zone.addEventListener("dragleave", () => { zone.classList.remove("dragover"); });
      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("dragover");
        if (e.dataTransfer.files && e.dataTransfer.files[0]) processUploadedFile(e.dataTransfer.files[0]);
      });
    }
  });

  const rawTextarea = document.getElementById("import-raw-text");
  if (rawTextarea) {
    let debounceTimer = null;
    rawTextarea.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const text = e.target.value;
        if (text.trim()) {
          const parsed = parseSmartText(text);
          handleParsedResults(parsed, "Văn bản nhập trực tiếp");
        } else {
          document.getElementById("import-preview-section").style.display = "none";
          document.getElementById("btn-submit-smart-import").disabled = true;
          document.getElementById("btn-import-label").textContent = "Lưu Vào Môn Học (0 câu)";
        }
      }, 300);
    });
  }



  // Liquid Glass JS — Real-time Refraction & Specular Rim Tracking
  document.addEventListener("pointermove", (e) => {
    const target = e.target.closest(".btn, .btn-hamburger, .sub-item-card, .stat-glass-card, .glass-specular, .detail-chip, .grid-subject-card, .compact-table-card, .focus-stage-card, .layout-pill-btn");
    if (target) {
      const rect = target.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      target.style.setProperty("--mouse-x", `${x.toFixed(1)}%`);
      target.style.setProperty("--mouse-y", `${y.toFixed(1)}%`);
    }
  }, { passive: true });

  // Keyboard navigation (Escape for drawer/modals, ArrowLeft/Right for Focus Stage carousel)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMainDrawer();
      return;
    }
    // Only handle arrow keys if not currently typing in an input/textarea
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
    if (activeTag === "input" || activeTag === "textarea") return;

    if (currentLayoutMode === "focus-stage" && document.getElementById("view-dashboard")?.classList.contains("active")) {
      if (e.key === "ArrowLeft") {
        focusPrevSubject();
      } else if (e.key === "ArrowRight") {
        focusNextSubject();
      }
    }
  });

  initDraggableAIFloatBtn();
}

function toggleNavDropdown(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById("nav-dropdown-menu");
  if (menu) menu.classList.toggle("show");
}

function closeNavDropdown() {
  const menu = document.getElementById("nav-dropdown-menu");
  if (menu) menu.classList.remove("show");
}

// ==========================================================================
// 14. MULTI-THEME & UI CUSTOMIZER SYSTEM
// ==========================================================================
const THEMES = [
  { id: "cyber-sunset", name: "Cyber Sunset", color: "#c084fc" },
  { id: "apple-dark", name: "Titanium Dark", color: "#2c2c2e" },
  { id: "apple-light", name: "Silver Light", color: "#e5e5ea" },
  { id: "midnight-navy", name: "Midnight Navy", color: "#38bdf8" },
  { id: "matte-carbon", name: "Matte Carbon", color: "#525252" },
  { id: "nordic-sage", name: "Nordic Sage", color: "#34d399" },
  { id: "royal-amber", name: "Royal Amber", color: "#f59e0b" },
  { id: "cupertino-frost", name: "Cupertino Frost", color: "#0284c7" }
];

function initTheme() {
  const saved = localStorage.getItem("cuonedu_theme") || "cyber-sunset";
  applyTheme(saved, false);
}

function applyTheme(themeId, showNotification = false) {
  const matched = THEMES.find(t => t.id === themeId) || THEMES[0];
  document.documentElement.setAttribute("data-theme", matched.id);
  localStorage.setItem("cuonedu_theme", matched.id);

  // Update quick toggle pill
  const quickLabel = document.getElementById("quick-theme-label");
  const quickDot = document.getElementById("quick-theme-dot");
  if (quickLabel) quickLabel.textContent = matched.name;
  if (quickDot) quickDot.style.background = matched.color;

  // Update active state in drawer theme choices
  document.querySelectorAll(".theme-choice-btn").forEach(btn => {
    if (btn.getAttribute("data-theme-id") === matched.id) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  if (showNotification) {
    showToast(`Đã đổi giao diện: ${matched.name}`, "info");
  }
}

function switchTheme(themeId) {
  applyTheme(themeId, true);
}

function cycleTheme() {
  const current = localStorage.getItem("cuonedu_theme") || "apple-dark";
  const idx = THEMES.findIndex(t => t.id === current);
  const nextIdx = (idx + 1) % THEMES.length;
  applyTheme(THEMES[nextIdx].id, true);
}

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
      btn.style.left = `${snapX}px`;
      setTimeout(() => {
        btn.style.transition = "";
      }, 300);
    }
  };

  // Mouse events
  btn.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    onStart(e.clientX, e.clientY);

    const onMouseMove = (ev) => onMove(ev.clientX, ev.clientY);
    const onMouseUp = () => {
      onEnd();
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  // Touch events (phones & tablets)
  btn.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      onStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  btn.addEventListener("touchmove", (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    onMove(e.touches[0].clientX, e.touches[0].clientY);
    if (hasMoved && e.cancelable) {
      e.preventDefault();
    }
  }, { passive: false });

  btn.addEventListener("touchend", () => {
    onEnd();
  }, { passive: true });

  btn.addEventListener("touchcancel", () => {
    onEnd();
  }, { passive: true });

  // Click toggle: only opens chatbot if user tapped without dragging
  btn.addEventListener("click", (e) => {
    if (hasMoved) {
      e.preventDefault();
      e.stopPropagation();
      hasMoved = false;
      return;
    }
    toggleAIChatbot();
  });
}

function toggleAIChatbot(forceState) {
  if (document.body.classList.contains("in-exam-mode") && forceState !== false) {
    showToast("Không được sử dụng trợ lý AI trong lúc làm bài thi!", "warning");
    return;
  }
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


