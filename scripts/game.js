import {
  CANVAS_ID,
  VIDEO_ID,
  CANVAS_SIZE,
  WORLD,
  DIFFICULTY_CAP,
  STEPS_PER_MS,
  INITIAL_PIPE_DISTANCE_RATIO,
  DEATH_VIDEO_SKIP_DELAY_MS,
  DEATH_VIDEOS,
} from './config.js';
import { createVideoController } from './video.js';
import { createAudioBank } from './game/audio.js';
import { createBird, resetBird, flapBird, integrateBird } from './game/bird.js';
import { createPipeManager } from './game/pipes.js';
import { createRenderer } from './game/renderer.js';
import {
  createGameState,
  GAME_MODES,
  resetGameState,
  setMode,
  updateWingPhase,
  recordBestScore,
  resetSkipLock,
  scheduleSkipUnlock,
  canSkipVideo,
  checkLeaderboardQualify,
  addLeaderboardScore,
  syncLeaderboard,
} from './game/state.js';

const WING_FLAP_FREQ_PLAYING = 5;
const WING_FLAP_FREQ_DYING = 2.5;

const generateRandomName = () => {
  const adjectives = ['Star', 'Happy', 'Pixel', 'Flappy', 'Super', 'Cool', 'Epic', 'Mighty', 'Brave', 'Sky', 'Wind', 'Fast'];
  const nouns = ['Merlin', 'Bird', 'Eagle', 'Falcon', 'Hawk', 'Glider', 'Pilot', 'Ninja', 'Rider', 'Jumper', 'Flyer'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${adj}${noun}${num}`;
};

export function initGame() {
  if (!document.getElementById('font-press-start')) {
    const fontLink = document.createElement('link');
    fontLink.id = 'font-press-start';
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    document.head.appendChild(fontLink);
  }

  if (!document.getElementById('injected-styles')) {
    const style = document.createElement('style');
    style.id = 'injected-styles';
    style.innerHTML = `
      .player-name-display {
        position: absolute;
        top: 12px;
        left: 12px;
        font-family: 'Press Start 2P', monospace;
        font-size: 10px;
        color: #fff;
        text-shadow: -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 -2px 0 #000, 0 2px 0 #000, -2px 0 0 #000, 2px 0 0 #000;
        cursor: pointer;
        z-index: 50;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: transform 0.1s;
      }
      .player-name-display:active {
        transform: scale(0.95);
      }
      .player-name-display.hidden {
        display: none !important;
      }
      .name-modal {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #f7e6cf;
        border: 4px solid #573319;
        border-radius: 4px;
        width: 85%;
        max-width: 320px;
        padding: 30px 20px 24px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
        font-family: 'Press Start 2P', monospace;
        text-align: center;
        z-index: 100;
        box-sizing: border-box;
      }
      .name-modal.hidden {
        display: none !important;
      }
      .name-modal-close {
        position: absolute;
        top: 10px;
        right: 14px;
        font-size: 16px;
        color: #573319;
        cursor: pointer;
        user-select: none;
      }
      .name-modal-title {
        font-size: 16px;
        color: #573319;
        margin: 0 0 12px;
        line-height: 1.4;
      }
      .name-modal-subtitle {
        font-size: 10px;
        color: #b5825a;
        margin: 0 0 24px;
      }
      .name-input {
        width: 100%;
        font-family: 'Press Start 2P', monospace;
        font-size: 12px;
        padding: 12px;
        background-color: #f3dfc3;
        border: 2px solid #573319;
        border-radius: 8px;
        color: #573319;
        margin-bottom: 24px;
        outline: none;
        box-sizing: border-box;
      }
      .name-input:focus {
        border-color: #000;
      }
      .name-save-btn {
        font-family: 'Press Start 2P', monospace;
        font-size: 16px;
        padding: 10px 24px;
        background-color: #65d539;
        color: #fff;
        border: 2px solid #000;
        border-radius: 8px;
        cursor: pointer;
        text-shadow: -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 -2px 0 #000, 0 2px 0 #000, -2px 0 0 #000, 2px 0 0 #000;
        box-shadow: 0 4px 0 #000;
        transition: transform 0.1s, box-shadow 0.1s;
      }
      .name-save-btn:active {
        transform: translateY(4px);
        box-shadow: 0 0 0 #000;
      }
      .edit-icon {
        margin-top: -2px;
      }
    `;
    document.head.appendChild(style);
  }

  let currentPlayerName = localStorage.getItem('fb_player_name');
  if (!currentPlayerName) {
    currentPlayerName = generateRandomName();
    localStorage.setItem('fb_player_name', currentPlayerName);
  }

  const canvas = document.getElementById(CANVAS_ID);
  if (!canvas) {
    throw new Error(`Canvas with id "${CANVAS_ID}" not found`);
  }

  let playerNameText = document.getElementById('playerNameText');
  let playerNameDisplay = document.getElementById('playerNameDisplay');

  if (!playerNameText) {
    const playfield = document.querySelector('.playfield');
    if (playfield) {
      playfield.insertAdjacentHTML('beforeend', `
        <div id="playerNameDisplay" class="player-name-display">
          <span id="playerNameText">Player</span>
          <svg class="edit-icon" width="18" height="18" viewBox="0 0 17 17" fill="#fff" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5.5 1.5 A 2.8 2.8 0 0 0 1.5 5.5 L9.5 13.5 L15.5 15.5 L13.5 9.5 Z" />
            <path d="M3.5 7.5 L7.5 3.5 M9.5 13.5 L13.5 9.5" />
            <polygon points="12.5,14.5 15.5,15.5 14.5,12.5" fill="#000" />
          </svg>
        </div>
        <div id="nameModal" class="name-modal hidden">
          <div class="name-modal-close" id="nameModalClose">✖</div>
          <h2 class="name-modal-title">Edit your name</h2>
          <p class="name-modal-subtitle">Shown on the leaderboard.</p>
          <input type="text" id="nameInput" class="name-input" maxlength="15" autocomplete="off" spellcheck="false" />
          <button id="nameSaveBtn" class="name-save-btn">SAVE</button>
        </div>
      `);
      playerNameText = document.getElementById('playerNameText');
      playerNameDisplay = document.getElementById('playerNameDisplay');
    }
  }

  const updateNameDisplay = (name) => {
    playerNameText.textContent = name;
    currentPlayerName = name;
    localStorage.setItem('fb_player_name', name);
  };
  updateNameDisplay(currentPlayerName);

  const showNameModal = (onSaveCallback) => {
    const modal = document.getElementById('nameModal');
    const input = document.getElementById('nameInput');
    const saveBtn = document.getElementById('nameSaveBtn');
    const closeBtn = document.getElementById('nameModalClose');

    input.value = currentPlayerName;
    modal.classList.remove('hidden');
    input.focus();
    input.setSelectionRange(0, input.value.length);

    const closeModal = () => {
      modal.classList.add('hidden');
    };

    const saveAndClose = () => {
      const name = input.value.trim();
      if (name) {
        updateNameDisplay(name);
        if (typeof onSaveCallback === 'function') onSaveCallback(name);
      }
      closeModal();
    };

    saveBtn.onclick = saveAndClose;
    closeBtn.onclick = closeModal;
  };

  playerNameDisplay.addEventListener('click', () => showNameModal());

  const ctx = canvas.getContext('2d');
  const DPR = Math.max(1, window.devicePixelRatio || 1);

  const resizeBackingStore = () => {
    canvas.width = CANVAS_SIZE.width * DPR;
    canvas.height = CANVAS_SIZE.height * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  };

  resizeBackingStore();
  window.addEventListener('resize', resizeBackingStore);

  const world = { ...WORLD };
  const bestScore = Number(localStorage.getItem('fb_best') || 0);
  const state = createGameState(bestScore);

  const videoEl = document.getElementById(VIDEO_ID);
  const videoController = createVideoController(videoEl, DEATH_VIDEOS);
  const audio = createAudioBank();
  const bird = createBird({ x: 80, y: CANVAS_SIZE.height / 2, radius: 16 });

  const baseSpacingRange = world.pipeSpawnMsRange.map(
    (ms) => world.baseSpeed * ms * STEPS_PER_MS
  );
  const initialPipeDistance = baseSpacingRange[0] * INITIAL_PIPE_DISTANCE_RATIO;

  const difficultyLevel = () => Math.min(state.score, DIFFICULTY_CAP);
  const currentSpeed = () => world.baseSpeed + difficultyLevel() * world.speedRampPerScore;

  const pipeDelayForDistance = (distance, speedOverride) => {
    const speed = speedOverride ?? currentSpeed();
    return distance / (speed * STEPS_PER_MS);
  };

  const nextPipeDelay = () => {
    const [minDist, maxDist] = baseSpacingRange;
    const distance = minDist + Math.random() * (maxDist - minDist);
    return pipeDelayForDistance(distance);
  };

  const initialPipeDelay = () => pipeDelayForDistance(initialPipeDistance, world.baseSpeed);

  const pipeManager = createPipeManager({
    world,
    initialDelayMs: initialPipeDelay(),
    nextDelayMs: nextPipeDelay,
  });

  const renderer = createRenderer({
    ctx,
    world,
    state,
    bird,
    getSpeed: currentSpeed,
    pipes: pipeManager.getPipes,
  });

  const hideDeathVideo = () => {
    videoController.hide();
    resetSkipLock(state);
    
    if (checkLeaderboardQualify(state.score)) {
      addLeaderboardScore(currentPlayerName, state.score);
    }
  };

  const playDeathVideo = () => {
    videoController.playRandom();
  };

  if (videoEl) {
    videoEl.addEventListener('playing', () => {
      if (state.mode === GAME_MODES.GAME_OVER) {
        scheduleSkipUnlock(state, DEATH_VIDEO_SKIP_DELAY_MS);
      }
    });
    videoEl.addEventListener('ended', () => {
      if (state.mode === GAME_MODES.GAME_OVER) {
        hideDeathVideo();
      }
    });
  }

  const resetGame = () => {
    resetGameState(state);
    resetBird(bird);
    pipeManager.reset(initialPipeDelay());
    hideDeathVideo();
    renderer.render();
    startLoop(); // Ensure the loop is always running after a reset
  };

  const startGame = () => {
    if (state.mode !== GAME_MODES.PLAYING) {
      setMode(state, GAME_MODES.PLAYING);
      state.lastTime = performance.now();
    }
  };

  let animFrameId = null;

  const startLoop = () => {
    if (!animFrameId) {
      state.lastTime = performance.now();
      animFrameId = requestAnimationFrame(loop);
    }
  };

  const pauseToggle = (force) => {
    const newValue = typeof force === 'boolean' ? force : !state.paused;
    state.paused = newValue;
    if (!newValue) {
      startLoop();
    }
  };

  const beginCrash = () => {
    if (state.mode !== GAME_MODES.PLAYING) return;
    setMode(state, GAME_MODES.DYING);
    bird.vy = Math.max(4, Math.abs(bird.vy));
    audio.hit();
  };

  const die = () => {
    setMode(state, GAME_MODES.GAME_OVER);
    state.gameOverTime = performance.now();
    audio.die();
    scheduleSkipUnlock(state, DEATH_VIDEO_SKIP_DELAY_MS);
    playDeathVideo();
    startLoop();
  };

  const flap = (event) => {
    if (state.mode === GAME_MODES.READY) {
      startGame();
      flapBird(bird, world.jumpV);
      audio.wing();
      return;
    }

    if (state.mode === GAME_MODES.PLAYING) {
      flapBird(bird, world.jumpV);
      audio.wing();
      return;
    }

    if (state.mode === GAME_MODES.GAME_OVER && canSkipVideo(state)) {
      if (videoController.isVisible()) {
        hideDeathVideo();
      } else {
        if (event && event.clientX !== undefined) {
          const rect = canvas.getBoundingClientRect();
          const scaleX = 400 / rect.width;
          const scaleY = 640 / rect.height;
          const clickX = (event.clientX - rect.left) * scaleX;
          const clickY = (event.clientY - rect.top) * scaleY;
          
          const btnW = 100;
          const btnH = 40;
          const goY = 640 * 0.25;
          const panelY = goY + 45;
          const panelH = 160;
          const btnY = panelY + panelH + 20;
          const lbBtnX = 400 / 2 + 10;
          
          if (clickX >= lbBtnX && clickX <= lbBtnX + btnW && clickY >= btnY && clickY <= btnY + btnH) {
            setMode(state, GAME_MODES.LEADERBOARD);
            state.leaderboardTime = performance.now();
            syncLeaderboard();
            return;
          }
        }
        resetGame();
      }
    }
    
    if (state.mode === GAME_MODES.LEADERBOARD) {
      resetGame();
    }
  };

  const tick = (dtSeconds) => {
    const isDying = state.mode === GAME_MODES.DYING;
    const speed = isDying ? 0 : currentSpeed();
    state.acc = speed;

    updateWingPhase(state, dtSeconds, isDying ? WING_FLAP_FREQ_DYING : WING_FLAP_FREQ_PLAYING);

    const { hitFloor } = integrateBird(bird, dtSeconds, world);
    if (hitFloor) {
      die();
      return;
    }

    if (isDying) {
      return;
    }

    const { scored } = pipeManager.update(dtSeconds, speed, bird.x);
    if (scored > 0) {
      state.score += scored;
      recordBestScore(state);
      for (let i = 0; i < scored; i++) {
        audio.point();
      }
    }

    if (pipeManager.collides(bird)) {
      beginCrash();
    }
  };

  const loop = (timestamp) => {
    const elapsedMs = timestamp - state.lastTime;
    const dt = Math.min(0.033, (elapsedMs || 0) / 1000);
    if (!state.paused) {
      state.lastTime = timestamp;
      if (state.mode === GAME_MODES.PLAYING || state.mode === GAME_MODES.DYING) {
        tick(dt);
      } else if (state.mode === GAME_MODES.READY) {
        updateWingPhase(state, dt, WING_FLAP_FREQ_PLAYING);
      }
    }

    renderer.render();

    if (playerNameDisplay) {
      if (state.mode === GAME_MODES.READY) {
        playerNameDisplay.classList.remove('hidden');
      } else {
        playerNameDisplay.classList.add('hidden');
      }
    }

    if (!state.paused) {
      animFrameId = requestAnimationFrame(loop);
    } else {
      animFrameId = null;
    }
  };

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space' || event.code === 'ArrowUp') {
      event.preventDefault();
      flap();
    }
    if (event.key.toLowerCase() === 'r') {
      if (state.mode === GAME_MODES.GAME_OVER && !canSkipVideo(state)) return;
      if (state.mode === GAME_MODES.GAME_OVER && videoController.isVisible()) {
        hideDeathVideo();
      } else {
        resetGame();
      }
    }
    if (event.key.toLowerCase() === 'p') {
      pauseToggle();
    }
  });

  canvas.addEventListener('pointerdown', flap);
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pauseToggle(true);
    } else {
      // Always unpause when returning to avoid getting permanently stuck
      pauseToggle(false);
    }
  });

  resetGame();

  window.__fb = {
    state,
    bird,
    pipes: pipeManager.getPipes(),
    world,
    audio,
  };
}
