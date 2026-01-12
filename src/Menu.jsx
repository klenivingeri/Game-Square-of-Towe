import { useNavigate } from 'react-router-dom';
import { toggleFullScreen } from './help/toggleFullScreen';
import { useDeviceType } from './hooks/useDeviceType';

export const Menu = () => {
  const navigate = useNavigate();
  const deviceType = useDeviceType();

  const handleStart = () => {
    // Ativa o modo tela cheia somente em dispositivos móveis
    if (deviceType === 'mobile') {
      toggleFullScreen();
    }
    // Navega para a tela do jogo
    navigate('/play');
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      width: '100vw',
      backgroundColor: '#000', 
      color: 'white'
    }}>
      <style>{`
        .menu-btn {
          padding: 20px 50px;
          font-size: 24px;
          cursor: pointer;
          background: transparent;
          color: cyan;
          border: 2px solid cyan;
          border-radius: 10px;
          box-shadow: 0 0 15px cyan;
          font-family: monospace;
          font-weight: bold;
          text-transform: uppercase;
          transition: all 0.3s ease;
        }
        .menu-btn:hover {
          background: cyan;
          color: black;
          transform: scale(1.1);
          box-shadow: 0 0 30px cyan;
        }
      `}</style>
      <h1 style={{ fontSize: '4rem', marginBottom: '40px', textShadow: '0 0 20px cyan', fontFamily: 'monospace' }}>
        Cube Tower
      </h1>
      {/* Ao clicar, a URL muda para /play e o Vite carrega o componente do Jogo */}
      <button className="menu-btn" onClick={handleStart}>
        Iniciar Aventura
      </button>
    </div>
  );
}

