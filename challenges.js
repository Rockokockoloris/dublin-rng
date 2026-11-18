const CHALLENGE_GAMES = ["reaction", "tictactoe", "tapsprint", "perfectfive", "hotpotato", "steadyhand", "memory", "airhockey"];

const GAME_NAMES = {
  reaction: "🐾 Reaktionsduell",
  tictactoe: "🐾 Tic-Tac-Toe",
  tapsprint: "🐾 Tap-Sprint",
  perfectfive: "🐾 Perfekte 5 Sekunden",
  hotpotato: "🐾 Hot Potato",
  steadyhand: "🐾 Steady Hand",
  memory: "🐾 Memory-Duell",
  airhockey: "🐾 Air Hockey"
};

function pickChallengePlayers() {
  const pool = shuffle(Array.from(presentNames));
  if (pool.length < 2) return null;
  return [pool[0], pool[1]];
}

// Shuffle-Bag: alle Challenge-Typen werden einmal gemischt und der Reihe nach
// verbraucht, bevor neu gemischt wird. So sind innerhalb eines Durchlaufs
// (max. 6 Challenges bei der Auslosung) garantiert keine Wiederholungen möglich,
// statt sie nur unwahrscheinlicher zu machen.
let challengeBag = [];
let lastPlayedGame = null;

function resetChallengeWeights() {
  challengeBag = [];
  lastPlayedGame = null;
}

function pickWeightedGame() {
  if (challengeBag.length === 0) {
    challengeBag = shuffle(CHALLENGE_GAMES);
    if (challengeBag.length > 1 && challengeBag[0] === lastPlayedGame) {
      const swapIndex = 1 + Math.floor(Math.random() * (challengeBag.length - 1));
      [challengeBag[0], challengeBag[swapIndex]] = [challengeBag[swapIndex], challengeBag[0]];
    }
  }
  lastPlayedGame = challengeBag.shift();
  return lastPlayedGame;
}

