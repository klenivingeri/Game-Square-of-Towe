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

              return (
                <div key={`${rarity.id}-${item.id}`} style={{
                  minWidth: '200px',
                  background: '#222',
                  border: `2px solid ${rarity.color}`,
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: `0 0 15px ${rarity.color}20`,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Fundo com brilho sutil da cor da raridade */}
                  <div style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: `radial-gradient(circle, ${rarity.color}10 0%, transparent 70%)`,
                    pointerEvents: 'none'
                  }} />

                  <div style={{ fontSize: '48px', marginBottom: '15px', filter: `drop-shadow(0 0 5px ${rarity.color})`, zIndex: 1 }}>
                    {item.icon}
                  </div>
                  
                  <div style={{ color: rarity.color, fontWeight: 'bold', fontSize: '18px', marginBottom: '5px', textAlign: 'center', zIndex: 1 }}>
                    {item.name}
                  </div>
                  
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px', zIndex: 1 }}>
                    {rarity.name} - {item.type}
                  </div>

                  <div style={{ width: '100%', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '10px', zIndex: 1 }}>
                    {Object.entries(stats).map(([stat, value]) => (
                      <div key={stat} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '14px', borderBottom: '1px solid #333', paddingBottom: '2px' }}>
                        <span style={{ color: '#aaa', textTransform: 'capitalize' }}>{stat}:</span>
                        <span style={{ color: 'white', fontWeight: 'bold' }}>{value > 0 ? '+' : ''}{value}{stat.includes('Chance') || stat.includes('xp') ? '%' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};