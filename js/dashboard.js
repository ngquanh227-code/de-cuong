// ==========================================================================
// CUONEDU PRO — MODULE: DASHBOARD, SEARCH & MULTI-LAYOUT SYSTEM
// ==========================================================================
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

