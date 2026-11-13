const MONTH_PAIRS = ["Januar / Februar", "März / April", "Mai / Juni", "Juli / August", "September / Oktober", "November / Dezember"];

const setupScreen = document.getElementById("setup");
const revealScreen = document.getElementById("reveal");
const summaryScreen = document.getElementById("summary");

const namesInput = document.getElementById("names-input");
const setupError = document.getElementById("setup-error");
const drawBtn = document.getElementById("draw-btn");

const progressEl = document.querySelector(".progress");
const revealCard = document.getElementById("reveal-card");
const nextBtn = document.getElementById("next-btn");

const summaryList = document.getElementById("summary-list");
const restartBtn = document.getElementById("restart-btn");

let steps = [];
let stepIndex = 0;

function shuffle(array) {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function parseNames(raw) {
  return raw
    .split("\n")
    .map(n => n.trim())
    .filter(n => n.length > 0);
}

function validateNames(names) {
  if (names.length !== 15) {
    return `Es müssen genau 15 Namen sein (aktuell: ${names.length}).`;
  }
  const seen = new Set();
  for (const name of names) {
    const key = name.toLowerCase();
    if (seen.has(key)) {
      return `Der Name "${name}" kommt doppelt vor.`;
    }
    seen.add(key);
  }
  return null;
}

function buildSteps(names) {
  const shuffled = shuffle(names);
  const result = [];
  for (let i = 0; i < 6; i++) {
    result.push({
      type: "pair",
      members: [shuffled[i * 2], shuffled[i * 2 + 1]],
      detail: MONTH_PAIRS[i]
    });
  }
  result.push({
    type: "trio",
    members: [shuffled[12], shuffled[13], shuffled[14]],
    detail: "Organisiert die Stammtischfahrt im nächsten Jahr"
  });
  return result;
}

function showScreen(screen) {
  for (const s of [setupScreen, revealScreen, summaryScreen]) {
    s.classList.toggle("hidden", s !== screen);
  }
}

function renderStep() {
  const step = steps[stepIndex];
  progressEl.textContent = `Team ${stepIndex + 1} von ${steps.length}`;
  revealCard.innerHTML = `
    <div class="label">${step.type === "trio" ? "Dreier-Team" : "Zweier-Team"}</div>
    <div class="members">${step.members.join(" & ")}</div>
    <div class="detail">${step.detail}</div>
  `;
  nextBtn.textContent = stepIndex === steps.length - 1 ? "Fertig – Übersicht anzeigen" : "Weiter";
}

function renderSummary() {
  summaryList.innerHTML = steps.map(step => `
    <li>
      <div class="s-members">${step.members.join(" & ")}</div>
      <div class="s-detail">${step.detail}</div>
    </li>
  `).join("");
}

drawBtn.addEventListener("click", () => {
  const names = parseNames(namesInput.value);
  const error = validateNames(names);
  if (error) {
    setupError.textContent = error;
    return;
  }
  setupError.textContent = "";
  steps = buildSteps(names);
  stepIndex = 0;
  showScreen(revealScreen);
  renderStep();
});

nextBtn.addEventListener("click", () => {
  stepIndex++;
  if (stepIndex >= steps.length) {
    renderSummary();
    showScreen(summaryScreen);
  } else {
    renderStep();
  }
});

restartBtn.addEventListener("click", () => {
  namesInput.value = "";
  setupError.textContent = "";
  showScreen(setupScreen);
});
