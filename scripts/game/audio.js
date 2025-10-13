const DEFAULT_POOL_SIZE = 1;

const createSoundPlayer = (src, { poolSize = DEFAULT_POOL_SIZE, volume = 1 } = {}) => {
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
    } catch {
      // Safari can throw while loading; ignore and continue playback.
    }
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
  };
};

export const createAudioBank = () => ({
  wing: createSoundPlayer('game-audio/sfx_wing.wav', { poolSize: 4, volume: 0.55 }),
  point: createSoundPlayer('game-audio/sfx_point.wav', { poolSize: 2, volume: 0.6 }),
  hit: createSoundPlayer('game-audio/sfx_hit.wav', { poolSize: 2, volume: 0.6 }),
  die: createSoundPlayer('game-audio/sfx_die.wav', { poolSize: 2, volume: 0.6 }),
});
