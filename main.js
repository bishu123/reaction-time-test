// Game functionality
const STATE = {
  START: 'start',
  WAIT: 'wait',
  GO: 'go',
  RESULT: 'result',
  EARLY: 'early',
};

const UI = {
  area: document.getElementById('game-area'),
  icon: document.getElementById('main-icon'),
  mainText: document.getElementById('main-text'),
  subText: document.getElementById('sub-text'),
  scoreboard: document.getElementById('scoreboard'),
  scoreList: document.getElementById('score-list'),
};

let currentState = STATE.START;
let startTime = 0;
let endTime = 0;
let timeoutId = null;

// LocalStorage Key
const STORAGE_KEY = 'reaction-game-best-scores';

// Messages for different states
const CONTENT = {
  [STATE.START]: {
    icon: '⚡️',
    main: 'Reaction Time Test',
    sub: 'When the red box turns green, click as fast as you can.',
    instruction: 'Click anywhere to start'
  },
  [STATE.WAIT]: {
    icon: '✋',
    main: 'Wait for Green...',
    sub: 'Keep your focus.',
    instruction: '(Do not click yet)'
  },
  [STATE.GO]: {
    icon: '🎯',
    main: 'CLICK!',
    sub: 'Go go go!',
    instruction: ''
  },
  [STATE.RESULT]: {
    icon: '⏱️',
    main: 'Result',
    sub: '', // Dynamic
    instruction: 'Click to keep going'
  },
  [STATE.EARLY]: {
    icon: '⚠️',
    main: 'Too Soon!',
    sub: 'You clicked before the green light.',
    instruction: 'Click to try again'
  }
};

function loadScores() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveScores(scores) {
  // Keep only top 5 unique-ish scores (or just top 5 raw)
  // Let's keep strict top 5.
  const top5 = scores.sort((a, b) => a - b).slice(0, 5);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(top5));
  return top5;
}

function updateScoreboard() {
  const scores = loadScores();
  UI.scoreList.innerHTML = '';

  if (scores.length === 0) {
    UI.scoreList.innerHTML = '<li style="justify-content:center; opacity:0.5;">No scores yet</li>';
  } else {
    scores.forEach((score, index) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>#${index + 1}</span> <span>${score} ms</span>`;
      UI.scoreList.appendChild(li);
    });
  }
}

function setState(newState) {
  UI.area.classList.remove(`state-${currentState}`);
  currentState = newState;
  UI.area.classList.add(`state-${currentState}`);

  const content = CONTENT[newState];
  if (content) {
    UI.icon.textContent = content.icon;
    UI.mainText.textContent = content.main;
    if (newState !== STATE.RESULT) {
      UI.subText.textContent = content.sub;
    }
  }

  // Show scoreboard only on START and RESULT, maybe EARLY?
  // Let's show on START and RESULT.
  if (newState === STATE.START || newState === STATE.RESULT || newState === STATE.EARLY) {
    updateScoreboard();
    UI.scoreboard.classList.remove('hidden');
  } else {
    UI.scoreboard.classList.add('hidden');
  }
}

function startGame() {
  setState(STATE.WAIT);

  // Random time between 2s and 5s
  const randomDelay = Math.floor(Math.random() * 3000) + 2000;

  timeoutId = setTimeout(() => {
    setState(STATE.GO);
    startTime = Date.now();
  }, randomDelay);
}

function endGame() {
  endTime = Date.now();
  const reactionTime = endTime - startTime;

  // Save Score
  const currentScores = loadScores();
  currentScores.push(reactionTime);
  saveScores(currentScores);

  setState(STATE.RESULT);
  UI.mainText.innerHTML = `<span class="big-score">${reactionTime} ms</span>`;
  UI.subText.textContent = getFeedback(reactionTime);
}

function getFeedback(time) {
  if (time < 150) return "Inhuman reflexes! 🤖";
  if (time < 200) return "Fast as lightning! ⚡️";
  if (time < 250) return "Great job! 🔥";
  if (time < 300) return "Not bad. 👍";
  if (time < 500) return "You can do better. 🐢";
  return "Are you asleep? 😴";
}

function handleEarlyClick() {
  clearTimeout(timeoutId);
  setState(STATE.EARLY);
}

function handleClick(e) {
  // Prevent starting game if clicking on specific non-interactive or confusing areas (if any)
  // But currently big click area is fine.

  switch (currentState) {
    case STATE.START:
    case STATE.RESULT:
    case STATE.EARLY:
      startGame();
      break;

    case STATE.WAIT:
      handleEarlyClick();
      break;

    case STATE.GO:
      endGame();
      break;
  }
}

// Event Listeners
UI.area.addEventListener('mousedown', handleClick);
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    handleClick();
  }
});

// Initialize
setState(STATE.START);
