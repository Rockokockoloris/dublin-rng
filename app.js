const PRESET_NAMES = ["Jannik", "Jan", "Christoph", "Lütti", "Marvin", "Nico", "Marius", "Carsten", "Robin", "Phil", "Julius", "Tim", "Lars", "David", "Steak"];
const MONTH_PAIRS = ["Januar / Februar", "März / April", "Mai / Juni", "Juli / August", "September / Oktober", "November / Dezember"];

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js");
  });
}

// Verhindert, dass ein versehentliches Zurück-Wischen (z. B. beim Herumreichen
// des Handys bei Hot Potato) den App-Zustand zurücksetzt: jeder Rücksprung
// wird sofort durch einen neuen Verlaufseintrag "abgefangen".
history.pushState(null, "", location.href);
window.addEventListener("popstate", () => {
  history.pushState(null, "", location.href);
});

const welcomeScreen = document.getElementById("welcome");
const setupScreen = document.getElementById("setup");
const revealScreen = document.getElementById("reveal");
const summaryScreen = document.getElementById("summary");

const modeAuslosungBtn = document.getElementById("mode-auslosung-btn");
const modeChallengesBtn = document.getElementById("mode-challenges-btn");

const nameCardsEl = document.getElementById("name-cards");
const presentCountEl = document.getElementById("present-count");
const trioExcludeSection = document.getElementById("trio-exclude-section");
const trioExcludeCardsEl = document.getElementById("trio-exclude-cards");
const drawBtn = document.getElementById("draw-btn");

const progressEl = document.querySelector(".progress");
const revealCard = document.getElementById("reveal-card");
const challengeCard = document.getElementById("challenge-card");
const nextBtn = document.getElementById("next-btn");
const endChallengesBtn = document.getElementById("end-challenges-btn");

const summaryList = document.getElementById("summary-list");
const restartBtn = document.getElementById("restart-btn");
const appHeader = document.querySelector(".app-header");

let appMode = "auslosung";
let steps = [];
let stepIndex = 0;
const presentNames = new Set();
const unavailableForTrip = new Set();

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

function renderTrioExcludeCards() {
  trioExcludeCardsEl.innerHTML = PRESET_NAMES.map(name => `
    <button type="button" class="name-card exclude-card" data-name="${name}" aria-pressed="false">${name}</button>
  `).join("");
}

trioExcludeCardsEl.addEventListener("click", (event) => {
  const card = event.target.closest(".exclude-card");
  if (!card) return;
  const name = card.dataset.name;
  const isExcluded = unavailableForTrip.has(name);
  if (isExcluded) {
    unavailableForTrip.delete(name);
  } else {
    unavailableForTrip.add(name);
  }
  card.classList.toggle("excluded", !isExcluded);
  card.setAttribute("aria-pressed", String(!isExcluded));
});

modeAuslosungBtn.addEventListener("click", () => {
  appMode = "auslosung";
  drawBtn.textContent = "Teams auslosen";
  trioExcludeSection.classList.remove("hidden");
  showScreen(setupScreen);
});

modeChallengesBtn.addEventListener("click", () => {
  appMode = "challenges";
  drawBtn.textContent = "Challenge starten";
  trioExcludeSection.classList.add("hidden");
  showScreen(setupScreen);
});

function buildSteps(names) {
  let eligibleForTrio = names.filter(n => !unavailableForTrip.has(n));
  if (eligibleForTrio.length < 3) {
    eligibleForTrio = names;
  }
  const trioMembers = shuffle(eligibleForTrio).slice(0, 3);
  const shuffled = shuffle(names.filter(n => !trioMembers.includes(n)));

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
    members: trioMembers,
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
        const game = pickWeightedGame();
        result.push({ type: "challenge", game, players });
      }
    }
  });
  return result;
}

function showScreen(screen) {
  for (const s of [welcomeScreen, setupScreen, revealScreen, summaryScreen]) {
    s.classList.toggle("hidden", s !== screen);
  }
}

function enterChallengeScreen(step) {
  progressEl.textContent = "🎲 Challenge";
  revealScreen.classList.add("challenge-active");
  appHeader.classList.add("hidden");
  revealCard.classList.add("hidden");
  challengeCard.classList.remove("hidden");
  nextBtn.classList.add("hidden");
  endChallengesBtn.classList.add("hidden");
  renderChallengeIntro(step);
}

function revealNextButton() {
  nextBtn.classList.remove("hidden");
  if (appMode === "challenges") {
    endChallengesBtn.classList.remove("hidden");
  }
}

function startNextStandaloneChallenge() {
  const players = pickChallengePlayers();
  if (!players) {
    showScreen(welcomeScreen);
    return;
  }
  const game = pickWeightedGame();
  nextBtn.textContent = "Weiter";
  enterChallengeScreen({ type: "challenge", game, players });
}

function renderStep() {
  const step = steps[stepIndex];
  nextBtn.textContent = "Weiter";

  if (step.type === "challenge") {
    enterChallengeScreen(step);
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
  resetChallengeWeights();
  showScreen(revealScreen);
  if (appMode === "challenges") {
    startNextStandaloneChallenge();
    return;
  }
  steps = buildSteps(PRESET_NAMES);
  stepIndex = 0;
  renderStep();
});

nextBtn.addEventListener("click", () => {
  if (appMode === "challenges") {
    startNextStandaloneChallenge();
    return;
  }
  stepIndex++;
  if (stepIndex >= steps.length) {
    renderSummary();
    showScreen(summaryScreen);
  } else {
    renderStep();
  }
});

endChallengesBtn.addEventListener("click", () => {
  presentNames.clear();
  renderNameCards();
  showScreen(welcomeScreen);
});

restartBtn.addEventListener("click", () => {
  presentNames.clear();
  unavailableForTrip.clear();
  renderNameCards();
  renderTrioExcludeCards();
  showScreen(welcomeScreen);
});

renderNameCards();
renderTrioExcludeCards();
