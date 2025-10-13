import { CANVAS_SIZE, UI_FONT } from '../config.js';

const wrapTextIntoLines = (ctx, text, fontSize, maxWidth) => {
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

const drawBanner = (ctx, state, text) => {
  ctx.save();
  const fontSize = 22;
  const maxTextWidth = CANVAS_SIZE.width * 0.72;
  const lines = wrapTextIntoLines(ctx, text, fontSize, maxTextWidth);
  const renderLines = lines.length ? lines : [''];
  const padX = 28;
  const padY = 24;
  const lineHeight = fontSize + 6;
  const widestLine = renderLines.reduce(
    (max, line) => Math.max(max, ctx.measureText(line).width),
    0
  );
  const bw = Math.min(
    CANVAS_SIZE.width * 0.9,
    Math.max(widestLine + padX * 2, CANVAS_SIZE.width * 0.45)
  );
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

const drawBackground = (ctx, world, getSpeed) => {
  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, world.floorY, CANVAS_SIZE.width, CANVAS_SIZE.height - world.floorY);

  ctx.fillStyle = '#86efac';
  const speedFactor = getSpeed() / world.baseSpeed;
  const drift = ((Date.now() / 40) * speedFactor) % 120;
  for (let i = 0; i < 5; i++) {
    const x = ((i * 120 + drift) % (CANVAS_SIZE.width + 120)) - 60;
    ctx.beginPath();
    ctx.arc(x, world.floorY, 80, Math.PI, 0);
    ctx.fill();
  }
};

const drawPipes = (ctx, world, pipes) => {
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

const drawBird = (ctx, state, bird) => {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rot * 0.4);
  const bodyWidth = bird.r * 1.15;
  const bodyHeight = bird.r * 0.9;
  const wingLift = Math.max(-bird.vy * 0.18, 0);
  const wingFlap = Math.sin(state.wingPhase);
  const wingTilt = -0.35 + wingFlap * 0.6;
  const wingOffset = wingFlap * bird.r * 0.45;
  const wingStretch = 1 + wingLift / (bird.r * 1.1) + Math.max(0, -wingFlap) * 0.25;
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
  ctx.ellipse(
    -bodyWidth * 0.1,
    bodyHeight * 0.25,
    bodyWidth * 0.65,
    bodyHeight * 0.65,
    -0.2,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.save();
  ctx.translate(-bodyWidth * 0.05, bodyHeight * 0.2 - wingOffset);
  ctx.rotate(wingTilt);
  const wingWidth = bodyWidth * 0.55;
  const wingHeight = (bodyHeight * 0.55 + wingLift) * wingStretch;
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.ellipse(0, 0, wingWidth, wingHeight, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(217,119,6,0.45)';
  ctx.lineWidth = bird.r * 0.12;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const featherCount = 3;
  for (let i = 0; i < featherCount; i++) {
    const featherProgress = (i + 1) / (featherCount + 1);
    const featherY = -wingHeight * 0.35 + featherProgress * wingHeight * 0.9;
    const featherRadius = wingWidth * 0.65;
    ctx.beginPath();
    ctx.arc(-wingWidth * 0.25, featherY, featherRadius, Math.PI * 0.15, Math.PI * 0.95);
    ctx.stroke();
  }
  ctx.restore();

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

const drawHUD = (ctx, state) => {
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
    drawBanner(ctx, state, 'Tap/Click/Space to start');
  } else if (state.mode === 'gameover') {
    drawBanner(ctx, state, 'Game Over - press R or tap to restart');
  } else if (state.paused) {
    drawBanner(ctx, state, 'Paused - press P to resume');
  }
};

export const createRenderer = ({ ctx, world, state, pipes, getSpeed, bird }) => ({
  render() {
    ctx.clearRect(0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height);
    drawBackground(ctx, world, getSpeed);
    drawPipes(ctx, world, pipes());
    drawBird(ctx, state, bird);
    drawHUD(ctx, state);
  },
});
