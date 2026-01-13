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
import { generateArenaMobs } from './data/enemies';
import { SetupModal } from './components/SetupModal';
import { OrientationWarning } from './components/OrientationWarning';

export const Game = () => {
  const [screen, setScreen] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [modalArenaOpen, setModalArenaOpen] = useState(false);
  const [modalDropOpen, setModalDropOpen] = useState(false);
  const [modalPortalOpen, setModalPortalOpen] = useState(false);
  const [modalGameOverOpen, setModalGameOverOpen] = useState(false); // Novo estado
  const [gameOverMessage, setGameOverMessage] = useState(""); // Novo estado
  const [portalVisible, setPortalVisible] = useState(false);
  const [activeNavModal, setActiveNavModal] = useState(null);
  const [dropInfo, setDropInfo] = useState(null);
  const [mapInfo, setMapInfo] = useState({});
  const [mapLevel, setMapLevel] = useState(() => {
    const saved = localStorage.getItem('rpg_map_level');
    return saved ? parseInt(saved, 10) : 0;
  });
  const gameMap = useMemo(() => createMatchMap(mapLevel), [mapLevel]);
  const ROWS = gameMap.length;
  const COLS = gameMap[0].length;

  const tileW = screen.width / COLS;
  const tileH = 80;
  const playerSize = tileW * 0.2;
  const mapHeight = ROWS * tileH;

  const initialSpawnX = useMemo(() => (screen.width / 2) - (playerSize / 2), [screen.width, playerSize]);
  const initialSpawnY = useMemo(() => mapHeight - 150, [mapHeight]);

  const [pos, setPos] = useState({ x: initialSpawnX, y: initialSpawnY });
  const currentPosRef = useRef({ x: initialSpawnX, y: initialSpawnY });
  const reqRef = useRef(null);
  const [isMoving, setIsMoving] = useState(false);
  const walkingAudioRef = useRef(null);
  const portalVisibleRef = useRef(portalVisible);

  useEffect(() => {
    portalVisibleRef.current = portalVisible;
  }, [portalVisible]);

  // --- NOVOS ESTADOS E REFS ---
  const velocityRef = useRef({ x: 0, y: 0 });
  const progressBarRef = useRef(null);
  const totalWalkedRef = useRef(0);
  const triggerDistanceRef = useRef(0);
  const touchRef = useRef({ startX: 0, startY: 0, moveX: 0, moveY: 0, active: false });
  const [particles, setParticles] = useState([]);
  const lastParticlePos = useRef({ x: pos.x, y: pos.y });

  // Carrega stats do localStorage ou usa padrão
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('rpg_stats');
    const defaultStats = { money: 100, gems: 0, fichas: 30 };
    if (saved) {
      const parsed = JSON.parse(saved);
      // Garante que 'fichas' exista para dados salvos mais antigos
      return { ...defaultStats, ...parsed };
    }
    return defaultStats;
  });

  const lastPos = useRef({ x: pos.x, y: pos.y });
  const [battleState, setBattleState] = useState('none'); // 'none', 'setup', 'fighting'
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [setupFocusIndex, setSetupFocusIndex] = useState(0);
  const [upcomingMobs, setUpcomingMobs] = useState([]);
  const [previewEnemy, setPreviewEnemy] = useState(null);

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
        shield: null, // Escudo
        accessory: null // Acessório
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

  // Ref para acessar o estado atual do player dentro de callbacks/eventos sem recriá-los
  const playerRef = useRef(player);
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  // Filtra apenas itens consumíveis (que possuem a propriedade 'value') para a batalha
  const consumables = useMemo(() => {
    return player.items.filter(item => item.value !== undefined);
  }, [player.items]);

  // Memoiza os itens de batalha para evitar recriação de array e re-render da Arena
  const battleItems = useMemo(() => {
    const selected = player.items.filter(i => selectedItemIds.includes(i.id));

    // Preenche slots vazios com Poção de Vida Default (Metade do valor: 25)
    const defaults = [];
    const slotsNeeded = 2 - selected.length;
    for (let i = 0; i < slotsNeeded; i++) {
      defaults.push({
        id: `default_potion_slot_${i}`,
        name: 'Poção de Vida',
        type: 'heal',
        icon: '❤',
        value: 25,
        color: '#e74c3c',
        isDefault: true
      });
    }

    return [...selected, ...defaults];
  }, [player.items, selectedItemIds]);

  // --- REFERÊNCIAS PARA O LERP ---
  const mapContainerRef = useRef(null);
  const scrollRef = useRef(0); // Valor interno da câmera para o cálculo matemático
  const keys = useRef({});

  const removeFicha = () => {
    setStats(s => ({ ...s, fichas: s.fichas - 1 }));
    setBattleState('fighting')
  };

  const handleGameOverClose = useCallback(() => {
    setModalGameOverOpen(false);
    // Reset map level
    setMapLevel(0);
    setModalPortalOpen(false)
    setPortalVisible(false);
    localStorage.setItem('rpg_map_level', 0);
    // Reset fichas ao reiniciar o jogo
    setStats(s => ({ ...s, fichas: 30 }));
    // Reset any other relevant game state, e.g., position
    const startY = mapHeight - 150;
    const startX = (screen.width / 2) - (playerSize / 2);
    setPos({ x: startX, y: startY });
    currentPosRef.current = { x: startX, y: startY };
    lastPos.current = { x: startX, y: startY };
    velocityRef.current = { x: 0, y: 0 };
    scrollRef.current = mapHeight - screen.height;
    totalWalkedRef.current = 0;
    if (progressBarRef.current) {
      progressBarRef.current.style.width = '0%';
      progressBarRef.current.style.background = 'cyan';
    }
  }, [mapHeight, screen.width, playerSize, setPlayer, setStats, setMapLevel]);

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
    // Instancia o áudio apenas uma vez ao montar o componente
    walkingAudioRef.current = new Audio(walkingSound);
    walkingAudioRef.current.loop = true;
    walkingAudioRef.current.playbackRate = 2.5; // Acelerado para acompanhar a movimentação

    return () => {
      if (walkingAudioRef.current) walkingAudioRef.current.pause();
      walkingAudioRef.current = null;
    };
  }, []);

  // Resetar posição ao mudar de mapa
  useEffect(() => {
    const startY = mapHeight - 150;
    const startX = (screen.width / 2) - (playerSize / 2);
    setPos({ x: startX, y: startY });
    currentPosRef.current = { x: startX, y: startY };
    lastPos.current = { x: startX, y: startY };
    velocityRef.current = { x: 0, y: 0 };
    scrollRef.current = mapHeight - screen.height;

    if (progressBarRef.current) {
      progressBarRef.current.style.width = '0%';
      progressBarRef.current.style.background = 'cyan';
    }
    totalWalkedRef.current = 0;
  }, [mapLevel, mapHeight, screen, playerSize]);

  // Controle de Play/Pause do som de andar
  useEffect(() => {
    if (walkingAudioRef.current) {
      if (isMoving) walkingAudioRef.current.play().catch(() => { });
      else walkingAudioRef.current.pause();
    }
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
      if (stats.fichas < 1) {
        // Opcional: Adicionar um feedback visual/sonoro de que não há fichas
        console.log("Sem fichas para entrar na dungeon!");
        return; // Impede a entrada
      }

      // Salva XP e Nível atuais para verificar vitória depois
      const startXp = playerRef.current.attributes.xp;
      const startLevel = playerRef.current.attributes.level;
      setMapInfo({ nivel, tension, mobHp, mobAtk, cRow, startXp, startLevel });

      // Gera e guarda preview dos mobs para a tela de Preparação (mesma lógica usada pela Arena)
      const mobCount = Math.floor(Math.random() * 6) + 2;
      const isMapBoss = cRow === 0;
      const mobsPreview = generateArenaMobs(mobCount, { nivel, mobHp, mobAtk }, isMapBoss);
      setUpcomingMobs(mobsPreview);

      setBattleState('setup');
      setModalArenaOpen(true);
    }

  };



  // Limpa itens selecionados que não existem mais no inventário (ex: usados em batalha)
  useEffect(() => {
    setSelectedItemIds(prev => prev.filter(id => player.items.some(item => item.id === id)));
  }, [player.items]);

  useEffect(() => {
    const update = () => {
      // Configurações de Física (Deslizamento)
      const ACCELERATION = 0.2;
      const FRICTION = 0.92;
      const MAX_SPEED = 6;
      const STOP_THRESHOLD = 0.1;

      let inputX = 0;
      let inputY = 0;

      if (!modalArenaOpen && !activeNavModal && !modalDropOpen) {
        if (keys.current['ArrowUp'] || keys.current['w']) inputY -= 1;
        if (keys.current['ArrowDown'] || keys.current['s']) inputY += 1;
        if (keys.current['ArrowLeft'] || keys.current['a']) inputX -= 1;
        if (keys.current['ArrowRight'] || keys.current['d']) inputX += 1;

        // Normaliza vetor de entrada
        if (inputX !== 0 || inputY !== 0) {
          const length = Math.sqrt(inputX * inputX + inputY * inputY);
          inputX /= length;
          inputY /= length;
        }

        // Lógica de Toque (Joystick Virtual)
        if (touchRef.current.active) {
          const { moveX, moveY } = touchRef.current;
          const distance = Math.sqrt(moveX * moveX + moveY * moveY);
          if (distance > 10) { // Zona morta para evitar movimentos acidentais
            const angle = Math.atan2(moveY, moveX);
            inputX = Math.cos(angle);
            inputY = Math.sin(angle);
          } else {
            inputX = 0;
            inputY = 0;
          }
        }
      }

      // Aplica Aceleração
      if (inputX !== 0 || inputY !== 0) {
        velocityRef.current.x += inputX * ACCELERATION;
        velocityRef.current.y += inputY * ACCELERATION;

        // Limita velocidade
        const currentSpeed = Math.sqrt(velocityRef.current.x ** 2 + velocityRef.current.y ** 2);
        if (currentSpeed > MAX_SPEED) {
          const ratio = MAX_SPEED / currentSpeed;
          velocityRef.current.x *= ratio;
          velocityRef.current.y *= ratio;
        }
      } else {
        // Aplica Fricção
        velocityRef.current.x *= FRICTION;
        velocityRef.current.y *= FRICTION;
      }

      // Para completamente se for muito lento
      if (Math.abs(velocityRef.current.x) < STOP_THRESHOLD) velocityRef.current.x = 0;
      if (Math.abs(velocityRef.current.y) < STOP_THRESHOLD) velocityRef.current.y = 0;

      const dx = velocityRef.current.x;
      const dy = velocityRef.current.y;

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

      // Checagem de Colisão com Portal
      if (portalVisibleRef.current) {
        const portalHitBox = {
          x: (screen.width / 2) - 75,
          y: 100,
          w: 100,
          h: 100
        };

        if (newX < portalHitBox.x + portalHitBox.w && newX + playerSize > portalHitBox.x && newY < portalHitBox.y + portalHitBox.h && newY + playerSize > portalHitBox.y) {
          setPortalVisible(false);
          setModalPortalOpen(false);
          const nextLevel = mapLevel + 1;
          localStorage.setItem('rpg_map_level', nextLevel);
          window.location.reload();
          return;
        }
      }

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
        boxShadow: `0 0 5px ${tile.cor}`,
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
    setUpcomingMobs([]);

    // Check player HP after battle
    if (playerRef.current.attributes.hp <= 0) {
      setGameOverMessage("Você foi derrotado em combate! Prepare-se melhor da próxima vez.");
      setModalGameOverOpen(true);
      return; // Stop further processing if game over
    }

    // Deduct 1 ficha when receding (or after battle if not game over)
    const newFichas = stats.fichas - 1;
    setStats(s => ({ ...s, fichas: newFichas }));

    // Check if fichas are 0 after receding
    if (newFichas <= 0) {
      setGameOverMessage("Suas fichas acabaram! Retorne à base para reabastecer e tentar novamente.");
      setModalGameOverOpen(true);
      return; // Stop further processing if game over
    }

    // Verifica se foi uma vitória no topo do mapa (Linha 0)
    if (mapInfo.cRow === 0) {
      const current = playerRef.current;
      const xpGained = current.attributes.xp > mapInfo.startXp;
      const levelGained = current.attributes.level > mapInfo.startLevel;

      if (xpGained || levelGained) {
        setModalPortalOpen(true);
        setPortalVisible(true);
      }
    }
  }, [mapInfo, setStats, stats.fichas, playerRef, setModalGameOverOpen, setGameOverMessage]);

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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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

        {/* Portal */}
        {portalVisible && (
          <div style={{
            position: 'absolute',
            top: '100px',
            left: '50%',
            marginLeft: '-75px',
            width: '100px',
            height: '100px',
            border: '5px solid white',
            boxShadow: '0 0 30px white',
            animation: 'spin 4s linear infinite',
            zIndex: 20
          }} />
        )}

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
      <Perfil ROWS={ROWS} currentRow={currentRow} currentTileData={currentTileData} player={player} money={stats.money} gems={stats.gems} fichas={stats.fichas} />

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

      {/* Modal de Portal Aberto */}
      <ModalArena isOpen={modalPortalOpen} onClose={() => setModalPortalOpen(false)} showX={true}>
        <div style={{ textAlign: 'center', padding: '20px', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ color: 'cyan', marginBottom: '20px', textShadow: '0 0 10px cyan', fontSize: '2rem' }}>
            PORTAL ABERTO!
          </h2>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🌀</div>
          <p style={{ fontSize: '18px', marginBottom: '30px', lineHeight: '1.5' }}>
            Você derrotou o guardião do topo!<br />
            O portal para o próximo nível está aberto.
          </p>
          <button
            onClick={() => setModalPortalOpen(false)}
            style={{
              padding: '12px 40px',
              fontSize: '20px',
              background: 'cyan',
              color: 'black',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 0 20px cyan',
              textTransform: 'uppercase'
            }}
          >
            Entrar
          </button>
        </div>
      </ModalArena>

      <ModalArena isOpen={modalArenaOpen} disableBackgroundClose onClose={handleCloseArena} >
        {battleState === 'setup' && (
          <SetupModal
            consumables={consumables}
            selectedItemIds={selectedItemIds}
            setupFocusIndex={setupFocusIndex}
            toggleItemSelection={toggleItemSelection}
            removeFicha={removeFicha}
            handleCloseArena={handleCloseArena}
            upcomingMobs={upcomingMobs}
            previewEnemy={previewEnemy}
            setPreviewEnemy={setPreviewEnemy}
            selectedCount={selectedItemIds.length}
          />
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
              battleItems={battleItems}
              initialMobs={upcomingMobs}
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

      {/* Modal de Game Over */}
      <ModalArena isOpen={modalGameOverOpen} onClose={handleGameOverClose} disableBackgroundClose={true}>
        <div style={{ textAlign: 'center', padding: '20px', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ color: '#e74c3c', marginBottom: '20px', textShadow: '0 0 10px #e74c3c', fontSize: '2rem' }}>
            FIM DA JORNADA!
          </h2>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>💀</div>
          <p style={{ fontSize: '18px', marginBottom: '30px', lineHeight: '1.5' }}>
            {gameOverMessage}
          </p>
          <button
            onClick={handleGameOverClose}
            style={{
              padding: '12px 40px',
              fontSize: '20px',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 0 20px #e74c3c',
              textTransform: 'uppercase'
            }}
          >
            Tentar Novamente
          </button>
        </div>
      </ModalArena>

      {/* Aviso de Orientação */}
      <OrientationWarning width={screen.width} height={screen.height} />
    </div>
  );
};
