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

  videoEl.preload = 'auto';

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
    const source = sources[Math.floor(Math.random() * sources.length)];
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
