// 무한 난이도 추리 클럽 - 게임 로직
const STORAGE_KEY = "mystery-club-progress";

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { unlocked: 1, grades: {} };
}
function saveProgress(p) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

let progress = loadProgress();

const state = {
  screen: "home",
  caseData: null,
  visitedSuspects: new Set(),
  visitedClues: new Set(),
  selectedSuspects: new Set(),
  noCulprit: false,
  selectedTrick: null,
};

function resetCaseState() {
  state.visitedSuspects = new Set();
  state.visitedClues = new Set();
  state.selectedSuspects = new Set();
  state.noCulprit = false;
  state.selectedTrick = null;
}

const GRADE_INFO = {
  perfect: { label: "완전 명탐정", emoji: "🏆", color: "#e0a458" },
  good: { label: "명탐정", emoji: "🥈", color: "#6fbf73" },
  fail: { label: "초보 탐정", emoji: "🔍", color: "#d9695f" },
};

const app = document.getElementById("app");

function render() {
  if (state.screen === "home") return renderHome();
  if (state.screen === "case") return renderCaseScreen();
  if (state.screen === "accuse") return renderAccuseScreen();
  if (state.screen === "trick") return renderTrickScreen();
  if (state.screen === "result") return renderResultScreen();
}

function renderHome() {
  const cards = CASES.map(c => {
    const locked = c.level > progress.unlocked;
    const grade = progress.grades[c.id];
    const gradeHtml = grade ? `<span class="grade-badge">${GRADE_INFO[grade].emoji}</span>` : "";
    return `
      <div class="level-card ${locked ? "locked" : ""}" data-case="${c.id}">
        ${gradeHtml}
        <div class="level-num">${c.levelLabel}</div>
        <h3>${locked ? "???" : c.title}</h3>
        <p>${locked ? "이전 레벨을 먼저 클리어하세요." : c.intro.split("\n")[0]}</p>
      </div>
    `;
  }).join("");

  app.innerHTML = `
    <div class="header">
      <h1>🕵️ 무한 난이도 추리 클럽</h1>
      <div class="sub">레벨이 끝없이 올라가는 추리게임 시리즈</div>
    </div>
    <div class="level-grid">${cards}</div>
  `;

  app.querySelectorAll(".level-card").forEach(el => {
    el.addEventListener("click", () => {
      const id = Number(el.dataset.case);
      const c = CASES.find(x => x.id === id);
      if (c.level > progress.unlocked) return;
      startCase(c);
    });
  });
}

function startCase(c) {
  state.caseData = c;
  resetCaseState();
  state.screen = "case";
  render();
}

function renderCaseScreen() {
  const c = state.caseData;
  const suspectCards = c.suspects.map(s => `
    <div class="card ${state.visitedSuspects.has(s.id) ? "visited" : ""}" data-suspect="${s.id}">
      <div class="card-name">${s.emoji} ${s.name}</div>
      <div class="card-hint">${s.hint}</div>
      ${state.visitedSuspects.has(s.id) ? '<div class="check">✔ 조사 완료</div>' : ""}
    </div>
  `).join("");

  const clueCards = c.clues.map(cl => `
    <div class="card ${state.visitedClues.has(cl.id) ? "visited" : ""}" data-clue="${cl.id}">
      <div class="card-name">🔎 ${cl.name}</div>
      ${state.visitedClues.has(cl.id) ? '<div class="check">✔ 확인 완료</div>' : '<div class="card-hint">클릭해서 확인하기</div>'}
    </div>
  `).join("");

  const allDone = state.visitedSuspects.size === c.suspects.length && state.visitedClues.size === c.clues.length;

  app.innerHTML = `
    <div class="topbar">
      <button class="link-btn" id="btn-home">← 레벨 선택으로</button>
    </div>
    <div class="panel">
      <div class="case-level-tag">${c.levelLabel}</div>
      <div class="case-title">${c.title}</div>
      <div class="case-intro">${c.intro}</div>
    </div>

    <div class="panel">
      <div class="section-title">👥 용의자 조사 (${state.visitedSuspects.size}/${c.suspects.length})</div>
      <div class="grid">${suspectCards}</div>

      <div class="section-title">🔎 단서 확인 (${state.visitedClues.size}/${c.clues.length})</div>
      <div class="grid">${clueCards}</div>

      <div class="btn-row">
        <button id="btn-accuse" ${allDone ? "" : "disabled"}>범인 지목하기 →</button>
      </div>
      ${allDone ? "" : '<div class="progress-line">모든 용의자와 단서를 확인하면 범인을 지목할 수 있어요.</div>'}
    </div>
  `;

  document.getElementById("btn-home").addEventListener("click", () => { state.screen = "home"; render(); });
  document.getElementById("btn-accuse").addEventListener("click", () => { state.screen = "accuse"; render(); });

  app.querySelectorAll("[data-suspect]").forEach(el => {
    el.addEventListener("click", () => {
      const s = c.suspects.find(x => x.id === el.dataset.suspect);
      state.visitedSuspects.add(s.id);
      showModal(`${s.emoji} ${s.name}`, s.statement, s.hint);
    });
  });
  app.querySelectorAll("[data-clue]").forEach(el => {
    el.addEventListener("click", () => {
      const cl = c.clues.find(x => x.id === el.dataset.clue);
      state.visitedClues.add(cl.id);
      showModal(`🔎 ${cl.name}`, null, cl.desc);
    });
  });
}

