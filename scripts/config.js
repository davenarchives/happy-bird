export const CANVAS_ID = 'game';
export const VIDEO_ID = 'deathVideo';

export const CANVAS_SIZE = { width: 360, height: 640 };

export const WORLD = {
  gravity: 0.36,
  jumpV: -6.4,
  baseSpeed: 1.32,
  speedRampPerScore: 0.05,
  pipeGap: 150,
  pipeWidth: 64,
  pipeSpawnMsRange: [2300, 2800],
  floorY: CANVAS_SIZE.height - 90,
};

export const UI_FONT =
  'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"';

export const DIFFICULTY_CAP = 40;
export const STEPS_PER_MS = 60 / 1000;
export const INITIAL_PIPE_DISTANCE_RATIO = 0.25;
export const DEATH_VIDEO_SKIP_DELAY_MS = 5000;

export const DEATH_VIDEOS = [
  'relapse/alipin.mp4',
  'relapse/beer.mp4',
  'relapse/eroplanongpapel.mp4',
  'relapse/kathangisip.mp4',
  'relapse/nanditoako.mp4',
  'relapse/pusongligaw.mp4',
  'relapse/sayo.mp4',
  'relapse/hanggangkailan.mp4',
  'relapse/masyadopangmaaga.mp4',
  'relapse/malayko.mp4',
  
];
