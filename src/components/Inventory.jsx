import React, { useState } from 'react';
import { Attributes } from './Attributes';

export const Inventory = ({ player, setPlayer }) => {
  const { attributes, equipment } = player;
  const [tab, setTab] = useState('items'); // 'items' or 'cosmetics'
  
  // Gera 20 slots vazios para exemplo
  const slots = Array.from({ length: 20 });

  const equipmentSlots = [
    { id: 'head', icon: '🧢' },
    { id: 'chest', icon: '👕' },
    { id: 'arms', icon: '🧤' },
    { id: 'pants', icon: '👖' },
    { id: 'boots', icon: '👢' },
    { id: 'weapon', icon: '⚔️' },
    { id: 'shield', icon: '🛡️' }
  ];

  return (
    <div style={{ display: 'flex', gap: '5px', height: '100%', overflowY: 'auto', paddingRight: '2px', flexWrap: 'wrap', alignContent: 'flex-start' }}>
      
      {/* Coluna Esquerda: Equipamentos e Atributos */}
      <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        
        {/* Equipamentos */}
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '8px' }}>
          <h3 style={{ borderBottom: '1px solid #555', paddingBottom: '2px', marginTop: 0, marginBottom: '5px', color: 'orange', fontSize: '14px' }}>Equipamentos</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
            {equipmentSlots.map((slot) => (
              <div key={slot.id} style={{
                width: '45px', height: '45px', 
                border: '2px dashed #555',
                borderRadius: '8px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: equipment[slot.id] ? '#2d3748' : 'rgba(0,0,0,0.2)',
                cursor: 'pointer'
              }}>
                <div style={{ fontSize: '18px' }}>{slot.icon}</div>
                <div style={{ fontSize: '8px', color: '#888', textTransform: 'capitalize' }}>{slot.id}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Atributos */}
        <Attributes attributes={attributes} />
      </div>

      {/* Coluna Direita: Inventário (Bag) */}
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '8px', flex: '1 1 150px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
          <button 
            onClick={() => setTab('items')}
            style={{ flex: 1, padding: '6px', fontSize: '12px', background: tab === 'items' ? '#4a5568' : '#2d3748', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
            Itens
          </button>
          <button 
            onClick={() => setTab('cosmetics')}
            style={{ flex: 1, padding: '6px', fontSize: '12px', background: tab === 'cosmetics' ? '#4a5568' : '#2d3748', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
            Cosméticos
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(35px, 1fr))', gap: '4px', overflowY: 'auto' }}>
          {slots.map((_, i) => (
            <div key={i} style={{ aspectRatio: '1/1', background: 'rgba(255,255,255,0.05)', border: '1px solid #444', borderRadius: '4px' }}></div>
          ))}
        </div>
      </div>
    </div>
  );
};