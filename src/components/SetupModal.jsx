import React from 'react';
import { SetupPreview } from './SetupPreview';

export const SetupModal = ({
  consumables,
  selectedItemIds,
  setupFocusIndex,
  toggleItemSelection,
  removeFicha,
  handleCloseArena,
  upcomingMobs,
  previewEnemy,
  setPreviewEnemy,
  selectedCount
}) => {
  const enemyPreview = (upcomingMobs || []).filter(m => m.type === 'enemy');
  const mobCount = enemyPreview.length;
  const rarityCounts = enemyPreview.reduce((acc, m) => {
    const key = m.rarityName || m.rarityId || 'Desconhecido';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ textAlign: 'center', padding: '10px', position: 'relative' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <strong style={{ color: 'cyan' }}>INIMIGOS:</strong> <span style={{ fontWeight: 'bold', color: 'white' }}>{mobCount}</span>
            {Object.entries(rarityCounts).map(([name, count]) => {
              const example = enemyPreview.find(m => (m.rarityName === name) || (m.rarityId === name));
              const color = example?.borderColor || example?.color || '#888';
              return (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#111', padding: '4px 8px', borderRadius: '12px', border: '1px solid #222' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 6, background: color }} />
                  <span style={{ fontSize: '12px', color: '#ddd' }}>{name}</span>
                </div>
              );
            })}
          </div>
      <p style={{ color: '#ccc', fontSize: '14px' }}>
        Selecione até 2 itens para a batalha <span style={{ color: 'white', fontWeight: 'bold' }}>({selectedCount}/2 selecionados)</span>:
      </p>

      {/* Detalhes e Preview de Inimigos */}
      {enemyPreview && enemyPreview.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '10px', marginBottom: '10px', flexDirection: 'column', alignItems: 'center' }}>
          {/*
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {Object.entries(rarityCounts).map(([name, count]) => {
              const example = enemyPreview.find(m => (m.rarityName === name) || (m.rarityId === name));
              const color = example?.borderColor || example?.color || '#888';
              return (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#111', padding: '4px 8px', borderRadius: '12px', border: '1px solid #222' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 6, background: color }} />
                  <span style={{ fontSize: '12px', color: '#ddd' }}>{name} <strong style={{ color: 'white', marginLeft: '6px' }}>{count}</strong></span>
                </div>
              );
            })}
          </div>
          <SetupPreview
            enemyPreview={enemyPreview}
            previewEnemy={previewEnemy}
            setPreviewEnemy={setPreviewEnemy}
          />*/}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', margin: '20px 0', minHeight: '60px' }}>
        {consumables.length > 0 ? consumables.map((item, index) => {
          const isSelected = selectedItemIds.includes(item.id);
          const isFocused = setupFocusIndex === index;
          return (
            <div
              key={item.id}
              onClick={() => toggleItemSelection(item.id)}
              style={{
                width: '50px', height: '50px',
                border: isSelected ? '2px solid cyan' : (isFocused ? '2px solid white' : `1px solid ${item.color}`),
                borderRadius: '8px',
                background: isSelected ? 'rgba(0, 255, 255, 0.2)' : 'rgba(0,0,0,0.3)',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                fontSize: '24px', cursor: 'pointer',
                boxShadow: isFocused ? '0 0 15px rgba(255,255,255,0.5)' : 'none',
                position: 'relative'
              }}
            >
              {item.icon}
              {isSelected && <div style={{ position: 'absolute', top: -5, right: -5, background: 'cyan', width: '15px', height: '15px', borderRadius: '50%', border: '1px solid black' }} />}
            </div>
          );
        }) : <span style={{ color: '#666' }}>Nenhum item consumível.</span>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '30px' }}>
        <button
          onClick={() => removeFicha()}
          style={{
            padding: '10px 40px',
            background: '#e74c3c', color: 'white',
            borderRadius: '5px', fontSize: '18px', cursor: 'pointer',
            boxShadow: '0 0 10px #c0392b',
            zIndex: 10
          }}>
          ENTRAR NA DUNGEON!
        </button>
        <button
          onClick={handleCloseArena}
          style={{
            padding: '10px 20px',
            background: '#7f8c8d', color: 'white',
            border: 'none',
            borderRadius: '5px', fontSize: '18px', cursor: 'pointer',
            boxShadow: '0 0 10px #7f8c8d'
          }}>
          RECUAR(-1 FICHA)
        </button>
      </div>

      {/* Slots de Consumíveis (Lado Direito) */}
      <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[0, 1].map(slotIndex => {
          const itemId = selectedItemIds[slotIndex];
          const selectedItem = itemId ? consumables.find(i => i.id === itemId) : null;

          const item = selectedItem || {
            name: 'Poção de Vida',
            icon: '❤',
            value: 25,
            color: '#e74c3c',
            isDefault: true
          };

          return (
            <div key={slotIndex} style={{
              width: '50px', height: '50px',
              border: selectedItem ? '1px solid #fff' : '1px dashed #555',
              borderRadius: '8px',
              background: 'rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
              position: 'relative',
              opacity: selectedItem ? 1 : 0.8
            }}>
              <>
                <div style={{ fontSize: '20px' }}>{item.icon}</div>
                <div style={{ fontSize: '10px', color: 'white', fontWeight: 'bold', position: 'absolute', bottom: '2px', right: '2px', textShadow: '0 0 2px black' }}>
                  {item.value || (item.stats ? Object.values(item.stats)[0] : '?')}
                </div>
                {item.isDefault && <div style={{ position: 'absolute', top: -2, right: -2, width: '6px', height: '6px', background: '#e74c3c', borderRadius: '50%' }} />}
              </>
            </div>
          );
        })}
      </div>
    </div>
  );
};
