// ==========================================================================
// CUONEDU PRO — MODULE: WORD DOCX & TEXT PARSER (SMART IMPORT)
// ==========================================================================
// ==========================================================================
// 4. SUPER-ENHANCED VIETNAMESE WORD & TEXT PARSER WITH INTERACTIVE REVIEW
// ==========================================================================
let smartImportTargetSubjectId = null;

function openSmartImportModal() {
  if (!requireTeacherAuth(() => openSmartImportModal())) return;
  parsedQuestionsTemp = [];
  smartImportTargetSubjectId = null;

  const titleInput = document.getElementById("import-input-title");
  if (titleInput) titleInput.value = "";

  const targetModeContainer = document.getElementById("import-target-mode-container");
  if (targetModeContainer) {
    targetModeContainer.style.display = "none";
    targetModeContainer.innerHTML = "";
  }

  document.getElementById("import-raw-text").value = "";
  document.getElementById("file-upload-input").value = "";
  document.getElementById("file-upload-status").style.display = "none";
  document.getElementById("import-preview-section").style.display = "none";
  document.getElementById("btn-submit-smart-import").disabled = true;
  document.getElementById("btn-import-label").textContent = "Tạo Đề Mới (0 câu)";
  
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

  // Strip page headers and title banners
  text = text.replace(/---\s*Trang\s*\d+\s*---/gi, "");
  text = text.replace(/^\d+\s+CÂU\s+HỎI\s+TRẮC\s+NGHIỆM.*$/gim, "");
  text = text.replace(/^KÈM\s+ĐÁP\s+ÁN.*$/gim, "");

  // Step 2.5: Pre-process trailing answer tags like '(b)', '(d)', '[c]' in Vietnamese tests
  // 1. Single-line option: 'b. Thần thoại - tôn giáo - triết học (b)' -> '*b. Thần thoại - tôn giáo - triết học'
  // Or with trailing note: 'e. Gồm b, c và d. (e) Chú ý...' -> '*e. Gồm b, c và d. Chú ý...'
  text = text.replace(/^([^\S\r\n]*[*]?\s*[a-gA-G][\.:\)-][^\n\r]*?)[^\S\r\n]*[\(\[]\s*([a-gA-G])\s*[\)\]]([^\n\r]*)$/gm, (m, optBody, ansL, trailing) => {
    return '*' + optBody.replace(/^[\s*]+/, '').trim() + (trailing ? ' ' + trailing.trim() : '');
  });

  // 2. Multiline wrapped line ending with (a)-(g):
  text = text.replace(/^([^\n\r]+?)\s*[\(\[]\s*([a-gA-G])\s*[\)\]]\s*$/gm, (m, lineBody, ansL) => {
    if (!/^\s*(?:câu|bài|question|q|c|\d+[\.:\-])/i.test(lineBody)) {
      return lineBody.trim() + ' [CORRECT_ANSWER]';
    }
    return m;
  });

  // 3. Inline option ending with (a)-(g) before next option: 'a. Nước Anh (a) c. Nước Đức'
  text = text.replace(/(\s*[*]?\s*[a-gA-G][\.:\)-][^\n\r]*?)\s*[\(\[]\s*([a-gA-G])\s*[\)\]]\s*(?=[a-gA-G][\.:\)-])/gm, (m, optBody, ansL) => {
    return ' *' + optBody.replace(/^[\s*]+/, '').trim() + ' ';
  });

  // Protect "C. Mác" / "C.Mác" (Karl Marx) from being split as Option C in Step 3!
  text = text.replace(/\bC\.\s*Mác\b/gi, "@@C_MAC@@");

  // Protect list references like 'a, b, c', 'a & b', 'a và b', 'a, và b', 'a hoặc b', 'cả a, b và c', 'khi thì là (a)' from splitting
  text = text.replace(/(?:\b(?:cả|gồm|điểm|hai\s*điểm|hoặc|khi\s*thì\s*là)\s+)?[\(\[]?\b([a-gA-G])\b[\)\]]?(?:(?:\s*,\s*|\s+(?:và|v\u00e0|&|hoặc|ho\u1eb7c|\/)\s*|,\s*(?:và|v\u00e0|&|hoặc|ho\u1eb7c|\/)\s*)[\(\[]?\b([a-gA-G])\b[\)\]]?)+(?:\s*(?:,|và|v\u00e0|&|hoặc|ho\u1eb7c|\/)\s*[\(\[]?\b([a-gA-G])\b[\)\]]?)?(?:\.|\b)/gi, (m) => {
    return m.replace(/,/g, '@@COMMA@@').replace(/\./g, '@@DOT@@').replace(/\(/g, '@@OP@@').replace(/\)/g, '@@CP@@');
  });

  // Also protect standalone parenthesized letters inside quotes or text: 'khi thì là (a)'
  text = text.replace(/(khi\s+thì\s+là\s+)\(([a-gA-G])\)/gi, (m, p1, l) => `${p1}@@OP@@${l}@@CP@@`);

  // Step 3: Put inline options on separate lines (only when followed by text on SAME line, NO comma delimiter)
  text = text.replace(/(?<=[\s\n\?\.:;!]|^)\s*(?:(\*+)?\s*\[([A-Ga-g])\](?=[^\S\r\n]+\S)|(\*+)?\s*\(([A-Ga-g])\)(?=[^\S\r\n]+\S)|(\*+)?\s*([A-Ga-g])(\*+)?(?:[\.:\)\-]|(?<=\*)))\s+/g, (m, s1, g1, s2, g2, s3, g3, s4) => {
    const letter = (g1 || g2 || g3).toUpperCase();
    const isStar = !!(s1 || s2 || s3 || s4);
    return `\n${isStar ? "*" : ""}${letter}. `;
  });
  text = text.replace(/@@COMMA@@/g, ",").replace(/@@DOT@@/g, ".").replace(/@@OP@@/g, "(").replace(/@@CP@@/g, ")").replace(/@@C_MAC@@/g, "C. Mác");

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

      // Check options for trailing answer tags that might still be in last line of option
      curOptions.forEach(opt => {
        if (opt.text.includes("[CORRECT_ANSWER]") || opt.text.endsWith("*")) {
          opt.isCorrect = true;
          opt.text = opt.text.replace(/\[CORRECT_ANSWER\]|\*+$/g, "").trim();
        }
        const m = opt.text.match(/\s*[\(\[]\s*([a-gA-G])\s*[\)\]]\s*$/);
        if (m) {
          if (m[1].toUpperCase() === opt.key.toUpperCase()) {
            opt.isCorrect = true;
          }
          opt.text = opt.text.replace(/\s*[\(\[]\s*([a-gA-G])\s*[\)\]]\s*$/, "").trim();
        }
      });

      const qIndex = questions.length + 1;
      const correctOpt = curOptions.find(o => o.isCorrect);
      const finalAns = (correctOpt ? correctOpt.key : (curAnswer || answerMap[curQNum || qIndex] || "")).toUpperCase();
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
    // Avoid matching bare 4-digit years like '1500 - 1570'
    const qHeaderMatch = line.match(/^[*_]?(?:(?:câu|bài|question|q|c)\s*(\d+)[\s.:\-_)\/]*|(\b\d{1,3})[.:]\s+)[*_]?(.*)/i);
    if (qHeaderMatch) {
      const num = parseInt(qHeaderMatch[1] || qHeaderMatch[2]);
      const rest = (qHeaderMatch[3] || "").replace(/^[*_]+|[*_]+$/g, "").trim();

      if (curOptions.length >= 2) {
        trailingPromptBuffer = rest ? [rest] : [];
        flushQuestion();
        curQNum = num;
      } else {
        curQNum = num;
        curPromptLines = rest ? [rest] : [];
      }
      continue;
    }

    // Check Option Header: supports [A-Ga-g]
    const optMatch = line.match(/^([*]?)\s*(?:([A-Ga-g])[\.:\)-]|\[([A-Ga-g])\]|\(([A-Ga-g])\)|([A-Ga-g])[*])\s*([*]?)\s*(.*)/i);
    if (optMatch) {
      const isStar1 = optMatch[1] === "*";
      const key = (optMatch[2] || optMatch[3] || optMatch[4] || optMatch[5]).toUpperCase();
      const isStar2 = optMatch[6] === "*";
      let optText = (optMatch[7] || "").trim();

      // If we see Option A and we already have options for previous question:
      if (key === "A" && (curOptions.some(o => o.key === "A") || curOptions.length >= 2)) {
        const savedQNum = curQNum;
        flushQuestion();
        if (!curQNum) curQNum = savedQNum ? savedQNum + 1 : null;
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

      curOptions.push({ key, text: optText, isCorrect });
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
      const lastOpt = curOptions[curOptions.length - 1];
      if (lastOpt) {
        lastOpt.text += " " + line;
      } else {
        curPromptLines.push(line);
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

  // Luôn luôn tạo một Bộ Đề Mới riêng biệt độc lập 100%
  const finalTitle = inputTitle || "Bộ Đề Mới Tải Lên";
  const detected = detectCategory(finalTitle);
  const targetSub = {
    id: Date.now(),
    title: finalTitle,
    code: `SUB-${Math.floor(100 + Math.random() * 900)}`,
    category: selectedCat === "auto" ? detected : selectedCat,
    durationMinutes: 15,
    questions: [...parsedQuestionsTemp]
  };
  appData.subjects.unshift(targetSub);
  selectedSubjectId = targetSub.id;

  isLocalModificationActive = true;
  appData.lastUpdated = Date.now();
  saveData(false);
  closeModal("modal-smart-import");
  renderApp();
  showToast(`Đã tạo thành công bộ đề mới "${targetSub.title}" (${parsedQuestionsTemp.length} câu) và đang đồng bộ lên Cloud!`, "success");
  parsedQuestionsTemp = [];
  smartImportTargetSubjectId = null;

  syncToCloud(true).finally(() => {
    isLocalModificationActive = false;
  });

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

