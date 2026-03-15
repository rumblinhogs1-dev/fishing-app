import { useState } from 'react';
import { scanReceipt } from '../../utils/receiptScanner';
import ImageUpload from '../ImageUpload';
import styles from './TripTabs.module.css';

const CATEGORIES = ['gas', 'lodging', 'bait', 'food', 'guide', 'gear', 'other'];

export default function TripExpenses({ trip, user, onAddExpense, onRemoveExpense, toast }) {
  const [form, setForm] = useState({ description: '', amount: '', category: 'other' });
  const [splitIds, setSplitIds] = useState([]);
  const [splitAll, setSplitAll] = useState(true);
  const [receiptImage, setReceiptImage] = useState('');
  const [scanning, setScanning] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const members = trip.members || [];
  const expenses = trip.expenses || [];

  // Compute balances & settlements
  const balances = {};
  members.forEach((m) => { balances[m.userId] = 0; });
  expenses.forEach((exp) => {
    const splitCount = exp.splitWithUserIds?.length || 1;
    const perPerson = exp.amount / splitCount;
    balances[exp.paidByUserId] = (balances[exp.paidByUserId] || 0) + exp.amount;
    (exp.splitWithUserIds || []).forEach((uid) => {
      balances[uid] = (balances[uid] || 0) - perPerson;
    });
  });

  const memberMap = {};
  members.forEach((m) => { memberMap[m.userId] = m.displayName || 'Angler'; });

  const settlements = [];
  const debtors = [];
  const creditors = [];
  Object.entries(balances).forEach(([uid, bal]) => {
    const r = Math.round(bal * 100) / 100;
    if (r < -0.01) debtors.push({ uid, amount: -r });
    else if (r > 0.01) creditors.push({ uid, amount: r });
  });
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);
  let di = 0, ci = 0;
  while (di < debtors.length && ci < creditors.length) {
    const pay = Math.min(debtors[di].amount, creditors[ci].amount);
    if (pay > 0.01) {
      settlements.push({ from: memberMap[debtors[di].uid] || debtors[di].uid, to: memberMap[creditors[ci].uid] || creditors[ci].uid, amount: Math.round(pay * 100) / 100 });
    }
    debtors[di].amount -= pay;
    creditors[ci].amount -= pay;
    if (debtors[di].amount < 0.01) di++;
    if (creditors[ci].amount < 0.01) ci++;
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  // Per-member spending summary
  const memberSpending = {};
  members.forEach((m) => { memberSpending[m.userId] = { paid: 0, owes: 0 }; });
  expenses.forEach((exp) => {
    if (memberSpending[exp.paidByUserId]) memberSpending[exp.paidByUserId].paid += exp.amount;
    const splitCount = exp.splitWithUserIds?.length || 1;
    const perPerson = exp.amount / splitCount;
    (exp.splitWithUserIds || []).forEach((uid) => {
      if (memberSpending[uid]) memberSpending[uid].owes += perPerson;
    });
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.description.trim() || !form.amount) return;
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) return;

    const split = splitAll
      ? members.map((m) => m.userId)
      : splitIds.length > 0 ? splitIds : [user.uid];

    const expense = {
      id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      description: form.description.trim(),
      amount: Math.round(amount * 100) / 100,
      category: form.category,
      paidByUserId: user.uid,
      paidByName: user.displayName || 'You',
      splitWithUserIds: split,
      createdAt: new Date().toISOString(),
    };

    await onAddExpense(expense);
    setForm({ description: '', amount: '', category: 'other' });
    setSplitIds([]);
    setSplitAll(true);
    setShowForm(false);
  }

  async function handleScanReceipt() {
    if (!receiptImage) return;
    setScanning(true);
    try {
      const result = await scanReceipt(receiptImage);
      setForm({
        description: result.description,
        amount: result.total.toFixed(2),
        category: CATEGORIES.includes(result.category) ? result.category : 'other',
      });
      setSplitAll(true);
      setShowForm(true);
      setReceiptImage('');
      toast.success(`Receipt scanned: $${result.total.toFixed(2)} — ${result.description}`);
    } catch (err) {
      toast.error(err.message || 'Failed to scan receipt');
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className={styles.tabContent}>
      {/* Summary Card */}
      {expenses.length > 0 && (
        <div className={styles.expSummaryCard}>
          <div className={styles.expTotalRow}>
            <span className={styles.expTotalLabel}>Total Trip Expenses</span>
            <span className={styles.expTotalAmount}>${total.toFixed(2)}</span>
          </div>
          {members.length > 1 && (
            <div className={styles.expPerPerson}>
              ${(total / members.length).toFixed(2)} per person (even split)
            </div>
          )}
        </div>
      )}

      {/* Who Owes Who */}
      {settlements.length > 0 && (
        <div className={styles.settleCard}>
          <h4 className={styles.cardTitle}>Who Owes Who</h4>
          {settlements.map((s, i) => (
            <div key={i} className={styles.settleRow}>
              <span className={styles.settleName}>{s.from}</span>
              <span className={styles.settleArrow}>&rarr;</span>
              <span className={styles.settleName}>{s.to}</span>
              <span className={styles.settleAmount}>${s.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Per-member breakdown */}
      {expenses.length > 0 && members.length > 1 && (
        <div className={styles.memberBreakdown}>
          <h4 className={styles.cardTitle}>Per Person</h4>
          {members.map((m) => {
            const ms = memberSpending[m.userId] || { paid: 0, owes: 0 };
            const net = Math.round((ms.paid - ms.owes) * 100) / 100;
            return (
              <div key={m.userId} className={styles.memberBreakdownRow}>
                <span className={styles.memberBreakdownName}>{m.displayName || 'Angler'}</span>
                <span className={styles.memberBreakdownPaid}>Paid ${ms.paid.toFixed(2)}</span>
                <span className={net >= 0 ? styles.memberBreakdownPositive : styles.memberBreakdownNegative}>
                  {net >= 0 ? `+$${net.toFixed(2)}` : `-$${Math.abs(net).toFixed(2)}`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Expense List */}
      {expenses.length > 0 && (
        <div className={styles.expList}>
          <h4 className={styles.cardTitle}>All Expenses</h4>
          {expenses.map((exp) => (
            <div key={exp.id} className={styles.expItem}>
              <span className={styles.expCat}>{exp.category}</span>
              <div className={styles.expItemInfo}>
                <span className={styles.expItemDesc}>{exp.description}</span>
                <span className={styles.expItemPaidBy}>Paid by {exp.paidByName}</span>
              </div>
              <span className={styles.expItemAmount}>${exp.amount.toFixed(2)}</span>
              <button className={styles.expItemRemove} onClick={() => onRemoveExpense(exp.id)}>&times;</button>
            </div>
          ))}
        </div>
      )}

      {/* Receipt Scanner */}
      <div className={styles.receiptSection}>
        <h4 className={styles.cardTitle}>Scan a Receipt</h4>
        <p className={styles.receiptHint}>Take a photo of a receipt and AI will extract the total, description, and category.</p>
        <ImageUpload image={receiptImage} onChange={setReceiptImage} />
        {receiptImage && (
          <button className={styles.scanBtn} onClick={handleScanReceipt} disabled={scanning}>
            {scanning ? 'Scanning...' : 'Scan Receipt'}
          </button>
        )}
      </div>

      {/* Add Expense Form */}
      <button className={styles.addExpenseToggle} onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : '+ Add Expense Manually'}
      </button>

      {showForm && (
        <form className={styles.expForm} onSubmit={handleSubmit}>
          <div className={styles.expFormRow}>
            <input
              className={styles.expFormInput}
              placeholder="What was it for?"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <input
              className={styles.expFormInput}
              type="number"
              step="0.01"
              min="0"
              placeholder="$ Amount"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <select
            className={styles.expFormSelect}
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>

          {members.length > 1 && (
            <div className={styles.splitSection}>
              <label className={styles.splitAllLabel}>
                <input
                  type="checkbox"
                  checked={splitAll}
                  onChange={(e) => {
                    setSplitAll(e.target.checked);
                    if (e.target.checked) setSplitIds(members.map((m) => m.userId));
                  }}
                />
                Split evenly with everyone
              </label>
              {!splitAll && (
                <div className={styles.splitCheckboxes}>
                  {members.map((m) => (
                    <label key={m.userId} className={styles.splitCheckbox}>
                      <input
                        type="checkbox"
                        checked={splitIds.includes(m.userId)}
                        onChange={() => setSplitIds((prev) =>
                          prev.includes(m.userId) ? prev.filter((id) => id !== m.userId) : [...prev, m.userId]
                        )}
                      />
                      {m.displayName || 'Angler'}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <button type="submit" className={styles.expSubmitBtn} disabled={!form.description.trim() || !form.amount}>
            Add Expense
          </button>
        </form>
      )}
    </div>
  );
}
