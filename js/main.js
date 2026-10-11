// ==========================================================================
// CUONEDU PRO — MODULE: MAIN APPLICATION BOOTSTRAP
// ==========================================================================
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

  // Close modals on outside backdrop click
  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove("active");
      }
    });
  });

  // Keyboard navigation (Escape for drawer/modals, ArrowLeft/Right for Focus Stage carousel)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMainDrawer();
      document.querySelectorAll(".modal-backdrop.active").forEach(m => m.classList.remove("active"));
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
  initCloudSync();
});

