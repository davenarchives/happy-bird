import { CANVAS_SIZE } from '../config.js';
import { circleIntersectsRect } from './collision.js';

export const createPipeManager = ({ world, initialDelayMs, nextDelayMs }) => {
  const pipes = [];
  let nextPipeIn = initialDelayMs;

  const spawnPipe = () => {
    const gap = world.pipeGap;
    const minTop = 40;
    const maxTop = Math.max(minTop + 1, world.floorY - gap - 100);
    const span = Math.max(1, maxTop - minTop);
    const topH = Math.min(maxTop, Math.floor(minTop + Math.random() * span));
    pipes.push({ x: CANVAS_SIZE.width + 20, topH, gap, scored: false });
  };

  const reset = (delay = initialDelayMs) => {
    pipes.length = 0;
    nextPipeIn = delay;
  };

  const update = (dtSeconds, speed, birdX) => {
    const step = dtSeconds * 60;
    nextPipeIn -= dtSeconds * 1000;
    if (nextPipeIn <= 0) {
      spawnPipe();
      nextPipeIn = nextDelayMs();
    }

    let scored = 0;

    for (let i = pipes.length - 1; i >= 0; i--) {
      const pipe = pipes[i];
      pipe.x -= speed * step;
      const pipeMidX = pipe.x + world.pipeWidth * 0.2;
      if (!pipe.scored && birdX > pipeMidX) {
        pipe.scored = true;
        scored += 1;
      }
      if (pipe.x + world.pipeWidth < -40) {
        pipes.splice(i, 1);
      }
    }

    return { scored };
  };

  const collides = (bird) => {
    for (const pipe of pipes) {
      const topRect = { x: pipe.x, y: 0, w: world.pipeWidth, h: pipe.topH };
      const bottomY = pipe.topH + pipe.gap;
      const bottomRect = {
        x: pipe.x,
        y: bottomY,
        w: world.pipeWidth,
        h: world.floorY - bottomY,
      };
      if (
        circleIntersectsRect(bird.x, bird.y, bird.r, topRect.x, topRect.y, topRect.w, topRect.h) ||
        circleIntersectsRect(
          bird.x,
          bird.y,
          bird.r,
          bottomRect.x,
          bottomRect.y,
          bottomRect.w,
          bottomRect.h
        )
      ) {
        return true;
      }
    }
    return false;
  };

  const getPipes = () => pipes;

  return {
    reset,
    update,
    collides,
    getPipes,
  };
};
