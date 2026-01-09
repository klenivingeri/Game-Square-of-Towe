import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createMatchMap } from './maps/map';
import { convertPercentage } from './help/convertPercentage';

const App = () => {
  const [screen, setScreen] = useState({ width: window.innerWidth, height: window.innerHeight });
  const gameMap = createMatchMap(0);
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
      setStats(s => ({ ...s }));
    }

  };

  useEffect(() => {
    const update = () => {
      // 1. Atualizar Posição do Personagem
      setPos(prev => {
        let newX = prev.x;
        let newY = prev.y;
        const speed = 6;

        if (keys.current['ArrowUp'] || keys.current['w']) newY -= speed;
        if (keys.current['ArrowDown'] || keys.current['s']) newY += speed;
        if (keys.current['ArrowLeft'] || keys.current['a']) newX -= speed;
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

          const currentBarLevel = progressBarRef.current ? convertPercentage(progressBarRef.current.style.width) : 0;
          // Chance ajustada (0.7%) pois agora só roda quando a barra está acima do nível 3
          if (currentBarLevel >= 3 && Math.random() < 0.007) {
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

        // ATUALIZAÇÃO VISUAL DA BARRA (Executa todo frame, mesmo parado)
        if (triggerDistanceRef.current > 0) {
          // A barra enche visualmente em 70% do caminho total (Janela de Tensão)
          const barFullLimit = triggerDistanceRef.current * 0.90;
          const visualProgress = Math.min((totalWalkedRef.current / barFullLimit) * 100, 100);

          // EFEITOS DE TREMOR (SHAKE)
          // 1. Oscilação Horizontal: Gera um número aleatório entre -1.5 e 1.5 para somar à largura
          const shakeX = (Math.random() - 0.5) * 1;
          
          // 2. Oscilação Vertical: Suave em 70% (2) e Forte em 85% (6)
          const shakeIntensity = visualProgress >= 85 ? 6 : (visualProgress >= 70 ? 2 : 0);
          const shakeY = (Math.random() - 0.5) * shakeIntensity;

          // Lógica de Cores baseada na porcentagem
          let barColor = 'cyan';
          if (visualProgress >= 85) {
            barColor = '#ff0000'; // Vermelho Escuro
          } else if (visualProgress >= 70) {
            barColor = '#ff4d4d'; // Vermelho
          }

          if (progressBarRef.current) {
            // Aplica a largura com o tremor (Math.max garante que não fique negativo)
            progressBarRef.current.style.width = `${Math.max(0, visualProgress + shakeX)}%`;
            // Aplica a cor calculada e sombra
            progressBarRef.current.style.background = barColor;
            progressBarRef.current.style.boxShadow = `0 0 ${visualProgress >= 70 ? '10px' : '5px'} ${barColor}`;
            // Aplica o pulo vertical para dar a impressão de sair da borda
            progressBarRef.current.style.transform = `translateY(${shakeY}px)`;
          }
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

  // Otimização: Memoriza os tiles do mapa para não recriar a cada frame
  const mapTiles = useMemo(() => {
    return gameMap.map((row, rIdx) => row.map((tile, cIdx) => (
      <div key={`${rIdx}-${cIdx}`} style={{
        position: 'absolute',
        left: cIdx * tileW,
        top: rIdx * tileH,
        width: tileW,
        height: tileH,
        backgroundColor: tile.cor,
        zIndex: tile.zIndex,
        boxSizing: 'border-box',
        boxShadow: `0 0 20px ${tile.cor}`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }} >
        <div style={{ opacity: 0.5, fontSize: '12px' }}>{tile.nivel}</div>
      </div>
    )));
  }, [gameMap, tileW, tileH]);

  return (
    <div style={{
      position: 'fixed', // Fixa o container na tela, ignorando margens do body
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      background: '#000',
      touchAction: 'none' // Impede gestos de rolagem/zoom no mobile
    }}>

      {/* CONTAINER DO MAPA */}
      <div style={{
        position: 'absolute',
        top: -scrollY,
        left: 0,
        width: '100%',
        height: mapHeight,
      }}>

        {mapTiles}

        {/* Player */}
        <div style={{
          position: 'absolute',
          left: pos.x,
          top: pos.y,
          width: playerSize,
          height: playerSize,
          background: 'white',
          zIndex: 15,
          boxShadow: '0 0 15px cyan',
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
        zIndex: 1000
      }}>
        <div
          ref={progressBarRef}
          style={{
            width: '0%',
            height: '100%',
            borderRadius: '8px', // Arredonda a barra interna para ficar bonito ao pular
            background: 'cyan',
            boxShadow: '0 0 10px cyan'
          }} />
      </div>

      <div style={{ position: 'absolute', top: 20, left: 20, color: 'white', background: 'rgba(0,0,0,0.8)', padding: '10px', borderRadius: '5px', zIndex: 100 }}>
        Andar: {ROWS - currentRow} / {ROWS} <br />
        Nível do Grid: {currentTileData?.nivel}
      </div>

    </div>
  );
};

export default App;