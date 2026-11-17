const PRESET_NAMES = ["Jannik", "Jan", "Christoph", "Lütti", "Marvin", "Nico", "Marius", "Carsten", "Robin", "Phil", "Julius", "Tim", "Lars", "David", "Steak"];
const MONTH_PAIRS = ["Januar / Februar", "März / April", "Mai / Juni", "Juli / August", "September / Oktober", "November / Dezember"];

const setupScreen = document.getElementById("setup");
const revealScreen = document.getElementById("reveal");
const summaryScreen = document.getElementById("summary");

const nameCardsEl = document.getElementById("name-cards");
const presentCountEl = document.getElementById("present-count");
const drawBtn = document.getElementById("draw-btn");

const progressEl = document.querySelector(".progress");
const revealCard = document.getElementById("reveal-card");
const challengeCard = document.getElementById("challenge-card");
const nextBtn = document.getElementById("next-btn");

const summaryList = document.getElementById("summary-list");
const restartBtn = document.getElementById("restart-btn");
const appHeader = document.querySelector(".app-header");

let steps = [];
let stepIndex = 0;
const presentNames = new Set();

function shuffle(array) {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function renderNameCards() {
  nameCardsEl.innerHTML = PRESET_NAMES.map(name => `
    <button type="button" class="name-card" data-name="${name}" aria-pressed="false">${name}</button>
  `).join("");
  updatePresentCount();
}

function updatePresentCount() {
  presentCountEl.textContent = `${presentNames.size} von ${PRESET_NAMES.length} anwesend`;
}

nameCardsEl.addEventListener("click", (event) => {
  const card = event.target.closest(".name-card");
  if (!card) return;
  const name = card.dataset.name;
  const isSelected = presentNames.has(name);
  if (isSelected) {
    presentNames.delete(name);
  } else {
    presentNames.add(name);
  }
  card.classList.toggle("selected", !isSelected);
  card.setAttribute("aria-pressed", String(!isSelected));
  updatePresentCount();
});

function buildSteps(names) {
  const shuffled = shuffle(names);
  const teamSteps = [];
  for (let i = 0; i < 6; i++) {
    teamSteps.push({
      type: "pair",
      members: [shuffled[i * 2], shuffled[i * 2 + 1]],
      detail: MONTH_PAIRS[i],
      teamNumber: i + 1
    });
  }
  teamSteps.push({
    type: "trio",
    members: [shuffled[12], shuffled[13], shuffled[14]],
    detail: "Organisiert die Stammtischfahrt im nächsten Jahr",
    teamNumber: 7
  });

  const result = [];
  teamSteps.forEach((step, index) => {
    result.push(step);
    const isLast = index === teamSteps.length - 1;
    if (!isLast) {
      const players = pickChallengePlayers();
      if (players) {
        const game = CHALLENGE_GAMES[Math.floor(Math.random() * CHALLENGE_GAMES.length)];
        result.push({ type: "challenge", game, players });
      }
    }
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
  nextBtn.textContent = "Weiter";

  if (step.type === "challenge") {
    progressEl.textContent = "🎲 Challenge";
    revealScreen.classList.add("challenge-active");
    appHeader.classList.add("hidden");
    revealCard.classList.add("hidden");
    challengeCard.classList.remove("hidden");
    nextBtn.classList.add("hidden");
    renderChallengeIntro(step);
    return;
  }

  progressEl.textContent = `Team ${step.teamNumber} von 7`;
  revealScreen.classList.remove("challenge-active");
  appHeader.classList.remove("hidden");
  challengeCard.classList.add("hidden");
  revealCard.classList.remove("hidden");
  nextBtn.classList.remove("hidden");
  revealCard.innerHTML = `
    <div class="label">${step.type === "trio" ? "🐕 Dreier-Team" : "🐾 Zweier-Team"}</div>
    <div class="members">${step.members.join(" & ")}</div>
    <div class="detail">${step.detail}</div>
  `;
  nextBtn.textContent = stepIndex === steps.length - 1 ? "Fertig – Übersicht anzeigen" : "Weiter";
}

function renderSummary() {
  summaryList.innerHTML = steps
    .filter(step => step.type !== "challenge")
    .map(step => `
      <li>
        <div class="s-members">${step.members.join(" & ")}</div>
        <div class="s-detail">${step.detail}</div>
      </li>
    `).join("");
}

drawBtn.addEventListener("click", () => {
  steps = buildSteps(PRESET_NAMES);
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
  presentNames.clear();
  renderNameCards();
  showScreen(setupScreen);
});

renderNameCards();
