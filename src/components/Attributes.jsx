import React from 'react';

export const Attributes = ({ attributes, diff }) => {
  if (!attributes) return null;

  const renderDiff = (key) => {
    if (!diff || !diff[key]) return null;
    const val = diff[key];
    const color = val > 0 ? '#2ecc71' : '#e74c3c';
    return <span style={{ color, marginLeft: '4px', fontSize: '10px' }}>({val > 0 ? '+' : ''}{val})</span>;
  };

  const stats = [
    { label: 'Nível', value: attributes.level, key: 'level' },
    { label: 'XP', value: `${attributes.xp} / ${attributes.maxXp}`, key: 'xp' },
    { label: 'Vida', value: `${attributes.hp} / ${attributes.maxHp}`, key: 'maxHp' },
    { label: 'Ataque', value: attributes.attack, key: 'attack' },
    { label: 'Defesa', value: attributes.defense, key: 'defense' },
    { label: 'Velocidade', value: attributes.speed, key: 'speed' },
    { label: 'Crítico', value: `${attributes.critChance}%`, key: 'critChance' },
    { label: 'Escudo', value: `${attributes.shield}`, key: 'shield' },
  ];

  return (
    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '8px', marginBottom: '5px' }}>
      <h3 style={{ borderBottom: '1px solid #555', paddingBottom: '2px', marginTop: 0, marginBottom: '5px', color: 'cyan', fontSize: '14px' }}>Atributos</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '12px' }}>
        {stats.map((stat, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2px' }}>
            <span style={{ color: '#aaa' }}>{stat.label}:</span>
            <span style={{ fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '3px' }}>{renderDiff(stat.key)} {stat.value} </span>
          </div>
        ))}
      </div>
    </div>
  );
};