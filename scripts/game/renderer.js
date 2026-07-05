import { CANVAS_SIZE } from '../config.js';
import { drawSpriteDigit, drawSpriteNumber, drawSpriteLabel, drawCurvedSpriteLabel, drawGameOverSprite } from './sprites.js';
import { getLeaderboard } from './state.js';

// Preload the medal image
const medalImg = new Image();
medalImg.src = 'yearner-badge.png';

const wrapTextIntoLines = (ctx, text, fontSize, maxWidth) => {
  ctx.font = `bold ${fontSize}px monospace`;
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
  const fontSize = 16;
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

const drawBackground = (ctx, world, bgDistance) => {
  const t = performance.now() / 1000;
  
  // Sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, world.floorY);
  skyGrad.addColorStop(0, '#87ceeb');
  skyGrad.addColorStop(1, '#b5e3f4');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, CANVAS_SIZE.width, world.floorY);

  // Sun
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillRect(300, 50, 40, 40);
  ctx.fillRect(310, 40, 20, 60);
  ctx.fillRect(290, 60, 60, 20);

  // Clouds
  ctx.fillStyle = '#ffffff';
  const cloudOffset = (t * 10) % 400;
  const drawCloud = (cx, cy) => {
    ctx.fillRect(cx, cy, 60, 20);
    ctx.fillRect(cx + 10, cy - 10, 30, 10);
    ctx.fillRect(cx + 20, cy - 20, 30, 10);
    ctx.fillRect(cx + 50, cy - 10, 20, 10);
  };
  drawCloud(50 - cloudOffset, 100);
  drawCloud(450 - cloudOffset, 100);
  drawCloud(250 - cloudOffset * 1.5, 150);
  drawCloud(650 - cloudOffset * 1.5, 150);

  // Cityscape - Back
  ctx.fillStyle = '#7ac1d9';
  const backOffset = (bgDistance * 20) % 64;
  for (let i = -2; i < CANVAS_SIZE.width / 32 + 2; i++) {
    const x = i * 32 - backOffset;
    const index = Math.abs(i + Math.floor((bgDistance * 20) / 64)) % 10;
    const heights = [120, 150, 100, 180, 140, 90, 160, 110, 170, 130];
    const h = heights[index];
    ctx.fillRect(x, world.floorY - h, 32, h);
    ctx.fillRect(x + 8, world.floorY - h - 16, 16, 16); // antenna
  }

  // Cityscape - Front
  ctx.fillStyle = '#6ab1c9';
  const frontOffset = (bgDistance * 40) % 48;
  for (let i = -2; i < CANVAS_SIZE.width / 48 + 2; i++) {
    const x = i * 48 - frontOffset;
    const index = Math.abs(i + Math.floor((bgDistance * 40) / 48)) % 7;
    const heights = [90, 120, 70, 140, 100, 60, 110];
    const h = heights[index];
    ctx.fillRect(x, world.floorY - h, 48, h);
    // windows
    ctx.fillStyle = '#7ac1d9';
    for (let wy = world.floorY - h + 10; wy < world.floorY - 20; wy += 20) {
      ctx.fillRect(x + 8, wy, 8, 10);
      ctx.fillRect(x + 32, wy, 8, 10);
    }
    ctx.fillStyle = '#6ab1c9'; // reset
  }

  // Background Bushes (Behind pipes)
  const bushOffset = (bgDistance * 80) % 120;
  for (let i = -1; i < CANVAS_SIZE.width / 120 + 2; i++) {
    const x = i * 120 - bushOffset + 60;
    ctx.fillStyle = '#8ce876';
    ctx.fillRect(x - 40, world.floorY - 20, 80, 20);
    ctx.fillRect(x - 30, world.floorY - 30, 60, 10);
    ctx.fillRect(x - 15, world.floorY - 40, 30, 10);
    ctx.fillStyle = '#73c95d';
    ctx.fillRect(x - 40, world.floorY - 5, 80, 5);
  }
};

