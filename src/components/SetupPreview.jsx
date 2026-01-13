import React from 'react';

export const SetupPreview = ({ enemyPreview = [], previewEnemy, setPreviewEnemy }) => {
  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* Grid de Cards */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {enemyPreview.length > 0 ? enemyPreview.map((m, idx) => (
          <div
            key={m.id || idx}
            onClick={() => setPreviewEnemy(m)}
            title={`Classe: ${m.mobClassName || m.label} • Raridade: ${m.rarityName || m.rarityId || 'Desconhecida'}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '74px',
              padding: '8px',
              background: '#111',
              borderRadius: '8px',
              border: previewEnemy?.id === m.id ? `2px solid ${m.borderColor || '#fff'}` : `1px solid ${m.borderColor || m.color || '#333'}`,
              boxShadow: previewEnemy?.id === m.id ? `0 0 15px ${m.borderColor || m.color || '#fff'}50` : 'none',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontSize: '26px', filter: `drop-shadow(0 0 6px ${m.borderColor || m.color || '#000'})` }}>{m.icon || '👾'}</div>
            <div style={{ fontSize: '11px', color: '#aaa', textAlign: 'center', marginTop: '6px' }}>{m.mobClassName || m.label}</div>
            <div style={{ fontSize: '11px', color: '#fff', marginTop: '4px' }}>{m.rarityName || m.rarityId || ''}</div>
            <div style={{ fontSize: '10px', color: '#bbb', marginTop: '6px' }}>
              <span style={{ marginRight: '6px' }}>HP: <strong style={{ color: 'white' }}>{m.hp}</strong></span>
              <span>DMG: <strong style={{ color: 'white' }}>{m.dmg}</strong></span>
            </div>
          </div>
        )) : <div style={{ color: '#666' }}>Carregando inimigos...</div>}
      </div>

      {/* Painel de Detalhes (quando um mob está selecionado) */}
      <div style={{ minWidth: '220px', maxWidth: '260px', background: '#0f1113', border: '1px solid #222', borderRadius: '8px', padding: '10px', display: previewEnemy ? 'block' : 'none' }}>
        {previewEnemy && (
          <div style={{ color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '32px' }}>{previewEnemy.icon}</div>
              <div>
                <div style={{ fontSize: '14px', color: previewEnemy.borderColor || previewEnemy.color || 'white', fontWeight: 'bold' }}>{previewEnemy.mobClassName || previewEnemy.label}</div>
                <div style={{ fontSize: '12px', color: '#ccc' }}>{previewEnemy.rarityName || previewEnemy.rarityId || ''} • {previewEnemy.category || ''}</div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #222', margin: '10px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ddd', fontSize: '13px' }}>
              <div>HP</div>
              <div style={{ fontWeight: 'bold', color: 'white' }}>{previewEnemy.hp}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ddd', fontSize: '13px' }}>
              <div>DMG</div>
              <div style={{ fontWeight: 'bold', color: 'white' }}>{previewEnemy.dmg}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ddd', fontSize: '13px' }}>
              <div>Shield</div>
              <div style={{ fontWeight: 'bold', color: 'white' }}>{previewEnemy.shield || 0}</div>
            </div>

            {previewEnemy.isBoss && <div style={{ marginTop: '8px', padding: '6px', background: '#111', borderRadius: '6px', textAlign: 'center', color: '#f1c40f', fontWeight: 'bold' }}>BOSS</div>}

            <div style={{ marginTop: '8px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button onClick={() => setPreviewEnemy(null)} style={{ padding: '6px 10px', borderRadius: '6px', background: '#7f8c8d', border: 'none', color: 'white', cursor: 'pointer' }}>Fechar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
