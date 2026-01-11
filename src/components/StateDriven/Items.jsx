import React from 'react';

// Definição das Raridades e suas Cores/Multiplicadores
export const RARITIES = [
  { id: 'common', name: 'Comum', color: '#95a5a6', multiplier: 1 },       // Cinza
  { id: 'uncommon', name: 'Incomum', color: '#2ecc71', multiplier: 1.5 }, // Verde
  { id: 'rare', name: 'Raro', color: '#3498db', multiplier: 2 },          // Azul
  { id: 'heroic', name: 'Heroico', color: '#9b59b6', multiplier: 3 },     // Roxo
  { id: 'legendary', name: 'Lendário', color: '#f1c40f', multiplier: 5 }, // Amarelo
  { id: 'mythic', name: 'Mítico', color: '#e67e22', multiplier: 8 },      // Laranja
  { id: 'immortal', name: 'Imortal', color: '#e74c3c', multiplier: 12 },  // Vermelho
];

// Definição dos Itens Base (Sempre os mesmos, mudam com a raridade)
export const BASE_ITEMS = [
  { id: 'sword', name: 'Espada Longa', type: 'weapon', icon: '⚔️', baseStats: { attack: 5 } },
  { id: 'axe', name: 'Machado de Guerra', type: 'weapon', icon: '🪓', baseStats: { attack: 7, speed: -1 } },
  { id: 'shield', name: 'Escudo de Carvalho', type: 'shield', icon: '🛡️', baseStats: { defense: 3, shield: 5 } },
  { id: 'helmet', name: 'Elmo de Ferro', type: 'head', icon: '🪖', baseStats: { hp: 10, defense: 1 } },
  { id: 'chestplate', name: 'Peitoral de Aço', type: 'chest', icon: '👕', baseStats: { hp: 25, defense: 3 } },
  { id: 'gloves', name: 'Luvas de Couro', type: 'arms', icon: '🧤', baseStats: { attack: 1, critChance: 2 } },
  { id: 'pants', name: 'Calças Reforçadas', type: 'pants', icon: '👖', baseStats: { hp: 15, defense: 2 } },
  { id: 'boots', name: 'Botas de Viajante', type: 'boots', icon: '👢', baseStats: { speed: 2, defense: 1 } },
  { id: 'ring', name: 'Anel do Poder', type: 'accessory', icon: '💍', baseStats: { critChance: 5 } },
  { id: 'amulet', name: 'Amuleto Antigo', type: 'accessory', icon: '🧿', baseStats: { maxHp: 20, xp: 5 } },
];

// Definição dos Itens Consumíveis
export const BASE_CONSUMABLES = [
  { id: 'potion_heal', name: 'Poção de Vida', type: 'heal', icon: '❤', baseStats: { heal: 50 } },
  { id: 'potion_shield', name: 'Poção de Escudo', type: 'shield', icon: '🛡️', baseStats: { shield: 50 } },
  { id: 'potion_crit', name: 'Poção de Crítico', type: 'crit', icon: '🎯', baseStats: { crit: 15 } },
  { id: 'potion_speed', name: 'Poção de Velocidade', type: 'speed', icon: '⚡', baseStats: { speed: 5 } },
  { id: 'potion_damage', name: 'Poção de Dano', type: 'damage', icon: '⚔️', baseStats: { damage: 10 } },
];

export const ItemCard = ({ item, style, onClick, children }) => {
  const { rarity, stats } = item;
  
  return (
    <div onClick={onClick} style={{
      minWidth: '140px',
      background: '#222',
      border: `2px solid ${rarity?.color || '#444'}`,
      borderRadius: '8px',
      padding: '10px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: `0 0 10px ${rarity?.color || '#444'}20`,
      position: 'relative',
      overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }}>
      {/* Fundo com brilho sutil da cor da raridade */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: `radial-gradient(circle, ${rarity?.color || '#444'}10 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />

      <div style={{ fontSize: '32px', marginBottom: '5px', filter: `drop-shadow(0 0 5px ${rarity?.color || '#444'})`, zIndex: 1 }}>
        {item.icon}
      </div>
      
      <div style={{ color: rarity?.color || 'white', fontWeight: 'bold', fontSize: '14px', marginBottom: '2px', textAlign: 'center', zIndex: 1 }}>
        {item.name}
      </div>
      
      <div style={{ fontSize: '10px', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', zIndex: 1 }}>
        {rarity?.name} - {item.type}
      </div>

      <div style={{ width: '100%', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', padding: '5px', marginBottom: '10px', flex: 1, zIndex: 1 }}>
        {stats && Object.entries(stats).map(([stat, value]) => (
          <div key={stat} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '11px', borderBottom: '1px solid #333' }}>
            <span style={{ color: '#aaa', textTransform: 'capitalize' }}>{stat}:</span>
            <span style={{ color: 'white', fontWeight: 'bold' }}>{value > 0 ? '+' : ''}{value}{stat.includes('Chance') || stat.includes('xp') ? '%' : ''}</span>
          </div>
        ))}
      </div>
      {children}
    </div>
  );
};

export const Items = () => {
  return (
    <div style={{ padding: '20px', background: '#1a1a1a', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: 'cyan', textShadow: '0 0 10px cyan' }}>
        Catálogo de Itens (Test Drive)
      </h1>
      
      {RARITIES.map(rarity => (
        <div key={rarity.id} style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            color: rarity.color, 
            borderBottom: `2px solid ${rarity.color}`, 
            paddingBottom: '10px',
            textShadow: `0 0 10px ${rarity.color}`
          }}>
            {rarity.name} <span style={{ fontSize: '0.6em', color: '#888' }}>(Multiplicador: x{rarity.multiplier})</span>
          </h2>
          
          <div style={{ 
            display: 'flex', 
            overflowX: 'auto',
            gap: '20px',
            marginTop: '20px',
            paddingBottom: '15px'
          }}>
            {BASE_ITEMS.map(item => {
              // Calcula os atributos baseados na raridade
              const stats = Object.entries(item.baseStats).reduce((acc, [key, val]) => {
                // Arredonda para cima para evitar números quebrados e garantir progressão
                acc[key] = Math.ceil(val * rarity.multiplier);
                return acc;
              }, {});

              return <ItemCard key={`${rarity.id}-${item.id}`} item={{ ...item, rarity, stats }} />;
            })}
            
            {BASE_CONSUMABLES.map(item => {
              const stats = Object.entries(item.baseStats).reduce((acc, [key, val]) => {
                acc[key] = Math.ceil(val * rarity.multiplier);
                return acc;
              }, {});

              return <ItemCard key={`${rarity.id}-${item.id}`} item={{ ...item, rarity, stats }} />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
};