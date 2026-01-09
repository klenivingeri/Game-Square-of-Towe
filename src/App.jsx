import React, { useState, useEffect, useRef } from 'react';
import { createMatchMap } from './maps/map';
import { convertPercentage } from './help/convertPercentage';

const App = () => {
  const [screen, setScreen] = useState({ width: window.innerWidth, height: window.innerHeight });
  const gameMap = createMatchMap(1);
  const ROWS = gameMap.length; 
  const COLS = gameMap[0].length; 

  const tileW = screen.width / COLS;
  const tileH = 80; 
  const playerSize = tileW * 0.2;
  const mapHeight = ROWS * tileH;

  const [pos, setPos] = useState({ x: screen.width / 2, y: mapHeight - 50 });
  
  // --- NOVOS ESTADOS E REFS ---
  const progressBarRef = useRef(null);
  const totalWalkedRef = useRef(0);
  const triggerDistanceRef = useRef(0);
  
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({ money: 0 });
  const lastPos = useRef({ x: pos.x, y: pos.y });

  // --- REFERÊNCIAS PARA O LERP ---
  const [scrollY, setScrollY] = useState(0);
  const scrollRef = useRef(0); // Valor interno da câmera para o cálculo matemático
  const keys = useRef({});

  // 3. FUNÇÃO DE EVENTOS (Drop ou Mobs)
  const handleEvent = (x, y) => {
    // CORREÇÃO 2: Limpa os comandos para o personagem parar de andar ao abrir o alerta
    keys.current = {};

    // CORREÇÃO: Calcula o nível baseando-se na posição exata do evento (x, y)
    const cx = x + (playerSize / 2);
    const cy = y + (playerSize / 2);
    const cCol = Math.floor(cx / tileW);
    const cRow = Math.floor(cy / tileH);
    const nivel = gameMap[cRow]?.[cCol]?.nivel || 1;
    const stringLevel = convertPercentage(progressBarRef.current.style.width);
    const chance = Math.random();

    if (chance < 0.2) { // 20% de chance de achar algo
      alert(`✨ Você encontrou um DROP de nível ${nivel}!, ${stringLevel}`);
      setStats(s => ({ ...s, money: s.money + (10 * nivel) }));
    } else {
      // Aqui entrará a sua lógica de batalha
      alert(`Iniciando batalha com Mob nível: ${nivel}, ${stringLevel}!`);
      setStats(s => ({ ...s}));
    }
    
  };

  useEffect(() => {
    const update = () => {
      // 1. Atualizar Posição do Personagem
      setPos(prev => {
        let newX = prev.x;
        let newY = prev.y;
        const speed = 6;

        if (keys.current['ArrowUp'] || keys.current['w'])    newY -= speed;
        if (keys.current['ArrowDown'] || keys.current['s'])  newY += speed;
        if (keys.current['ArrowLeft'] || keys.current['a'])  newX -= speed;
        if (keys.current['ArrowRight'] || keys.current['d']) newX += speed;

        newX = Math.max(0, Math.min(newX, screen.width - playerSize));
        newY = Math.max(0, Math.min(newY, mapHeight - playerSize));

        // --- CÁLCULO DE PROGRESSO ---
        const distanceMoved = Math.sqrt(
          Math.pow(newX - lastPos.current.x, 2) + 
          Math.pow(newY - lastPos.current.y, 2)
        );

        if (distanceMoved > 0.5) { // Se ele realmente se moveu
          // Lógica de Distância Dinâmica
          const maxDimension = Math.max(screen.width, screen.height);
          
          // Inicializa o trigger na primeira vez
          if (triggerDistanceRef.current === 0) {
            triggerDistanceRef.current = maxDimension * (0.25 + Math.random() * 0.75);
          }

          // Chance de evento surpresa (0.5% por frame) para dar entre 40% e 60% no total
          if (Math.random() < 0.005) {
            handleEvent(newX, newY);
            totalWalkedRef.current = 0;
            triggerDistanceRef.current = maxDimension * (0.25 + Math.random() * 0.75);
            if (progressBarRef.current) {
              progressBarRef.current.style.width = '0%';
              progressBarRef.current.style.background = 'cyan';
              progressBarRef.current.style.boxShadow = '0 0 10px cyan';
            }
            lastPos.current = { x: newX, y: newY };
            return { x: newX, y: newY };
          }

          totalWalkedRef.current += distanceMoved;
          
          // A barra enche visualmente em 70% do caminho total (Janela de Tensão)
          const barFullLimit = triggerDistanceRef.current * 0.90;
          const visualProgress = Math.min((totalWalkedRef.current / barFullLimit) * 100, 100);
          console.log(visualProgress)
          if (progressBarRef.current) {
            progressBarRef.current.style.width = `${visualProgress}%`;
            // Fica vermelho quando a barra visual está cheia (perigo iminente)
            progressBarRef.current.style.background = visualProgress >= 100 ? '#ff4d4d' : 'cyan';
            progressBarRef.current.style.boxShadow = visualProgress >= 100 ? '0 0 15px #ff4d4d' : '0 0 10px cyan';
          }

          // O evento só dispara quando atinge o trigger real (que é maior que o visual)
          if (totalWalkedRef.current >= triggerDistanceRef.current) {
            handleEvent(newX, newY);
            
            // Reseta e sorteia novo trigger para o próximo ciclo
            totalWalkedRef.current = 0;
            triggerDistanceRef.current = maxDimension * (0.25 + Math.random() * 0.75);
            
            if (progressBarRef.current) {
              progressBarRef.current.style.width = '0%';
              progressBarRef.current.style.background = 'cyan';
            }
          }
          lastPos.current = { x: newX, y: newY };
        }

        // 2. CÁLCULO DO LERP (Câmera Suave) dentro do setPos para pegar o newY atualizado
        let targetScroll = newY - screen.height / 2;
        const maxScroll = mapHeight - screen.height;
        targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));

        // A fórmula: posição_atual + (destino - posição_atual) * suavidade
        // 0.1 cria o "delay" suave. Se quiser mais rápido, use 0.15. Mais lento, 0.05.
        scrollRef.current = scrollRef.current + (targetScroll - scrollRef.current) * 0.1;
        
        // Sincroniza o estado visual com o cálculo matemático
        setScrollY(scrollRef.current);

        return { x: newX, y: newY };
      });
      
      requestAnimationFrame(update);
    };

    const animId = requestAnimationFrame(update);
    const handleKey = (e) => keys.current[e.key] = e.type === 'keydown';
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
      cancelAnimationFrame(animId);
    };
  }, [screen, mapHeight, playerSize]);

  // Detecção de Grid
  const centerX = pos.x + (playerSize / 2);
  const centerY = pos.y + (playerSize / 2);
  const currentCol = Math.floor(centerX / tileW);
  const currentRow = Math.floor(centerY / tileH);
  const currentTileData = gameMap[currentRow]?.[currentCol];

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000', position: 'relative' }}>
      
      {/* CONTAINER DO MAPA */}
      <div style={{
        position: 'absolute',
        top: -scrollY, 
        left: 0,
        width: '100%',
        height: mapHeight,
        // IMPORTANTE: Removido o 'transition' do CSS para não conflitar com o Lerp manual
      }}>
        
        {gameMap.map((row, rIdx) => row.map((tile, cIdx) => (
          <div key={`${rIdx}-${cIdx}`} style={{
            position: 'absolute',
            left: cIdx * tileW,
            top: rIdx * tileH,
            width: tileW,
            height: tileH,
            backgroundColor: (rIdx === currentRow && cIdx === currentCol) ? '#fff' : tile.cor,
            border: '0.1px solid rgba(255,255,255,0.1)',
            boxSizing: 'border-box'
          }} />
        )))}
        {/* Player */}
        <div style={{
          position: 'absolute',
          left: pos.x,
          top: pos.y,
          width: playerSize,
          height: playerSize,
          background: 'cyan',
          boxShadow: '0 0 15px cyan',
          zIndex: 10,
        }} />
      </div>

      {/* HUD da Barra de Progresso */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '40vw',
        height: '12px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '10px',
        border: '2px solid rgba(255,255,255,0.3)',
        overflow: 'hidden',
        zIndex: 1000
      }}>
        <div 
          ref={progressBarRef}
          style={{
          width: '0%',
          height: '100%',
          background: 'cyan',
          boxShadow: '0 0 10px cyan'
        }} />
      </div>

      <div style={{ position: 'absolute', top: 20, left: 20, color: 'white', background: 'rgba(0,0,0,0.8)', padding: '10px', borderRadius: '5px', zIndex: 100 }}>
        Andar: {ROWS - currentRow} / {ROWS} <br/>
        Nível do Grid: {currentTileData?.nivel}
      </div>
      
    </div>
  );
};

export default App;