const drawFloor = (ctx, world, bgDistance) => {
  const floorOffset = (bgDistance * 120) % 32;

  // Foreground Bushes (In front of pipes, attached to floor)
  const fgBushOffset = (bgDistance * 120) % 200;
  for (let i = -1; i < CANVAS_SIZE.width / 200 + 2; i++) {
    const x = i * 200 - fgBushOffset + 100;
    ctx.fillStyle = '#5aa61f';
    ctx.fillRect(x - 20, world.floorY - 15, 40, 15);
    ctx.fillRect(x - 10, world.floorY - 25, 20, 10);
    ctx.fillStyle = '#418210';
    ctx.fillRect(x - 20, world.floorY - 4, 40, 4);
  }

  // Floor Dirt
  ctx.fillStyle = '#ded895';
  ctx.fillRect(0, world.floorY, CANVAS_SIZE.width, CANVAS_SIZE.height - world.floorY);
  
  // Grass top
  ctx.fillStyle = '#73bf2e';
  ctx.fillRect(0, world.floorY, CANVAS_SIZE.width, 12);
  ctx.fillStyle = '#5aa61f';
  ctx.fillRect(0, world.floorY + 12, CANVAS_SIZE.width, 4);
  
  // Pixelated floor dirt pattern
  ctx.fillStyle = '#c5b565';
  for (let i = -1; i < CANVAS_SIZE.width / 32 + 2; i++) {
    const x = i * 32 - floorOffset;
    ctx.fillRect(x, world.floorY + 24, 12, 6);
    ctx.fillRect(x + 16, world.floorY + 40, 12, 6);
  }
};

