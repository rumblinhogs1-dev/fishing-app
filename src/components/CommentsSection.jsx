import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useComments } from '../hooks/useComments';
import { addComment, deleteComment } from '../utils/comments';
import styles from './CommentsSection.module.css';

export default function CommentsSection({ catchId }) {
  const { user } = useAuth();
  const { comments, loading } = useComments(catchId);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || !user) return;
    setSending(true);
    try {
      await addComment(catchId, user.uid, user.displayName || 'Angler', text.trim());
      setText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(commentId) {
    await deleteComment(commentId, catchId);
  }

  return (
    <div className={styles.container}>
      <h4 className={styles.heading}>Comments ({comments.length})</h4>

      {loading ? (
        <p className={styles.loading}>Loading comments...</p>
      ) : (
        <div className={styles.list}>
          {comments.map((c) => (
            <div key={c.id} className={styles.comment}>
              <div className={styles.commentHeader}>
                <Link to={`/user/${c.userId}`} className={styles.author}>
                  {c.displayName}
                </Link>
                <span className={styles.time}>
                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}
                </span>
                {user?.uid === c.userId && (
                  <button className={styles.deleteBtn} onClick={() => handleDelete(c.id)}>&times;</button>
                )}
              </div>
              <p className={styles.text}>{c.text}</p>
            </div>
          ))}
        </div>
      )}

      {user ? (
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            className={styles.input}
            type="text"
            placeholder="Add a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
          />
          <button type="submit" className={styles.sendBtn} disabled={sending || !text.trim()}>
            Post
          </button>
        </form>
      ) : (
        <p className={styles.signInHint}>
          <Link to="/auth">Sign in</Link> to comment.
        </p>
      )}
    </div>
  );
}
