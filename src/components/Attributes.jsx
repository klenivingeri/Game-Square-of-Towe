import React from 'react';

export const Attributes = ({ attributes }) => {
  if (!attributes) return null;

  const stats = [
    { label: 'Nível', value: attributes.level },
    { label: 'XP', value: `${attributes.xp} / ${attributes.maxXp}` },
    { label: 'Vida', value: `${attributes.hp} / ${attributes.maxHp}` },
    { label: 'Ataque', value: attributes.attack },
    { label: 'Defesa', value: attributes.defense },
    { label: 'Velocidade', value: attributes.speed },
    { label: 'Crítico', value: `${attributes.critChance}%` },
    { label: 'Escudo', value: `${attributes.shield}` },
  ];

  return (
    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '8px', marginBottom: '5px' }}>
      <h3 style={{ borderBottom: '1px solid #555', paddingBottom: '2px', marginTop: 0, marginBottom: '5px', color: 'cyan', fontSize: '14px' }}>Atributos</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '12px' }}>
        {stats.map((stat, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2px' }}>
            <span style={{ color: '#aaa' }}>{stat.label}:</span>
            <span style={{ fontWeight: 'bold', color: 'white' }}>{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};