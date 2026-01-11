import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RARITIES, BASE_ITEMS } from './StateDriven/Items';

export const Shop = ({ money, gems, player, setPlayer, setStats }) => {
  const [shopItems, setShopItems] = useState([]);
  const [shopLevel, setShopLevel] = useState(1);
  const [isAuto, setIsAuto] = useState(false);
  const [targetRarity, setTargetRarity] = useState(''); // ID da raridade alvo
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Custos
  const REFRESH_COST = 10;
  const UPGRADE_COST_BASE = 100;
  const upgradeCost = Math.floor(UPGRADE_COST_BASE * Math.pow(1.5, shopLevel - 1));

  // Função para calcular pesos de raridade baseado no nível da loja
  const getRarityWeights = useCallback((level) => {
    return RARITIES.map((rarity, index) => {
      let weight = 0;
      if (index === 0) {
        // Comum: Começa em 100, diminui 10 por nível, mínimo 0
        weight = Math.max(0, 100 - (level - 1) * 10);
      } else {
        // Outras raridades aparecem conforme o nível sobe
        const unlockThreshold = index === 1 ? 2 : (index * 3);
        if (level >= unlockThreshold) {
          weight = 10 + (level - unlockThreshold) * 5;
        }
      }
      return { ...rarity, weight };
    });
  }, []);

  // Cálculos para exibição de porcentagem no select
  const currentWeights = useMemo(() => getRarityWeights(shopLevel), [shopLevel, getRarityWeights]);
  const totalWeight = useMemo(() => currentWeights.reduce((acc, r) => acc + r.weight, 0), [currentWeights]);

  // Função para sortear uma raridade baseada nos pesos
  const pickRarity = (weights) => {
    const totalWeight = weights.reduce((acc, r) => acc + r.weight, 0);
    let random = Math.random() * totalWeight;
    for (const rarity of weights) {
      if (random < rarity.weight) return rarity;
      random -= rarity.weight;
    }
    return weights[0];
  };

  // Gera itens novos
  const generateItems = useCallback(() => {
    const weights = getRarityWeights(shopLevel);
    const newItems = [];
    const itemCount = 4 + Math.floor(shopLevel / 3); // 4 itens base + 1 a cada 3 níveis

    for (let i = 0; i < itemCount; i++) {
      const rarity = pickRarity(weights);
      const baseItem = BASE_ITEMS[Math.floor(Math.random() * BASE_ITEMS.length)];

      // Variação de atributos (+/- 20%)
      const variance = 0.8 + Math.random() * 0.4;

      const stats = Object.entries(baseItem.baseStats).reduce((acc, [key, val]) => {
        // Aplica multiplicador da raridade e a variância
        let finalVal = val * rarity.multiplier * variance;
        // Garante valor mínimo de 1 se o base for > 0
        finalVal = val > 0 ? Math.max(1, Math.round(finalVal)) : Math.round(finalVal);
        acc[key] = finalVal;
        return acc;
      }, {});

      // Preço baseado na raridade e qualidade (variance)
      const price = Math.floor(20 * rarity.multiplier * variance);

      newItems.push({
        uniqueId: `${baseItem.id}-${Date.now()}-${i}`,
        ...baseItem,
        rarity,
        stats,
        price,
        variance // Para mostrar se é um item "bom" ou "ruim" para a raridade
      });
    }
    return newItems;
  }, [shopLevel, getRarityWeights]);

  // Ação de Atualizar (Refresh)
  const handleRefresh = useCallback((isAutoCall = false) => {
    if (money < REFRESH_COST) {
      if (!isAutoCall) alert("Ouro insuficiente para atualizar!");
      else setIsAuto(false);
      return;
    }

    if (setStats) {
      setStats(prev => ({ ...prev, money: prev.money - REFRESH_COST }));
    }

    const newItems = generateItems();
    setShopItems(newItems);
    setLastRefresh(Date.now());

    // Lógica de Parada Automática
    if (isAutoCall && targetRarity) {
      const found = newItems.some(item => item.rarity.id === targetRarity);
      if (found) {
        setIsAuto(false); // Para o auto
      }
    }
  }, [money, generateItems, targetRarity, setStats]);

  // Efeito para o Auto Refresh
  useEffect(() => {
    let interval;
    if (isAuto) {
      interval = setInterval(() => {
        handleRefresh(true);
      }, 2000); // 2 segundos
    }
    return () => clearInterval(interval);
  }, [isAuto, handleRefresh]);

  // Inicializa a loja se estiver vazia
  useEffect(() => {
    if (shopItems.length === 0) {
      setShopItems(generateItems());
    }
  }, []);

  const handleUpgrade = () => {
    if (money >= upgradeCost) {
      setStats(prev => ({ ...prev, money: prev.money - upgradeCost }));
      setShopLevel(prev => prev + 1);
    } else {
      alert("Ouro insuficiente para melhorar a loja!");
    }
  };

  const handleBuy = (item) => {
    if (money >= item.price) {
      setStats(prev => ({ ...prev, money: prev.money - item.price }));
      // Adiciona ao inventário do player
      setPlayer(prev => ({
        ...prev,
        items: [...prev.items, { ...item, id: item.uniqueId }] // Garante ID único no inventário
      }));
      // Remove da loja
      setShopItems(prev => prev.filter(i => i.uniqueId !== item.uniqueId));
    } else {
      alert("Ouro insuficiente!");
    }
  };

  return (
    <div style={{ padding: '10px', height: '100%', display: 'flex', flexDirection: 'column', color: 'white' }}>

      {/* Cabeçalho da Loja */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
        <div>
          <h2 style={{ margin: 0, color: 'gold' }}>Loja (Nível {shopLevel})</h2>
          <div style={{ fontSize: '12px', color: '#aaa' }}>Ouro: {money} 💰</div>
        </div>

        <button
          onClick={handleUpgrade}
          style={{
            background: '#27ae60', border: 'none', borderRadius: '4px', color: 'white', padding: '5px 10px', cursor: 'pointer', fontSize: '12px',
            opacity: money >= upgradeCost ? 1 : 0.5
          }}>
          Upgrade ({upgradeCost} 💰)
        </button>
      </div>

      {/* Controles de Refresh e Auto */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '5px' }}>
        <button
          onClick={() => handleRefresh(false)}
          disabled={isAuto}
          style={{
            flex: 1, padding: '8px', background: '#e67e22', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontWeight: 'bold',
            opacity: isAuto ? 0.5 : 1
          }}>
          Atualizar (-{REFRESH_COST} 💰)
        </button>

        <div style={{ display: 'flex', flexDirection: 'row', flex: 1, gap: '5px' }}>


          <button
            onClick={() => setIsAuto(!isAuto)}
            style={{
              flex: 1, padding: '11px', background: isAuto ? '#c0392b' : '#3498db', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontSize: '12px'
            }}>
            {isAuto ? 'PARAR AUTO' : `AUTO REFRESH (-${REFRESH_COST} 💰)`}
          </button>

          <select
            value={targetRarity}
            onChange={(e) => setTargetRarity(e.target.value)}
            style={{ flex: 1, background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', fontSize: '10px', padding: '2px' }}
          >
            <option value="">Parar em qualquer...</option>
            {currentWeights.map(r => {
              const chance = totalWeight > 0 ? (r.weight / totalWeight * 100) : 0;
              if (chance <= 0) return null; // Oculta raridades impossíveis para o nível atual
              return (
                <option key={r.id} value={r.id} style={{ color: r.color }}>
                  {r.name} ({chance.toFixed(1)}%)
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Grade de Itens */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', overflowY: 'auto', paddingRight: '5px' }}>
        {shopItems.map((item) => (
          <div key={item.uniqueId} style={{
            background: '#222',
            border: `2px solid ${item.rarity.color}`,
            borderRadius: '8px',
            padding: '10px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            position: 'relative',
            boxShadow: `0 0 10px ${item.rarity.color}20`
          }}>
            {/* Indicador de Qualidade (Variância) */}
            <div style={{
              position: 'absolute', top: 5, right: 5, fontSize: '10px',
              color: item.variance > 1.1 ? '#2ecc71' : (item.variance < 0.9 ? '#e74c3c' : '#95a5a6')
            }}>
              {item.variance > 1.1 ? '▲' : (item.variance < 0.9 ? '▼' : '-')}
            </div>

            <div style={{ fontSize: '32px', marginBottom: '5px' }}>{item.icon}</div>
            <div style={{ color: item.rarity.color, fontWeight: 'bold', fontSize: '14px', textAlign: 'center', marginBottom: '2px' }}>{item.name}</div>
            <div style={{ fontSize: '10px', color: '#888', marginBottom: '8px' }}>{item.rarity.name} - {item.type}</div>

            <div style={{ width: '100%', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', padding: '5px', marginBottom: '10px', flex: 1 }}>
              {Object.entries(item.stats).map(([stat, value]) => (
                <div key={stat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px solid #333' }}>
                  <span style={{ color: '#aaa', textTransform: 'capitalize' }}>{stat}:</span>
                  <span style={{ color: 'white' }}>{value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleBuy(item)}
              style={{
                width: '100%', padding: '5px',
                background: money >= item.price ? '#f1c40f' : '#555',
                color: money >= item.price ? 'black' : '#aaa',
                border: 'none', borderRadius: '4px', cursor: money >= item.price ? 'pointer' : 'not-allowed',
                fontWeight: 'bold', fontSize: '12px'
              }}>
              Comprar ({item.price} 💰)
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
