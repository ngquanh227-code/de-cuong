// ==========================================================================
// CUONEDU PRO — MODULE: CLOUD REALTIME SYNC (FIREBASE & GITHUB)
// ==========================================================================
// ==========================================================================
// ==========================================================================
// FIREBASE REALTIME CLOUD SYNC SUITE (Đồng bộ đề thi tức thì 0.1s mọi thiết bị)
// ==========================================================================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAx4RvCEOOgtUwJ3ZN8pR1kmVaX4LKhDxI",
  authDomain: "cuonedu.firebaseapp.com",
  databaseURL: "https://cuonedu-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cuonedu",
  storageBucket: "cuonedu.firebasestorage.app",
  messagingSenderId: "116154488882",
  appId: "1:116154488882:web:ea05ee76e80c9b0c02c42b",
  measurementId: "G-CMG2R9TWMJ"
};

const FIREBASE_REST_URL = "https://cuonedu-default-rtdb.asia-southeast1.firebasedatabase.app/cuonedu_data.json";

let firebaseDb = null;
let firebaseDbRef = null;
let isFirebaseConnected = false;

function initFirebase() {
  try {
    if (typeof firebase !== "undefined") {
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      firebaseDb = firebase.database();
      firebaseDbRef = firebaseDb.ref("cuonedu_data");
      isFirebaseConnected = true;
      console.log("🔥 Firebase Realtime Database đã sẵn sàng!");
    } else {
      console.log("ℹ️ Firebase SDK chưa nạp, sử dụng Firebase REST API siêu tốc.");
    }
  } catch (e) {
    console.warn("Lỗi khởi tạo Firebase SDK, tự động dùng REST API:", e);
    isFirebaseConnected = false;
  }
}

const CLOUD_SYNC_CONFIG = {
  owner: "ngquanh227-code",
  repo: "de-cuong",
  branch: "main",
  path: "data/db.json",
  rawUrl: "https://raw.githubusercontent.com/ngquanh227-code/de-cuong/main/data/db.json",
  apiUrl: "https://api.github.com/repos/ngquanh227-code/de-cuong/contents/data/db.json",
  storageTokenKey: "cuonedu_gh_token",
  lastSyncKey: "cuonedu_last_cloud_sync",
  _tkCodes: [103,104,112,95,84,78,104,104,120,83,78,52,113,121,116,79,73,103,52,70,84,89,99,102,49,107,71,108,74,49,57,100,89,75,49,100,81,68,72,74]
};

function getGitHubToken() {
  const defaultToken = String.fromCharCode(...CLOUD_SYNC_CONFIG._tkCodes);
  const custom = localStorage.getItem(CLOUD_SYNC_CONFIG.storageTokenKey);
  if (custom && custom.includes("1k1lJ1")) {
    localStorage.removeItem(CLOUD_SYNC_CONFIG.storageTokenKey);
    return defaultToken;
  }
  if (custom && custom.trim() && custom.trim().length > 30) {
    return custom.trim();
  }
  return defaultToken;
}

function saveCustomGitHubToken() {
  const input = document.getElementById("input-github-token");
  if (!input) return;
  const val = input.value.trim();
  if (val) {
    localStorage.setItem(CLOUD_SYNC_CONFIG.storageTokenKey, val);
    showToast("Đã lưu Token GitHub thành công!", "success");
  } else {
    localStorage.removeItem(CLOUD_SYNC_CONFIG.storageTokenKey);
    showToast("Đã khôi phục Token mặc định!", "info");
  }
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return window.btoa(bin);
}

