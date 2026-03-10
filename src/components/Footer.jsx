import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import styles from './Footer.module.css';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState({ text: '', ok: false });
  const [busy, setBusy] = useState(false);

  const auth = getAuth();
  const isLoggedIn = !!auth.currentUser;

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setBusy(true);
    setMsg({ text: '', ok: false });

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, source: 'app' }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: "You're in! We'll keep you posted.", ok: true });
        setEmail('');
      } else {
        setMsg({ text: data.error || 'Something went wrong.', ok: false });
      }
    } catch {
      setMsg({ text: 'Network error. Try again.', ok: false });
    }
    setBusy(false);
  }

  return (
    <footer className={styles.footer}>
      {!isLoggedIn && (
        <div className={styles.subscribe}>
          <p className={styles.subHeading}>Get notified at launch</p>
          <form className={styles.subForm} onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className={styles.subInput}
            />
            <button type="submit" disabled={busy} className={styles.subBtn}>
              {busy ? '...' : 'Notify Me'}
            </button>
          </form>
          {msg.text && (
            <p className={msg.ok ? styles.subSuccess : styles.subError}>{msg.text}</p>
          )}
        </div>
      )}
      <div className={styles.links}>
        <Link to="/terms">Terms of Service</Link>
        <span className={styles.divider}>|</span>
        <Link to="/privacy">Privacy Policy</Link>
        <span className={styles.divider}>|</span>
        <Link to="/pricing">Pricing</Link>
      </div>
      <p className={styles.copy}>&copy; 2026 CatchDaddy. All rights reserved.</p>
    </footer>
  );
}
