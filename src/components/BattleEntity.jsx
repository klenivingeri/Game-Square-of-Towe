import React, { memo } from 'react';

export const BattleEntity = memo(({
  x, y, size, color,
  hp, maxHp,
  attackProgress, // 0-100
  hit, // > 0 indica que tomou dano
  label,
  classMob,
  isBoss,
  isBonus,
  shield,
  textColor = '#fff',
  zIndex = 10,
  opacity = 1,
  // Props preparadas para futuras animações
  isAttacking = false,
  isMoving = false
}) => {
  // Lógica de animação (Shake ao tomar dano ou Scale ao atacar)
  const transform = hit > 0 
    ? `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)` 
    : (isAttacking ? 'scale(1.1)' : 'none');

  const bgColor = hit > 0 ? 'white' : color;

  return (
    <div style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      background: bgColor,
      transform,
      opacity,
      boxShadow: `0 0 15px ${color}`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontWeight: 'bold',
      color: textColor,
      zIndex: zIndex,
      borderRadius: isBonus ? '4px' : '0',
      transition: 'transform 0.05s'
    }}>
      {label}

      {/* Barra de Carga do Ataque */}
      {attackProgress !== undefined && attackProgress !== null && (
        <div style={{
          position: 'absolute',
          top: 0,
          [label === 'P' ? 'left' : 'right']: '-10px', // Player na esquerda, Mob na direita
          width: '2px',
          height: '100%',
          background: '#222',
          border: '1px solid #555',
          overflow: 'hidden',
          zIndex: -1
        }}>
          <div style={{
            width: '100%',
            height: `${attackProgress}%`,
            background: label === 'P' ? 'yellow' : 'orange',
            position: 'absolute',
            bottom: 0
          }} />
        </div>
      )}
      {classMob && <div style={{ fontSize: '8px' }}>{classMob}</div>}
      {/* Barra de Vida */}
      {!isBonus && (
        <div style={{
          position: 'absolute',
          bottom: '-15px',
          left: 0,
          width: '100%',
          height: '12px',
          background: '#222',
          border: '1px solid #555',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: `${Math.max(0, (hp / maxHp) * 100)}%`,
            height: '100%',
            background: '#e74c3c',
            transition: 'width 0.2s ease-out',
            zIndex: 0
          }} />
          <span style={{
            position: 'relative',
            zIndex: 1,
            fontSize: '9px',
            color: 'white',
            fontWeight: 'bold',
            textShadow: '1px 1px 0 #000'
          }}>
            {Math.ceil(hp)}/{maxHp}
          </span>
          
          {/* Escudo */}
          {shield > 0 && (
             <div style={{
              position: 'absolute',
              left: -10,
              width: '16px',
              height: '16px',
              background: 'silver',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: '2px',
              fontSize: '8px',
              color: 'black',
              zIndex: 2,
              boxShadow: '0 0 5px #3498db'
            }}>
              {Math.floor(shield)}
            </div>
          )}
        </div>
      )}
    </div>
  );
});