/**
 * Pixel-art sprite data for Flappy Bird style text rendering.
 * Each digit is a 2D array of 0s and 1s representing pixels.
 * Rendered directly to canvas — no font loading required.
 */

// 7 wide x 10 tall digit bitmaps (classic Flappy Bird style)
const DIGIT_MAPS = [
  // 0
  [
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
  ],
  // 1
  [
    [0,0,0,1,1,0,0],
    [0,0,1,1,1,0,0],
    [0,1,1,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,1,1,1,1,1,0],
    [0,1,1,1,1,1,0],
  ],
  // 2
  [
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,1,1],
    [0,0,0,0,0,1,1],
    [0,0,0,0,1,1,0],
    [0,0,0,1,1,0,0],
    [0,0,1,1,0,0,0],
    [0,1,1,0,0,0,0],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
  ],
  // 3
  [
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,1,1],
    [0,0,0,0,0,1,1],
    [0,0,1,1,1,1,0],
    [0,0,1,1,1,1,0],
    [0,0,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
  ],
  // 4
  [
    [0,0,0,0,1,1,0],
    [0,0,0,1,1,1,0],
    [0,0,1,1,1,1,0],
    [0,1,1,0,1,1,0],
    [1,1,0,0,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [0,0,0,0,1,1,0],
    [0,0,0,0,1,1,0],
    [0,0,0,0,1,1,0],
  ],
  // 5
  [
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,0,0],
    [1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [0,0,0,0,0,1,1],
    [0,0,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
  ],
  // 6
  [
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,0,0],
    [1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
  ],
  // 7
  [
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [0,0,0,0,0,1,1],
    [0,0,0,0,1,1,0],
    [0,0,0,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,0,1,1,0,0,0],
    [0,0,1,1,0,0,0],
    [0,0,1,1,0,0,0],
    [0,0,1,1,0,0,0],
  ],
  // 8
  [
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [0,1,1,1,1,1,0],
    [0,1,1,1,1,1,0],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
  ],
  // 9
  [
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1],
    [0,0,0,0,0,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
  ],
];

// "GAME OVER" as pixel art (each letter ~7-8 wide, 10 tall)
const GAME_OVER_BITMAP = (() => {
  // Build "GAME OVER" as a combined bitmap
  // G A M E  O V E R
  const letters = {
    G: [
      [0,1,1,1,1,1,0],
      [1,1,1,1,1,1,1],
      [1,1,0,0,0,0,0],
      [1,1,0,0,0,0,0],
      [1,1,0,1,1,1,1],
      [1,1,0,1,1,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,1,1,1,1,1],
      [0,1,1,1,1,1,0],
    ],
    A: [
      [0,0,1,1,1,0,0],
      [0,1,1,1,1,1,0],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
    ],
    M: [
      [1,1,0,0,0,1,1],
      [1,1,1,0,1,1,1],
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1],
      [1,1,0,1,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
    ],
    E: [
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1],
      [1,1,0,0,0,0,0],
      [1,1,0,0,0,0,0],
      [1,1,1,1,1,0,0],
      [1,1,1,1,1,0,0],
      [1,1,0,0,0,0,0],
      [1,1,0,0,0,0,0],
      [1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1],
    ],
    O: [
      [0,1,1,1,1,1,0],
      [1,1,1,1,1,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,1,1,1,1,1],
      [0,1,1,1,1,1,0],
    ],
    V: [
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [0,1,1,0,1,1,0],
      [0,1,1,0,1,1,0],
      [0,0,1,1,1,0,0],
      [0,0,1,1,1,0,0],
      [0,0,0,1,0,0,0],
    ],
    R: [
      [1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,1,1,1,1,0],
      [1,1,1,1,1,0,0],
      [1,1,0,0,1,1,0],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
      [1,1,0,0,0,1,1],
    ],
  };

  // "GAME OVER" layout
  const word1 = ['G','A','M','E'];
  const word2 = ['O','V','E','R'];
  return { word1, word2, letters };
})();

