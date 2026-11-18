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
const setupPresenceScreen = document.getElementById("setup-presence");
const setupExcludeScreen = document.getElementById("setup-exclude");
const revealScreen = document.getElementById("reveal");
const summaryScreen = document.getElementById("summary");

const modeAuslosungBtn = document.getElementById("mode-auslosung-btn");
const modeChallengesBtn = document.getElementById("mode-challenges-btn");

const nameCardsEl = document.getElementById("name-cards");
const presentCountEl = document.getElementById("present-count");
const presenceNextBtn = document.getElementById("presence-next-btn");
const trioExcludeCardsEl = document.getElementById("trio-exclude-cards");
const excludeBackBtn = document.getElementById("exclude-back-btn");
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
let currentStandaloneChallenge = null;
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
  saveState();
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
  saveState();
});

modeAuslosungBtn.addEventListener("click", () => {
  appMode = "auslosung";
  presenceNextBtn.textContent = "Weiter";
  showScreen(setupPresenceScreen);
  saveState();
});

modeChallengesBtn.addEventListener("click", () => {
  appMode = "challenges";
  presenceNextBtn.textContent = "Challenge starten";
  showScreen(setupPresenceScreen);
  saveState();
});

presenceNextBtn.addEventListener("click", () => {
  if (appMode === "challenges") {
    resetChallengeWeights();
    showScreen(revealScreen);
    startNextStandaloneChallenge();
    return;
  }
  showScreen(setupExcludeScreen);
  saveState();
});

excludeBackBtn.addEventListener("click", () => {
  showScreen(setupPresenceScreen);
  saveState();
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

const ALL_SCREENS = [welcomeScreen, setupPresenceScreen, setupExcludeScreen, revealScreen, summaryScreen];

function showScreen(screen) {
  for (const s of ALL_SCREENS) {
    s.classList.toggle("hidden", s !== screen);
  }
}

function getCurrentScreenId() {
  const current = ALL_SCREENS.find(s => !s.classList.contains("hidden"));
  return current ? current.id : "welcome";
}

const STORAGE_KEY = "dieHundisState";

function saveState() {
  const state = {
    appMode,
    presentNames: Array.from(presentNames),
    unavailableForTrip: Array.from(unavailableForTrip),
    screen: getCurrentScreenId(),
    steps,
    stepIndex,
    currentStandaloneChallenge
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // z. B. im privaten Modus nicht verfügbar – App bleibt nutzbar, nur ohne Wiederherstellung.
  }
}

function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // siehe saveState
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function restoreSelectionCards(container, selector, selectedSet, activeClass) {
  container.querySelectorAll(selector).forEach(card => {
    const isActive = selectedSet.has(card.dataset.name);
    card.classList.toggle(activeClass, isActive);
    card.setAttribute("aria-pressed", String(isActive));
  });
}

function initApp() {
  renderNameCards();
  renderTrioExcludeCards();

  const state = loadState();
  if (!state) return;

  appMode = state.appMode === "challenges" ? "challenges" : "auslosung";
  steps = Array.isArray(state.steps) ? state.steps : [];
  stepIndex = Number.isInteger(state.stepIndex) ? state.stepIndex : 0;
  currentStandaloneChallenge = state.currentStandaloneChallenge || null;

  (state.presentNames || []).forEach(name => presentNames.add(name));
  (state.unavailableForTrip || []).forEach(name => unavailableForTrip.add(name));
  restoreSelectionCards(nameCardsEl, ".name-card", presentNames, "selected");
  restoreSelectionCards(trioExcludeCardsEl, ".exclude-card", unavailableForTrip, "excluded");
  updatePresentCount();
  presenceNextBtn.textContent = appMode === "challenges" ? "Challenge starten" : "Weiter";

  const screenMap = {
    welcome: welcomeScreen,
    "setup-presence": setupPresenceScreen,
    "setup-exclude": setupExcludeScreen,
    reveal: revealScreen,
    summary: summaryScreen
  };
  const targetScreen = screenMap[state.screen] || welcomeScreen;
  showScreen(targetScreen);

  if (targetScreen === revealScreen) {
    if (appMode === "challenges" && currentStandaloneChallenge) {
      enterChallengeScreen(currentStandaloneChallenge);
    } else if (steps.length > 0) {
      renderStep();
    } else {
      showScreen(welcomeScreen);
    }
  } else if (targetScreen === summaryScreen) {
    if (steps.length > 0) {
      renderSummary();
    } else {
      showScreen(welcomeScreen);
    }
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
  currentStandaloneChallenge = { type: "challenge", game, players };
  enterChallengeScreen(currentStandaloneChallenge);
  saveState();
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

  revealCard.classList.remove("reveal-in");
  revealCard.innerHTML = `
    <div class="label">${step.type === "trio" ? "🐕 Dreier-Team" : "🐾 Zweier-Team"}</div>
    <div class="members">${step.members.join(" & ")}</div>
    <div class="detail">${step.detail}</div>
  `;
  void revealCard.offsetWidth;
  revealCard.classList.add("reveal-in");
  if (navigator.vibrate) {
    navigator.vibrate([30, 40, 30, 40, 80]);
  }

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
  steps = buildSteps(PRESET_NAMES);
  stepIndex = 0;
  showScreen(revealScreen);
  renderStep();
  saveState();
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
  saveState();
});

endChallengesBtn.addEventListener("click", () => {
  presentNames.clear();
  unavailableForTrip.clear();
  renderNameCards();
  renderTrioExcludeCards();
  showScreen(welcomeScreen);
  clearState();
});

restartBtn.addEventListener("click", () => {
  presentNames.clear();
  unavailableForTrip.clear();
  renderNameCards();
  renderTrioExcludeCards();
  showScreen(welcomeScreen);
  clearState();
});

document.addEventListener("DOMContentLoaded", initApp);
