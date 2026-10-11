// ==========================================================================
// CUONEDU PRO — MODULE: THEME & UI CUSTOMIZER
// ==========================================================================
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

