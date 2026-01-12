export const SIZES = {
  PLAYER: 50,
  MOB: 50,
  ELITE: 65,
  BOSS: 80,
  BONUS: 30
};

export const RARITIES_MOBS = [
  { id: 'common', name: 'Comum', borderColor: '#95a5a6', rarities: 60, statsMultiplier: 1.0 },       // Cinza
  { id: 'uncommon', name: 'Incomum', borderColor: '#2ecc71', rarities: 20, statsMultiplier: 1.5 }, // Verde
  { id: 'rare', name: 'Raro', borderColor: '#3498db', rarities: 10, statsMultiplier: 2 },          // Azul
  { id: 'heroic', name: 'Heroico', borderColor: '#9b59b6', rarities: 5, statsMultiplier: 2.5 },     // Roxo
  { id: 'legendary', name: 'Lendário', borderColor: '#f1c40f', rarities: 3, statsMultiplier: 3.5 }, // Amarelo
  { id: 'mythic', name: 'Mítico', borderColor: '#e67e22', rarities: 1.5, statsMultiplier: 5 },      // Laranja
  { id: 'immortal', name: 'Imortal', borderColor: '#e74c3c', rarities: 0.5, statsMultiplier: 10 },  // Vermelho
];

export const COLORS_MOBS = {
  common: '#2c3e50',
  uncommon: '#1b3d2f',
  rare: '#1a2a3a',
  heroic: '#2d1e33',
  legendary: '#3e3612',
  mythic: '#3d2315',
  immortal: '#3b1616',
};

export const MOB_CLASSES = {
  WARRIOR: { id: 'warrior', name: 'Guerreiro', icon: '⚔️' },
  TANK: { id: 'tank', name: 'Tanque', icon: '🛡️' },
  MAGE: { id: 'mage', name: 'Mago', icon: '🔮' },
  ARCHER: { id: 'archer', name: 'Arqueiro', icon: '🏹' },
  ASSASSIN: { id: 'assassin', name: 'Assassino', icon: '🗡️' },
  HEALER: { id: 'healer', name: 'Curandeiro', icon: '💚' }
};



// Helper para sortear raridade
const getRarity = () => {
  const totalWeight = RARITIES_MOBS.reduce((acc, r) => acc + r.rarities, 0);
  let random = Math.random() * totalWeight;
  for (const rarity of RARITIES_MOBS) {
    if (random < rarity.rarities) return rarity;
    random -= rarity.rarities;
  }
  return RARITIES_MOBS[0];
};

