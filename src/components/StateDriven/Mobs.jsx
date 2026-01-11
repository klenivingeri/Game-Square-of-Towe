import React from 'react';
import { BattleEntity } from '../BattleEntity';
import { SIZES, RARITIES_MOBS as RM, COLORS_MOBS as CM } from '../../data/enemies';

export const RARITIES_MOBS = RM;
export const COLORS_MOBS = CM;

export const MOBS_SIZES = {
  PLAYER: SIZES.PLAYER,
  MOB_COMUM: SIZES.MOB,
  MOB_ELITE: SIZES.ELITE,
  MOB_BOSS: SIZES.BOSS,
  BONUS: SIZES.BONUS
};

export const MobsGallery = () => {
  const colorsList = Object.values(COLORS_MOBS);
  const mobTypes = [
    { label: 'Comum', size: MOBS_SIZES.MOB_COMUM, isBoss: false },
    { label: 'Elite', size: MOBS_SIZES.MOB_ELITE, isBoss: false },
    { label: 'Boss', size: MOBS_SIZES.MOB_BOSS, isBoss: true }
  ];

  return (
    <div style={{ padding: '20px', background: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: 'cyan' }}>Galeria de Mobs</h1>
      
      {mobTypes.map((type) => (
        <div key={type.label} style={{ marginBottom: '60px' }}>
          <h2 style={{ color: 'white', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
            Categoria: {type.label}
          </h2>

          <div style={{ position: 'relative', height: `${RARITIES_MOBS.length * 100}px`, marginTop: '20px' }}>
            {RARITIES_MOBS.map((rarity, rowIndex) => {
              const yPos = rowIndex * 100;
              
              return (
                <React.Fragment key={rarity.id}>
                  {/* Label da Raridade (Borda) */}
                  <div style={{ position: 'absolute', left: 0, top: yPos + 20, width: '100px', color: rarity.borderColor, fontWeight: 'bold' }}>
                    {rarity.name}
                  </div>

                  {/* Mobs com as cores de fundo */}
                  {colorsList.map((bgColor, colIndex) => (
                    <BattleEntity
                      key={`${rarity.id}-${colIndex}`}
                      x={120 + (colIndex * 90)}
                      y={yPos + 50 - (type.size / 2)}
                      size={type.size}
                      color={bgColor}
                      borderColor={rarity.borderColor}
                      hp={100}
                      maxHp={100}
                      label={type.label[0]}
                      classMob={type.label}
                      isBoss={type.isBoss}
                      textColor="#fff"
                    />
                  ))}

                  {/* Box Bônus (Sempre Amarela com ?) */}
                  <BattleEntity
                    key={`${rarity.id}-bonus`}
                    x={120 + (colorsList.length * 90)}
                    y={yPos + 50 - (MOBS_SIZES.BONUS / 2)} // Centralizado na linha
                    size={MOBS_SIZES.BONUS}
                    color="gold"
                    borderColor={rarity.borderColor}
                    hp={1}
                    maxHp={1}
                    label="?"
                    isBonus={true}
                    textColor="#000"
                  />
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
