import { memo, useState } from 'react';
import { ModalArena } from './ModalArena';
import { Inventory } from './Inventory';
import { Shop } from './Shop';
import { Quest } from './Quest';
import { Attributes } from './Attributes';

const icons = {
  menu: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
    </svg>
  ),
  close: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
    </svg>
  ),
  inventory: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 6h-3V4c0-1.11-.89-2-2-2H9c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2v2H9V4h6zM8 8h12v5H8V8zm0 12v-5h12v5H8z" />
    </svg>
  ),
  shop: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  ),
  achievements: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1l0 2.5c0 2.5 2 4.5 4.5 4.5H9c.5 0 1-.5 1-1s-.5-1-1-1H7.5c-1.4 0-2.5-1.1-2.5-2.5V8h2v3h2V8h6v3h2V8h2v1.5c0 1.4-1.1 2.5-2.5 2.5H15c-.5 0-1 .5-1 1s.5 1 1 1h1.5c2.5 0 4.5-2 4.5-4.5V8c0-1.1-.9-2-2-2zM8 17h8v2H8z" />
    </svg>
  ),
  attributes: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
    </svg>
  )
};

export const Nav = memo(({ player, setPlayer, money, gems, setStats, activeModal, setActiveModal }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenModal = (modalName) => {
    setActiveModal(modalName);
  };
  console.log('Rendering Attributes with:');
  const handleCloseModal = () => setActiveModal(null);

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      right: 20,
      zIndex: 30,
      display: 'flex',
      justifyContent: 'flex-end', // Garante que o menu cresça para a esquerda
      alignItems: 'center'
    }}>
      <style>{`
        @keyframes slideLeft {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'cyan',
            border: '1px solid cyan',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 0 15px cyan',
            fontSize: '16px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
        {icons.menu}
        </button>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.9)',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid #444',
          gap: '8px',
          animation: 'slideLeft 0.3s ease-out',
          boxShadow: '0 5px 15px rgba(0,0,0,0.5)'
        }}>
          {/* Seta para encolher (Lado Esquerdo) */}
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'cyan',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0 10px',
              display: 'flex',
              alignItems: 'center',
              height: '100%'
            }}
            title="Fechar Menu"
          >
            {icons.close}
          </button>

          {/* Botões do Menu */}
          
          <NavBtn icon={icons.shop} label="Loja" onClick={() => handleOpenModal('shop')} />
          <NavBtn icon={icons.achievements} label="Missões" onClick={() => handleOpenModal('quest')} />
          <NavBtn icon={icons.attributes} label="Atributos" onClick={() => handleOpenModal('attributes')} />
          <NavBtn icon={icons.inventory} label="Inventário" onClick={() => handleOpenModal('inventory')} />
        </div>
      )}

      {/* Modal Reutilizável */}
      <ModalArena isOpen={!!activeModal} onClose={handleCloseModal} showX={true}>
        {activeModal === 'inventory' && (
          <Inventory player={player} setPlayer={setPlayer} gems={gems} setStats={setStats} />
        )}
        {activeModal === 'shop' && (
          <Shop money={money} gems={gems} player={player} setPlayer={setPlayer} setStats={setStats} />
        )}
        {activeModal === 'quest' && (
          <Quest />
        )}
        {activeModal === 'attributes' && (
          <Attributes attributes={player.attributes} />
        )}
      </ModalArena>
    </div>
  );
});

const NavBtn = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid #555',
      borderRadius: '6px',
      color: '#eee',
      width: '45px',
      height: '40px',
      cursor: 'pointer',
      fontSize: '8px',
      transition: 'all 0.2s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'rgba(0, 255, 255, 0.1)';
      e.currentTarget.style.borderColor = 'cyan';
      e.currentTarget.style.color = 'cyan';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
      e.currentTarget.style.borderColor = '#555';
      e.currentTarget.style.color = '#eee';
    }}
  >
    <div style={{ marginBottom: '4px', display: 'flex' }}>{icon}</div>
    {label}
  </button>
);