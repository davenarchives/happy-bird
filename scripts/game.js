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
} from './game/state.js';

const WING_FLAP_FREQ_PLAYING = 5;
const WING_FLAP_FREQ_DYING = 2.5;

export function initGame() {
  const canvas = document.getElementById(CANVAS_ID);
  if (!canvas) {
    throw new Error(`Canvas with id "${CANVAS_ID}" not found`);
  }

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
  };

  const startGame = () => {
    if (state.mode !== GAME_MODES.PLAYING) {
      setMode(state, GAME_MODES.PLAYING);
      state.lastTime = performance.now();
      requestAnimationFrame(loop);
    }
  };

  const pauseToggle = (force) => {
    const newValue = typeof force === 'boolean' ? force : !state.paused;
    state.paused = newValue;
    if (!newValue && (state.mode === GAME_MODES.PLAYING || state.mode === GAME_MODES.DYING)) {
      state.lastTime = performance.now();
      requestAnimationFrame(loop);
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
    audio.die();
    scheduleSkipUnlock(state, DEATH_VIDEO_SKIP_DELAY_MS);
    playDeathVideo();
  };

  const flap = () => {
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
    if (state.mode !== GAME_MODES.PLAYING && state.mode !== GAME_MODES.DYING) {
      return;
    }

    const elapsedMs = timestamp - state.lastTime;
    const dt = Math.min(0.033, (elapsedMs || 0) / 1000);
    if (!state.paused) {
      state.lastTime = timestamp;
      tick(dt);
    }

    renderer.render();

    if (!state.paused && (state.mode === GAME_MODES.PLAYING || state.mode === GAME_MODES.DYING)) {
      requestAnimationFrame(loop);
    }
  };

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space' || event.code === 'ArrowUp') {
      event.preventDefault();
      flap();
    }
    if (event.key.toLowerCase() === 'r') {
      if (state.mode === GAME_MODES.GAME_OVER && !canSkipVideo(state)) return;
      resetGame();
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
