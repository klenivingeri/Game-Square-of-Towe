import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useDeviceType } from './hooks/useDeviceType'; // Import the hook
import { Menu } from './Menu'; // Sua tela inicial
import { Game } from './Game';// Onde está o mapa e a barra de tensão
import { Items } from './components/StateDriven/Items';
import { MobsGallery } from './components/StateDriven/Mobs';

function App() {
  const deviceType = useDeviceType(); // Use the hook

  return (
    <div>
      <BrowserRouter>
        <Routes>
          {/* Rota inicial (Menu) */}
          <Route path="/" element={<Menu />} />

          <Route path="/items" element={<Items />} />

          <Route path="/mobs" element={<MobsGallery />} />
          
          {/* Rota do Jogo (Mapa) */}
          <Route path="/play" element={<Game />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;