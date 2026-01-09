export const Perfil = ({ROWS, currentRow, currentTileData}) => (
  <div style={{ position: 'absolute', top: 20, left: 20, color: 'white', background: 'rgba(0,0,0,0.8)', padding: '10px', borderRadius: '5px', zIndex: 100 }}>
    Andar: {ROWS - currentRow} / {ROWS} <br />
    Nível do Grid: {currentTileData?.nivel}
  </div>
)