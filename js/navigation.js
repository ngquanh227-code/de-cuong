// ==========================================================================
// CUONEDU PRO — MODULE: NAVIGATION & TEACHER AUTHENTICATION
// ==========================================================================
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


function toggleNavDropdown(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById("nav-dropdown-menu");
  if (menu) menu.classList.toggle("show");
}

function closeNavDropdown() {
  const menu = document.getElementById("nav-dropdown-menu");
  if (menu) menu.classList.remove("show");
}

