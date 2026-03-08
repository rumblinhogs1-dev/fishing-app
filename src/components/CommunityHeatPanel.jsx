import styles from './CommunityHeatPanel.module.css';

export default function CommunityHeatPanel({ waterBodyAggregates, heatPoints, onClose }) {
  const totalCatches = waterBodyAggregates.reduce((sum, wb) => sum + wb.totalCatches, 0)
    + (heatPoints?.length || 0);

  const sorted = [...waterBodyAggregates].sort((a, b) => b.totalCatches - a.totalCatches);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Community Activity</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className={styles.summary}>
          <span className={styles.tag}>{waterBodyAggregates.length} water bod{waterBodyAggregates.length !== 1 ? 'ies' : 'y'}</span>
          <span className={styles.tag}>{totalCatches} total catch{totalCatches !== 1 ? 'es' : ''}</span>
        </div>

        {sorted.length === 0 ? (
          <div className={styles.empty}>
            <p>No community data yet. Be the first to share your catches!</p>
          </div>
        ) : (
          <div className={styles.cards}>
            {sorted.map((wb) => (
              <div key={wb.waterBody} className={styles.card}>
                <div className={styles.cardHeader}>
                  <strong className={styles.cardName}>{wb.waterBody}</strong>
                  <span className={styles.cardCount}>{wb.totalCatches} catch{wb.totalCatches !== 1 ? 'es' : ''}</span>
                </div>
                {wb.species.length > 0 && (
                  <div className={styles.speciesTags}>
                    {wb.species.slice(0, 5).map((s) => (
                      <span key={s.name} className={styles.speciesTag}>
                        {s.name} ({s.count})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
