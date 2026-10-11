// ==========================================================================
// CUONEDU PRO — MODULE: UTILITIES & MODAL SYSTEM
// ==========================================================================
// Fisher-Yates Array Shuffle Helper (Used only during exam mode)
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

function copyToClipboardText(text, successMsg = "Đã sao chép vào bộ nhớ tạm!") {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg, "success");
    }).catch(() => {
      fallbackCopyText(text, successMsg);
    });
  } else {
    fallbackCopyText(text, successMsg);
  }
}

function fallbackCopyText(text, successMsg) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand("copy");
    showToast(successMsg, "success");
  } catch (e) {
    prompt("Sao chép thủ công:", text);
  }
  document.body.removeChild(ta);
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

