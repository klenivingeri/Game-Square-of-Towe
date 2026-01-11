import React, { useState } from 'react';
import { Attributes } from './Attributes';
import { ItemCard } from './StateDriven/Items';

export const Inventory = ({ player, setPlayer, gems, setStats }) => {
  const { attributes, equipment } = player;
  const [tab, setTab] = useState('items'); // 'items' or 'cosmetics'
  const [selectedItem, setSelectedItem] = useState(null);
  
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
            Object.entries(newEquipment[slot].stats).forEach(([key, value]) => {
              if (newAttributes[key] !== undefined) {
                newAttributes[key] -= value;
              }
            });
          }
          newEquipment[slot] = null;
          wasEquipped = true;
        }
      });

      // Remove from items and cosmetics
      const newItems = prev.items.filter(i => (i.uniqueId || i.id) !== selectedId);
      const newCosmetics = prev.cosmetics.filter(i => (i.uniqueId || i.id) !== selectedId);

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
        <Attributes attributes={attributes} />
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
            Itens
          </button>
          <button 
            onClick={() => setTab('cosmetics')}
            style={{ flex: 1, padding: '6px', fontSize: '12px', background: tab === 'cosmetics' ? '#4a5568' : '#2d3748', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
            Cosméticos
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(35px, 1fr))', gap: '4px', overflowY: 'auto' }}>
          {slots.map((_, i) => {
            const list = tab === 'items' ? player.items : player.cosmetics;
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
              {tab === 'items' && ['weapon', 'shield', 'head', 'chest', 'arms', 'pants', 'boots'].includes(selectedItem.type) && (
                <button 
                  onClick={handleEquip}
                  style={{ padding: '10px 20px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Equipar
                </button>
              )}
              <button 
                onClick={handleSell}
                style={{ padding: '10px 20px', background: '#e67e22', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                Vender ({Math.floor((selectedItem.price || 0) * 0.4)} 💰)
              </button>
            </div>
          </ItemCard>
        </div>
      )}
    </div>
  );
};