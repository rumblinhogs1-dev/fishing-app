import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTackleBox } from '../hooks/useTackleBox';
import { CATEGORIES } from '../utils/tackleBox';
import styles from './TackleBox.module.css';

const EMPTY_ITEM = { name: '', category: 'lure', quantity: 1, threshold: 1, photo: '' };

export default function TackleBox() {
  const { user } = useAuth();
  const { items, loading, addItem, updateItem, deleteItem } = useTackleBox();
  const [form, setForm] = useState(EMPTY_ITEM);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState('inventory');

  const grouped = useMemo(() => {
    const groups = {};
    Object.keys(CATEGORIES).forEach((key) => { groups[key] = []; });
    items.forEach((item) => {
      const cat = item.category || 'accessory';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [items]);

  const lowStock = useMemo(() =>
    items.filter((i) => i.quantity <= (i.threshold || 1)),
    [items]
  );

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await addItem({
      name: form.name.trim(),
      category: form.category,
      quantity: Number(form.quantity) || 1,
      threshold: Number(form.threshold) || 1,
      photo: form.photo || '',
    });
    setForm(EMPTY_ITEM);
    setShowForm(false);
  }

  async function handleQuickAdd(category, preset) {
    await addItem({
      name: preset,
      category,
      quantity: 1,
      threshold: 1,
      photo: '',
    });
  }

  async function handleQuantityChange(item, delta) {
    const newQty = Math.max(0, (item.quantity || 0) + delta);
    await updateItem(item.id, { quantity: newQty });
  }

  async function handleTogglePacked(item) {
    await updateItem(item.id, { packed: !item.packed });
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <h2 className={styles.heading}>Tackle Box</h2>
        <p className={styles.empty}>Sign in to manage your tackle inventory.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <h2 className={styles.heading}>Tackle Box</h2>
        <p className={styles.loadingText}>Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Tackle Box</h2>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'inventory' ? styles.tabActive : ''}`} onClick={() => setTab('inventory')}>
          Inventory
        </button>
        <button className={`${styles.tab} ${tab === 'shopping' ? styles.tabActive : ''}`} onClick={() => setTab('shopping')}>
          Shopping List {lowStock.length > 0 && <span className={styles.badge}>{lowStock.length}</span>}
        </button>
      </div>

      {tab === 'inventory' && (
        <>
          {lowStock.length > 0 && (
            <div className={styles.lowStockAlert}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
              {lowStock.length} item{lowStock.length > 1 ? 's' : ''} low on stock
            </div>
          )}

          <button className={styles.addBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Item'}
          </button>

          {showForm && (
            <form className={styles.form} onSubmit={handleAdd}>
              <input
                className={styles.input}
                placeholder="Item name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                autoFocus
              />
              <select
                className={styles.select}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.label}</option>
                ))}
              </select>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>
                  Qty
                  <input
                    type="number"
                    className={styles.numInput}
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </label>
                <label className={styles.formLabel}>
                  Low at
                  <input
                    type="number"
                    className={styles.numInput}
                    min="0"
                    value={form.threshold}
                    onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                  />
                </label>
              </div>
              <button type="submit" className={styles.submitBtn}>Add to Tackle Box</button>
            </form>
          )}

          {!showForm && (
            <div className={styles.quickAdd}>
              <p className={styles.quickAddLabel}>Quick Add:</p>
              {Object.entries(CATEGORIES).map(([catKey, cat]) => (
                <div key={catKey} className={styles.quickAddGroup}>
                  <span className={styles.quickAddCat}>{cat.label}</span>
                  <div className={styles.quickAddBtns}>
                    {cat.presets.map((preset) => (
                      <button
                        key={preset}
                        className={styles.quickAddBtn}
                        onClick={() => handleQuickAdd(catKey, preset)}
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {Object.entries(grouped).map(([catKey, catItems]) => {
            if (catItems.length === 0) return null;
            return (
              <div key={catKey} className={styles.categoryGroup}>
                <h3 className={styles.categoryTitle}>
                  {CATEGORIES[catKey]?.label || catKey}
                  <span className={styles.categoryCount}>{catItems.length}</span>
                </h3>
                <div className={styles.itemList}>
                  {catItems.map((item) => (
                    <div key={item.id} className={`${styles.itemRow} ${item.quantity <= (item.threshold || 1) ? styles.itemLow : ''}`}>
                      <label className={styles.packedCheck}>
                        <input
                          type="checkbox"
                          checked={item.packed || false}
                          onChange={() => handleTogglePacked(item)}
                        />
                        <span className={styles.checkmark} />
                      </label>
                      <div className={styles.itemInfo}>
                        <span className={`${styles.itemName} ${item.packed ? styles.itemPacked : ''}`}>{item.name}</span>
                        {item.quantity <= (item.threshold || 1) && (
                          <span className={styles.lowTag}>Low</span>
                        )}
                      </div>
                      <div className={styles.qtyControls}>
                        <button className={styles.qtyBtn} onClick={() => handleQuantityChange(item, -1)}>-</button>
                        <span className={styles.qtyValue}>{item.quantity}</span>
                        <button className={styles.qtyBtn} onClick={() => handleQuantityChange(item, 1)}>+</button>
                      </div>
                      <button className={styles.deleteBtn} onClick={() => deleteItem(item.id)} title="Remove">
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <p className={styles.empty}>Your tackle box is empty. Add items above!</p>
          )}
        </>
      )}

      {tab === 'shopping' && (
        <div className={styles.shoppingList}>
          {lowStock.length === 0 ? (
            <p className={styles.empty}>All stocked up! No items are low.</p>
          ) : (
            lowStock.map((item) => (
              <div key={item.id} className={styles.shoppingRow}>
                <div className={styles.shoppingInfo}>
                  <span className={styles.shoppingName}>{item.name}</span>
                  <span className={styles.shoppingMeta}>
                    {CATEGORIES[item.category]?.label || item.category} — {item.quantity} left (threshold: {item.threshold || 1})
                  </span>
                </div>
                <button className={styles.restockBtn} onClick={() => updateItem(item.id, { quantity: (item.threshold || 1) + 5 })}>
                  Restock
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
