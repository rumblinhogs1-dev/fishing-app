import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../hooks/useChat';
import { sendMessage } from '../utils/chat';
import styles from './ChatRoom.module.css';

export default function ChatRoom() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const { messages, loading } = useMessages(groupId);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !user) return;
    setSending(true);
    try {
      await sendMessage(groupId, user.uid, user.displayName || 'Angler', text.trim());
      setText('');
    } catch (err) {
      console.error('Failed to send:', err);
    } finally {
      setSending(false);
    }
  }

  if (!user) return <p className={styles.empty}>Please sign in to chat.</p>;
  if (loading) return <p className={styles.loading}>Loading messages...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/chat" className={styles.backBtn}>&#8592;</Link>
        <h3 className={styles.heading}>Chat</h3>
        <Link to={`/chat/${groupId}/settings`} className={styles.settingsBtn}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z" />
          </svg>
        </Link>
      </div>

      <div className={styles.messages}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.bubble} ${msg.userId === user.uid ? styles.own : styles.other}`}
          >
            {msg.userId !== user.uid && (
              <span className={styles.sender}>{msg.displayName}</span>
            )}
            <p className={styles.msgText}>{msg.text}</p>
            <span className={styles.msgTime}>
              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSend} className={styles.inputRow}>
        <input
          className={styles.input}
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={sending}
        />
        <button type="submit" className={styles.sendBtn} disabled={sending || !text.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