// Additional letter maps for labels (MEDAL, SCORE, BEST)
const LABEL_LETTERS = {
  M: GAME_OVER_BITMAP.letters.M,
  E: GAME_OVER_BITMAP.letters.E,
  A: GAME_OVER_BITMAP.letters.A,
  O: GAME_OVER_BITMAP.letters.O,
  R: GAME_OVER_BITMAP.letters.R,
  G: GAME_OVER_BITMAP.letters.G,
  V: GAME_OVER_BITMAP.letters.V,
  D: [
    [1,1,1,1,1,0,0],
    [1,1,1,1,1,1,0],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,0],
    [1,1,1,1,1,0,0],
  ],
  L: [
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
  ],
  S: [
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,0,0],
    [1,1,1,1,1,1,0],
    [0,1,1,1,1,1,1],
    [0,0,0,0,0,1,1],
    [0,0,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
  ],
  C: [
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
  ],
  T: [
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [0,0,0,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,0,0,1,1,0,0],
  ],
  B: [
    [1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,0],
    [1,1,1,1,1,1,0],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,0,0],
  ],
  Y: [
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [0,1,1,0,1,1,0],
    [0,0,1,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,0,0,1,1,0,0],
    [0,0,0,1,1,0,0],
  ],
  P: [
    [1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,0],
    [1,1,1,1,1,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
  ],
  H: [
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
  ],
  I: [
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [0,0,1,1,1,0,0],
    [0,0,1,1,1,0,0],
    [0,0,1,1,1,0,0],
    [0,0,1,1,1,0,0],
    [0,0,1,1,1,0,0],
    [0,0,1,1,1,0,0],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
  ],
  F: [
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,1,1,1,0,0],
    [1,1,1,1,1,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
  ],
  N: [
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,0,0,1,1],
    [1,1,1,1,0,1,1],
    [1,1,0,1,1,1,1],
    [1,1,0,0,1,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
  ],
  '0': DIGIT_MAPS[0],
  '1': DIGIT_MAPS[1],
  '!': [
    [0,0,1,1,1,0,0],
    [0,0,1,1,1,0,0],
    [0,0,1,1,1,0,0],
    [0,0,1,1,1,0,0],
    [0,0,1,1,1,0,0],
    [0,0,1,1,1,0,0],
    [0,0,0,1,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,1,1,1,0,0],
    [0,0,1,1,1,0,0],
  ],
  ' ': [
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
  ]
};

/**
 * Draw a single pixel-art digit on the canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} digit 0-9
 * @param {number} x top-left x
 * @param {number} y top-left y
 * @param {number} scale pixel size multiplier
 * @param {string} fillColor main fill color
 * @param {string} strokeColor outline color
 */
export const drawSpriteDigit = (ctx, digit, x, y, scale, fillColor = '#fff', strokeColor = '#000') => {
  const map = DIGIT_MAPS[digit];
  if (!map) return;

  // Draw outline first (shifted in all 4 directions)
  if (strokeColor && strokeColor !== 'transparent') {
    ctx.fillStyle = strokeColor;
    const offsets = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
    for (const [ox, oy] of offsets) {
      for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
          if (map[row][col]) {
            // scale + 0.5 removes subpixel grid lines
            ctx.fillRect(x + (col + ox) * scale, y + (row + oy) * scale, scale + 0.5, scale + 0.5);
          }
        }
      }
    }
  }

  // Draw fill
  ctx.fillStyle = fillColor;
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      if (map[row][col]) {
        // scale + 0.5 removes subpixel grid lines
        ctx.fillRect(x + col * scale, y + row * scale, scale + 0.5, scale + 0.5);
      }
    }
  }
};

/**
 * Draw a number string centered at (cx, cy).
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} numStr e.g. "42"
 * @param {number} cx center x
 * @param {number} cy center y
 * @param {number} scale pixel size
 * @param {string} fillColor
 * @param {string} strokeColor
 */
export const drawSpriteNumber = (ctx, numStr, cx, cy, scale, fillColor = '#fff', strokeColor = '#000') => {
  const digitWidth = 7;
  const digitHeight = 10;
  const gap = 2; // gap between digits in "pixels"
  const digits = numStr.split('').map(Number);
  const totalWidth = digits.length * digitWidth + (digits.length - 1) * gap;
  const startX = cx - (totalWidth * scale) / 2;
  const startY = cy - (digitHeight * scale) / 2;

  for (let i = 0; i < digits.length; i++) {
    const dx = startX + i * (digitWidth + gap) * scale;
    drawSpriteDigit(ctx, digits[i], dx, startY, scale, fillColor, strokeColor);
  }
};

/**
 * Draw a single pixel-art map.
 */
