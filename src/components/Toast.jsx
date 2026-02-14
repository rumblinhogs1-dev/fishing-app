import { useToast } from '../contexts/ToastContext';
import styles from './Toast.module.css';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
          <span className={styles.message}>{toast.message}</span>
          <button className={styles.closeBtn} onClick={() => removeToast(toast.id)}>
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
