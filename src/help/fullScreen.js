export const toggleFullScreen = () => {
  const el = document.documentElement;
  if (!document.fullscreenElement) {
    el.requestFullscreen?.().then(() => {
      // Depois de entrar em fullscreen, tenta travar a orientação
      if (screen.orientation?.lock) {
        screen.orientation.lock("portrait").catch((err) => {
          console.error("Erro ao travar orientação:", err);
        });
      }
    });
  } else {
    document.exitFullscreen?.().then(() => {
      // Depois de sair do fullscreen, tenta desbloquear a orientação
      if (screen.orientation?.unlock) {
        screen.orientation.unlock();
      }
    });
  }
};