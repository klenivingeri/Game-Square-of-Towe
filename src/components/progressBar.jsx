import { memo } from 'react';

export const ProgressBar = memo(({ progressBarRef }) => (
  <div
    style={{
      position: "absolute",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      width: "40vw",
      height: "12px",
      background: "rgba(255,255,255,0.1)",
      borderRadius: "10px",
      border: "2px solid rgba(255,255,255,0.3)",
      zIndex: 30,
    }}
  >
    <div
      ref={progressBarRef}
      style={{
        width: "0%",
        height: "100%",
        borderRadius: "8px", // Arredonda a barra interna para ficar bonito ao pular
        background: "cyan",
        boxShadow: "0 0 10px cyan",
      }}
    />
  </div>
));
