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

const CHALLENGE_GAMES = ["reaction", "tictactoe"];

function pickChallengePlayers() {
  const pool = shuffle(Array.from(presentNames));
  if (pool.length < 2) return null;
  return [pool[0], pool[1]];
}

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
        const game = Math.random() < 0.5 ? "reaction" : "tictactoe";
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
    progressEl.textContent = "🎲 Zwischenspiel";
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

const GAME_NAMES = {
  reaction: "🐾 Reaktionsduell",
  tictactoe: "🐾 Tic-Tac-Toe"
};

function renderChallengeIntro(step) {
  challengeCard.classList.add("intro-mode");
  challengeCard.innerHTML = `
    <div class="challenge-intro">
      <div class="intro-dog">
        🐶
        <span class="sound-wave sw1"></span>
        <span class="sound-wave sw2"></span>
        <span class="sound-wave sw3"></span>
      </div>
      <div class="intro-bark">WUFF!</div>
      <div class="intro-title">CHALLENGE!</div>
      <div class="intro-game-name">${GAME_NAMES[step.game]}</div>
      <div class="intro-players">${step.players.join(" 🆚 ")}</div>
      <div class="intro-hint">Antippen zum Start</div>
    </div>
  `;

  if (navigator.vibrate) {
    navigator.vibrate([80, 40, 80]);
  }

  challengeCard.addEventListener("click", () => {
    challengeCard.classList.remove("intro-mode");
    renderChallenge(step);
  }, { once: true });
}

function renderChallenge(step) {
  if (step.game === "reaction") {
    renderReactionGame(step.players);
  } else {
    renderTicTacToe(step.players);
  }
}

function renderReactionGame(players) {
  challengeCard.innerHTML = `
    <p class="challenge-status" id="reaction-status">Bereit machen …</p>
    <div class="reaction-zones">
      <button type="button" class="reaction-zone" data-index="0">${players[0]}</button>
      <button type="button" class="reaction-zone" data-index="1">${players[1]}</button>
    </div>
  `;

  const statusEl = document.getElementById("reaction-status");
  const zones = challengeCard.querySelectorAll(".reaction-zone");
  let phase = "waiting";

  const goTimer = setTimeout(() => {
    phase = "go";
    statusEl.textContent = "JETZT TIPPEN!";
    zones.forEach(z => z.classList.add("go"));
  }, 1200 + Math.random() * 2500);

  function finish(winnerIndex, falseStart) {
    clearTimeout(goTimer);
    phase = "done";
    zones.forEach(z => z.classList.remove("go"));
    zones[winnerIndex].classList.add("winner");
    statusEl.textContent = falseStart
      ? `${players[1 - winnerIndex]} war zu früh! ${players[winnerIndex]} gewinnt. 🏆`
      : `${players[winnerIndex]} gewinnt! 🏆`;
    nextBtn.classList.remove("hidden");
  }

  zones.forEach((zone, index) => {
    zone.addEventListener("click", () => {
      if (phase === "done") return;
      if (phase === "waiting") {
        finish(1 - index, true);
      } else {
        finish(index, false);
      }
    });
  });
}

function renderTicTacToe(players) {
  const board = Array(9).fill(null);
  const marks = ["❌", "⭕"];
  let currentPlayer = 0;
  let finished = false;

  const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  challengeCard.innerHTML = `
    <p class="challenge-status" id="ttt-status">${players[0]} (❌) ist dran</p>
    <div class="ttt-board">
      ${board.map((_, i) => `<button type="button" class="ttt-cell" data-index="${i}"></button>`).join("")}
    </div>
  `;

  const statusEl = document.getElementById("ttt-status");
  const cells = challengeCard.querySelectorAll(".ttt-cell");

  function checkWinner() {
    for (const [a, b, c] of WIN_LINES) {
      if (board[a] !== null && board[a] === board[b] && board[b] === board[c]) {
        return board[a];
      }
    }
    return null;
  }

  cells.forEach((cell, index) => {
    cell.addEventListener("click", () => {
      if (finished || board[index] !== null) return;
      board[index] = currentPlayer;
      cell.textContent = marks[currentPlayer];
      cell.classList.add("filled");

      const winner = checkWinner();
      if (winner !== null) {
        finished = true;
        statusEl.textContent = `${players[winner]} gewinnt! 🏆`;
        nextBtn.classList.remove("hidden");
        return;
      }
      if (board.every(v => v !== null)) {
        finished = true;
        statusEl.textContent = "Unentschieden! 🤝";
        nextBtn.classList.remove("hidden");
        return;
      }
      currentPlayer = 1 - currentPlayer;
      statusEl.textContent = `${players[currentPlayer]} (${marks[currentPlayer]}) ist dran`;
    });
  });
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