function showModal(title, quote, desc) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box">
      <h3>${title}</h3>
      ${quote ? `<div class="quote">${quote}</div>` : ""}
      <div class="desc">${desc || ""}</div>
      <div class="btn-row"><button class="close-modal">닫기</button></div>
    </div>
  `;
  document.body.appendChild(overlay);
  const close = () => document.body.removeChild(overlay);
  overlay.querySelector(".close-modal").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  render(); // refresh underlying screen to show visited state
}

function renderAccuseScreen() {
  const c = state.caseData;
  const multi = c.multipleCulprits;

  const suspectOptions = c.suspects.map(s => {
    const selected = state.selectedSuspects.has(s.id);
    return `
      <div class="option-item ${selected ? "selected" : ""}" data-suspect="${s.id}">
        <input type="${multi ? "checkbox" : "radio"}" ${selected ? "checked" : ""} name="suspect-pick" />
        <div><strong>${s.emoji} ${s.name}</strong><br><span style="color:var(--text-dim);font-size:0.85rem">${s.hint}</span></div>
      </div>
    `;
  }).join("");

  const noCulpritOption = c.allowNoCulprit ? `
    <div class="option-item ${state.noCulprit ? "selected" : ""}" data-nocuprit="1">
      <input type="radio" ${state.noCulprit ? "checked" : ""} name="suspect-pick" />
      <div><strong>🤷 범인은 없다 (사고 / 오해였다)</strong></div>
    </div>
  ` : "";

  const canConfirm = state.selectedSuspects.size > 0 || state.noCulprit;

  app.innerHTML = `
    <div class="topbar">
      <button class="link-btn" id="btn-back">← 사건으로 돌아가기</button>
    </div>
    <div class="panel">
      <div class="case-level-tag">${c.levelLabel}</div>
      <div class="section-title">범인은 누구일까요?${multi ? " (여러 명 선택 가능)" : ""}</div>
      <div class="option-list">
        ${suspectOptions}
        ${noCulpritOption}
      </div>
      <div class="btn-row">
        <button id="btn-confirm" ${canConfirm ? "" : "disabled"}>이 사람으로 확정 →</button>
      </div>
    </div>
  `;

  document.getElementById("btn-back").addEventListener("click", () => { state.screen = "case"; render(); });
  document.getElementById("btn-confirm").addEventListener("click", () => { state.screen = "trick"; render(); });

  app.querySelectorAll("[data-suspect]").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.dataset.suspect;
      if (multi) {
        if (state.selectedSuspects.has(id)) state.selectedSuspects.delete(id);
        else state.selectedSuspects.add(id);
      } else {
        state.selectedSuspects = new Set([id]);
      }
      state.noCulprit = false;
      renderAccuseScreen();
    });
  });
  const noEl = app.querySelector("[data-nocuprit]");
  if (noEl) {
    noEl.addEventListener("click", () => {
      state.noCulprit = true;
      state.selectedSuspects = new Set();
      renderAccuseScreen();
    });
  }
}

function renderTrickScreen() {
  const c = state.caseData;
  const options = c.trickOptions.map(o => `
    <div class="option-item ${state.selectedTrick === o.id ? "selected" : ""}" data-trick="${o.id}">
      <input type="radio" ${state.selectedTrick === o.id ? "checked" : ""} name="trick-pick" />
      <div>${o.text}</div>
    </div>
  `).join("");

  app.innerHTML = `
    <div class="topbar">
      <button class="link-btn" id="btn-back">← 범인 지목 다시하기</button>
    </div>
    <div class="panel">
      <div class="case-level-tag">${c.levelLabel}</div>
      <div class="section-title">범인의 트릭(방법과 이유)은 무엇일까요?</div>
      <div class="option-list">${options}</div>
      <div class="btn-row">
        <button id="btn-submit" ${state.selectedTrick ? "" : "disabled"}>사건 해결하기 →</button>
      </div>
    </div>
  `;

  document.getElementById("btn-back").addEventListener("click", () => { state.screen = "accuse"; render(); });
  document.getElementById("btn-submit").addEventListener("click", () => { finishCase(); });

  app.querySelectorAll("[data-trick]").forEach(el => {
    el.addEventListener("click", () => {
      state.selectedTrick = el.dataset.trick;
      renderTrickScreen();
    });
  });
}

function finishCase() {
  const c = state.caseData;
  let suspectCorrect;
  if (c.allowNoCulprit && c.culprits.length === 0) {
    suspectCorrect = state.noCulprit;
  } else {
    const chosen = state.selectedSuspects;
    suspectCorrect = chosen.size === c.culprits.length && c.culprits.every(id => chosen.has(id));
  }
  const trickCorrect = state.selectedTrick === c.correctTrickId;

  let grade;
  if (suspectCorrect && trickCorrect) grade = "perfect";
  else if (suspectCorrect) grade = "good";
  else grade = "fail";

  // save progress
  const prevGrade = progress.grades[c.id];
  const rank = { fail: 0, good: 1, perfect: 2 };
  if (!prevGrade || rank[grade] > rank[prevGrade]) {
    progress.grades[c.id] = grade;
  }
  if (grade !== "fail" && progress.unlocked === c.level) {
    progress.unlocked = Math.min(CASES.length, c.level + 1);
  }
  saveProgress(progress);

  state.screen = "result";
  state._lastResult = { suspectCorrect, trickCorrect, grade };
  render();
}

function renderResultScreen() {
  const c = state.caseData;
  const { suspectCorrect, trickCorrect, grade } = state._lastResult;
  const info = GRADE_INFO[grade];
  const isLast = c.level === CASES.length;
  const nextCase = CASES.find(x => x.level === c.level + 1);

  app.innerHTML = `
    <div class="panel">
      <div class="result-badge">${info.emoji}</div>
      <div class="result-title" style="color:${info.color}">${info.label}</div>
      <div class="result-sub">
        범인 지목: <span class="${suspectCorrect ? "correct-mark" : "wrong-mark"}">${suspectCorrect ? "정답" : "오답"}</span>
        &nbsp;·&nbsp;
        트릭 설명: <span class="${trickCorrect ? "correct-mark" : "wrong-mark"}">${trickCorrect ? "정답" : "오답"}</span>
      </div>
      <div class="section-title">🔓 사건의 진실</div>
      <div class="reveal-box">${c.resolution}</div>
      <div class="btn-row">
        <button class="secondary" id="btn-retry">이 사건 다시 도전</button>
        ${grade !== "fail" && nextCase ? `<button id="btn-next">다음 레벨로 →</button>` : ""}
        <button class="secondary" id="btn-home2">레벨 선택으로</button>
      </div>
      ${grade !== "fail" && isLast ? `<div class="progress-line" style="margin-top:14px;text-align:center">🎉 축하합니다! 현재까지 준비된 모든 사건을 해결한 궁극의 명탐정입니다!</div>` : ""}
    </div>
  `;

  document.getElementById("btn-retry").addEventListener("click", () => startCase(c));
  document.getElementById("btn-home2").addEventListener("click", () => { state.screen = "home"; render(); });
  const nextBtn = document.getElementById("btn-next");
  if (nextBtn) nextBtn.addEventListener("click", () => startCase(nextCase));
}

render();
