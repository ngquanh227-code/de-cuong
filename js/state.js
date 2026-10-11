// ==========================================================================
// CUONEDU PRO — MODULE: STATE & DATA STORE
// ==========================================================================
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


// Initial Sample Subject (Cleared by user request)
const INITIAL_DEMO_SUBJECTS = [];

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


function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      appData = JSON.parse(saved);
      if (!Array.isArray(appData.subjects)) {
        appData.subjects = [];
      }
    }

    // Nếu chưa có dữ liệu trong LocalStorage (lần đầu vào web hoặc đổi máy), nạp ngay bộ đề gốc từ questions.js
    if (!appData || !Array.isArray(appData.subjects) || appData.subjects.length === 0) {
      if (typeof DEFAULT_INITIAL_DATA !== "undefined") {
        if (Array.isArray(DEFAULT_INITIAL_DATA.subjects) && DEFAULT_INITIAL_DATA.subjects.length > 0) {
          appData = JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA));
          saveData(false);
        } else if (Array.isArray(DEFAULT_INITIAL_DATA) && DEFAULT_INITIAL_DATA.length > 0) {
          appData = { subjects: JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA)), lastUpdated: Date.now() };
          saveData(false);
        }
      }
    }
    if (!appData || !Array.isArray(appData.subjects)) {
      appData = { subjects: [] };
    }

    // Xóa triệt để môn mẫu mặc định cũ nếu còn tồn đọng trong máy
    if (Array.isArray(appData.subjects)) {
      const beforeLen = appData.subjects.length;
      appData.subjects = appData.subjects.filter(s => s.id !== 1710000000001 && s.code !== "GEO-204" && !s.title?.includes("Khám Phá Địa Lý"));
      if (appData.subjects.length !== beforeLen) {
        saveData(false);
      }
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
      if (hasChanges) saveData(false);
    }
  } catch (e) {
    console.error("Lỗi nạp database:", e);
    appData = { subjects: [] };
  }
}

let cloudSyncDebounceTimer = null;

function saveData(triggerCloudSync = true) {
  try {
    appData.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  } catch (e) {
    console.error("Lỗi lưu database:", e);
  }

  // Tự động đồng bộ lên Cloud ngầm ngay khi giáo viên tải/sửa/xóa đề
  if (triggerCloudSync) {
    clearTimeout(cloudSyncDebounceTimer);
    cloudSyncDebounceTimer = setTimeout(() => {
      syncToCloud(true);
    }, 450);
  }
}
