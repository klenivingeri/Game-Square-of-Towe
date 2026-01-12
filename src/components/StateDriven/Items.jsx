import React from 'react';

// Definição das Raridades e suas Cores/Multiplicadores
export const RARITIES = [
  { id: 'common', name: 'Comum', color: '#95a5a6', multiplier: 1.0, priceMult: 1 },
  { id: 'uncommon', name: 'Incomum', color: '#2ecc71', multiplier: 1.5, priceMult: 2 },
  { id: 'rare', name: 'Raro', color: '#3498db', multiplier: 2.2, priceMult: 4 },
  { id: 'heroic', name: 'Heroico', color: '#9b59b6', multiplier: 3.2, priceMult: 8 },
  { id: 'legendary', name: 'Lendário', color: '#f1c40f', multiplier: 4.8, priceMult: 16 },
  { id: 'mythic', name: 'Mítico', color: '#e67e22', multiplier: 7.0, priceMult: 32 },
  { id: 'immortal', name: 'Imortal', color: '#e74c3c', multiplier: 10.0, priceMult: 64 },
];

// Definição dos Itens Base (Sempre os mesmos, mudam com a raridade)
export const BASE_ITEMS = [
  // ARMAS (Dano e Crítico)
  { id: 'sword', name: 'Espada Longa', type: 'weapon', icon: '⚔️', baseStats: { attack: null, critChance: null } },
  { id: 'axe', name: 'Machado de Guerra', type: 'weapon', icon: '🪓', baseStats: { attack: null, critChance: null } },

  // ESCUDO (Defesa e Shield)
  { id: 'shield', name: 'Escudo de Carvalho', type: 'shield', icon: '🛡️', baseStats: { defense: null, shield: null } },

  // ARMADURA DE PEITO (Defesa e Shield)
  { id: 'chestplate', name: 'Peitoral de Aço', type: 'chest', icon: '👕', baseStats: { defense: null, shield: null } },

  // PARTES DA ARMADURA (Apenas Shield)
  { id: 'helmet', name: 'Elmo de Ferro', type: 'head', icon: '🪖', baseStats: { shield: null } },
  { id: 'gloves', name: 'Luvas de Couro', type: 'arms', icon: '🧤', baseStats: { shield: null } },
  { id: 'pants', name: 'Calças Reforçadas', type: 'pants', icon: '👖', baseStats: { shield: null } },
  { id: 'boots', name: 'Botas de Viajante', type: 'boots', icon: '👢', baseStats: { shield: null } },

  // ACESSÓRIOS (Atributos mistos/utilitários) podem receber qualquer atributo
  { id: 'ring', name: 'Anel do Poder', type: 'accessory', icon: '💍', baseStats: {} },
  { id: 'amulet', name: 'Amuleto Antigo', type: 'accessory', icon: '🧿', baseStats: {} },
];

// Definição dos Itens Consumíveis
export const BASE_CONSUMABLES = [
  { id: 'potion_heal', name: 'Poção de Vida', type: 'heal', icon: '❤', baseStats: { heal: 50 } },
  { id: 'potion_shield', name: 'Poção de Escudo', type: 'shield', icon: '🛡️', baseStats: { shield: 50 } },
  { id: 'potion_crit', name: 'Poção de Crítico', type: 'crit', icon: '🎯', baseStats: { crit: 15 } },
  { id: 'potion_damage', name: 'Poção de Dano', type: 'damage', icon: '⚔️', baseStats: { damage: 10 } },
];

// Array de atributos possíveis para sorteio
export const ATTRIBUTES_POOL = ['hp', 'attack', 'defense', 'shield', 'critChance'];

// Função para adicionar 1 ou 2 atributos aleatórios aos stats do item
export const addRandomStats = (stats, multiplier = 1, count = null, item = null) => {
  const newStats = { ...stats };

  // Para itens com atributos pré-definidos em baseStats (ex: armas, armaduras)
  if (item && Object.keys(item.baseStats).length > 0) {
    const attributes = Object.keys(item.baseStats);
    for (const attr of attributes) {
      const value = Math.ceil((Math.floor(Math.random() * 5) + 1) * multiplier);
      newStats[attr] = (newStats[attr] || 0) + value;
    }
  }
  // Para itens que podem ter atributos aleatórios (ex: acessórios)
  else {
    const finalCount = count !== null ? count : (Math.random() < 0.2 ? 2 : 1);
    const pool = [...ATTRIBUTES_POOL]; // Clona o array para poder modificar

    for (let i = 0; i < finalCount; i++) {
      if (pool.length === 0) break;

      // Escolhe um atributo aleatório do pool
      const attrIndex = Math.floor(Math.random() * pool.length);
      const attr = pool[attrIndex];

      // Remove o atributo do pool para não ser escolhido novamente
      pool.splice(attrIndex, 1);

      const value = Math.ceil((Math.floor(Math.random() * 5) + 1) * multiplier);
      newStats[attr] = (newStats[attr] || 0) + value;
    }
  }

  return newStats;
};

export const ItemCard = ({ item, style, onClick, children }) => {
  const { rarity, stats } = item;
  
  // Garante que sempre haja pelo menos 2 linhas de atributos para manter o tamanho do card consistente
  const statEntries = stats ? Object.entries(stats) : [];
  const displayStats = [...statEntries];
  while (displayStats.length < 2) {
    displayStats.push([`empty-${displayStats.length}`, null]);
  }

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
      boxShadow: `0 0 15px ${rarity?.color || '#444'}60`,
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
        background: `radial-gradient(circle, ${rarity?.color || '#444'}30 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />

      {item.stars && (
        <div style={{
          position: 'absolute',
          top: '5px',
          left: '5px',
          color: '#f1c40f',
          fontSize: '10px',
          zIndex: 2,
          textShadow: '0 0 2px black'
        }}>
          {item.stars}
        </div>
      )}

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
        {displayStats.map(([stat, value]) => (
          <div key={stat} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '11px', borderBottom: '1px solid #333', minHeight: '17px' }}>
            {value !== null ? (
              <>
                <span style={{ color: '#aaa', textTransform: 'capitalize' }}>{stat}:</span>
                <span style={{ color: 'white', fontWeight: 'bold' }}>{value > 0 ? '+' : ''}{value}{stat.includes('Chance') || stat.includes('xp') ? '%' : ''}</span>
              </>
            ) : (
              <span>&nbsp;</span>
            )}
          </div>
        ))}
      </div>
      {children}
    </div>
  );
};

const generateUniqueId = () => {
  return `item_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
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
            {BASE_ITEMS.map(baseItem => {
              // Inicializa os stats como um objeto vazio
              let stats = {};

              // Adiciona atributos aleatórios com base no item
              stats = addRandomStats(stats, rarity.multiplier, null, baseItem);

              const item = {
                ...baseItem,
                instanceId: generateUniqueId(), // Adiciona um ID de instância único
                rarity,
                stats
              };

              return <ItemCard key={item.instanceId} item={item} />;
            })}
            
            {BASE_CONSUMABLES.map(baseItem => {
              const stats = Object.entries(baseItem.baseStats).reduce((acc, [key, val]) => {
                acc[key] = Math.ceil(val * rarity.multiplier);
                return acc;
              }, {});

              const item = {
                ...baseItem,
                instanceId: generateUniqueId(),
                rarity,
                stats
              }

              return <ItemCard key={item.instanceId} item={item} />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
};