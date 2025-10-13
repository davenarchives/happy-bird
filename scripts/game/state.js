export const GAME_MODES = {
  READY: 'ready',
  PLAYING: 'playing',
  DYING: 'dying',
  GAME_OVER: 'gameover',
};

export const createGameState = (bestScore = 0) => ({
  mode: GAME_MODES.READY,
  lastTime: 0,
  acc: 0,
  paused: false,
  score: 0,
  best: bestScore,
  skipUnlockAt: 0,
  wingPhase: 0,
});

export const resetGameState = (state) => {
  state.mode = GAME_MODES.READY;
  state.lastTime = 0;
  state.acc = 0;
  state.paused = false;
  state.score = 0;
  state.wingPhase = 0;
};

export const setMode = (state, mode) => {
  state.mode = mode;
};

export const updateWingPhase = (state, dtSeconds, frequency) => {
  state.wingPhase = (state.wingPhase + dtSeconds * frequency * Math.PI * 2) % (Math.PI * 2);
};

export const recordBestScore = (state) => {
  state.best = Math.max(state.best, state.score);
  localStorage.setItem('fb_best', state.best);
};

export const resetSkipLock = (state) => {
  state.skipUnlockAt = 0;
};

export const scheduleSkipUnlock = (state, delayMs) => {
  state.skipUnlockAt = performance.now() + delayMs;
};

export const canSkipVideo = (state) => performance.now() >= state.skipUnlockAt;
