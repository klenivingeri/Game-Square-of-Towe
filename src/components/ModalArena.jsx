import { memo } from 'react';

export const ModalArena = memo(({ isOpen, onClose, children, notCloseBg = false, showX = false, disableBackgroundClose }) => {
  const onClosebg = notCloseBg ? () => { } : onClose;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 40,
        }}
        onClick={disableBackgroundClose ? () => { } : onClosebg}
      />

      {/* Modal Container */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none', // Permite clicar no overlay atrás se necessário
          paddingBottom: '5rem', // Simula o mb-20 original para subir o modal visualmente
        }}
      >
        {/* Modal Content */}
        <div
          style={{
            backgroundColor: 'var(--bg-component, #2d3748)', // Fallback para cinza escuro
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            borderRadius: '0.5rem',
            width: '95%',
            maxWidth: '700px',
            pointerEvents: 'auto',
            color: 'white',
            padding: '1rem',
          }}
        >
          {children}

          {showX && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                bottom: '-3rem',
                transform: 'translateX(-50%)',
                cursor: 'pointer',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.2rem',
              }}
              onClick={onClose}
            >
              x
            </div>
          )}
        </div>
      </div>
    </>
  );
});