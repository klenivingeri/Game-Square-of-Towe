import { memo } from 'react';

export const Perfil = memo(({ ROWS, currentRow, currentTileData, player, money, gems }) => (
  <div style={{ position: 'absolute', top: 20, left: 20, color: 'white', background: 'rgba(0,0,0,0.8)', padding: '10px', borderRadius: '5px', zIndex: 100, fontSize: '14px', lineHeight: '1.5' }}>
    <div><strong>Andar:</strong> {ROWS - currentRow} / {ROWS}</div>
    <div><strong>Nível do Grid:</strong> {currentTileData?.nivel || 1}</div>
    {player && (
      <div style={{ marginTop: '10px', borderTop: '1px solid #555', paddingTop: '5px' }}>
        <div><strong>Nível:</strong> {player.attributes.level}</div>
        <div><strong>XP:</strong> {player.attributes.xp} / {player.attributes.maxXp}</div>
        <div><strong>Ouro:</strong> {money}</div>
        <div><strong>Joias:</strong> {gems || 0}</div>
      </div>
    )}
  </div>
))