const drawPipes = (ctx, world, pipes) => {
  for (const pipe of pipes) {
    const capHeight = 18;
    const bodyWidth = world.pipeWidth;
    const bottomY = pipe.topH + pipe.gap;
    // Let pipes draw deeper so floor can overlap them cleanly
    const bottomPipeHeight = CANVAS_SIZE.height - bottomY;

    ctx.save();
    const bodyGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + bodyWidth, 0);
    bodyGradient.addColorStop(0, '#2e9f28');
    bodyGradient.addColorStop(0.25, '#5ed736');
    bodyGradient.addColorStop(0.5, '#7df55c');
    bodyGradient.addColorStop(0.75, '#5ed736');
    bodyGradient.addColorStop(1, '#2e9f28');
    ctx.fillStyle = bodyGradient;
    ctx.fillRect(pipe.x, 0, bodyWidth, pipe.topH);
    ctx.fillRect(pipe.x, bottomY, bodyWidth, bottomPipeHeight);

    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    const highlightX = pipe.x + bodyWidth * 0.38;
    const highlightW = bodyWidth * 0.12;
    ctx.fillRect(highlightX, 0, highlightW, pipe.topH);
    ctx.fillRect(highlightX, bottomY, highlightW, bottomPipeHeight);

    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    const offset = bodyWidth * 0.05;
    ctx.fillRect(pipe.x + offset, 0, 3, pipe.topH);
    ctx.fillRect(pipe.x + offset, bottomY, 3, bottomPipeHeight);
    ctx.fillRect(pipe.x + bodyWidth - 3 - offset, 0, 3, pipe.topH);
    ctx.fillRect(pipe.x + bodyWidth - 3 - offset, bottomY, 3, bottomPipeHeight);

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

const flappyFrames = [
  [ // Wing Up
    '......111111.....',
    '....117771331....',
    '...17722133331...',
    '..1722221833131..',
    '.11111221833131..',
    '133333122183331..',
    '1733371222111111.',
    '.1111122215555551',
    '..12226615111111.',
    '..16666661555551.',
    '...116666611111..',
    '.....11111.......',
  ],
  [ // Wing Mid
    '......111111.....',
    '....117771331....',
    '...17722133331...',
    '..1722221833131..',
    '.12222221833131..',
    '.11111222183331..',
    '1333331222111111.',
    '17333712215555551',
    '.111116615111111.',
    '..16666661555551.',
    '...116666611111..',
    '.....11111.......',
  ],
  [ // Wing Down
    '......111111.....',
    '....117771331....',
    '...17722133331...',
    '..1722221833131..',
    '.12222221833131..',
    '.12222222183331..',
    '.111112222111111.',
    '13333312215555551',
    '1733371615111111.',
    '.111116661555551.',
    '...116666611111..',
    '.....11111.......',
  ],
  [ // Dead Bird (X Eye)
    '......111111.....',
    '....117771331....',
    '...17722131311...',
    '..1722221831331..',
    '.12222221813131..',
    '.11111222183331..',
    '1333331222111111.',
    '17333712215555551',
    '.111116615111111.',
    '..16666661555551.',
    '...116666611111..',
    '.....11111.......',
  ]
];

const BIRD_COLORS = {
  '1': '#000000', // Pure black outline
  '2': '#fec400', // Yellow body
  '3': '#ffffff', // White eye / wing
  '5': '#d50100', // Red beak
  '6': '#f57b00', // Orange belly
  '7': '#ffe0b2', // Peach highlight
  '8': '#b2dfdc', // Light cyan eye highlight
};

const drawBird = (ctx, state, bird) => {
  const time = performance.now();
  let frameIdx = 1;
  const isDead = state.mode === 'dying' || state.mode === 'gameover';

  if (isDead) {
    frameIdx = 3;
  } else if (state.mode === 'ready') {
    frameIdx = Math.floor(time / 150) % 3;
  } else if (state.mode === 'playing') {
    frameIdx = Math.floor(time / 80) % 3;
  }

  const birdPixels = flappyFrames[frameIdx];

  // IMPORTANT:
  // Pixel art must use an integer pixel size.
  const pixelSize = 3;

  const spriteWidth = birdPixels[0].length * pixelSize;
  const spriteHeight = birdPixels.length * pixelSize;

  let displayY = bird.y;

  if (state.mode === 'ready') {
    displayY =
      bird.y +
      Math.sin(performance.now() / 200) * 8;
  }

  ctx.save();

  // Snap position to whole pixels.
  ctx.translate(
    Math.round(bird.x),
    Math.round(displayY)
  );

  // Slanted falling angle based on velocity
  const gravityTilt = (bird.vy || 0) * 0.04;
  const maxTilt = 1.2;
  const angle = Math.max(-0.6, Math.min(maxTilt, gravityTilt));
  ctx.rotate(angle);

  ctx.translate(
    -Math.floor(spriteWidth / 2),
    -Math.floor(spriteHeight / 2)
  );

  for (let row = 0; row < birdPixels.length; row++) {
    for (
      let column = 0;
      column < birdPixels[row].length;
      column++
    ) {
      const pixel = birdPixels[row][column];
      const color = BIRD_COLORS[pixel];

      if (!color) continue;

      ctx.fillStyle = color;

      ctx.fillRect(
        column * pixelSize,
        row * pixelSize,
        pixelSize,
        pixelSize
      );
    }
  }

  ctx.restore();
};

// Score is now rendered via pixel sprites — see sprites.js

const drawGameOver = (ctx, state) => {
  ctx.save();
  
  const elapsed = performance.now() - (state.gameOverTime || performance.now());
  
  // Title slides up (0ms to 300ms)
  let titleYOffset = 20;
  let titleAlpha = 0;
  if (elapsed < 300) {
    const t = elapsed / 300;
    titleAlpha = Math.min(1, t * 2);
    if (elapsed < 200) {
      const p = elapsed / 200;
      const ease = Math.sin((p * Math.PI) / 2);
      titleYOffset = 20 - (ease * 25);
    } else {
      const p = (elapsed - 200) / 100;
      const ease = 1 - Math.cos((p * Math.PI) / 2);
      titleYOffset = -5 + (ease * 5);
    }
  } else {
    titleYOffset = 0;
    titleAlpha = 1;
  }
  
  // Board animates up (400ms to 800ms)
  let boardYOffset = CANVAS_SIZE.height;
  if (elapsed > 400) {
    const boardElapsed = elapsed - 400;
    if (boardElapsed < 400) {
      const t = boardElapsed / 400;
      boardYOffset = CANVAS_SIZE.height * (1 - Math.sin(t * Math.PI / 2));
    } else {
      boardYOffset = 0;
    }
  }

  // Game Over sprite text
  const goY = CANVAS_SIZE.height * 0.25;
  if (titleAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = titleAlpha;
    drawGameOverSprite(ctx, CANVAS_SIZE.width / 2, goY + titleYOffset, 4);
    ctx.restore();
  }

  if (boardYOffset < CANVAS_SIZE.height) {
    ctx.save();
    ctx.translate(0, boardYOffset);

    // Beige panel (adjusted height)
    const panelW = 300;
    const panelH = 160;
    const panelX = (CANVAS_SIZE.width - panelW) / 2;
    const panelY = goY + 45;
    
    // Drop shadow for panel
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowOffsetY = 4;
    ctx.shadowBlur = 4;
    
    ctx.fillStyle = '#ded895';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 12);
    ctx.fill();
    
    ctx.shadowColor = 'transparent'; // turn off shadow
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#555';
    ctx.stroke();

    // Inner border
    ctx.strokeStyle = '#c8bd8a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(panelX + 6, panelY + 6, panelW - 12, panelH - 12, 8);
    ctx.stroke();

    // MEDAL label (sprite)
    const medalCenterX = panelX + panelW * 0.28;
    drawSpriteLabel(ctx, 'MEDAL', medalCenterX, panelY + 28, 1.5);

    // Medal area — show badge if newBest, otherwise placeholder circle
    if (state.newBest && medalImg.complete && medalImg.naturalWidth > 0) {
      const medalSize = 72;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(medalImg, medalCenterX - medalSize / 2, panelY + 78 - medalSize / 2, medalSize, medalSize);
      ctx.imageSmoothingEnabled = true;
    } else {
      ctx.fillStyle = '#c8bd8a';
      ctx.beginPath();
      ctx.arc(medalCenterX, panelY + 78, 36, 0, Math.PI * 2);
      ctx.fill();
    }

    // SCORE label (sprite) + number
    const scoreCenterX = panelX + panelW * 0.72;
    drawSpriteLabel(ctx, 'SCORE', scoreCenterX, panelY + 28, 1.5);
    drawSpriteNumber(ctx, state.score.toString(), scoreCenterX, panelY + 54, 2);

    // BEST label (sprite) + number
    drawSpriteLabel(ctx, 'BEST', scoreCenterX, panelY + 98, 1.5);
    drawSpriteNumber(ctx, state.best.toString(), scoreCenterX, panelY + 124, 2);

    // Buttons
    const btnW = 100;
    const btnH = 40;
    const btnY = panelY + panelH + 20;
    
    // Play button
    const playBtnX = CANVAS_SIZE.width / 2 - btnW - 10;
    ctx.fillStyle = '#f8f8f8';
    ctx.beginPath();
    ctx.roundRect(playBtnX, btnY, btnW, btnH, 8);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Green play triangle
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.moveTo(playBtnX + btnW / 2 - 8, btnY + btnH / 2 - 10);
    ctx.lineTo(playBtnX + btnW / 2 + 12, btnY + btnH / 2);
    ctx.lineTo(playBtnX + btnW / 2 - 8, btnY + btnH / 2 + 10);
    ctx.fill();

    // Leaderboard button
    const lbBtnX = CANVAS_SIZE.width / 2 + 10;
    ctx.fillStyle = '#f8f8f8';
    ctx.beginPath();
    ctx.roundRect(lbBtnX, btnY, btnW, btnH, 8);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.stroke();

    // Orange podium
    ctx.fillStyle = '#f97316';
    const bx = lbBtnX + btnW / 2;
    const by = btnY + btnH / 2 + 4;
    
    // Podium bars
    ctx.fillRect(bx - 8, by - 14, 16, 24);  // Center (1)
    ctx.fillRect(bx - 26, by - 2, 16, 12);  // Left (3)
    ctx.fillRect(bx + 10, by - 8, 16, 18);  // Right (2)

    // Podium numbers as sprite digits (white with black outline)
    drawSpriteNumber(ctx, '1', bx, by - 2, 1);
    drawSpriteNumber(ctx, '3', bx - 18, by + 4, 1);
    drawSpriteNumber(ctx, '2', bx + 18, by + 1, 1);

    ctx.restore();
  }
  
  ctx.restore();
};

