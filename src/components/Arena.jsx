import { memo, useState, useEffect, useRef } from 'react';

const BONUS_POOL = [
  { id: 'heal_30', name: 'Poção Menor', description: 'Recupera 30% de Vida', type: 'heal', value: 0.3, color: '#2ecc71' },
  { id: 'heal_100', name: 'Poção Completa', description: 'Recupera 100% de Vida', type: 'heal', value: 1, color: '#27ae60' },
  { id: 'shield_25', name: 'Escudo Básico', description: '+25 de Escudo', type: 'shield', value: 25, color: '#3498db' },
  { id: 'shield_50', name: 'Escudo Reforçado', description: '+50 de Escudo', type: 'shield', value: 50, color: '#2980b9' },
  { id: 'dmg_5', name: 'Afiador', description: '+5 de Dano (Batalha)', type: 'damage', value: 5, color: '#e74c3c' },
  { id: 'dmg_15', name: 'Lâmina Sombria', description: '+15 de Dano (Batalha)', type: 'damage', value: 15, color: '#c0392b' },
  { id: 'crit_10', name: 'Concentração', description: '+10% Crítico (Batalha)', type: 'crit', value: 10, color: '#f1c40f' },
  { id: 'crit_25', name: 'Instinto Assassino', description: '+25% Crítico (Batalha)', type: 'crit', value: 25, color: '#f39c12' },
];

