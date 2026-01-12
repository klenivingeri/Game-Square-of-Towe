import React from 'react';

export const OrientationWarning = ({ width, height }) => {
  // Se estiver na horizontal (ou quadrado), não exibe nada
  if (width >= height) return null;

  const handleForceLandscape = async () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      if (window.screen?.orientation?.lock) {
        await window.screen.orientation.lock('landscape');
      }
    } catch (err) {
      console.warn("Erro ao forçar orientação:", err);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.95)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white',
      textAlign: 'center',
    }}>
      <h2 style={{ color: 'cyan', marginBottom: '15px' }}>Melhor Experiência</h2>
      <div style={{ fontSize: '50px', marginBottom: '20px' }}>📱➡️🔄</div>
      <p style={{ fontSize: '18px', marginBottom: '30px', maxWidth: '300px' }}>
        Para melhorar a experiência é recomendado que o aparelho esteja na horizontal.
      </p>
      <button 
        onClick={handleForceLandscape}
        style={{
          padding: '15px 30px',
          fontSize: '18px',
          background: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}>
        OK, VIRAR PARA HORIZONTAL
      </button>
    </div>
  );
};