const drawTrophy = (ctx, cx, cy, scale, fillColor) => {
  const pixels = [
    '011111110',
    '111111111',
    '101111101',
    '111111111',
    '011111110',
    '001111100',
    '000111000',
    '000010000',
    '000111000',
    '001111100',
  ];
  
  const w = pixels[0].length * scale;
  const h = pixels.length * scale;
  const startX = cx - w / 2;
  const startY = cy - h / 2;
  
  ctx.fillStyle = '#000';
  for (let r = 0; r < pixels.length; r++) {
    for (let c = 0; c < pixels[r].length; c++) {
      if (pixels[r][c] === '1') {
        ctx.fillRect(startX + c * scale + 2, startY + r * scale + 2, scale + 0.5, scale + 0.5);
      }
    }
  }
  
  ctx.fillStyle = fillColor;
  for (let r = 0; r < pixels.length; r++) {
    for (let c = 0; c < pixels[r].length; c++) {
      if (pixels[r][c] === '1') {
        ctx.fillRect(startX + c * scale, startY + r * scale, scale + 0.5, scale + 0.5);
      }
    }
  }
};

const drawLeaderboard = (ctx, state) => {
  const elapsed = performance.now() - (state.leaderboardTime || 0);
  const slideProgress = Math.min(1, elapsed / 400);
  const easeProgress = 1 - Math.pow(1 - slideProgress, 3);
  
  const targetY = CANVAS_SIZE.height * 0.12;
  const startY = CANVAS_SIZE.height;
  const currentY = startY + (targetY - startY) * easeProgress;
  
  ctx.save();
  ctx.translate(0, currentY);
  
  const panelW = CANVAS_SIZE.width * 0.85;
  const panelH = CANVAS_SIZE.height * 0.75;
  const panelX = (CANVAS_SIZE.width - panelW) / 2;
  
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowOffsetY = 4;
  ctx.shadowBlur = 4;
  
  ctx.fillStyle = '#f3e4cb';
  ctx.beginPath();
  ctx.roundRect(panelX, 0, panelW, panelH, 12);
  ctx.fill();
  
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#4f2e1b';
  ctx.stroke();
  
  drawSpriteLabel(ctx, 'TOP 10 YEARNER', CANVAS_SIZE.width / 2, 35, 1.5);
  
  ctx.fillStyle = '#c28464';
  ctx.fillRect(panelX + 20, 60, panelW - 40, 3);
  
  const board = getLeaderboard();
  
  ctx.textBaseline = 'middle';
  
  if (board.length === 0) {
    ctx.textAlign = 'center';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#ea580c';
    ctx.fillText('NO SCORES YET!', CANVAS_SIZE.width / 2, 120);
  } else {
    for (let i = 0; i < board.length; i++) {
      const entry = board[i];
      const y = 95 + i * 36;
      
      const rowStartX = panelX + 25;
      const rowWidth = panelW - 50;
      let nameX = rowStartX + 24;
      
      if (i < 3) {
        let trophyColor = '#eab308';
        if (i === 1) trophyColor = '#94a3b8';
        else if (i === 2) trophyColor = '#b45309';
        drawTrophy(ctx, rowStartX, y, 2.2, trophyColor);
      } else {
        // Rank Circle
        ctx.beginPath();
        ctx.arc(rowStartX, y, 13, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#8e9596';
        ctx.stroke();
        
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#4f2e1b';
        ctx.textAlign = 'center';
        ctx.fillText(`${i + 1}`, rowStartX, y + 2);
      }
      
      // Player Name
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = '#4f2e1b';
      ctx.textAlign = 'left';
      ctx.fillText(entry.name.substring(0, 10), nameX, y + 2);
      
      // Score Box
      const boxW = 56;
      const boxH = 22;
      const boxX = rowStartX + rowWidth - boxW;
      const boxY = y - boxH / 2;
      
      ctx.fillStyle = '#c28464';
      ctx.beginPath();
      ctx.rect(boxX, boxY, boxW, boxH);
      ctx.fill();
      ctx.strokeStyle = '#4f2e1b';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Score Text
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(`${entry.score}`, boxX + boxW / 2, y + 2);
    }
  }
  
  ctx.textAlign = 'center';
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.fillStyle = '#a89d6a';
  ctx.fillText('TAP TO GO BACK', CANVAS_SIZE.width / 2, panelH - 25);
  
  ctx.restore();
};

const drawHUD = (ctx, state) => {
  if (state.mode === 'ready') {
    drawSpriteNumber(ctx, state.score.toString(), CANVAS_SIZE.width / 2, CANVAS_SIZE.height * 0.12, 5);
    
    ctx.save();
    
    // Shadow shifted down
    drawSpriteLabel(ctx, 'HAPPY BIRD', CANVAS_SIZE.width / 2, CANVAS_SIZE.height * 0.32 + 4, 3, '#000', '#000');
    // Main text
    drawSpriteLabel(ctx, 'HAPPY BIRD', CANVAS_SIZE.width / 2, CANVAS_SIZE.height * 0.32, 3, '#fcd34d', '#000');
    
    const tapY = CANVAS_SIZE.height * 0.65 + Math.sin(performance.now() / 150) * 5;
    drawSpriteLabel(ctx, 'TAP TO START', CANVAS_SIZE.width / 2, tapY, 2, '#fff', '#000');
    
    ctx.restore();
  } else if (state.mode === 'playing' || state.mode === 'dying') {
    drawSpriteNumber(ctx, state.score.toString(), CANVAS_SIZE.width / 2, CANVAS_SIZE.height * 0.12, 5);
  } else if (state.mode === 'gameover') {
    drawGameOver(ctx, state);
  } else if (state.mode === 'leaderboard') {
    drawLeaderboard(ctx, state);
  } else if (state.paused) {
    drawSpriteNumber(ctx, state.score.toString(), CANVAS_SIZE.width / 2, CANVAS_SIZE.height * 0.12, 5);
    drawBanner(ctx, state, 'Paused - press P to resume');
  }
};

export const createRenderer = ({
  ctx,
  world,
  state,
  pipes,
  getSpeed,
  bird,
}) => {
  ctx.imageSmoothingEnabled = false;
  
  let bgDistance = 0;
  let lastTime = performance.now();

  return {
    render() {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Only advance background when alive and moving
      if (state.mode === 'ready' || state.mode === 'playing') {
        const speed = state.mode === 'playing' ? getSpeed() : world.baseSpeed;
        bgDistance += speed * dt;
      }

      ctx.clearRect(
        0,
        0,
        CANVAS_SIZE.width,
        CANVAS_SIZE.height
      );

      drawBackground(ctx, world, bgDistance);
      drawPipes(ctx, world, pipes());
      drawFloor(ctx, world, bgDistance);
      drawBird(ctx, state, bird);
      drawHUD(ctx, state);
    },
  };
};
