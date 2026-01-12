import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createMatchMap } from './maps/map';
import { convertPercentage } from './help/convertPercentage';
import { ProgressBar } from './components/progressBar';
import { Perfil } from './components/perfil';
import { ModalArena } from './components/ModalArena';
import { Arena } from './components/Arena';
import { Nav } from './components/Nav';
import coinSound from './assets/sons/drop-coin.mp3';
import jewelSound from './assets/sons/drop_jewel.mp3';
import walkingSound from './assets/sons/sound-of-walking.mp3';
import { BASE_CONSUMABLES, ItemCard, RARITIES } from './components/StateDriven/Items';
import { OrientationWarning } from './components/OrientationWarning';

export const Game = () => {
  const [screen, setScreen] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [modalArenaOpen, setModalArenaOpen] = useState(false);
  const [modalDropOpen, setModalDropOpen] = useState(false);
  const [activeNavModal, setActiveNavModal] = useState(null);
  const [dropInfo, setDropInfo] = useState(null);
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
  const walkingAudioRef = useRef(new Audio(walkingSound));

  // --- NOVOS ESTADOS E REFS ---
  const progressBarRef = useRef(null);
  const totalWalkedRef = useRef(0);
  const triggerDistanceRef = useRef(0);
  const touchRef = useRef({ startX: 0, startY: 0, moveX: 0, moveY: 0, active: false });
  const [particles, setParticles] = useState([]);
  const lastParticlePos = useRef({ x: pos.x, y: pos.y });

  const [inventory, setInventory] = useState([]);

  // Carrega stats do localStorage ou usa padrão
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('rpg_stats');
    return saved ? JSON.parse(saved) : { money: 100, gems: 0 };
  });

  const lastPos = useRef({ x: pos.x, y: pos.y });
  const [battleState, setBattleState] = useState('none'); // 'none', 'setup', 'fighting'
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [setupFocusIndex, setSetupFocusIndex] = useState(0);

  // --- ESTADO DO JOGADOR (ATRIBUTOS E EQUIPAMENTOS) ---
  // Carrega player do localStorage ou usa padrão
  const [player, setPlayer] = useState(() => {
    const saved = localStorage.getItem('rpg_player');
    return saved ? JSON.parse(saved) : {
      attributes: {
        level: 1,
        xp: 0,
        maxXp: 100,
        hp: 100,
        maxHp: 100,
        attack: 10,      // Dano base
        speed: 3,        // Velocidade de enchimento da barra
        defense: 2,      // Redução de dano
        shield: 2,
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
      },
      items: [],      // Consumíveis
      cosmetics: []   // Cosméticos
    };
  });

  // Salva no localStorage sempre que player ou stats mudarem
  useEffect(() => {
    localStorage.setItem('rpg_player', JSON.stringify(player));
    localStorage.setItem('rpg_stats', JSON.stringify(stats));
  }, [player, stats]);

  // Filtra apenas itens consumíveis (que possuem a propriedade 'value') para a batalha
  const consumables = useMemo(() => {
    return player.items.filter(item => item.value !== undefined);
  }, [player.items]);

  // --- REFERÊNCIAS PARA O LERP ---
  const mapContainerRef = useRef(null);
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

  // Configuração do som de andar
  useEffect(() => {
    walkingAudioRef.current.loop = true;
    walkingAudioRef.current.playbackRate = 2.5; // Acelerado para acompanhar a movimentação
    return () => {
      walkingAudioRef.current.pause();
    };
  }, []);

  // Controle de Play/Pause do som de andar
  useEffect(() => {
    if (isMoving) walkingAudioRef.current.play().catch(() => { });
    else walkingAudioRef.current.pause();
  }, [isMoving]);

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
      const dropRoll = Math.random();
      let msg = '';
      let icon = '';

      if (dropRoll < 0.35) {
        // 35% Ouro
        const goldAmount = 10 * nivel;
        setStats(s => ({ ...s, money: s.money + goldAmount }));
        msg = `+${goldAmount} Ouro`;
        icon = '💰';
        new Audio(coinSound).play().catch(() => { });
        setDropInfo({ msg, icon });
      } else if (dropRoll < 0.60) {
        // 25% Joias
        const gemsAmount = Math.floor(Math.random() * 2) + 1; // 1 a 2 joias
        setStats(s => ({ ...s, gems: s.gems + gemsAmount }));
        msg = `+${gemsAmount} Joia(s)`;
        icon = '💎';
        new Audio(jewelSound).play().catch(() => { });
        setDropInfo({ msg, icon });
      } else {
        // Consumível
        const baseItem = BASE_CONSUMABLES[Math.floor(Math.random() * BASE_CONSUMABLES.length)];
        const rarity = RARITIES[0]; // Comum

        // Extrai valor para compatibilidade com Arena (que usa .value)
        const statKey = Object.keys(baseItem.baseStats)[0];
        const value = baseItem.baseStats[statKey];

        const newItem = {
          ...baseItem,
          id: `${baseItem.id}_${Date.now()}`,
          rarity,
          stats: baseItem.baseStats,
          value,
          color: rarity.color
        };

        setPlayer(p => ({ ...p, items: [...(p.items || []), newItem] }));
        setDropInfo({ type: 'item', data: newItem });
      }
      setModalDropOpen(true);
    } else {
      setMapInfo({ nivel, tension, mobHp, mobAtk });
      // Aqui entrará a sua lógica de batalha
      setBattleState('setup');
      // setSelectedItemIds([]); // Mantém a seleção anterior (Persistência)
      setModalArenaOpen(true);

      setStats(s => ({ ...s }));
    }

  };

  // Limpa itens selecionados que não existem mais no inventário (ex: usados em batalha)
  useEffect(() => {
    setSelectedItemIds(prev => prev.filter(id => player.items.some(item => item.id === id)));
  }, [player.items]);

  useEffect(() => {
    const update = () => {
      const speed = 6;
      let dx = 0;
      let dy = 0;

      if (!modalArenaOpen && !activeNavModal && !modalDropOpen) {
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

      if (newX !== prevPos.x || newY !== prevPos.y) {
        currentPosRef.current = { x: newX, y: newY };
        setPos({ x: newX, y: newY });
      }

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
        if (currentBarLevel >= 2 && Math.random() < 0.007) {
          handleEvent(newX, newY);
          totalWalkedRef.current = 0;
          triggerDistanceRef.current = mapHeight;
          if (progressBarRef.current) {
            progressBarRef.current.style.width = '0%';
            progressBarRef.current.style.background = 'cyan';
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
          // Aplica a cor calculada
          progressBarRef.current.style.background = barColor;
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

      // OTIMIZAÇÃO: Manipulação direta do DOM (evita re-render do React a cada frame)
      if (mapContainerRef.current) {
        mapContainerRef.current.style.transform = `translate3d(0, -${scrollRef.current}px, 0)`;
      }

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
  }, [screen, mapHeight, playerSize, modalArenaOpen, activeNavModal, modalDropOpen]);

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
    setBattleState('none');
  }, []);

  const toggleItemSelection = (itemId) => {
    setSelectedItemIds(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        if (prev.length >= 2) return prev;
        return [...prev, itemId];
      }
    });
  };

  // Reset focus when opening setup
  useEffect(() => {
    if (modalArenaOpen && battleState === 'setup') {
      setSetupFocusIndex(0);
    }
  }, [modalArenaOpen, battleState]);

  // Keyboard handler for Setup Phase
  useEffect(() => {
    if (!modalArenaOpen || battleState !== 'setup') return;

    const handleSetupKey = (e) => {
      const itemCount = consumables.length;
      // Indices 0 to itemCount-1: Items
      // Index itemCount: "LUTAR!" button

      if (e.key === 'ArrowRight' || e.key === 'd') {
        setSetupFocusIndex(prev => Math.min(prev + 1, itemCount));
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        setSetupFocusIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        setSetupFocusIndex(itemCount);
      } else if (e.key === 'ArrowUp' || e.key === 'w') {
        if (itemCount > 0) setSetupFocusIndex(0);
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (setupFocusIndex < itemCount) {
          toggleItemSelection(consumables[setupFocusIndex].id);
        } else {
          setBattleState('fighting');
        }
      }
    };

    window.addEventListener('keydown', handleSetupKey);
    return () => window.removeEventListener('keydown', handleSetupKey);
  }, [modalArenaOpen, battleState, setupFocusIndex, consumables, toggleItemSelection]);

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
      <div
        ref={mapContainerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: mapHeight,
          zIndex: 0, // Garante que o mapa e o player fiquem em uma camada abaixo da UI
          willChange: 'transform',
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
      <Perfil ROWS={ROWS} currentRow={currentRow} currentTileData={currentTileData} player={player} money={stats.money} gems={stats.gems} />

      {/* Modal de Drop (Mapa) */}
      <ModalArena isOpen={modalDropOpen} onClose={() => setModalDropOpen(false)} showX={true} compact={dropInfo?.type === 'item'}>
        <div style={{ textAlign: 'center', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {dropInfo?.type === 'item' && dropInfo.data ? (
            <>
              <h2 style={{ color: 'cyan', margin: '0 0 15px 0' }}>Item Encontrado!</h2>
              <ItemCard item={dropInfo.data} />
            </>
          ) : (
            <>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>{dropInfo?.icon}</div>
              <h2 style={{ color: 'cyan', margin: '0 0 10px 0' }}>Encontrado!</h2>
              <p style={{ fontSize: '18px', color: 'white' }}>{dropInfo?.msg}</p>
            </>
          )}
          <button
            onClick={() => setModalDropOpen(false)}
            style={{ marginTop: '20px', padding: '8px 20px', background: '#3498db', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', width: '100%' }}>
            Coletar
          </button>
        </div>
      </ModalArena>

      <ModalArena isOpen={modalArenaOpen} disableBackgroundClose onClose={handleCloseArena} >
        {battleState === 'setup' && (
          <div style={{ textAlign: 'center', padding: '10px', position: 'relative' }}>
            <h2 style={{ color: 'cyan', marginBottom: '10px' }}>Preparação</h2>
            <p style={{ color: '#ccc', fontSize: '14px' }}>Selecione até 2 itens para a batalha:</p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', margin: '20px 0', minHeight: '60px' }}>
              {consumables.length > 0 ? consumables.map((item, index) => {
                const isSelected = selectedItemIds.includes(item.id);
                const isFocused = setupFocusIndex === index;
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItemSelection(item.id)}
                    style={{
                      width: '50px', height: '50px',
                      border: isSelected ? '2px solid cyan' : (isFocused ? '2px solid white' : `1px solid ${item.color}`),
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(0, 255, 255, 0.2)' : 'rgba(0,0,0,0.3)',
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      fontSize: '24px', cursor: 'pointer',
                      transform: isFocused ? 'scale(1.1)' : 'scale(1)',
                      boxShadow: isFocused ? '0 0 15px rgba(255,255,255,0.5)' : 'none',
                      position: 'relative'
                    }}
                  >
                    {item.icon}
                    {isSelected && <div style={{ position: 'absolute', top: -5, right: -5, background: 'cyan', width: '15px', height: '15px', borderRadius: '50%', border: '1px solid black' }} />}
                  </div>
                );
              }) : <span style={{ color: '#666' }}>Nenhum item consumível.</span>}
            </div>

            <div style={{ position: 'relative', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '30px' }}>
              <button
                onClick={() => setBattleState('fighting')}
                style={{
                  padding: '10px 40px',
                  background: '#e74c3c', color: 'white',
                  border: setupFocusIndex === consumables.length ? '2px solid white' : 'none',
                  borderRadius: '5px', fontSize: '18px', cursor: 'pointer',
                  boxShadow: setupFocusIndex === consumables.length ? '0 0 20px white' : '0 0 10px #c0392b',
                  transform: setupFocusIndex === consumables.length ? 'scale(1.1)' : 'scale(1)',
                  zIndex: 10
                }}>
                LUTAR! {setupFocusIndex === consumables.length && <span style={{ fontSize: '12px' }}></span>}
              </button>

              {/* Slots de Consumíveis (Lado Direito) */}
              <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', display: 'flex', gap: '10px' }}>
                {[0, 1].map(slotIndex => {
                  const itemId = selectedItemIds[slotIndex];
                  const item = itemId ? consumables.find(i => i.id === itemId) : null;

                  return (
                    <div key={slotIndex} style={{
                      width: '50px', height: '50px',
                      border: '1px dashed #555',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.5)',
                      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                      position: 'relative'
                    }}>
                      {item ? (
                        <>
                          <div style={{ fontSize: '20px' }}>{item.icon}</div>
                          <div style={{ fontSize: '10px', color: 'white', fontWeight: 'bold', position: 'absolute', bottom: '2px', right: '2px', textShadow: '0 0 2px black' }}>
                            {item.value || (item.stats ? Object.values(item.stats)[0] : '?')}
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize: '10px', color: '#444' }}>Vazio</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {battleState === 'fighting' && (
          <>      {/* --- INFO TOPO --- */}
            <div style={{
              position: 'absolute',
              top: '5px',
              width: '100%',
              textAlign: 'center',
              color: 'white',
              fontSize: '12px',
              zIndex: 30,
              textShadow: '0 0 3px black',
              pointerEvents: 'none'
            }}>
              <span style={{ marginRight: '10px' }}>
                GRID: <span style={{ color: 'cyan', fontWeight: 'bold' }}>{currentTileData?.nivel || 1}</span>
              </span>
              <span>
                TENSÃO: <span style={{ color: (mapInfo?.tension || 0) > 7 ? '#e74c3c' : '#f1c40f', fontWeight: 'bold' }}>
                  {mapInfo?.tension || 0}/10
                </span>
              </span>
            </div>
            <Arena
              currentTileData={mapInfo}
              player={player}
              setPlayer={setPlayer}
              setStats={setStats}
              onClose={handleCloseArena}
              battleItems={player.items.filter(i => selectedItemIds.includes(i.id))}
            />
          </>
        )}
      </ModalArena>
      <Nav
        ROWS={ROWS}
        currentRow={currentRow}
        currentTileData={currentTileData}
        player={player}
        setPlayer={setPlayer}
        money={stats.money}
        gems={stats.gems}
        setStats={setStats}
        activeModal={activeNavModal}
        setActiveModal={setActiveNavModal}
      />

      {/* Aviso de Orientação */}
      <OrientationWarning width={screen.width} height={screen.height} />
    </div>
  );
};
