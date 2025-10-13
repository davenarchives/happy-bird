import {
  CANVAS_ID,
  VIDEO_ID,
  CANVAS_SIZE,
  WORLD,
  UI_FONT,
  DIFFICULTY_CAP,
  STEPS_PER_MS,
  INITIAL_PIPE_DISTANCE_RATIO,
  DEATH_VIDEO_SKIP_DELAY_MS,
  DEATH_VIDEOS,
} from './config.js';
import { createVideoController } from './video.js';

const createSoundPlayer = (src, { poolSize = 1, volume = 1 } = {}) => {
  const players = Array.from({ length: Math.max(1, poolSize) }, () => {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.volume = volume;
    return audio;
  });
  let index = 0;
  return () => {
    const audio = players[index];
    index = (index + 1) % players.length;
    try {
      audio.currentTime = 0;
    } catch (err) {
      /* Safari can throw while loading; safe to ignore */
    }
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
  };
};

export function initGame() {
  const canvas = document.getElementById(CANVAS_ID);
  if (!canvas) {
    throw new Error(`Canvas with id "${CANVAS_ID}" not found`);
  }
  const ctx = canvas.getContext('2d');
  const DPR = Math.max(1, window.devicePixelRatio || 1);

  const world = { ...WORLD };
  const state = {
    mode: 'ready',
    lastTime: 0,
    acc: 0,
    paused: false,
    score: 0,
    best: Number(localStorage.getItem('fb_best') || 0),
    skipUnlockAt: 0,
  };

  const videoEl = document.getElementById(VIDEO_ID);
  const videoController = createVideoController(videoEl, DEATH_VIDEOS);

  const sounds = {
    wing: createSoundPlayer('game-audio/sfx_wing.wav', { poolSize: 4, volume: 0.55 }),
    point: createSoundPlayer('game-audio/sfx_point.wav', { poolSize: 2, volume: 0.6 }),
    hit: createSoundPlayer('game-audio/sfx_hit.wav', { poolSize: 2, volume: 0.6 }),
    die: createSoundPlayer('game-audio/sfx_die.wav', { poolSize: 2, volume: 0.6 }),
  };

  const bird = {
    x: 80,
    y: CANVAS_SIZE.height / 2,
    r: 16,
    vy: 0,
    rot: 0,
  };

  /** Pipes are {x, topH, gap, scored} where bottom starts at floorY - (H - topH - gap) */
  const pipes = [];

  function resizeBackingStore() {
    canvas.width = CANVAS_SIZE.width * DPR;
    canvas.height = CANVAS_SIZE.height * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  resizeBackingStore();
  window.addEventListener('resize', resizeBackingStore);

  const baseSpacingRange = world.pipeSpawnMsRange.map((ms) => world.baseSpeed * ms * STEPS_PER_MS);
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

  let nextPipeAt = initialPipeDelay();

  const resetDeathVideoSkipLock = () => {
    state.skipUnlockAt = 0;
  };

  const scheduleDeathVideoSkipUnlock = () => {
    state.skipUnlockAt = performance.now() + DEATH_VIDEO_SKIP_DELAY_MS;
  };

  const canSkipDeathVideo = () => performance.now() >= state.skipUnlockAt;

  const hideDeathVideo = () => {
    videoController.hide();
    resetDeathVideoSkipLock();
  };
  const playDeathVideo = () => videoController.playRandom();

  if (videoEl) {
    videoEl.addEventListener('playing', () => {
      if (state.mode === 'gameover') {
        scheduleDeathVideoSkipUnlock();
      }
    });
    videoEl.addEventListener('ended', () => {
      if (state.mode === 'gameover') {
        hideDeathVideo();
      }
    });
  }

  const reset = () => {
    state.mode = 'ready';
    state.score = 0;
    state.acc = 0;
    state.lastTime = 0;
    state.paused = false;
    bird.x = 80;
    bird.y = CANVAS_SIZE.height / 2;
    bird.vy = 0;
    bird.rot = 0;
    pipes.length = 0;
    nextPipeAt = initialPipeDelay();
    hideDeathVideo();
    render();
  };

  const start = () => {
    if (state.mode !== 'playing') {
      state.mode = 'playing';
      state.lastTime = performance.now();
      requestAnimationFrame(loop);
    }
  };

  const pauseToggle = (force) => {
    const newVal = typeof force === 'boolean' ? force : !state.paused;
    state.paused = newVal;
    if (!newVal && (state.mode === 'playing' || state.mode === 'dying')) {
      state.lastTime = performance.now();
      requestAnimationFrame(loop);
    }
  };

  const flap = () => {
    if (state.mode === 'ready') {
      start();
      bird.vy = world.jumpV;
      sounds.wing();
      return;
    }

    if (state.mode === 'playing') {
      bird.vy = world.jumpV;
      sounds.wing();
      return;
    }

    if (state.mode === 'gameover' && canSkipDeathVideo()) {
      reset();
    }
  };

  const spawnPipe = () => {
    const gap = world.pipeGap;
    const minTop = 40;
    const maxTop = Math.max(minTop + 1, world.floorY - gap - 100);
    const span = Math.max(1, maxTop - minTop);
    const topH = Math.min(maxTop, Math.floor(minTop + Math.random() * span));
    pipes.push({ x: CANVAS_SIZE.width + 20, topH, gap, scored: false });
  };

  const rectsCollide = (cx, cy, r, rx, ry, rw, rh) => {
    const nx = Math.max(rx, Math.min(cx, rx + rw));
    const ny = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nx;
    const dy = cy - ny;
    return dx * dx + dy * dy <= r * r;
  };

  const beginCrash = () => {
    if (state.mode !== 'playing') return;
    state.mode = 'dying';
    bird.vy = Math.max(4, Math.abs(bird.vy));
    sounds.hit();
  };

  const update = (dt) => {
    const step = dt * 60;
    const isDying = state.mode === 'dying';
    const speed = isDying ? 0 : currentSpeed();
    state.acc = speed;

    bird.vy += world.gravity * step;
    bird.y += bird.vy * step;
    bird.rot = Math.atan2(bird.vy, 8);

    if (bird.y - bird.r < 0) {
      bird.y = bird.r;
      bird.vy = 0;
    }
    if (bird.y + bird.r > world.floorY) {
      bird.y = world.floorY - bird.r;
      die();
      return;
    }

    if (isDying) {
      return;
    }

    nextPipeAt -= dt * 1000;
    if (nextPipeAt <= 0) {
      spawnPipe();
      nextPipeAt = nextPipeDelay();
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
      const pipe = pipes[i];
      pipe.x -= speed * step;
      if (!pipe.scored && pipe.x + world.pipeWidth < bird.x) {
        pipe.scored = true;
        state.score += 1;
        state.best = Math.max(state.best, state.score);
        localStorage.setItem('fb_best', state.best);
        sounds.point();
      }
      if (pipe.x + world.pipeWidth < -40) pipes.splice(i, 1);
    }

    for (const pipe of pipes) {
      const topRect = { x: pipe.x, y: 0, w: world.pipeWidth, h: pipe.topH };
      const bottomY = pipe.topH + pipe.gap;
      const bottomRect = { x: pipe.x, y: bottomY, w: world.pipeWidth, h: world.floorY - bottomY };
      if (
        rectsCollide(bird.x, bird.y, bird.r, topRect.x, topRect.y, topRect.w, topRect.h) ||
        rectsCollide(bird.x, bird.y, bird.r, bottomRect.x, bottomRect.y, bottomRect.w, bottomRect.h)
      ) {
        beginCrash();
        break;
      }
    }
  };

  const drawBackground = () => {
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, world.floorY, CANVAS_SIZE.width, CANVAS_SIZE.height - world.floorY);

    ctx.fillStyle = '#86efac';
    const speedFactor = currentSpeed() / world.baseSpeed;
    const drift = ((Date.now() / 40) * speedFactor) % 120;
    for (let i = 0; i < 5; i++) {
      const x = ((i * 120 + drift) % (CANVAS_SIZE.width + 120)) - 60;
      ctx.beginPath();
      ctx.arc(x, world.floorY, 80, Math.PI, 0);
      ctx.fill();
    }
  };

  const drawPipes = () => {
    for (const pipe of pipes) {
      const capHeight = 18;
      const bodyWidth = world.pipeWidth;
      const bottomY = pipe.topH + pipe.gap;

      ctx.save();
      const bodyGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + bodyWidth, 0);
      bodyGradient.addColorStop(0, '#2e9f28');
      bodyGradient.addColorStop(0.25, '#5ed736');
      bodyGradient.addColorStop(0.5, '#7df55c');
      bodyGradient.addColorStop(0.75, '#5ed736');
      bodyGradient.addColorStop(1, '#2e9f28');
      ctx.fillStyle = bodyGradient;
      ctx.fillRect(pipe.x, 0, bodyWidth, pipe.topH);
      ctx.fillRect(pipe.x, bottomY, bodyWidth, world.floorY - bottomY);

      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      const highlightX = pipe.x + bodyWidth * 0.38;
      const highlightW = bodyWidth * 0.12;
      ctx.fillRect(highlightX, 0, highlightW, pipe.topH);
      ctx.fillRect(highlightX, bottomY, highlightW, world.floorY - bottomY);

      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      const offset = bodyWidth * 0.05;
      ctx.fillRect(pipe.x + offset, 0, 3, pipe.topH);
      ctx.fillRect(pipe.x + offset, bottomY, 3, world.floorY - bottomY);
      ctx.fillRect(pipe.x + bodyWidth - 3 - offset, 0, 3, pipe.topH);
      ctx.fillRect(pipe.x + bodyWidth - 3 - offset, bottomY, 3, world.floorY - bottomY);

      const capGradient = ctx.createLinearGradient(pipe.x - 4, 0, pipe.x + bodyWidth + 4, 0);
      capGradient.addColorStop(0, '#2e9f28');
      capGradient.addColorStop(0.5, '#7df55c');
      capGradient.addColorStop(1, '#2e9f28');
      ctx.fillStyle = capGradient;
      ctx.fillRect(pipe.x - 4, pipe.topH - capHeight, bodyWidth + 8, capHeight);
      ctx.fillRect(pipe.x - 4, bottomY, bodyWidth + 8, capHeight);

      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(pipe.x - 4, pipe.topH - 4, bodyWidth + 8, 4);
      ctx.fillRect(pipe.x - 4, bottomY + capHeight - 4, bodyWidth + 8, 4);

      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(pipe.x - 4, pipe.topH - capHeight + 2, bodyWidth + 8, 2);
      ctx.fillRect(pipe.x - 4, bottomY + 2, bodyWidth + 8, 2);
      ctx.restore();
    }
  };

  const drawBird = () => {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rot * 0.4);
    const bodyWidth = bird.r * 1.15;
    const bodyHeight = bird.r * 0.9;
    const wingLift = Math.max(-bird.vy * 0.18, 0);
    const showDeadEye = state.mode === 'dying' || state.mode === 'gameover';

    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.moveTo(-bodyWidth * 0.85, -bodyHeight * 0.1);
    ctx.lineTo(-bodyWidth * 1.15, 0);
    ctx.lineTo(-bodyWidth * 0.85, bodyHeight * 0.35);
    ctx.closePath();
    ctx.fill();

    const bodyGradient = ctx.createRadialGradient(
      0,
      -bodyHeight * 0.25,
      bodyWidth * 0.25,
      0,
      0,
      bodyWidth * 1.05
    );
    bodyGradient.addColorStop(0, '#fef3c7');
    bodyGradient.addColorStop(0.55, '#fde047');
    bodyGradient.addColorStop(1, '#eab308');
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, bodyWidth, bodyHeight, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(-bodyWidth * 0.1, bodyHeight * 0.25, bodyWidth * 0.65, bodyHeight * 0.65, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(
      -bodyWidth * 0.05,
      bodyHeight * 0.2,
      bodyWidth * 0.55,
      bodyHeight * 0.55 + wingLift,
      -0.25,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = 'rgba(217,119,6,0.45)';
    ctx.lineWidth = bird.r * 0.12;
    ctx.lineCap = 'round';
    const featherCount = 3;
    for (let i = 0; i < featherCount; i++) {
      const featherProgress = (i + 1) / (featherCount + 1);
      const y = bodyHeight * 0.05 + featherProgress * bodyHeight * 0.5;
      ctx.beginPath();
      ctx.arc(-bodyWidth * 0.15, y, bodyWidth * 0.35, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
    }

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    const eyeX = bodyWidth * 0.45;
    const eyeY = -bodyHeight * 0.35;
    const eyeRadius = bird.r * 0.45;
    ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();

    if (showDeadEye) {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = bird.r * 0.18;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const eyeSpanX = eyeRadius * 0.7;
      const eyeSpanY = eyeRadius * 0.45;
      ctx.beginPath();
      ctx.moveTo(eyeX - eyeSpanX, eyeY - eyeSpanY);
      ctx.lineTo(eyeX + eyeSpanX, eyeY);
      ctx.lineTo(eyeX - eyeSpanX, eyeY + eyeSpanY);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(bodyWidth * 0.6, -bodyHeight * 0.32, bird.r * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(bodyWidth * 0.7, -bodyHeight * 0.05);
    ctx.lineTo(bodyWidth * 1.2, bird.r * 0.1);
    ctx.lineTo(bodyWidth * 0.65, bird.r * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const wrapTextIntoLines = (text, fontSize, maxWidth) => {
    ctx.font = `bold ${fontSize}px ${UI_FONT}`;
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width <= maxWidth || !current) {
        current = test;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  const drawHUD = () => {
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 0, CANVAS_SIZE.width, 40);
    ctx.fillStyle = '#fff';
    ctx.font = `bold 20px ${UI_FONT}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${state.score}`, 12, 22);
    ctx.textAlign = 'right';
    ctx.fillText(`Best: ${state.best}`, CANVAS_SIZE.width - 12, 22);

    if (state.mode === 'ready') {
      drawBanner('Tap/Click/Space to start');
    } else if (state.mode === 'gameover') {
      drawBanner('Game Over - press R or tap to restart');
    } else if (state.paused) {
      drawBanner('Paused - press P to resume');
    }
  };

  const drawBanner = (text) => {
    ctx.save();
    const fontSize = 22;
    const maxTextWidth = CANVAS_SIZE.width * 0.72;
    const lines = wrapTextIntoLines(text, fontSize, maxTextWidth);
    const renderLines = lines.length ? lines : [''];
    const padX = 28;
    const padY = 24;
    const lineHeight = fontSize + 6;
    const widestLine = renderLines.reduce(
      (max, line) => Math.max(max, ctx.measureText(line).width),
      0
    );
    const bw = Math.min(CANVAS_SIZE.width * 0.9, Math.max(widestLine + padX * 2, CANVAS_SIZE.width * 0.45));
    const bh = padY * 2 + lineHeight * renderLines.length;
    const bx = (CANVAS_SIZE.width - bw) / 2;
    const by = (CANVAS_SIZE.height - bh) / 2;
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = 'rgba(15,23,42,0.88)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(bx + 6, by + 6, bw - 12, bh - 12);
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < renderLines.length; i++) {
      const lineY = by + padY + lineHeight * i + lineHeight / 2;
      ctx.fillText(renderLines[i], CANVAS_SIZE.width / 2, lineY);
    }
    ctx.restore();
  };

  const render = () => {
    ctx.clearRect(0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height);
    drawBackground();
    drawPipes();
    drawBird();
    drawHUD();
  };

  const die = () => {
    state.mode = 'gameover';
    sounds.die();
    scheduleDeathVideoSkipUnlock();
    playDeathVideo();
  };

  const loop = (timestamp) => {
    if (state.mode !== 'playing' && state.mode !== 'dying') return;
    const dt = Math.min(0.033, (timestamp - state.lastTime) / 1000 || 0);
    if (!state.paused) {
      state.lastTime = timestamp;
      update(dt);
    }
    render();
    if (!state.paused && (state.mode === 'playing' || state.mode === 'dying')) {
      requestAnimationFrame(loop);
    }
  };

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space' || event.code === 'ArrowUp') {
      event.preventDefault();
      flap();
    }
    if (event.key.toLowerCase() === 'r') {
      if (state.mode === 'gameover' && !canSkipDeathVideo()) return;
      reset();
    }
    if (event.key.toLowerCase() === 'p') pauseToggle();
  });

  canvas.addEventListener('pointerdown', flap);
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseToggle(true);
  });

  hideDeathVideo();
  render();

  window.__fb = { state, bird, pipes, world, sounds };
}