export const drawSpriteLetter = (ctx, letterMap, x, y, scale, fillColor, strokeColor) => {
  // Draw outline
  if (strokeColor && strokeColor !== 'transparent') {
    ctx.fillStyle = strokeColor;
    const offsets = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
    for (const [ox, oy] of offsets) {
      for (let row = 0; row < letterMap.length; row++) {
        for (let col = 0; col < letterMap[row].length; col++) {
          if (letterMap[row][col]) {
            // scale + 0.5 removes subpixel grid lines
            ctx.fillRect(x + (col + ox) * scale, y + (row + oy) * scale, scale + 0.5, scale + 0.5);
          }
        }
      }
    }
  }

  // Draw fill
  ctx.fillStyle = fillColor;
  for (let row = 0; row < letterMap.length; row++) {
    for (let col = 0; col < letterMap[row].length; col++) {
      if (letterMap[row][col]) {
        // scale + 0.5 removes subpixel grid lines
        ctx.fillRect(x + col * scale, y + row * scale, scale + 0.5, scale + 0.5);
      }
    }
  }
};

/**
 * Draw "GAME OVER" centered at (cx, cy).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx center x
 * @param {number} cy center y
 * @param {number} scale pixel size
 */
export const drawGameOverSprite = (ctx, cx, cy, scale) => {
  const { word1, word2, letters } = GAME_OVER_BITMAP;
  const letterWidth = 7;
  const letterHeight = 10;
  const letterGap = 2;
  const wordGap = 5; // gap between "GAME" and "OVER"

  const word1Width = word1.length * letterWidth + (word1.length - 1) * letterGap;
  const word2Width = word2.length * letterWidth + (word2.length - 1) * letterGap;
  const totalWidth = word1Width + wordGap + word2Width;

  const startX = cx - (totalWidth * scale) / 2;
  const startY = cy - (letterHeight * scale) / 2;

  const fillColor = '#e8731e';
  const strokeColor = '#fff';

  // Draw "GAME"
  for (let i = 0; i < word1.length; i++) {
    const lx = startX + i * (letterWidth + letterGap) * scale;
    drawSpriteLetter(ctx, letters[word1[i]], lx, startY, scale, fillColor, strokeColor);
  }

  // Draw "OVER"
  const overStartX = startX + (word1Width + wordGap) * scale;
  for (let i = 0; i < word2.length; i++) {
    const lx = overStartX + i * (letterWidth + letterGap) * scale;
    drawSpriteLetter(ctx, letters[word2[i]], lx, startY, scale, fillColor, strokeColor);
  }
};

/**
 * Draw a text label (e.g. "MEDAL", "SCORE", "BEST") centered at (cx, cy).
 * Uses pixel sprite letters, no fonts.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text uppercase label
 * @param {number} cx center x
 * @param {number} cy center y
 * @param {number} scale pixel size
 * @param {string} fillColor
 * @param {string} strokeColor
 */
export const drawSpriteLabel = (ctx, text, cx, cy, scale, fillColor = '#ea580c', strokeColor = 'transparent') => {
  const letterWidth = 7;
  const letterHeight = 10;
  const letterGap = 3;
  const chars = text.split('');
  const totalWidth = chars.length * letterWidth + (chars.length - 1) * letterGap;
  const startX = cx - (totalWidth * scale) / 2;
  const startY = cy - (letterHeight * scale) / 2;

  for (let i = 0; i < chars.length; i++) {
    const map = LABEL_LETTERS[chars[i]];
    if (map) {
      const lx = startX + i * (letterWidth + letterGap) * scale;
      drawSpriteLetter(ctx, map, lx, startY, scale, fillColor, strokeColor);
    }
  }
};

/**
 * Draw text curved along an arc.
 */
export const drawCurvedSpriteLabel = (ctx, text, cx, cy, radius, angleSpread, scale, fillColor = '#ea580c', strokeColor = 'transparent') => {
  const chars = text.split('');
  const letterWidth = 7;
  const letterHeight = 10;
  
  const totalChars = chars.length;
  const startAng = -Math.PI / 2 - angleSpread / 2;
  const endAng = -Math.PI / 2 + angleSpread / 2;
  
  for (let i = 0; i < totalChars; i++) {
    const map = LABEL_LETTERS[chars[i]];
    if (map) {
      const p = totalChars > 1 ? i / (totalChars - 1) : 0.5;
      const angle = startAng + p * (endAng - startAng);
      
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle + Math.PI / 2);
      ctx.translate(0, -radius);
      
      drawSpriteLetter(ctx, map, (-letterWidth * scale) / 2, (-letterHeight * scale) / 2, scale, fillColor, strokeColor);
      ctx.restore();
    }
  }
};
