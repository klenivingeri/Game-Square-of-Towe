import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RARITIES, BASE_ITEMS, ItemCard, addRandomStats } from './StateDriven/Items';

export const Shop = ({ money, gems, player, setPlayer, setStats }) => {
  const [shopItems, setShopItems] = useState(() => {
    const saved = localStorage.getItem('rpg_shop_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [shopLevel, setShopLevel] = useState(() => {
    const saved = localStorage.getItem('rpg_shop_level');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [isAuto, setIsAuto] = useState(false);
  const [targetRarity, setTargetRarity] = useState(''); // ID da raridade alvo
  const [lastRefresh, setLastRefresh] = useState(() => {
    const saved = localStorage.getItem('rpg_shop_last_refresh');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [freeRefreshes, setFreeRefreshes] = useState(() => {
    const saved = localStorage.getItem('rpg_shop_free_refreshes');
    return saved ? parseInt(saved, 10) : 3;
  });
  const [lastFreeReset, setLastFreeReset] = useState(() => {
    const saved = localStorage.getItem('rpg_shop_last_free_reset');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [timeString, setTimeString] = useState('--:--');

  // Custos
  const REFRESH_COST_BASE = 20;
  const refreshCost = Math.floor(REFRESH_COST_BASE * Math.pow(1.8, shopLevel - 1));
  const UPGRADE_COST_BASE = 100;
  const upgradeCost = Math.floor(UPGRADE_COST_BASE * Math.pow(1.5, shopLevel - 1));
  const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutos

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
    const itemCount = 4;

    for (let i = 0; i < itemCount; i++) {
      const rarity = pickRarity(weights);
      const baseItem = BASE_ITEMS[Math.floor(Math.random() * BASE_ITEMS.length)];

      // Variação de atributos (+/- 20%)
      const variance = 0.8 + Math.random() * 0.4;

      // Começa com stats vazios
      let stats = {};

      // Adiciona atributos extras baseado no tier da raridade
      const rarityIndex = RARITIES.findIndex(r => r.id === rarity.id);
      const extraStatsCount = Math.floor(rarityIndex / 1.5) + 1;
      
      // Chama a função addRandomStats corretamente, passando o item base
      stats = addRandomStats(stats, rarity.multiplier * variance, extraStatsCount, baseItem);

      // Preço baseado na raridade (priceMult) e qualidade (variance)
      const basePrice = 20;
      const price = Math.floor(basePrice * rarity.priceMult * variance);

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
    const useFree = !isAutoCall && freeRefreshes > 0;

    if (!useFree && money < refreshCost) {
      if (!isAutoCall) alert("Ouro insuficiente para atualizar!");
      else setIsAuto(false);
      return;
    }

    if (useFree) {
      setFreeRefreshes(prev => prev - 1);
    } else if (setStats) {
      setStats(prev => ({ ...prev, money: prev.money - refreshCost }));
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
  }, [money, generateItems, targetRarity, setStats, refreshCost, freeRefreshes]);

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

  // Salva estados no localStorage sempre que mudarem
  useEffect(() => {
    localStorage.setItem('rpg_shop_level', shopLevel);
    localStorage.setItem('rpg_shop_items', JSON.stringify(shopItems));
    localStorage.setItem('rpg_shop_last_refresh', lastRefresh.toString());
    localStorage.setItem('rpg_shop_free_refreshes', freeRefreshes);
  }, [shopLevel, shopItems, lastRefresh, freeRefreshes]);

  // Reset diário das atualizações grátis
  useEffect(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    if (lastFreeReset < today) {
      setFreeRefreshes(3);
      setLastFreeReset(today);
      localStorage.setItem('rpg_shop_last_free_reset', today.toString());
    }
  }, [lastFreeReset]);

  // Timer de 30 minutos para refresh automático
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const elapsed = now - lastRefresh;
      const remaining = Math.max(0, REFRESH_INTERVAL - elapsed);

      if (remaining === 0) {
        const newItems = generateItems();
        setShopItems(newItems);
        setLastRefresh(now);
      } else {
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setTimeString(`${m}:${s < 10 ? '0' : ''}${s}`);
      }
    };
    tick(); // Executa imediatamente
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lastRefresh, generateItems]);

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

      {/* Grade de Itens */}
      <div style={{  marginBottom:'5px',display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', overflowY: 'auto', paddingRight: '5px' }}>
        {shopItems.map((item) => (
          <ItemCard key={item.uniqueId} item={item}>
            <button
              onClick={() => handleBuy(item)}
              style={{
                width: '100%', padding: '5px',
                background: money >= item.price ? '#f1c40f' : '#555',
                color: money >= item.price ? 'black' : '#aaa',
                border: 'none', borderRadius: '4px', cursor: money >= item.price ? 'pointer' : 'not-allowed',
                fontWeight: 'bold', fontSize: '12px',
                marginTop: 'auto'
              }}>
              Comprar ({item.price} 💰)
            </button>
          </ItemCard>
        ))}
      </div>
      
      {/* Controles de Refresh e Auto */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '5px' }}>
        
        <div style={{ fontFamily: 'monospace', fontSize: '14px', color: '#f1c40f', minWidth: '45px', textAlign: 'center' }}>
          {timeString}
        </div>

        <button
          onClick={() => handleRefresh(false)}
          disabled={isAuto}
          style={{
            flex: 1, padding: '8px', background: freeRefreshes > 0 ? '#2ecc71' : '#e67e22', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontWeight: 'bold',
            opacity: isAuto ? 0.5 : 1
          }}>
          {freeRefreshes > 0 ? `Grátis (${freeRefreshes}/3)` : `Atualizar (-${refreshCost} 💰)`}
        </button>

        <div style={{ display: 'flex', flexDirection: 'row', flex: 1, gap: '5px' }}>

          <button
            onClick={() => {
              if (isAuto) {
                setIsAuto(false);
              } else {
                setIsAuto(true);
                handleRefresh(true);
              }
            }}
            disabled={!targetRarity}
            style={{
              flex: 1, padding: '11px', 
              background: isAuto ? '#c0392b' : (!targetRarity ? '#555' : '#3498db'), 
              border: 'none', borderRadius: '4px', color: 'white', cursor: !targetRarity ? 'not-allowed' : 'pointer', fontSize: '12px'
            }}>
            {isAuto ? 'PARAR AUTO' : `AUTO (-${refreshCost} 💰)`}
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
    </div>
  );
};
