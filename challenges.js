const CHALLENGE_GAMES = ["reaction", "tictactoe", "tapsprint"];

const GAME_NAMES = {
  reaction: "🐾 Reaktionsduell",
  tictactoe: "🐾 Tic-Tac-Toe",
  tapsprint: "🐾 Tap-Sprint"
};

function pickChallengePlayers() {
  const pool = shuffle(Array.from(presentNames));
  if (pool.length < 2) return null;
  return [pool[0], pool[1]];
}

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
  } else if (step.game === "tictactoe") {
    renderTicTacToe(step.players);
  } else {
    renderTapSprint(step.players);
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

function renderTapSprint(players) {
  challengeCard.innerHTML = `
    <p class="challenge-status" id="tap-status">Bereit machen …</p>
    <div class="reaction-zones">
      <button type="button" class="reaction-zone tap-zone" data-index="0" disabled>
        <span class="tap-name">${players[0]}</span>
        <span class="tap-count" id="tap-count-0">0</span>
      </button>
      <button type="button" class="reaction-zone tap-zone" data-index="1" disabled>
        <span class="tap-name">${players[1]}</span>
        <span class="tap-count" id="tap-count-1">0</span>
      </button>
    </div>
  `;

  const statusEl = document.getElementById("tap-status");
  const zones = challengeCard.querySelectorAll(".tap-zone");
  const countEls = [document.getElementById("tap-count-0"), document.getElementById("tap-count-1")];
  const counts = [0, 0];
  let phase = "countdown";

  zones.forEach((zone, index) => {
    zone.addEventListener("click", () => {
      if (phase !== "running") return;
      counts[index]++;
      countEls[index].textContent = counts[index];
    });
  });

  const countdownSteps = ["Bereit …", "3", "2", "1", "LOS!"];
  let stepIdx = 0;
  const countdownTimer = setInterval(() => {
    statusEl.textContent = countdownSteps[stepIdx];
    stepIdx++;
    if (stepIdx >= countdownSteps.length) {
      clearInterval(countdownTimer);
      startRound();
    }
  }, 700);

  function startRound() {
    phase = "running";
    zones.forEach(z => {
      z.disabled = false;
      z.classList.add("go");
    });

    let remaining = 10;
    statusEl.textContent = `Noch ${remaining}s – tippen!`;
    const roundTimer = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(roundTimer);
        finish();
      } else {
        statusEl.textContent = `Noch ${remaining}s – tippen!`;
      }
    }, 1000);
  }

  function finish() {
    phase = "done";
    zones.forEach(z => {
      z.disabled = true;
      z.classList.remove("go");
    });
    if (counts[0] === counts[1]) {
      statusEl.textContent = `Unentschieden! ${counts[0]}:${counts[1]} 🤝`;
    } else {
      const winner = counts[0] > counts[1] ? 0 : 1;
      zones[winner].classList.add("winner");
      statusEl.textContent = `${players[winner]} gewinnt! ${counts[0]}:${counts[1]} 🏆`;
    }
    nextBtn.classList.remove("hidden");
  }
}
