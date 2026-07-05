export function createVideoController(videoEl, sources = []) {
  if (!videoEl) {
    return {
      hide() {},
      playRandom() {
        return Promise.resolve();
      },
    };
  }

  let onLoadedData = null;
  let onPlaying = null;
  let playQueue = [];
  let lastPlayedSource = null;

  videoEl.preload = 'auto';

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };

  const clearPendingVisibility = () => {
    if (onLoadedData) {
      videoEl.removeEventListener('loadeddata', onLoadedData);
      onLoadedData = null;
    }
    if (onPlaying) {
      videoEl.removeEventListener('playing', onPlaying);
      onPlaying = null;
    }
  };

  const hide = () => {
    clearPendingVisibility();
    videoEl.pause();
    videoEl.currentTime = 0;
    videoEl.removeAttribute('src');
    videoEl.load();
    videoEl.classList.remove('visible');
  };

  const tryPlay = () =>
    videoEl
      .play()
      .catch(async () => {
        videoEl.muted = true;
        try {
          await videoEl.play();
        } catch {
          /* ignore autoplay failure */
        }
      })
      .catch(() => {});

  const playRandom = () => {
    if (!sources.length) return Promise.resolve();
    clearPendingVisibility();
    
    if (playQueue.length === 0) {
      playQueue = [...sources];
      shuffleArray(playQueue);
      
      // Ensure the same song doesn't play twice in a row when refilling the bag
      if (playQueue.length > 1 && playQueue[playQueue.length - 1] === lastPlayedSource) {
        const temp = playQueue[playQueue.length - 1];
        playQueue[playQueue.length - 1] = playQueue[0];
        playQueue[0] = temp;
      }
    }
    
    const source = playQueue.pop();
    lastPlayedSource = source;
    
    videoEl.classList.remove('visible');
    videoEl.src = source;
    videoEl.preload = 'auto';
    videoEl.currentTime = 0;
    videoEl.muted = false;

    onLoadedData = () => {
      onLoadedData = null;
      videoEl.classList.add('visible');
    };
    videoEl.addEventListener('loadeddata', onLoadedData, { once: true });

    onPlaying = () => {
      onPlaying = null;
      videoEl.classList.add('visible');
    };
    videoEl.addEventListener('playing', onPlaying, { once: true });

    videoEl.load();
    return tryPlay();
  };

  hide();

  const isVisible = () => videoEl && videoEl.classList.contains('visible');

  return { hide, playRandom, isVisible };
}
