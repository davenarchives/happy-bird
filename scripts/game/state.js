import { initSupabase, fetchLeaderboard, insertScore } from './supabase.js';

export const GAME_MODES = {
  READY: 'ready',
  PLAYING: 'playing',
  DYING: 'dying',
  GAME_OVER: 'gameover',
  LEADERBOARD: 'leaderboard',
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
  gameOverTime: 0,
  newBest: false,
});

export const resetGameState = (state) => {
  state.mode = GAME_MODES.READY;
  state.lastTime = 0;
  state.acc = 0;
  state.paused = false;
  state.score = 0;
  state.wingPhase = 0;
  state.gameOverTime = 0;
  state.newBest = false;
};

export const setMode = (state, mode) => {
  state.mode = mode;
};

export const updateWingPhase = (state, dtSeconds, frequency) => {
  state.wingPhase = (state.wingPhase + dtSeconds * frequency * Math.PI * 2) % (Math.PI * 2);
};

export const recordBestScore = (state) => {
  if (state.score > state.best) {
    state.newBest = true;
  }
  state.best = Math.max(state.best, state.score);
  localStorage.setItem('fb_best', state.best);
};

// In-memory cache to ensure synchronous access for rendering
let cachedLeaderboard = [];
let isSupabaseInitialized = false;

export const syncLeaderboard = async () => {
  if (!isSupabaseInitialized) {
    initSupabase();
    isSupabaseInitialized = true;
  }
  
  const data = await fetchLeaderboard();
  if (data) {
    cachedLeaderboard = data;
  }
};

// Kick off initial fetch from Supabase
syncLeaderboard();

export const getLeaderboard = () => {
  return cachedLeaderboard;
};

export const addLeaderboardScore = (name, score) => {
  const finalName = name || 'Player';
  
  // Optimistically update memory so it shows instantly for the player
  cachedLeaderboard.push({ name: finalName, score });
  cachedLeaderboard.sort((a, b) => b.score - a.score);
  cachedLeaderboard.splice(10);
  
  // Push to Supabase and then pull the absolute truth
  insertScore(finalName, score).then(() => {
    syncLeaderboard();
  });
};

export const checkLeaderboardQualify = (score) => {
  if (score === 0) return false;
  if (cachedLeaderboard.length < 10) return true;
  return score > cachedLeaderboard[cachedLeaderboard.length - 1].score;
};

export const resetSkipLock = (state) => {
  state.skipUnlockAt = 0;
};

export const scheduleSkipUnlock = (state, delayMs) => {
  state.skipUnlockAt = performance.now() + delayMs;
};

export const canSkipVideo = (state) => performance.now() >= state.skipUnlockAt;
