import React, { useState } from 'react';
import { Attributes } from './Attributes';
import { ItemCard } from './StateDriven/Items';

export const Inventory = ({ player, setPlayer, gems, setStats }) => {
  const { attributes, equipment } = player;
  const [tab, setTab] = useState('items'); // 'items' or 'cosmetics'
  const [selectedItem, setSelectedItem] = useState(null);
  const [diff, setDiff] = useState({});

  // Gera 20 slots vazios para exemplo
  const slots = Array.from({ length: 20 });

  const equipmentSlots = [
    { id: 'head', icon: 'o' },
    { id: 'chest', icon: 'o' },
    { id: 'arms', icon: 'o' },
    { id: 'pants', icon: 'o' },
    { id: 'boots', icon: 'o' },
    { id: 'weapon', icon: 'o' },
    { id: 'shield', icon: 'o' }
  ];

  // Helper para identificar equipamentos
  const isEquipment = (item) => ['weapon', 'shield', 'head', 'chest', 'arms', 'pants', 'boots'].includes(item.type);

  // Listas filtradas para as abas
  const equipmentItems = player.items.filter(isEquipment);
  const cosmeticItems = [...player.items.filter(i => !isEquipment(i)), ...player.cosmetics];

  const handleEquip = () => {
    if (!selectedItem) return;

    const slotMap = {
      weapon: 'weapon',
      shield: 'shield',
      head: 'head',
      chest: 'chest',
      arms: 'arms',
      pants: 'pants',
      boots: 'boots',
    };

    const slot = slotMap[selectedItem.type];
    if (!slot) return;

    // Calcula Diff
    const currentEquip = player.equipment[slot];
    const diffCalc = {};

    // Remove stats do atual
    if (currentEquip && currentEquip.stats) {
      Object.entries(currentEquip.stats).forEach(([k, v]) => {
        diffCalc[k] = (diffCalc[k] || 0) - v;
      });
    }
    // Adiciona stats do novo
    if (selectedItem.stats) {
      Object.entries(selectedItem.stats).forEach(([k, v]) => {
        diffCalc[k] = (diffCalc[k] || 0) + v;
      });
    }
    setDiff(diffCalc);

    setPlayer(prev => {
      const currentEquip = prev.equipment[slot];
      const newAttributes = { ...prev.attributes };

      // Remove stats do equipamento atual
      if (currentEquip && currentEquip.stats) {
        Object.entries(currentEquip.stats).forEach(([key, value]) => {
          if (newAttributes[key] !== undefined) {
            newAttributes[key] -= value;
          }
        });
      }

      // Adiciona stats do novo equipamento
      if (selectedItem.stats) {
        Object.entries(selectedItem.stats).forEach(([key, value]) => {
          if (newAttributes[key] !== undefined) {
            newAttributes[key] += value;
          }
        });
      }

      // Ajusta HP se o maxHp mudou (para não ficar com hp > maxHp)
      if (newAttributes.hp > newAttributes.maxHp) {
        newAttributes.hp = newAttributes.maxHp;
      }

      // Atualiza Inventário: Remove o item selecionado, Adiciona o antigo (se houver)
      const selectedId = selectedItem.uniqueId || selectedItem.id;
      const newItems = prev.items.filter(i => (i.uniqueId || i.id) !== selectedId);

      if (currentEquip) {
        newItems.push(currentEquip);
      }

      return {
        ...prev,
        attributes: newAttributes,
        equipment: {
          ...prev.equipment,
          [slot]: selectedItem
        },
        items: newItems
      };
    });
    setSelectedItem(null);
  };

  const handleUnequip = () => {
    if (!selectedItem) return;

    // Encontra o slot onde o item está equipado
    const slotEntry = Object.entries(player.equipment).find(([k, v]) => v && (v.uniqueId === selectedItem.uniqueId || v.id === selectedItem.id));
    if (!slotEntry) return;
    const slot = slotEntry[0];

    // Calcula Diff (Remoção)
    const diffCalc = {};
    if (selectedItem.stats) {
      Object.entries(selectedItem.stats).forEach(([k, v]) => {
        diffCalc[k] = (diffCalc[k] || 0) - v;
      });
    }
    setDiff(diffCalc);

    setPlayer(prev => {
      const newAttributes = { ...prev.attributes };
      if (selectedItem.stats) {
        Object.entries(selectedItem.stats).forEach(([key, value]) => {
          if (newAttributes[key] !== undefined) newAttributes[key] -= value;
        });
      }
      if (newAttributes.hp > newAttributes.maxHp) newAttributes.hp = newAttributes.maxHp;

      return {
        ...prev,
        attributes: newAttributes,
        equipment: { ...prev.equipment, [slot]: null },
        items: [...prev.items, selectedItem]
      };
    });
    setSelectedItem(null);
  };

  const handleSell = () => {
    if (!selectedItem) return;

    const sellPrice = Math.floor((selectedItem.price || 0) * 0.4);

    if (setStats) {
      setStats(prev => ({ ...prev, money: prev.money + sellPrice }));
    }

    setPlayer(prev => {
      const selectedId = selectedItem.uniqueId || selectedItem.id;

      // Remove from equipment if equipped
      const newEquipment = { ...prev.equipment };
      let newAttributes = { ...prev.attributes };
      let wasEquipped = false;

      Object.keys(newEquipment).forEach(slot => {
        if (newEquipment[slot] && (newEquipment[slot].uniqueId || newEquipment[slot].id) === selectedId) {
          // Remove stats
          if (newEquipment[slot].stats) {
            // Calcula Diff para venda de equipado
            const diffCalc = {};
            Object.entries(newEquipment[slot].stats).forEach(([key, value]) => {
              diffCalc[key] = (diffCalc[key] || 0) - value;
              if (newAttributes[key] !== undefined) {
                newAttributes[key] -= value;
              }
            });
            setDiff(diffCalc);
          }
          newEquipment[slot] = null;
          wasEquipped = true;
        }
      });

      // Remove from items and cosmetics
      const newItems = prev.items.filter(i => (i.uniqueId || i.id) !== selectedId);
      const newCosmetics = prev.cosmetics.filter(i => (i.uniqueId || i.id) !== selectedId);

      if (!wasEquipped) setDiff({}); // Limpa diff se vendeu item da mochila

      // Adjust HP
      if (newAttributes.hp > newAttributes.maxHp) {
        newAttributes.hp = newAttributes.maxHp;
      }

      return {
        ...prev,
        attributes: newAttributes,
        equipment: newEquipment,
        items: newItems,
        cosmetics: newCosmetics
      };
    });
    setSelectedItem(null);
  };

  const getUpgradeCost = (level) => {
    const costs = [10, 25, 60, 150, 400];
    return costs[level] || 0;
  };

  const handleUpdate = () => {
    if (!selectedItem) return;

    const currentLevel = selectedItem.level || 0;
    if (currentLevel >= 5) return;

    const cost = getUpgradeCost(currentLevel);

    if (gems < cost) {
      alert(`Diamantes insuficientes! Necessário: ${cost} 💎`);
      return;
    }

    if (setStats) {
      setStats(prev => ({ ...prev, gems: prev.gems - cost }));
    }

    const newItem = { ...selectedItem };
    newItem.level = currentLevel + 1;
    newItem.price = (newItem.price || 0) * 2;
    newItem.stars = "★".repeat(newItem.level);

    if (newItem.stats) {
      const newStats = { ...newItem.stats };
      Object.keys(newStats).forEach(key => {
        const bonus = Math.random() < 0.05 ? 2 : 1;
        newStats[key] = (newStats[key] || 0) + bonus;
      });
      newItem.stats = newStats;
    }

    setPlayer(prev => {
      const selectedId = newItem.uniqueId || newItem.id;
      const newEquipment = { ...prev.equipment };
      const newAttributes = { ...prev.attributes };

      // Update equipment if equipped
      Object.keys(newEquipment).forEach(slot => {
        const equipped = newEquipment[slot];
        if (equipped && (equipped.uniqueId || equipped.id) === selectedId) {
          // Remove old stats
          if (selectedItem.stats) {
            Object.entries(selectedItem.stats).forEach(([k, v]) => {
              if (newAttributes[k] !== undefined) newAttributes[k] -= v;
            });
          }
          // Add new stats
          if (newItem.stats) {
            Object.entries(newItem.stats).forEach(([k, v]) => {
              if (newAttributes[k] !== undefined) newAttributes[k] += v;
            });
          }
          newEquipment[slot] = newItem;
        }
      });

      // Update lists
      const newItems = prev.items.map(i => (i.uniqueId || i.id) === selectedId ? newItem : i);
      const newCosmetics = prev.cosmetics.map(i => (i.uniqueId || i.id) === selectedId ? newItem : i);

      if (newAttributes.hp > newAttributes.maxHp) newAttributes.hp = newAttributes.maxHp;

      return { ...prev, attributes: newAttributes, equipment: newEquipment, items: newItems, cosmetics: newCosmetics };
    });
    setSelectedItem(newItem);
  };

  return (
    <div style={{ display: 'flex', gap: '5px', height: '100%', overflowY: 'auto', paddingRight: '2px', flexWrap: 'wrap', alignContent: 'flex-start' }}>

      {/* Coluna Esquerda: Equipamentos e Atributos */}
      <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '5px' }}>

        {/* Equipamentos */}
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '8px' }}>
          <h3 style={{ borderBottom: '1px solid #555', paddingBottom: '2px', marginTop: 0, marginBottom: '5px', color: 'orange', fontSize: '14px' }}>Equipamentos</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
            {equipmentSlots.map((slot) => {
              const item = equipment[slot.id];
              return (
                <div key={slot.id}
                  onClick={() => item && setSelectedItem(item)}
                  style={{
                    width: '45px', height: '45px',
                    border: item ? `2px solid ${item.rarity?.color || '#555'}` : '2px dashed #555',
                    borderRadius: '8px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: item?.rarity?.color ? `${item.rarity.color}40` : (item ? '#2d3748' : 'rgba(0,0,0,0.2)'),
                    cursor: 'pointer'
                  }}>
                  <div style={{ fontSize: '18px' }}>{item?.icon || slot.icon}</div>
                  <div style={{ fontSize: '8px', color: '#888', textTransform: 'capitalize' }}>{slot.id}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Atributos */}
        <Attributes attributes={attributes} diff={diff} />
      </div>

      {/* Coluna Direita: Inventário (Bag) */}
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '8px', flex: '1 1 150px', display: 'flex', flexDirection: 'column' }}>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '5px', color: '#3498db', fontSize: '12px', fontWeight: 'bold' }}>
          💎 {gems || 0}
        </div>

        <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
          <button
            onClick={() => setTab('items')}
            style={{ flex: 1, padding: '6px', fontSize: '12px', background: tab === 'items' ? '#4a5568' : '#2d3748', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
            Equipamentos
          </button>
          <button
            onClick={() => setTab('cosmetics')}
            style={{ flex: 1, padding: '6px', fontSize: '12px', background: tab === 'cosmetics' ? '#4a5568' : '#2d3748', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
            Poções
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(35px, 1fr))', gap: '4px', overflowY: 'auto' }}>
          {slots.map((_, i) => {
            const list = tab === 'items' ? equipmentItems : cosmeticItems;
            const item = list && list[i];
            const itemColor = item?.rarity?.color || item?.color || '#444';

            return (
              <div key={i}
                onClick={() => item && setSelectedItem(item)}
                title={item ? `${item.name}${item.rarity ? ` (${item.rarity.name})` : ''}` : ''}
                style={{
                  aspectRatio: '1/1',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${item ? itemColor : '#444'}`,
                  borderRadius: '4px',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px',
                  boxShadow: item ? `0 0 5px ${itemColor}40` : 'none',
                  cursor: item ? 'pointer' : 'default'
                }}>
                {item ? item.icon : ''}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Detalhes do Item */}
      {selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)',
          zIndex: 200,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }} onClick={() => setSelectedItem(null)}>
          <ItemCard
            item={selectedItem}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '300px',
              width: '90%',
              cursor: 'default',
              background: '#2d3748'
            }}
          >
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px', width: '100%' }}>
              {/* Verifica se está equipado */}
              {Object.values(player.equipment).some(e => e && (e.uniqueId === selectedItem.uniqueId || e.id === selectedItem.id)) ? (
                <button
                  onClick={handleUnequip}
                  style={{ padding: '8px 12px', fontSize: '10px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Desequipar
                </button>
              ) : (
                tab === 'items' && isEquipment(selectedItem) && (
                  <button
                    onClick={handleEquip}
                    style={{ padding: '8px 12px', fontSize: '10px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Equipar
                  </button>
                )
              )}
              <button
                onClick={handleUpdate}
                style={{ padding: '8px 12px', fontSize: '10px', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                Update {(selectedItem.level || 0) < 5 ? `(${getUpgradeCost(selectedItem.level || 0)} 💎)` : '(Max)'}
              </button>
              <button
                onClick={handleSell}
                style={{ padding: '8px 12px', fontSize: '12px', background: '#e67e22', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                Vender ({Math.floor((selectedItem.price || 0) * 0.4)} 💰)
              </button>
            </div>
          </ItemCard>
        </div>
      )}
    </div>
  );
};