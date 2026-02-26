import { createContext, useContext, useState, useCallback, useRef } from 'react';
import styles from '../components/ConfirmDialog.module.css';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((message, opts = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ message, destructive: opts.destructive || false });
    });
  }, []);

  function handleConfirm() {
    resolveRef.current?.(true);
    setState(null);
  }

  function handleCancel() {
    resolveRef.current?.(false);
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className={styles.overlay} onClick={handleCancel}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p className={styles.message}>{state.message}</p>
            <div className={styles.actions}>
              <button className={styles.cancelBtn} onClick={handleCancel}>
                Cancel
              </button>
              <button
                className={state.destructive ? styles.confirmBtnDestructive : styles.confirmBtn}
                onClick={handleConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used within ConfirmProvider');
  return confirm;
}
