import { memo, useState, useEffect, useRef } from 'react';

export const Arena = memo(({ currentTileData, player, setPlayer }) => {
  // Configurações da Arena
  const PLAYER_SIZE = 50;
  const MOB_SIZE = 50;
  const PLAYER_X = 30; // Posição fixa do player
  
  // Estado mutável do jogo (refs para performance no loop)
  const gameState = useRef({
    playerHp: player.attributes.hp,
    playerMaxHp: player.attributes.maxHp,
    playerAttack: 0,
    playerHit: 0,
    mobs: [], // Array de mobs
    currentMobIndex: 0,
    active: true,
    combat: false
  });

  // Estado para renderização visual
  const [render, setRender] = useState(gameState.current);

  useEffect(() => {
    // 1. Inicializa: Gera de 2 a 7 mobs
    const mobCount = Math.floor(Math.random() * 6) + 2; 
    const initialMobs = Array.from({ length: mobCount }).map((_, i) => ({
      id: i,
      hp: (currentTileData?.nivel || 1) * 20,
      maxHp: (currentTileData?.nivel || 1) * 20,
      attack: 0,
      hit: 0,
      x: 280 + (i * 100), // Posiciona em fila
      color: `hsl(${Math.random() * 360}, 70%, 50%)` // Cor aleatória
    }));

    gameState.current = {
      playerHp: player.attributes.hp,
      playerMaxHp: player.attributes.maxHp,
      playerAttack: 0,
      playerHit: 0,
      mobs: initialMobs,
      currentMobIndex: 0,
      active: true,
      combat: false
    };
    setRender({ ...gameState.current });

    let reqId;
    const loop = () => {
      const state = gameState.current;
      if (!state.active) return;

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
             targetX = prevMob.x + MOB_SIZE + 50;
        }

        if (mob.x > targetX) {
          mob.x -= 2;
          changed = true;
          // Se o mob ativo está andando, não há combate
          if (index === state.currentMobIndex && state.combat) state.combat = false;
        } else {
          // Chegou no alvo
          if (index === state.currentMobIndex && !state.combat) {
            state.combat = true;
            changed = true; // Força a renderização para exibir as barras imediatamente
          }
        }
      });

      // 3. Lógica de Combate (Apenas com o mob ativo)
      if (state.combat && activeMob.hp > 0) {
        // Barra de ataque do Player enchendo
        if (state.playerAttack < 100) {
          // Usa o atributo de velocidade do player
          state.playerAttack += player.attributes.speed; 
          changed = true;
        } else {
          // Player Ataca
          // Cálculo de Dano: Base + Crítico
          const isCrit = Math.random() * 100 < player.attributes.critChance;
          const damage = isCrit ? player.attributes.attack * 2 : player.attributes.attack;
          
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
            const mobDamage = Math.max(1, 5 - player.attributes.defense);
            
            state.playerHp -= mobDamage;
            state.playerHit = 5; // Pisca branco por 5 frames
            activeMob.attack = 0;
            changed = true;
          }
        }
      }

      // 4. Checagem de Morte do Mob Atual
      if (activeMob.hp <= 0) {
        activeMob.hp = 0;
        state.currentMobIndex++; // Passa para o próximo da fila
        state.combat = false; // Sai do combate para o próximo andar
        changed = true;
      } else if (state.playerHp <= 0) {
        state.playerHp = 0;
        state.active = false;
        changed = true;
        alert("Derrota! Você morreu.");
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
  }, [currentTileData, player]); // Recarrega se o player mudar (ex: equipar item)

  return (
    <div style={{
      width: '100%',
      height: '250px',
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
        top: '100px',
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
        top: '75px',
        width: PLAYER_SIZE,
        textAlign: 'center',
        color: 'white',
        fontSize: '12px'
      }}>
        {render.playerHp}/{render.playerMaxHp}
      </div>

      {/* Barra de XP */}
      <div style={{
        position: 'absolute',
        left: PLAYER_X,
        top: '60px',
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

        return (
          <div key={mob.id}>
            <div style={{
              position: 'absolute',
              left: mob.x,
              top: '100px',
              width: MOB_SIZE,
              height: MOB_SIZE,
              background: mob.hit > 0 ? 'white' : mob.color,
              transform: mob.hit > 0 ? `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)` : 'none',
              boxShadow: `0 0 15px ${mob.color}`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontWeight: 'bold',
              color: '#fff',
              zIndex: isCurrent ? 9 : 8, // Atual na frente
            }}>
              M{mob.id + 1}
              
              {/* Barra de Carga do Ataque (Apenas Mob Atual) */}
              {isCurrent && render.combat && (
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
            <div style={{
              position: 'absolute',
              left: mob.x,
              top: '75px',
              width: MOB_SIZE,
              textAlign: 'center',
              color: 'white',
              fontSize: '12px'
            }}>
              {mob.hp}/{mob.maxHp}
            </div>
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
    </div>
  )
})