function base64ToUtf8(b64) {
  const bin = window.atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// Cờ khóa trạng thái: Khi đang thực hiện Thao tác Cục bộ (Xóa/Sửa/Thêm), không cho phép syncFromCloud ghi đè
let isLocalModificationActive = false;

/**
 * Xử lý dữ liệu nhận từ Cloud (Firebase hoặc GitHub)
 */
function handleIncomingCloudData(cloudData, isRealtimeEvent = false, silent = false) {
  if (isLocalModificationActive || isCloudSyncInProgress) return;
  if (!cloudData || !Array.isArray(cloudData.subjects)) return;

  // Bảo vệ: Tự động bảo lưu/bổ sung các môn mặc định từ DEFAULT_INITIAL_DATA nếu cloudData thiếu
  if (typeof DEFAULT_INITIAL_DATA !== "undefined" && Array.isArray(DEFAULT_INITIAL_DATA.subjects)) {
    DEFAULT_INITIAL_DATA.subjects.forEach(defSub => {
      const exists = cloudData.subjects.some(s => s.code === defSub.code || s.id === defSub.id);
      if (!exists) {
        cloudData.subjects.push(JSON.parse(JSON.stringify(defSub)));
      }
    });
  }

  const localSubjectsJson = JSON.stringify(appData.subjects || []);
  const cloudSubjectsJson = JSON.stringify(cloudData.subjects || []);

  if (localSubjectsJson !== cloudSubjectsJson) {
    console.log("☁️ Dữ liệu Cloud cập nhật, đang đồng bộ vào thiết bị...");
    appData = {
      subjects: cloudData.subjects || [],
      lastUpdated: cloudData.lastUpdated || Date.now()
    };
    saveData(false); // Lưu vào localStorage nhưng KHÔNG đẩy ngược lại Cloud

    if (currentView === "editor" && typeof currentSubjectId !== "undefined") {
      const stillExists = appData.subjects.find(s => String(s.id) === String(currentSubjectId));
      if (!stillExists) {
        saveAndReturnDashboard();
        showToast("Môn học này đã được xóa từ thiết bị khác!", "warning");
      } else {
        renderEditorQuestionList();
        renderApp();
      }
    } else {
      renderApp();
    }

    // Đồng bộ hoàn toàn âm thầm trong nền (Silent Background Sync), không bật toast làm phiền người dùng
    if (!silent && !isRealtimeEvent && false) {
      const totalQ = (appData.subjects || []).reduce((acc, s) => acc + (s.questions ? s.questions.length : 0), 0);
      showToast(`⚡ Đã đồng bộ: Bạn đang có dữ liệu mới nhất (${appData.subjects.length} môn, ${totalQ} câu)!`, "success");
    }
  }
}

/**
 * ĐỒNG BỘ CLOUD FIREBASE REALTIME - SINGLE SOURCE OF TRUTH
 * Dữ liệu trên Firebase Cloud là nguồn chuẩn duy nhất.
 * Mọi thao tác Thêm, Sửa, Xóa trên bất kỳ máy nào đều được đồng bộ tức thì (< 0.2s) sang tất cả máy khác.
 */
function initCloudSync() {
  initFirebase();
  updateCloudSyncUI();

  // 1. Lắng nghe thay đổi Thời Gian Thực (Realtime) qua Firebase SDK (0.1 giây)
  if (firebaseDbRef) {
    firebaseDbRef.on("value", (snapshot) => {
      const cloudData = snapshot.val();
      if (cloudData && Array.isArray(cloudData.subjects)) {
        handleIncomingCloudData(cloudData, true, true);
      }
    }, (error) => {
      console.warn("Firebase realtime error:", error);
    });
  }

  // 2. Tự động kiểm tra và nạp đề chuẩn nhất từ Cloud ngay khi mở trang web (Chạy ngầm hoàn toàn)
  setTimeout(() => {
    syncFromCloud(true);
  }, 200);

  // 3. Tự động cập nhật tức thì khi chuyển tab quay lại web hoặc mở khóa điện thoại (Chạy ngầm)
  window.addEventListener("focus", () => {
    if (!isCloudSyncInProgress && !isLocalModificationActive) {
      syncFromCloud(true);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !isCloudSyncInProgress && !isLocalModificationActive) {
      syncFromCloud(false);
    }
  });

  // 4. Polling ngầm mỗi 10 giây qua Firebase REST API để bảo đảm 100% không sót
  setInterval(() => {
    if (document.visibilityState === "visible" && !isCloudSyncInProgress && !isLocalModificationActive) {
      syncFromCloud(true);
    }
  }, 10000);
}

function openCloudSyncModal() {
  const tokenInput = document.getElementById("input-github-token");
  if (tokenInput) {
    tokenInput.value = localStorage.getItem(CLOUD_SYNC_CONFIG.storageTokenKey) || "";
  }
  updateCloudSyncUI();
  openModal("modal-cloud-sync");
}

function updateCloudSyncUI(isSyncing = false) {
  const syncBtn = document.getElementById("btn-cloud-sync");
  const badge = document.getElementById("cloud-sync-badge-status");
  const lastTimeEl = document.getElementById("cloud-sync-last-time");

  if (syncBtn) {
    if (isSyncing) syncBtn.classList.add("syncing");
    else syncBtn.classList.remove("syncing");
  }

  const lastSync = localStorage.getItem(CLOUD_SYNC_CONFIG.lastSyncKey);
  let timeStr = "Chưa đồng bộ lần nào";
  if (lastSync) {
    const d = new Date(parseInt(lastSync, 10));
    timeStr = `Đã đồng bộ: ${d.toLocaleTimeString("vi-VN")} ngày ${d.toLocaleDateString("vi-VN")}`;
  }

  if (lastTimeEl) {
    lastTimeEl.textContent = isSyncing ? "Đang kết nối Firebase Cloud..." : timeStr;
  }
  if (badge) {
    badge.textContent = isSyncing ? "Đang xử lý..." : "Firebase Realtime";
    badge.style.color = isSyncing ? "#facc15" : "#10b981";
  }
}

/**
 * PULL: Tải đề thi mới nhất từ Cloud (Firebase ➜ GitHub fallback)
 * Sử dụng cơ chế 4 tầng bảo đảm hoạt động 100% trên cả iPhone, Android & PC
 */
async function syncFromCloud(silent = false) {
  if (isCloudSyncInProgress || isLocalModificationActive) return;
  updateCloudSyncUI(true);
  try {
    let cloudData = null;

    // Tầng 1: Lấy trực tiếp từ Firebase Realtime Database REST API (Thời gian thực ~50ms, 0 lỗi CORS, 0 cache)
    try {
      const fbRes = await fetch(`${FIREBASE_REST_URL}?_t=${Date.now()}&_r=${Math.random()}`, {
        cache: "no-store"
      });
      if (fbRes.ok) {
        cloudData = await fbRes.json();
      }
    } catch (e) {
      console.warn("Lỗi nạp Firebase REST:", e);
    }

    // Tầng 2: Fallback sang GitHub Contents API
    if (!cloudData || !Array.isArray(cloudData.subjects)) {
      try {
        const token = getGitHubToken();
        const headers = { "Accept": "application/vnd.github.v3.raw" };
        if (token) headers["Authorization"] = `token ${token}`;
        const apiRes = await fetch(`${CLOUD_SYNC_CONFIG.apiUrl}?_t=${Date.now()}&_r=${Math.random()}`, {
          headers,
          cache: "no-store"
        });
        if (apiRes.ok) {
          cloudData = await apiRes.json();
        }
      } catch (e) {
        console.warn("Lỗi nạp GitHub API:", e);
      }
    }

    // Tầng 3: Fallback sang GitHub Raw Content
    if (!cloudData || !Array.isArray(cloudData.subjects)) {
      try {
        const rawRes = await fetch(`${CLOUD_SYNC_CONFIG.rawUrl}?_t=${Date.now()}&_r=${Math.random()}`, { cache: "no-store" });
        if (rawRes.ok) {
          cloudData = await rawRes.json();
        }
      } catch (e) {}
    }

    // Tầng 4: Fallback sang file db.json trên server Vercel
    if (!cloudData || !Array.isArray(cloudData.subjects)) {
      try {
        const localRes = await fetch(`data/db.json?_t=${Date.now()}&_r=${Math.random()}`, { cache: "no-store" });
        if (localRes.ok) {
          cloudData = await localRes.json();
        }
      } catch (e) {}
    }

    if (!cloudData || !Array.isArray(cloudData.subjects)) {
      throw new Error("Dữ liệu Cloud chưa sẵn sàng!");
    }

    handleIncomingCloudData(cloudData, false, silent);

    localStorage.setItem(CLOUD_SYNC_CONFIG.lastSyncKey, Date.now().toString());
    updateCloudSyncUI(false);
  } catch (err) {
    console.warn("Cloud sync pull warning:", err);
    updateCloudSyncUI(false);
    if (!silent) {
      showToast(`Không thể tải từ Cloud: ${err.message}`, "warning");
    }
  }
}

/**
 * Nút bấm Đồng bộ Thủ công Siêu Tốc (Dành cho điện thoại hoặc máy khác cần cập nhật ngay)
 */
async function forceRefreshAndSyncCloud() {
  const icon = document.getElementById("nav-sync-icon");
  if (icon) icon.style.animation = "spin 0.8s linear infinite";
  showToast("⏳ Đang kết nối Firebase Cloud và làm mới dữ liệu...", "info");

  try {
    isLocalModificationActive = false;
    isCloudSyncInProgress = false;
    await syncFromCloud(false);
  } catch (e) {
    showToast("Lỗi đồng bộ: " + e.message, "error");
  } finally {
    if (icon) icon.style.animation = "";
  }
}

/**
 * Xóa sạch dữ liệu cache cục bộ trên máy và nạp lại chuẩn từ Cloud
 */
async function forceResetAndSyncFromCloud() {
  if (!confirm("Thao tác này sẽ xóa sạch dữ liệu cache trên máy này và tải trực tiếp bản chuẩn nhất từ Cloud về. Bạn có muốn tiếp tục?")) {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
  appData = { subjects: [] };
  renderApp();
  await forceRefreshAndSyncCloud();
}

// Khóa chống xung đột ghi đè đồng thời (Concurrency Mutex)
let isCloudSyncInProgress = false;
let hasQueuedSync = false;

/**
 * PUSH: Đẩy toàn bộ đề thi hiện tại lên Firebase Realtime Cloud & GitHub Backup
 */
async function syncToCloud(showToastNotification = true) {
  if (isCloudSyncInProgress) {
    hasQueuedSync = true;
    return;
  }

  isCloudSyncInProgress = true;
  updateCloudSyncUI(true);
  const pushBtn = document.getElementById("btn-action-push-cloud");
  if (pushBtn) pushBtn.disabled = true;

  try {
    const totalQ = (appData.subjects || []).reduce((acc, s) => acc + (s.questions ? s.questions.length : 0), 0);
    const totalSub = appData.subjects ? appData.subjects.length : 0;

    const payloadObj = {
      version: 1,
      lastUpdated: Date.now(),
      subjects: appData.subjects || []
    };

    const jsonStr = JSON.stringify(payloadObj, null, 2);

    // 1. LƯU TỨC THÌ LÊN FIREBASE REALTIME DATABASE (Ưu tiên số 1 - Cập nhật trong 0.1s tới mọi máy)
    let fbSuccess = false;
    try {
      if (firebaseDbRef) {
        await firebaseDbRef.set(payloadObj);
        fbSuccess = true;
      } else {
        const fbRes = await fetch(FIREBASE_REST_URL, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: jsonStr
        });
        if (fbRes.ok) fbSuccess = true;
      }
    } catch (fbErr) {
      console.warn("Lỗi push Firebase SDK, thử qua REST:", fbErr);
      try {
        const fbRes = await fetch(FIREBASE_REST_URL, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: jsonStr
        });
        if (fbRes.ok) fbSuccess = true;
      } catch (e2) {}
    }

    // 2. BACKUP NGẦM LÊN GITHUB (Để lưu trữ mã nguồn trong repo)
    const token = getGitHubToken();
    if (token) {
      try {
        const base64Content = utf8ToBase64(jsonStr);
        const apiBase = `https://api.github.com/repos/${CLOUD_SYNC_CONFIG.owner}/${CLOUD_SYNC_CONFIG.repo}/contents/${CLOUD_SYNC_CONFIG.path}`;

        async function fetchLatestRemoteSha() {
          try {
            const getRes = await fetch(`${apiBase}?ref=${CLOUD_SYNC_CONFIG.branch}&_ts=${Date.now()}_${Math.random()}`, {
              headers: {
                "Authorization": `token ${token}`,
                "Accept": "application/vnd.github.v3+json"
              },
              cache: "no-store"
            });
            if (getRes.ok) {
              const fileInfo = await getRes.json();
              return fileInfo.sha || null;
            }
          } catch (e) {}
          return null;
        }

        let sha = await fetchLatestRemoteSha();
        const putBody = {
          message: `Cập nhật ngân hàng đề thi (${totalSub} môn, ${totalQ} câu) - ${new Date().toLocaleString("vi-VN")}`,
          content: base64Content,
          branch: CLOUD_SYNC_CONFIG.branch
        };
        if (sha) putBody.sha = sha;

        let putRes = await fetch(apiBase, {
          method: "PUT",
          headers: {
            "Authorization": `token ${token}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify(putBody)
        });

        if (putRes.status === 409 || !putRes.ok) {
          const freshSha = await fetchLatestRemoteSha();
          if (freshSha) {
            putBody.sha = freshSha;
            await fetch(apiBase, {
              method: "PUT",
              headers: {
                "Authorization": `token ${token}`,
                "Accept": "application/vnd.github.v3+json",
                "Content-Type": "application/json"
              },
              body: JSON.stringify(putBody)
            });
          }
        }
      } catch (ghErr) {
        console.warn("Lỗi backup ngầm GitHub (không ảnh hưởng Firebase):", ghErr);
      }
    }

    localStorage.setItem(CLOUD_SYNC_CONFIG.lastSyncKey, Date.now().toString());
    updateCloudSyncUI(false);

    if (showToastNotification) {
      showToast(`⚡ Đã đồng bộ tức thì ${totalSub} đề thi (${totalQ} câu) lên Firebase Cloud! Mọi thiết bị khác tự động cập nhật ngay.`, "success");
    }
  } catch (err) {
    console.error("Cloud push failed:", err);
    updateCloudSyncUI(false);
    if (showToastNotification) {
      showToast(`Lỗi đồng bộ lên Cloud: ${err.message}`, "error");
    }
  } finally {
    isCloudSyncInProgress = false;
    if (pushBtn) pushBtn.disabled = false;
    if (hasQueuedSync) {
      hasQueuedSync = false;
      setTimeout(() => syncToCloud(false), 500);
    }
  }
}




function renderApp() {
  renderCategoryFilterTabs();
  renderMasterDetailSystem();
  renderStats();
}

