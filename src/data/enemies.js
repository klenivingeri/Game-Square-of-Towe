export const SIZES = {
  PLAYER: 50,
  MOB: 50,
  ELITE: 65,
  BOSS: 80,
  BONUS: 30
};

export const RARITIES_MOBS = [
  { id: 'common', name: 'Comum', borderColor: '#95a5a6', rarities: 60 },       // Cinza
  { id: 'uncommon', name: 'Incomum', borderColor: '#2ecc71', rarities: 20 }, // Verde
  { id: 'rare', name: 'Raro', borderColor: '#3498db', rarities: 10 },          // Azul
  { id: 'heroic', name: 'Heroico', borderColor: '#9b59b6', rarities: 5 },     // Roxo
  { id: 'legendary', name: 'Lendário', borderColor: '#f1c40f', rarities: 3 }, // Amarelo
  { id: 'mythic', name: 'Mítico', borderColor: '#e67e22', rarities: 1.5 },      // Laranja
  { id: 'immortal', name: 'Imortal', borderColor: '#e74c3c', rarities: 0.5 },  // Vermelho
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

export const MOB_CATEGORIES = {
  COMMON: { name: 'Comum', color: null }, // Cor gerada dinamicamente
  ELITE: { name: 'Elite', color: '#9b59b6' }, // Roxo
  LEADER: { name: 'Líder', color: '#c0392b' }, // Vermelho Escuro
  BONUS: { name: 'Bônus', color: 'gold' }
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

export const generateArenaMobs = (count, tileData) => {
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

    // Adiciona Mob
    initialMobs.push({
      id: `mob-${i}`,
      type: 'enemy',
      category: 'COMMON',
      mobClass: mobClass.id,
      mobClassName: mobClass.name,
      icon: mobClass.icon,
      hp: tileData?.mobHp || 30,
      maxHp: tileData?.mobHp || 30,
      dmg: tileData?.mobAtk || 5,
      attack: 0,
      hit: 0,
      x: xOffset,
      color: COLORS_MOBS[rarity.id],
      borderColor: rarity.borderColor,
      label: `M${i + 1}`,
      skills: [] // Preparado para receber skills
    });

    xOffset += 100;
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
      xOffset += 80; // Espaço menor para o bônus
      mobCounter = 0;
    }
  }

  // Se o último item for um bônus, adiciona um mob extra (que será o boss)
  if (initialMobs.length > 0 && initialMobs[initialMobs.length - 1].type === 'bonus') {
    const rarity = getRarity();
    const randomClassKey = classKeys[Math.floor(Math.random() * classKeys.length)];
    const mobClass = MOB_CLASSES[randomClassKey];

    initialMobs.push({
      id: `mob-boss`,
      type: 'enemy',
      category: 'COMMON', // Será ajustado abaixo
      mobClass: mobClass.id,
      mobClassName: mobClass.name,
      icon: mobClass.icon,
      hp: (tileData?.mobHp || 30) * 2,
      maxHp: (tileData?.mobHp || 30) * 2,
      dmg: tileData?.mobAtk || 5,
      attack: 0,
      hit: 0,
      x: xOffset,
      color: COLORS_MOBS[rarity.id],
      borderColor: rarity.borderColor,
      label: 'BOSS',
      isBoss: true,
      skills: []
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
      lastEnemy.category = 'ELITE';
      lastEnemy.label = 'ELITE';
      // lastEnemy.color = MOB_CATEGORIES.ELITE.color; // Mantém a cor da raridade
      lastEnemy.hp = (tileData?.mobHp || 30) * 2.5; // Elite tem mais vida
      lastEnemy.maxHp = lastEnemy.hp;
      lastEnemy.dmg = (tileData?.mobAtk || 5) * 1.5;
    } else {
      // Se for nível baixo (< 3), mantém como um "Chefe Comum"
      lastEnemy.category = 'COMMON';
      lastEnemy.label = 'CHEFE';
      lastEnemy.hp *= 2;
      lastEnemy.maxHp *= 2;
    }

    // Regra: Leader aparece SOMENTE no grid 12 com 50% de chance
    if (level === 12 && Math.random() < 0.5) {
      lastEnemy.category = 'LEADER';
      lastEnemy.label = 'LÍDER';
      // lastEnemy.color = MOB_CATEGORIES.LEADER.color; // Mantém a cor da raridade
      lastEnemy.hp = (tileData?.mobHp || 30) * 4; // Leader tem muita vida
      lastEnemy.maxHp = lastEnemy.hp;
      lastEnemy.dmg = (tileData?.mobAtk || 5) * 2;
      lastEnemy.dropsKey = true; // Dropa a chave
    }
  }

  return initialMobs;
};