export const generateArenaMobs = (count, tileData, isMapBoss = false) => {
  const initialMobs = [];
  let xOffset = 280;
  let mobCounter = 0;
  const level = tileData?.nivel || 1;
  const classKeys = Object.keys(MOB_CLASSES);

  for (let i = 0; i < count; i++) {
    // Sorteia Classe
    const randomClassKey = classKeys[Math.floor(Math.random() * classKeys.length)];
    const mobClass = MOB_CLASSES[randomClassKey];

    // Sorteia Raridade
    const rarity = getRarity();
    const multiplier = rarity.statsMultiplier || 1;

    // Adiciona Mob
    initialMobs.push({
      id: `mob-${i}`,
      type: 'enemy',
      category: 'COMMON',
      mobClass: mobClass.id,
      mobClassName: mobClass.name,
      icon: mobClass.icon,
      hp: Math.floor((tileData?.mobHp || 30) * multiplier),
      maxHp: Math.floor((tileData?.mobHp || 30) * multiplier),
      dmg: Math.floor((tileData?.mobAtk || 5) * multiplier),
      attack: 0,
      hit: 0,
      x: xOffset,
      color: COLORS_MOBS[rarity.id],
      borderColor: rarity.borderColor,
      label: `M${i + 1}`,
      skills: [], // Preparado para receber skills
      turnCount: 0,
      shield: mobClass.id === 'tank' ? Math.floor((tileData?.mobHp || 30) * multiplier * 0.3) : 0,
      rarityMultiplier: multiplier
    });

    xOffset += 130;
    mobCounter++;

    // A cada 3 mobs, adiciona uma caixa de bônus
    if (mobCounter === 3) {
      initialMobs.push({
        id: `bonus-${i}`,
        type: 'bonus',
        category: 'BONUS',
        hp: 1,
        maxHp: 1,
        x: xOffset,
        color: 'gold',
        label: '?'
      });
      xOffset += 110; // Espaço menor para o bônus
      mobCounter = 0;
    }
  }

  // Se o último item for um bônus, adiciona um mob extra (que será o boss)
  if (initialMobs.length > 0 && initialMobs[initialMobs.length - 1].type === 'bonus') {
    const rarity = getRarity();
    const multiplier = rarity.statsMultiplier || 1;
    const randomClassKey = classKeys[Math.floor(Math.random() * classKeys.length)];
    const mobClass = MOB_CLASSES[randomClassKey];

    initialMobs.push({
      id: `mob-boss`,
      type: 'enemy',
      category: 'COMMON', // Será ajustado abaixo
      mobClass: mobClass.id,
      mobClassName: mobClass.name,
      icon: mobClass.icon,
      hp: Math.floor((tileData?.mobHp || 30) * 2 * multiplier),
      maxHp: Math.floor((tileData?.mobHp || 30) * 2 * multiplier),
      dmg: Math.floor((tileData?.mobAtk || 5) * multiplier),
      attack: 0,
      hit: 0,
      x: xOffset,
      color: COLORS_MOBS[rarity.id],
      borderColor: rarity.borderColor,
      label: 'BOSS',
      isBoss: true,
      skills: [],
      turnCount: 0,
      shield: mobClass.id === 'tank' ? Math.floor(((tileData?.mobHp || 30) * 2 * multiplier) * 0.3) : 0,
      rarityMultiplier: multiplier
    });
  } else {
    // Define o último mob da lista como Boss se não for bônus
    const lastMob = initialMobs[initialMobs.length - 1];
    if (lastMob && lastMob.type === 'enemy') {
      lastMob.isBoss = true;
      // O HP será ajustado na lógica abaixo
    }
  }

  // --- LÓGICA DE ELITE E LEADER ---
  // Encontra o último inimigo da fila
  let lastEnemy = null;
  for (let i = initialMobs.length - 1; i >= 0; i--) {
    if (initialMobs[i].type === 'enemy') {
      lastEnemy = initialMobs[i];
      break;
    }
  }

  if (lastEnemy) {
    // Regra: Elite aparece do grid 3 ao 12
    if (level >= 3 && level <= 12) {
      const rarityMult = lastEnemy.rarityMultiplier || 1;
      lastEnemy.category = 'ELITE';
      lastEnemy.label = 'ELITE';
      lastEnemy.hp = Math.floor((tileData?.mobHp || 30) * 2.5 * rarityMult); // Elite tem mais vida
      lastEnemy.maxHp = lastEnemy.hp;
      lastEnemy.dmg = Math.floor((tileData?.mobAtk || 5) * 1.5 * rarityMult);
    } else {
      // Se for nível baixo (< 3), mantém como um "Chefe Comum"
      lastEnemy.category = 'COMMON';
      lastEnemy.label = 'CHEFE';
      lastEnemy.hp *= 2;
      lastEnemy.maxHp *= 2;
    }

    // Regra: Boss do Mapa (Dropa Chave)
    if (isMapBoss) {
      const rarity = getRarity();
      const multiplier = rarity.statsMultiplier || 1;
      const randomClassKey = classKeys[Math.floor(Math.random() * classKeys.length)];
      const mobClass = MOB_CLASSES[randomClassKey];

      const mapBoss = {
        id: `mob-boss-map`,
        type: 'enemy',
        category: 'BOSS',
        mobClass: mobClass.id,
        mobClassName: mobClass.name,
        icon: '👹',
        hp: Math.floor((tileData?.mobHp || 30) * 5 * multiplier),
        maxHp: Math.floor((tileData?.mobHp || 30) * 5 * multiplier),
        dmg: Math.floor((tileData?.mobAtk || 5) * 2.5 * multiplier),
        attack: 0,
        hit: 0,
        x: lastEnemy.x + 150,
        color: COLORS_MOBS[rarity.id],
        borderColor: 'gold',
        label: 'BOSS',
        isBoss: true,
        dropsKey: true,
        skills: [],
        turnCount: 0,
        shield: mobClass.id === 'tank' ? Math.floor(((tileData?.mobHp || 30) * 5 * multiplier) * 0.3) : 0,
        rarityMultiplier: multiplier
      };
      initialMobs.push(mapBoss);
    } else if (level === 12 && Math.random() < 0.5) {
      // Regra: Leader aparece SOMENTE no grid 12 com 50% de chance (se não for Boss de Mapa garantido)
      const rarity = getRarity();
      const multiplier = rarity.statsMultiplier || 1;
      const randomClassKey = classKeys[Math.floor(Math.random() * classKeys.length)];
      const mobClass = MOB_CLASSES[randomClassKey];

      const leaderMob = {
        id: `mob-leader`,
        type: 'enemy',
        category: 'LEADER',
        mobClass: mobClass.id,
        mobClassName: mobClass.name,
        icon: mobClass.icon,
        hp: Math.floor((tileData?.mobHp || 30) * 4 * multiplier),
        maxHp: Math.floor((tileData?.mobHp || 30) * 4 * multiplier),
        dmg: Math.floor((tileData?.mobAtk || 5) * 2 * multiplier),
        attack: 0,
        hit: 0,
        x: lastEnemy.x + 130,
        color: COLORS_MOBS[rarity.id],
        borderColor: rarity.borderColor,
        label: 'LÍDER',
        isBoss: true,
        dropsKey: true,
        skills: [],
        turnCount: 0,
        shield: mobClass.id === 'tank' ? Math.floor(((tileData?.mobHp || 30) * 4 * multiplier) * 0.3) : 0,
        rarityMultiplier: multiplier
      };

      initialMobs.push(leaderMob);
    }
  }

  return initialMobs;
};