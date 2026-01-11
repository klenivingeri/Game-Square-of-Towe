import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Menu } from './Menu'; // Sua tela inicial
import { Game } from './Game';// Onde está o mapa e a barra de tensão
import { Items } from './components/StateDriven/Items';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota inicial (Menu) */}
        <Route path="/" element={<Menu />} />
        
        {/* Rota do Jogo (Mapa) */}
        <Route path="/play" element={<Game />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;