function renderChallengeIntro(step) {
  challengeCard.classList.add("intro-mode");
  const playersLine = step.game === "hotpotato"
    ? "Alle Anwesenden"
    : step.players.join(" 🆚 ");
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
      <div class="intro-players">${playersLine}</div>
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
  const renderers = {
    reaction: renderReactionGame,
    tictactoe: renderTicTacToe,
    tapsprint: renderTapSprint,
    perfectfive: renderPerfectFive,
    hotpotato: renderHotPotato,
    steadyhand: renderSteadyHand,
    memory: renderMemoryDuell,
    airhockey: renderAirHockey
  };
  renderers[step.game](step.players);
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
    revealNextButton();
  }

  zones.forEach((zone, index) => {
    zone.addEventListener("pointerdown", () => {
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
    <p class="challenge-status" id="ttt-status"><span class="active-player">${players[0]}</span> (❌) ist dran</p>
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
        revealNextButton();
        return;
      }
      if (board.every(v => v !== null)) {
        finished = true;
        statusEl.textContent = "Unentschieden! 🤝";
        revealNextButton();
        return;
      }
      currentPlayer = 1 - currentPlayer;
      statusEl.innerHTML = `<span class="active-player">${players[currentPlayer]}</span> (${marks[currentPlayer]}) ist dran`;
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
    zone.addEventListener("pointerdown", () => {
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
    revealNextButton();
  }
}

function renderPerfectFive(players) {
  challengeCard.innerHTML = `
    <p class="challenge-status" id="five-status">Bereit machen …</p>
    <div class="reaction-zones">
      <button type="button" class="reaction-zone five-zone" data-index="0" disabled>${players[0]}</button>
      <button type="button" class="reaction-zone five-zone" data-index="1" disabled>${players[1]}</button>
    </div>
  `;

  const statusEl = document.getElementById("five-status");
  const zones = challengeCard.querySelectorAll(".five-zone");
  const taps = [null, null];
  let startTime = null;
  let finished = false;

  setTimeout(() => {
    statusEl.textContent = "Tippe bei genau 5 Sekunden! (kein Timer zu sehen)";
    startTime = Date.now();
    zones.forEach(z => { z.disabled = false; });
  }, 1200);

  const safetyTimer = setTimeout(finish, 1200 + 15000);

  zones.forEach((zone, index) => {
    zone.addEventListener("pointerdown", () => {
      if (finished || taps[index] !== null || startTime === null) return;
      taps[index] = Date.now() - startTime;
      zone.textContent = `${players[index]} ✓`;
      zone.disabled = true;
      if (taps[0] !== null && taps[1] !== null) {
        finish();
      }
    });
  });

  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(safetyTimer);
    zones.forEach(z => { z.disabled = true; });

    if (taps[0] === null && taps[1] === null) {
      statusEl.textContent = "Keiner hat getippt! Unentschieden 🤝";
      revealNextButton();
      return;
    }

    const label = index => (taps[index] === null ? "–" : `${(taps[index] / 1000).toFixed(2)}s`);
    const diffs = taps.map(t => (t === null ? Infinity : Math.abs(t - 5000)));

    if (diffs[0] === diffs[1]) {
      statusEl.textContent = `${players[0]}: ${label(0)} · ${players[1]}: ${label(1)} – Unentschieden! 🤝`;
    } else {
      const winner = diffs[0] < diffs[1] ? 0 : 1;
      zones[winner].classList.add("winner");
      statusEl.textContent = `${players[0]}: ${label(0)} · ${players[1]}: ${label(1)} – ${players[winner]} gewinnt! 🏆`;
    }
    revealNextButton();
  }
}

function renderHotPotato() {
  challengeCard.innerHTML = `
    <p class="challenge-status" id="potato-status">Gebt das Handy jetzt reihum weiter! 🔥</p>
    <div class="potato" id="potato">🥔</div>
  `;

  const statusEl = document.getElementById("potato-status");
  const potatoEl = document.getElementById("potato");

  const totalTime = 5000 + Math.random() * 15000;

  setTimeout(() => {
    potatoEl.classList.add("pulsing");
  }, totalTime * (2 / 3));

  setTimeout(() => {
    potatoEl.classList.remove("pulsing");
    potatoEl.textContent = "💥";
    potatoEl.classList.add("exploded");
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
    statusEl.textContent = "Verloren!";
    statusEl.classList.add("status-lost");
    revealNextButton();
  }, totalTime);
}

function renderSteadyHand(players) {
  const PATH_D = "M 150,30 C 40,110 260,170 150,250 C 40,330 260,390 150,470";

  challengeCard.innerHTML = `
    <p class="challenge-status" id="steady-status"></p>
    <svg id="steady-svg" class="steady-track" viewBox="0 0 300 500" preserveAspectRatio="xMidYMid meet">
      <path d="${PATH_D}" class="steady-tube"></path>
      <path d="${PATH_D}" class="steady-guide"></path>
      <circle cx="150" cy="30" r="24" class="steady-node steady-start"></circle>
      <text x="150" y="35" class="steady-label">START</text>
      <circle cx="150" cy="470" r="24" class="steady-node steady-end"></circle>
      <text x="150" y="475" class="steady-label">ZIEL</text>
    </svg>
  `;

  const statusEl = document.getElementById("steady-status");
  const svg = document.getElementById("steady-svg");
  const pathEl = svg.querySelector(".steady-tube");
  const pathLength = pathEl.getTotalLength();
  const TOLERANCE = 34;

  const samplePoints = [];
  const SAMPLES = 120;
  for (let i = 0; i <= SAMPLES; i++) {
    samplePoints.push(pathEl.getPointAtLength((i / SAMPLES) * pathLength));
  }

  function distanceToPath(x, y) {
    let min = Infinity;
    for (const p of samplePoints) {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < min) min = d;
    }
    return min;
  }

  function toSvgPoint(evt) {
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  const results = [null, null];
  let currentPlayer = 0;
  let tracing = false;
  let startTime = 0;

  function startTurn() {
    svg.classList.remove("fail", "success", "active");
    tracing = false;
    statusEl.innerHTML = `<span class="active-player">${players[currentPlayer]}</span> ist dran – Finger auf START, dann der Spur bis ZIEL folgen`;
  }

  svg.addEventListener("pointerdown", (evt) => {
    if (svg.classList.contains("fail") || svg.classList.contains("success")) return;
    const p = toSvgPoint(evt);
    if (Math.hypot(p.x - 150, p.y - 30) < 30) {
      tracing = true;
      startTime = performance.now();
      svg.classList.add("active");
      try {
        svg.setPointerCapture(evt.pointerId);
      } catch (e) {
        // ignore – capture is a nice-to-have, tracing already works via pointermove
      }
    }
  });

  svg.addEventListener("pointermove", (evt) => {
    if (!tracing) return;
    const p = toSvgPoint(evt);

    if (Math.hypot(p.x - 150, p.y - 470) < 30) {
      finishTurn(performance.now() - startTime, true);
      return;
    }

    if (distanceToPath(p.x, p.y) > TOLERANCE) {
      finishTurn(null, false);
    }
  });

  function finishTurn(time, success) {
    if (!tracing) return;
    tracing = false;
    svg.classList.remove("active");
    results[currentPlayer] = time;
    svg.classList.add(success ? "success" : "fail");
    statusEl.innerHTML = success
      ? `<span class="active-player">${players[currentPlayer]}</span> geschafft! (${(time / 1000).toFixed(2)}s)`
      : `<span class="active-player">${players[currentPlayer]}</span> daneben!`;

    setTimeout(() => {
      if (currentPlayer === 0) {
        currentPlayer = 1;
        startTurn();
      } else {
        showResult();
      }
    }, 1400);
  }

  function showResult() {
    svg.classList.add("hidden");
    if (results[0] === null && results[1] === null) {
      statusEl.textContent = "Beide daneben – Unentschieden! 🤝";
    } else if (results[0] === null) {
      statusEl.textContent = `${players[1]} gewinnt! 🏆`;
    } else if (results[1] === null) {
      statusEl.textContent = `${players[0]} gewinnt! 🏆`;
    } else {
      const winner = results[0] <= results[1] ? 0 : 1;
      statusEl.textContent = `${players[0]}: ${(results[0] / 1000).toFixed(2)}s · ${players[1]}: ${(results[1] / 1000).toFixed(2)}s – ${players[winner]} gewinnt! 🏆`;
    }
    revealNextButton();
  }

  startTurn();
}

function renderMemoryDuell(players) {
  const SYMBOLS = ["🐶", "🍺", "🎲", "🍀", "🥔", "🦴"];
  const cards = shuffle([...SYMBOLS, ...SYMBOLS]);

  challengeCard.innerHTML = `
    <p class="challenge-status" id="memory-status"><span class="active-player">${players[0]}</span> ist dran (0:0)</p>
    <div class="memory-board">
      ${cards.map(() => `<button type="button" class="memory-card">🐾</button>`).join("")}
    </div>
  `;

  const statusEl = document.getElementById("memory-status");
  const cardEls = challengeCard.querySelectorAll(".memory-card");
  const scores = [0, 0];
  let currentPlayer = 0;
  let firstPick = null;
  let lockBoard = false;
  let matchedCount = 0;

  function reveal(cardEl, index) {
    cardEl.textContent = cards[index];
    cardEl.classList.add("revealed");
  }

  function finish() {
    if (scores[0] === scores[1]) {
      statusEl.textContent = `Unentschieden! ${scores[0]}:${scores[1]} 🤝`;
    } else {
      const winner = scores[0] > scores[1] ? 0 : 1;
      statusEl.textContent = `${players[winner]} gewinnt! ${scores[0]}:${scores[1]} 🏆`;
    }
    revealNextButton();
  }

  cardEls.forEach((cardEl, index) => {
    cardEl.addEventListener("click", () => {
      if (lockBoard || cardEl.classList.contains("revealed") || cardEl.classList.contains("matched")) return;
      reveal(cardEl, index);

      if (firstPick === null) {
        firstPick = index;
        return;
      }

      const secondPick = index;
      lockBoard = true;

      if (cards[firstPick] === cards[secondPick]) {
        matchedCount += 2;
        scores[currentPlayer]++;
        cardEl.classList.add("matched");
        cardEls[firstPick].classList.add("matched");
        firstPick = null;
        lockBoard = false;

        if (matchedCount === cards.length) {
          finish();
          return;
        }
        statusEl.innerHTML = `<span class="active-player">${players[currentPlayer]}</span> ist dran (${scores[0]}:${scores[1]}) – Treffer, nochmal!`;
      } else {
        setTimeout(() => {
          cardEl.classList.remove("revealed");
          cardEl.textContent = "🐾";
          cardEls[firstPick].classList.remove("revealed");
          cardEls[firstPick].textContent = "🐾";
          firstPick = null;
          lockBoard = false;
          currentPlayer = 1 - currentPlayer;
          statusEl.innerHTML = `<span class="active-player">${players[currentPlayer]}</span> ist dran (${scores[0]}:${scores[1]})`;
        }, 800);
      }
    });
  });
}

function renderAirHockey(players) {
  const TABLE_W = 300;
  const TABLE_H = 500;
  const CENTER_Y = 250;
  const WALL = 6;
  const PUCK_R = 12;
  const PADDLE_R = 22;
  const GOAL_HALF_WIDTH = 50;

  challengeCard.innerHTML = `
    <p class="challenge-status" id="hockey-status">
      <span class="active-player">${players[0]}</span> (oben) 🆚 <span class="active-player">${players[1]}</span> (unten)
    </p>
    <svg id="hockey-svg" class="hockey-table" viewBox="0 0 ${TABLE_W} ${TABLE_H}" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="${TABLE_W}" height="${TABLE_H}" class="hockey-rink"></rect>
      <line x1="0" y1="${CENTER_Y}" x2="${TABLE_W}" y2="${CENTER_Y}" class="hockey-center-line"></line>
      <line x1="${TABLE_W / 2 - GOAL_HALF_WIDTH}" y1="3" x2="${TABLE_W / 2 + GOAL_HALF_WIDTH}" y2="3" class="hockey-goal"></line>
      <line x1="${TABLE_W / 2 - GOAL_HALF_WIDTH}" y1="${TABLE_H - 3}" x2="${TABLE_W / 2 + GOAL_HALF_WIDTH}" y2="${TABLE_H - 3}" class="hockey-goal"></line>
      <circle id="hockey-paddle-0" cx="${TABLE_W / 2}" cy="${CENTER_Y - 160}" r="${PADDLE_R}" class="hockey-paddle hockey-paddle-0"></circle>
      <circle id="hockey-paddle-1" cx="${TABLE_W / 2}" cy="${CENTER_Y + 160}" r="${PADDLE_R}" class="hockey-paddle hockey-paddle-1"></circle>
      <circle id="hockey-puck" cx="${TABLE_W / 2}" cy="${CENTER_Y}" r="${PUCK_R}" class="hockey-puck"></circle>
    </svg>
  `;

  const statusEl = document.getElementById("hockey-status");
  const svg = document.getElementById("hockey-svg");
  const puckEl = document.getElementById("hockey-puck");
  const paddleEls = [document.getElementById("hockey-paddle-0"), document.getElementById("hockey-paddle-1")];

  const paddles = [
    { x: TABLE_W / 2, y: CENTER_Y - 160 },
    { x: TABLE_W / 2, y: CENTER_Y + 160 }
  ];
  const puck = { x: TABLE_W / 2, y: CENTER_Y, vx: 0, vy: 0 };

  let finished = false;
  const activePointers = new Map();

  function toSvgPoint(evt) {
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  function clampPaddle(index, x, y) {
    const minY = index === 0 ? WALL + PADDLE_R : CENTER_Y + PADDLE_R;
    const maxY = index === 0 ? CENTER_Y - PADDLE_R : TABLE_H - WALL - PADDLE_R;
    return {
      x: Math.max(WALL + PADDLE_R, Math.min(TABLE_W - WALL - PADDLE_R, x)),
      y: Math.max(minY, Math.min(maxY, y))
    };
  }

  function movePaddle(index, x, y) {
    const clamped = clampPaddle(index, x, y);
    paddles[index].x = clamped.x;
    paddles[index].y = clamped.y;
    paddleEls[index].setAttribute("cx", clamped.x);
    paddleEls[index].setAttribute("cy", clamped.y);
  }

  svg.addEventListener("pointerdown", (evt) => {
    if (finished) return;
    const p = toSvgPoint(evt);
    const paddleIndex = p.y < CENTER_Y ? 0 : 1;
    activePointers.set(evt.pointerId, paddleIndex);
    try {
      svg.setPointerCapture(evt.pointerId);
    } catch (e) {
      // ignore – Steuerung funktioniert auch ohne Capture über pointermove weiter
    }
    movePaddle(paddleIndex, p.x, p.y);
  });

  svg.addEventListener("pointermove", (evt) => {
    if (finished || !activePointers.has(evt.pointerId)) return;
    const p = toSvgPoint(evt);
    movePaddle(activePointers.get(evt.pointerId), p.x, p.y);
  });

  function releasePointer(evt) {
    activePointers.delete(evt.pointerId);
  }
  svg.addEventListener("pointerup", releasePointer);
  svg.addEventListener("pointercancel", releasePointer);

  function scoreGoal(winnerIndex) {
    finished = true;
    if (navigator.vibrate) {
      navigator.vibrate([60, 40, 60, 40, 150]);
    }
    statusEl.innerHTML = `🥅 Tor! <span class="active-player">${players[winnerIndex]}</span> gewinnt! 🏆`;
    revealNextButton();
  }

  function step() {
    if (finished) return;

    puck.x += puck.vx;
    puck.y += puck.vy;

    if (puck.x - PUCK_R < WALL) {
      puck.x = WALL + PUCK_R;
      puck.vx *= -1;
    } else if (puck.x + PUCK_R > TABLE_W - WALL) {
      puck.x = TABLE_W - WALL - PUCK_R;
      puck.vx *= -1;
    }

    const inGoalRange = Math.abs(puck.x - TABLE_W / 2) < GOAL_HALF_WIDTH - PUCK_R;
    if (puck.y - PUCK_R < WALL) {
      if (inGoalRange) {
        scoreGoal(1);
        return;
      }
      puck.y = WALL + PUCK_R;
      puck.vy *= -1;
    } else if (puck.y + PUCK_R > TABLE_H - WALL) {
      if (inGoalRange) {
        scoreGoal(0);
        return;
      }
      puck.y = TABLE_H - WALL - PUCK_R;
      puck.vy *= -1;
    }

    paddles.forEach((paddle) => {
      const dx = puck.x - paddle.x;
      const dy = puck.y - paddle.y;
      const dist = Math.hypot(dx, dy);
      const minDist = PUCK_R + PADDLE_R;
      if (dist < minDist && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        puck.x = paddle.x + nx * minDist;
        puck.y = paddle.y + ny * minDist;
        const speed = Math.max(Math.hypot(puck.vx, puck.vy), 3.5);
        puck.vx = nx * speed * 1.15;
        puck.vy = ny * speed * 1.15;
      }
    });

    const currentSpeed = Math.hypot(puck.vx, puck.vy);
    const MAX_SPEED = 9;
    const MIN_SPEED = 2.2;
    if (currentSpeed > MAX_SPEED) {
      puck.vx = (puck.vx / currentSpeed) * MAX_SPEED;
      puck.vy = (puck.vy / currentSpeed) * MAX_SPEED;
    } else if (currentSpeed > 0 && currentSpeed < MIN_SPEED) {
      puck.vx = (puck.vx / currentSpeed) * MIN_SPEED;
      puck.vy = (puck.vy / currentSpeed) * MIN_SPEED;
    }

    puckEl.setAttribute("cx", puck.x);
    puckEl.setAttribute("cy", puck.y);

    requestAnimationFrame(step);
  }

  const countdownSteps = ["Bereit …", "3", "2", "1", "LOS!"];
  let stepIdx = 0;
  const countdownTimer = setInterval(() => {
    statusEl.textContent = countdownSteps[stepIdx];
    stepIdx++;
    if (stepIdx >= countdownSteps.length) {
      clearInterval(countdownTimer);
      const angle = (0.15 + Math.random() * 0.7) * Math.PI;
      puck.vx = Math.cos(angle) * 3 * (Math.random() < 0.5 ? 1 : -1);
      puck.vy = (Math.random() < 0.5 ? 1 : -1) * (2.2 + Math.random() * 1.3);
      requestAnimationFrame(step);
    }
  }, 600);
}