export const Arena = memo(({ currentTileData, player, setPlayer }) => {
  // Configurações da Arena
  const PLAYER_SIZE = 50;
  const MOB_SIZE = 50;
  const BONUS_SIZE = 30;
  const BOSS_SIZE = 80;
  const PLAYER_X = 30; // Posição fixa do player

  // Estado mutável do jogo (refs para performance no loop)
  const gameState = useRef({
    playerHp: player.attributes.hp,
    playerMaxHp: player.attributes.maxHp,
    playerAttack: 0,
    playerShield: 0,
    tempAttackBonus: 0,
    tempCritBonus: 0,
    playerHit: 0,
    mobs: [], // Array de mobs
    currentMobIndex: 0,
    active: true,
    combat: false,
    paused: false
  });

  // Estado para renderização visual
  const [render, setRender] = useState(gameState.current);
  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [bonusOptions, setBonusOptions] = useState([]);

  // Ref para acessar o estado atual do player dentro do loop sem recriar o loop
  const playerRef = useRef(player);
  useEffect(() => { playerRef.current = player; }, [player]);

  useEffect(() => {
    // 1. Inicializa: Gera de 2 a 7 mobs
    const mobCount = Math.floor(Math.random() * 6) + 2;
    const initialMobs = [];
    let xOffset = 280;
    let mobCounter = 0;

    for (let i = 0; i < mobCount; i++) {
      // Adiciona Mob
      initialMobs.push({
        id: `mob-${i}`,
        type: 'enemy',
        hp: currentTileData?.mobHp || 30,
        maxHp: currentTileData?.mobHp || 30,
        dmg: currentTileData?.mobAtk || 5,
        attack: 0,
        hit: 0,
        x: xOffset,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      });

      xOffset += 100;
      mobCounter++;

      // A cada 3 mobs, adiciona uma caixa de bônus
      if (mobCounter === 3) {
        initialMobs.push({
          id: `bonus-${i}`,
          type: 'bonus',
          hp: 1,
          maxHp: 1,
          x: xOffset,
          color: 'gold'
        });
        xOffset += 80; // Espaço menor para o bônus
        mobCounter = 0;
      }
    }

    // Se o último item for um bônus, adiciona um mob extra (que será o boss)
    if (initialMobs.length > 0 && initialMobs[initialMobs.length - 1].type === 'bonus') {
      initialMobs.push({
        id: `mob-boss`,
        type: 'enemy',
        hp: currentTileData?.mobHp || 30,
        maxHp: currentTileData?.mobHp || 30,
        dmg: currentTileData?.mobAtk || 5,
        attack: 0,
        hit: 0,
        x: xOffset,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      });
    }

    // Define o último mob como Boss
    const lastMob = initialMobs[initialMobs.length - 1];
    if (lastMob && lastMob.type === 'enemy') {
      lastMob.isBoss = true;
      lastMob.hp *= 2; // Boss tem o dobro de vida
      lastMob.maxHp *= 2;
    }

    gameState.current = {
      playerHp: player.attributes.hp,
      playerMaxHp: player.attributes.maxHp,
      playerAttack: 0,
      playerShield: 0,
      tempAttackBonus: 0,
      tempCritBonus: 0,
      playerHit: 0,
      mobs: initialMobs,
      currentMobIndex: 0,
      active: true,
      combat: false,
      paused: false
    };
    setRender({ ...gameState.current });
    setBonusModalOpen(false);

    let reqId;
    const loop = () => {
      const state = gameState.current;
      if (!state.active) return;

      // Se estiver pausado (modal aberto), mantém o loop rodando mas sem atualizar lógica
      if (state.paused) {
        reqId = requestAnimationFrame(loop);
        return;
      }

      let changed = false;
      const activeMob = state.mobs[state.currentMobIndex];

      // Decrementa contadores de hit (efeito visual)
      if (state.playerHit > 0) {
        state.playerHit--;
        changed = true;
      }
      if (activeMob && activeMob.hit > 0) {
        activeMob.hit--;
        changed = true;
      }

      // Se não tem mob ativo, venceu (todos morreram)
      if (!activeMob) {
        state.active = false;
        setRender({ ...state });
        alert("Vitória! Todos os mobs foram derrotados.");
        setPlayer(prev => ({
          ...prev,
          attributes: { ...prev.attributes, hp: prev.attributes.maxHp }
        }));
        return;
      }

      // 2. Lógica de Movimento (Fila)
      // Itera sobre todos os mobs vivos para movê-los
      state.mobs.forEach((mob, index) => {
        if (index < state.currentMobIndex) return; // Mobs mortos ignorados

        // O mob ativo vai até o player. Os outros ficam atrás dele.
        let targetX;
        if (index === state.currentMobIndex) {
          targetX = PLAYER_X + PLAYER_SIZE;
        } else {
          // O mob da frente é o index - 1
          const prevMob = state.mobs[index - 1];
          const prevSize = prevMob.type === 'bonus' ? BONUS_SIZE : (prevMob.isBoss ? BOSS_SIZE : MOB_SIZE);
          targetX = prevMob.x + prevSize + 50;
        }

        if (mob.x > targetX) {
          mob.x -= 2;
          changed = true;
          // Se o mob ativo está andando, não há combate
          if (index === state.currentMobIndex && state.combat) state.combat = false;
        } else {
          // Chegou no alvo
          if (index === state.currentMobIndex && !state.combat) {
            if (mob.type === 'bonus') {
              // Colisão com Bônus
              state.paused = true;

              // Sorteia 3 opções aleatórias
              const shuffled = [...BONUS_POOL].sort(() => 0.5 - Math.random());
              setBonusOptions(shuffled.slice(0, 3));

              setBonusModalOpen(true);
              changed = true;
            } else {
              // Colisão com Inimigo
              state.combat = true;
              changed = true;
            }
          }
        }
      });

      // 3. Lógica de Combate (Apenas com o mob ativo)
      if (state.combat && activeMob && activeMob.type === 'enemy' && activeMob.hp > 0) {
        // Barra de ataque do Player enchendo
        if (state.playerAttack < 100) {
          // Usa o atributo de velocidade do player
          state.playerAttack += playerRef.current.attributes.speed;
          changed = true;
        } else {
          // Player Ataca
          // Cálculo de Dano: Base + Crítico
          const isCrit = Math.random() * 100 < (playerRef.current.attributes.critChance + (state.tempCritBonus || 0));
          // Adiciona o bônus temporário de ataque
          const totalAttack = playerRef.current.attributes.attack + state.tempAttackBonus;
          const damage = isCrit ? totalAttack * 2 : totalAttack;

          activeMob.hp -= damage;
          activeMob.hit = 5; // Pisca branco por 5 frames
          state.playerAttack = 0;
          changed = true;
        }

        // Barra de ataque do Mob enchendo
        if (activeMob.hp > 0) {
          if (activeMob.attack < 100) {
            activeMob.attack += 2; // Velocidade de ataque do mob (Ajustado)
            changed = true;
          } else {
            // Mob Ataca
            // Dano do mob reduzido pela defesa do player (mínimo de 1 de dano)
            const baseDmg = activeMob.dmg || 5;
            let mobDamage = Math.max(1, baseDmg - playerRef.current.attributes.defense);

            // Lógica do Escudo: Absorve dano antes da vida
            if (state.playerShield > 0) {
              const absorb = Math.min(state.playerShield, mobDamage);
              state.playerShield -= absorb;
              mobDamage -= absorb;
            }

            state.playerHp -= mobDamage;
            state.playerHit = 5; // Pisca branco por 5 frames
            activeMob.attack = 0;
            changed = true;
          }
        }
      }

      // 4. Checagem de Morte do Mob Atual
      if (activeMob && activeMob.hp <= 0) {
        activeMob.hp = 0;
        state.currentMobIndex++; // Passa para o próximo da fila
        state.combat = false; // Sai do combate para o próximo andar
        changed = true;

        // --- SISTEMA DE XP E LEVEL UP ---
        if (activeMob.type === 'enemy') {
          const xpGain = (currentTileData?.nivel || 1) * 10;

          // Atualiza o estado global do player
          setPlayer(prev => {
            const attr = { ...prev.attributes };
            attr.xp += xpGain;

            // Persiste o HP atual da batalha (para não curar magicamente ao ganhar XP)
            attr.hp = state.playerHp;

            // Verifica Level Up
            if (attr.xp >= attr.maxXp) {
              attr.xp = attr.xp - attr.maxXp;
              attr.level += 1;
              attr.maxXp = Math.floor(attr.maxXp * 1.2); // Aumenta a dificuldade em 20%

              // Bônus de Atributos
              attr.maxHp += 20;
              attr.hp = attr.maxHp; // Recupera vida total ao upar
              attr.attack += 2;
              attr.defense += 1;

              // Atualiza o estado local da batalha para refletir a cura imediatamente
              state.playerHp = attr.maxHp;
              state.playerMaxHp = attr.maxHp;
              alert(`LEVEL UP! Você alcançou o nível ${attr.level}!`);
            }

            return { ...prev, attributes: attr };
          });
        }
      } else if (state.playerHp <= 0) {
        state.playerHp = 0;
        state.active = false;
        changed = true;
        alert("Derrota! Você morreu.");
        setPlayer(prev => ({
          ...prev,
          attributes: { ...prev.attributes, hp: prev.attributes.maxHp }
        }));
      }

      // Atualiza o React apenas se houve mudanças visuais
      if (changed) {
        setRender({ ...state, mobs: [...state.mobs] });
      }

      if (state.active) {
        reqId = requestAnimationFrame(loop);
      }
    };

    reqId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqId);
  }, [currentTileData]); // Removemos 'player' das dependências para não resetar a batalha ao ganhar XP

  // Função para aplicar o bônus escolhido
  const handleBonusChoice = (option) => {
    const state = gameState.current;

    if (option.type === 'heal') {
      const healAmount = Math.floor(state.playerMaxHp * option.value);
      state.playerHp = Math.min(state.playerHp + healAmount, state.playerMaxHp);
    } else if (option.type === 'shield') {
      state.playerShield += option.value;
    } else if (option.type === 'damage') {
      state.tempAttackBonus += option.value;
    } else if (option.type === 'crit') {
      state.tempCritBonus = (state.tempCritBonus || 0) + option.value;
    }

    state.currentMobIndex++; // Remove a caixa da frente
    state.paused = false; // Despausa o jogo
    setBonusModalOpen(false);
    setRender({ ...state, mobs: [...state.mobs] });
  };

  return (
    <div style={{
      width: '100%',
      height: '300px',
      background: '#222',
      position: 'relative',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '2px solid #444',
      marginTop: '10px'
    }}>
      {/* --- PLAYER --- */}
      <div style={{
        position: 'absolute',
        left: PLAYER_X,
        top: '170px',
        width: PLAYER_SIZE,
        height: PLAYER_SIZE,
        background: render.playerHit > 0 ? 'white' : 'cyan',
        transform: render.playerHit > 0 ? `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)` : 'none',
        boxShadow: '0 0 15px cyan',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontWeight: 'bold',
        color: '#000',
        zIndex: 10
      }}>
        P
        {/* Barra de Carga do Ataque (Player) */}
        {render.combat && (
          <div style={{
            position: 'absolute',
            bottom: '-10px',
            left: 0,
            width: '100%',
            height: '4px',
            background: '#555'
          }}>
            <div style={{
              width: `${render.playerAttack}%`,
              height: '100%',
              background: 'yellow'
            }} />
          </div>
        )}
      </div>
      {/* HP Player */}
      <div style={{
        position: 'absolute',
        left: PLAYER_X,
        top: '145px',
        width: PLAYER_SIZE,
        textAlign: 'center',
        color: 'white',
        fontSize: '12px'
      }}>
        {render.playerHp}/{render.playerMaxHp}
        {/* Visualização do Escudo */}
        {render.playerShield > 0 && (
          <div style={{
            color: '#4da6ff',
            fontWeight: 'bold',
            textShadow: '0 0 5px blue'
          }}>
            Shield: {render.playerShield}
          </div>
        )}
      </div>

      {/* Barra de XP */}
      <div style={{
        position: 'absolute',
        left: PLAYER_X,
        top: '130px',
        width: PLAYER_SIZE,
        height: '4px',
        background: '#333',
        border: '1px solid #555'
      }}>
        <div style={{
          width: `${(player.attributes.xp / player.attributes.maxXp) * 100}%`,
          height: '100%',
          background: 'purple'
        }} />
      </div>

      {/* --- MOBS --- */}
      {render.mobs && render.mobs.map((mob, index) => {
        // Só renderiza se estiver vivo (ou seja, index >= currentMobIndex)
        if (index < render.currentMobIndex) return null;

        const isCurrent = index === render.currentMobIndex;
        const isBonus = mob.type === 'bonus';
        const isBoss = !!mob.isBoss;
        const size = isBonus ? BONUS_SIZE : (isBoss ? BOSS_SIZE : MOB_SIZE);

        return (
          <div key={mob.id}>
            <div style={{
              position: 'absolute',
              left: mob.x,
              top: isBonus ? '190px' : (isBoss ? '140px' : '170px'), // Alinha com o chão (bottom: 80px -> y=220)
              width: size,
              height: size,
              background: mob.hit > 0 ? 'white' : mob.color,
              transform: mob.hit > 0 ? `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)` : 'none',
              boxShadow: `0 0 15px ${mob.color}`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontWeight: 'bold',
              color: '#fff',
              zIndex: isCurrent ? 9 : 8, // Atual na frente
              borderRadius: isBonus ? '4px' : '0'
            }}>
              {isBonus ? '?' : (isBoss ? 'BOSS' : `M${index + 1}`)}

              {/* Barra de Carga do Ataque (Apenas Mob Atual) */}
              {isCurrent && render.combat && !isBonus && (
                <div style={{
                  position: 'absolute',
                  bottom: '-10px',
                  left: 0,
                  width: '100%',
                  height: '4px',
                  background: '#555'
                }}>
                  <div style={{
                    width: `${mob.attack}%`,
                    height: '100%',
                    background: 'orange'
                  }} />
                </div>
              )}
            </div>
            {/* HP Mob */}
            {!isBonus && <div style={{
              position: 'absolute',
              left: mob.x,
              top: isBoss ? '115px' : '145px',
              width: MOB_SIZE,
              textAlign: 'center',
              color: 'white',
              fontSize: '12px'
            }}>
              {mob.hp}/{mob.maxHp}
            </div>}
          </div>
        );
      })}

      {/* Chão */}
      <div style={{
        position: 'absolute',
        bottom: '80px',
        width: '100%',
        height: '2px',
        background: '#666'
      }} />

      {/* MODAL DE BÔNUS (Interno da Arena) */}
      {bonusModalOpen && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.85)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          gap: '10px'
        }}>
          <h3 style={{ fontSize: '20px', textShadow: '0 0 10px black', margin: 0 }}>Escolha um Bônus!</h3>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
            {bonusOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => handleBonusChoice(option)}
                style={{
                  flex: '1 1 80px',
                  maxWidth: '130px',
                  height: '160px',
                  background: '#333',
                  border: `2px solid ${option.color}`,
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '5px',
                  cursor: 'pointer',
                  boxShadow: `0 0 15px ${option.color}40`,
                  transition: 'transform 0.1s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ fontSize: '24px', marginBottom: '5px' }}>
                  {option.type === 'heal' && '❤'}
                  {option.type === 'shield' && '🛡'}
                  {option.type === 'damage' && '⚔'}
                  {option.type === 'crit' && '🎯'}
                </div>
                <div style={{ fontWeight: 'bold', color: option.color, textAlign: 'center', marginBottom: '5px', fontSize: '12px' }}>
                  {option.name}
                </div>
                <div style={{ fontSize: '10px', color: '#ccc', textAlign: 'center', lineHeight: '1.2' }}>
                  {option.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})