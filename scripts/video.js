export function createVideoController(videoEl, sources = []) {
  if (!videoEl) {
    return {
      hide() {},
      playRandom() {},
    };
  }

  const hide = () => {
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
    if (!sources.length) return;
    const source = sources[Math.floor(Math.random() * sources.length)];
    videoEl.src = source;
    videoEl.classList.add('visible');
    videoEl.currentTime = 0;
    videoEl.muted = false;
    videoEl.load();
    tryPlay();
  };

  hide();

  return { hide, playRandom };
}
