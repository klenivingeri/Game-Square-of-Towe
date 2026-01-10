import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createMatchMap } from './maps/map';
import { convertPercentage } from './help/convertPercentage';
import { toggleFullScreen } from './help/toggleFullScreen';
import { ProgressBar } from './components/progressBar';
import { Perfil } from './components/perfil';
import { ModalArena } from './components/ModalArena';
import { Arena } from './components/Arena';
import { Nav } from './components/Nav';

export const Game = () => {
  const [screen, setScreen] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [modalArenaOpen, setModalArenaOpen] = useState(false);
  const [mapInfo, setMapInfo] = useState({});
  const gameMap = useMemo(() => createMatchMap(0), []);
  const ROWS = gameMap.length;
  const COLS = gameMap[0].length;

  const tileW = screen.width / COLS;
  const tileH = 80;
  const playerSize = tileW * 0.2;
  const mapHeight = ROWS * tileH;

  const [pos, setPos] = useState({ x: screen.width / 2, y: mapHeight - 50 });
  const currentPosRef = useRef({ x: screen.width / 2, y: mapHeight - 50 });
  const reqRef = useRef(null);
  const [isMoving, setIsMoving] = useState(false);

  // --- NOVOS ESTADOS E REFS ---
  const progressBarRef = useRef(null);
  const totalWalkedRef = useRef(0);
  const triggerDistanceRef = useRef(0);
  const touchRef = useRef({ startX: 0, startY: 0, moveX: 0, moveY: 0, active: false });
  const [particles, setParticles] = useState([]);
  const lastParticlePos = useRef({ x: pos.x, y: pos.y });

  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({ money: 0 });
  const lastPos = useRef({ x: pos.x, y: pos.y });

  // --- ESTADO DO JOGADOR (ATRIBUTOS E EQUIPAMENTOS) ---
  const [player, setPlayer] = useState({
    attributes: {
      level: 1,
      xp: 0,
      maxXp: 100,
      hp: 100,
      maxHp: 100,
      attack: 10,      // Dano base
      speed: 3,        // Velocidade de enchimento da barra
      defense: 2,      // Redução de dano
      shild: 2,
      critChance: 10,  // Porcentagem (0-100)
    },
    equipment: {
      head: null,   // Cabeça
      chest: null,  // Peito
      arms: null,   // Braço
      pants: null,  // Calça
      boots: null,  // Botas
      weapon: null, // Espada
      shield: null  // Escudo
    }
  });

  // --- REFERÊNCIAS PARA O LERP ---
  const [scrollY, setScrollY] = useState(0);
  const scrollRef = useRef(0); // Valor interno da câmera para o cálculo matemático
  const keys = useRef({});

  // Listener para redimensionamento da tela (rotação)
  useEffect(() => {
    const handleResize = () => {
      setScreen({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 3. FUNÇÃO DE EVENTOS (Drop ou Mobs)
  const handleEvent = (x, y) => {
    // CORREÇÃO 2: Limpa os comandos para o personagem parar de andar ao abrir o alerta
    keys.current = {};
    touchRef.current = { startX: 0, startY: 0, moveX: 0, moveY: 0, active: false };

    // CORREÇÃO: Calcula o nível baseando-se na posição exata do evento (x, y)
    const cx = x + (playerSize / 2);
    const cy = y + (playerSize / 2);
    const cCol = Math.floor(cx / tileW);
    const cRow = Math.floor(cy / tileH);
    const nivel = gameMap[cRow]?.[cCol]?.nivel || 1;
    const tension = convertPercentage(progressBarRef.current.style.width);

    // Regra de Vida e Força dos Mobs
    const mobHp = 30 + (nivel * 10) + (tension * 5);
    const mobAtk = 5 + (nivel * 2) + Math.floor(tension / 2);

    const chance = Math.random();

    if (chance < 0.2) { // 20% de chance de achar algo
      setMapInfo({ nivel, tension, mobHp, mobAtk });
      alert(`✨ Você encontrou um DROP de nível ${nivel}!, ${tension }`);
      setStats(s => ({ ...s, money: s.money + (10 * nivel) }));
    } else {
      setMapInfo({ nivel, tension, mobHp, mobAtk });
      // Aqui entrará a sua lógica de batalha
      setModalArenaOpen(true);
      
      setStats(s => ({ ...s }));
    }

  };

  useEffect(() => {
    const update = () => {
      const speed = 6;
      let dx = 0;
      let dy = 0;

      if (!modalArenaOpen) {
        if (keys.current['ArrowUp'] || keys.current['w']) dy -= speed;
        if (keys.current['ArrowDown'] || keys.current['s']) dy += speed;
        if (keys.current['ArrowLeft'] || keys.current['a']) dx -= speed;
        if (keys.current['ArrowRight'] || keys.current['d']) dx += speed;

        // Lógica de Toque (Joystick Virtual)
        if (touchRef.current.active) {
          const { moveX, moveY } = touchRef.current;
          const distance = Math.sqrt(moveX * moveX + moveY * moveY);
          if (distance > 10) { // Zona morta para evitar movimentos acidentais
            const angle = Math.atan2(moveY, moveX);
            dx += Math.cos(angle) * speed;
            dy += Math.sin(angle) * speed;
          }
        }
      }

      const moving = dx !== 0 || dy !== 0;
      setIsMoving(prev => (prev !== moving ? moving : prev));

      // Limpeza de partículas expiradas (substitui o setTimeout)
      setParticles(prev => {
        const now = Date.now();
        const filtered = prev.filter(p => now - p.createdAt < 500);
        return filtered.length !== prev.length ? filtered : prev;
      });

      // 1. Atualizar Posição do Personagem
      const prevPos = currentPosRef.current;
      let newX = prevPos.x + dx;
      let newY = prevPos.y + dy;

      newX = Math.max(0, Math.min(newX, screen.width - playerSize));
      newY = Math.max(0, Math.min(newY, mapHeight - playerSize));

      currentPosRef.current = { x: newX, y: newY };
      setPos({ x: newX, y: newY });

      // --- LÓGICA DE PARTÍCULAS (Rastro) ---
      const distParticle = Math.sqrt(
        Math.pow(newX - lastParticlePos.current.x, 2) +
        Math.pow(newY - lastParticlePos.current.y, 2)
      );

      if (distParticle > 20) { // Cria uma partícula a cada 20px percorridos
        const id = Date.now() + Math.random();
        setParticles(prev => [...prev, { id, x: newX, y: newY, createdAt: Date.now() }]);
        lastParticlePos.current = { x: newX, y: newY };
      }

      // --- CÁLCULO DE PROGRESSO ---
      const distanceMoved = Math.sqrt(
        Math.pow(newX - lastPos.current.x, 2) +
        Math.pow(newY - lastPos.current.y, 2)
      );

      if (distanceMoved > 0.5) { // Se ele realmente se moveu
        // Lógica de Distância Dinâmica

        // Inicializa o trigger na primeira vez
        if (triggerDistanceRef.current === 0) {
          triggerDistanceRef.current = mapHeight;
        }

        const currentBarLevel = progressBarRef.current ? convertPercentage(progressBarRef.current.style.width) : 0;
        // Chance ajustada (0.7%) pois agora só roda quando a barra está acima do nível 3
        if (currentBarLevel >= 3 && Math.random() < 0.005) {
          handleEvent(newX, newY);
          totalWalkedRef.current = 0;
          triggerDistanceRef.current = mapHeight;
          if (progressBarRef.current) {
            progressBarRef.current.style.width = '0%';
            progressBarRef.current.style.background = 'cyan';
            progressBarRef.current.style.boxShadow = '0 0 10px cyan';
          }
          lastPos.current = { x: newX, y: newY };
        } else {
          totalWalkedRef.current += distanceMoved;

          // O evento só dispara quando atinge o trigger real (que é maior que o visual)
          if (totalWalkedRef.current >= triggerDistanceRef.current) {
            handleEvent(newX, newY);

            // Reseta e sorteia novo trigger para o próximo ciclo
            totalWalkedRef.current = 0;
            triggerDistanceRef.current = mapHeight;

            if (progressBarRef.current) {
              progressBarRef.current.style.width = '0%';
              progressBarRef.current.style.background = 'cyan';
            }
          }
          lastPos.current = { x: newX, y: newY };
        }
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

      // 2. CÁLCULO DO LERP (Câmera Suave)
      let targetScroll = newY - screen.height / 2;
      const maxScroll = mapHeight - screen.height;
      targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));

      // A fórmula: posição_atual + (destino - posição_atual) * suavidade
      // 0.1 cria o "delay" suave. Se quiser mais rápido, use 0.15. Mais lento, 0.05.
      scrollRef.current = scrollRef.current + (targetScroll - scrollRef.current) * 0.05;

      // Sincroniza o estado visual com o cálculo matemático
      setScrollY(scrollRef.current);

      reqRef.current = requestAnimationFrame(update);
    };

    reqRef.current = requestAnimationFrame(update);
    const handleKey = (e) => keys.current[e.key] = e.type === 'keydown';
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);

    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
      cancelAnimationFrame(reqRef.current);
    };
  }, [screen, mapHeight, playerSize, modalArenaOpen]);

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

  // --- HANDLERS DE TOQUE ---
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchRef.current.startX = touch.clientX;
    touchRef.current.startY = touch.clientY;
    touchRef.current.active = true;
  };

  const handleTouchMove = (e) => {
    if (!touchRef.current.active) return;
    const touch = e.touches[0];
    touchRef.current.moveX = touch.clientX - touchRef.current.startX;
    touchRef.current.moveY = touch.clientY - touchRef.current.startY;
  };

  const handleTouchEnd = () => {
    touchRef.current.active = false;
    touchRef.current.moveX = 0;
    touchRef.current.moveY = 0;
  };

  // Otimização: Função estável para o Modal não re-renderizar à toa
  const handleCloseArena = useCallback(() => {
    setModalArenaOpen(false);
  }, []);

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
      position: 'fixed', // Fixa o container na tela, ignorando margens do body
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      background: '#000',
      touchAction: 'none' // Impede gestos de rolagem/zoom no mobile
    }}>

      <style>{`
        @keyframes fadeOut {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0); }
        }
        @keyframes waddle {
          0% { transform: rotate(0deg) translateX(0); }
          25% { transform: rotate(-3deg)}
          50% { transform: rotate(0deg) translateX(0); }
          75% { transform: rotate(3deg) }
          100% { transform: rotate(0deg) translateX(0); }
        }
      `}</style>

      {/* CONTAINER DO MAPA */}
      <div style={{
        position: 'absolute',
        top: -scrollY,
        left: 0,
        width: '100%',
        height: mapHeight,
        zIndex: 0, // Garante que o mapa e o player fiquem em uma camada abaixo da UI
      }}>

        {mapTiles}

        {/* Partículas (Rastro) */}
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute',
            left: p.x + (playerSize / 4),
            top: p.y + (playerSize / 4),
            width: playerSize / 2,
            height: playerSize / 2,
            background: 'rgba(255, 255, 255, 0.5)',
            animation: 'fadeOut 0.5s forwards',
            zIndex: 14,
          }} />
        ))}

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
          animation: isMoving ? 'waddle 0.2s infinite' : 'none',
        }} />
      </div>
        {/* HUD */}
        <ProgressBar progressBarRef={progressBarRef} />
        <Perfil ROWS={ROWS} currentRow={currentRow} currentTileData={currentTileData} player={player} money={stats.money} />
        
        {/* Botão Fullscreen */}
        <button
          onClick={toggleFullScreen}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 100,
            padding: '8px',
            background: 'rgba(0,0,0,0.5)',
            color: 'white',
            border: '1px solid white',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '20px',
            lineHeight: '1',
          }}
        >
          ⛶
        </button>
        <ModalArena isOpen={modalArenaOpen} onClose={handleCloseArena} >
          {`Iniciando batalha com Mob nível: ${mapInfo.nivel}, ${mapInfo.tension }!`}
          <Arena 
            currentTileData={mapInfo}
            player={player}
            setPlayer={setPlayer}
            setStats={setStats}
            onClose={handleCloseArena}
          />
        </ModalArena>
        <Nav />
    </div>
  );
};
