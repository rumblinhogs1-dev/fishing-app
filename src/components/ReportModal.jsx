import { useState } from 'react';
import styles from './ReportModal.module.css';

const REASONS = [
  'Spam or misleading',
  'Harassment or bullying',
  'Inappropriate content',
  'False information',
  'Other',
];

export default function ReportModal({ contentType, contentId, onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason) return;
    setSubmitting(true);
    try {
      await onSubmit({ contentType, contentId, reason, details: details.trim() });
      setSubmitted(true);
    } catch {
      // handled by parent
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <h3 className={styles.heading}>Report Submitted</h3>
          <p className={styles.thanks}>Thanks for helping keep CatchDaddy safe. We'll review this shortly.</p>
          <button className={styles.closeBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.heading}>Report {contentType}</h3>
        <form onSubmit={handleSubmit}>
          <p className={styles.label}>Why are you reporting this?</p>
          <div className={styles.reasons}>
            {REASONS.map((r) => (
              <label key={r} className={`${styles.reason} ${reason === r ? styles.selected : ''}`}>
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className={styles.radio}
                />
                {r}
              </label>
            ))}
          </div>
          <textarea
            className={styles.details}
            placeholder="Additional details (optional)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={!reason || submitting}>
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
