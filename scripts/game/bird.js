export const createBird = ({ x, y, radius }) => ({
  x,
  y,
  r: radius,
  vy: 0,
  rot: 0,
  spawnX: x,
  spawnY: y,
});

export const resetBird = (bird) => {
  bird.x = bird.spawnX;
  bird.y = bird.spawnY;
  bird.vy = 0;
  bird.rot = 0;
};

export const flapBird = (bird, jumpVelocity) => {
  bird.vy = jumpVelocity;
};

export const integrateBird = (bird, dtSeconds, world) => {
  const step = dtSeconds * 60;
  bird.vy += world.gravity * step;
  bird.y += bird.vy * step;
  bird.rot = Math.atan2(bird.vy, 8);

  let hitFloor = false;
  let hitCeiling = false;

  if (bird.y - bird.r < 0) {
    bird.y = bird.r;
    bird.vy = 0;
    hitCeiling = true;
  }

  if (bird.y + bird.r > world.floorY) {
    bird.y = world.floorY - bird.r;
    hitFloor = true;
  }

  return { hitFloor, hitCeiling };
};
