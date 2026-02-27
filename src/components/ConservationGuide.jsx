import { useState, useMemo } from 'react';
import { CONSERVATION_GUIDE, getRotatingFacts } from '../utils/conservationTips';
import styles from './ConservationGuide.module.css';

export default function ConservationGuide() {
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState('');

  const categories = Object.entries(CONSERVATION_GUIDE);
  const funFacts = useMemo(() => getRotatingFacts(3), []);

  function toggleCategory(cat) {
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  const query = search.toLowerCase().trim();

  const filtered = query
    ? categories
        .map(([cat, tips]) => [
          cat,
          tips.filter(
            (t) =>
              t.title.toLowerCase().includes(query) ||
              t.body.toLowerCase().includes(query)
          ),
        ])
        .filter(([, tips]) => tips.length > 0)
    : categories;

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Conservation Guide</h2>
      <p className={styles.intro}>
        Best practices for catch &amp; release and protecting our waterways.
      </p>

      <div className={styles.funFactsSection}>
        <h3 className={styles.funFactsHeading}>Did You Know?</h3>
        <p className={styles.funFactsSubtitle}>New facts every day</p>
        <div className={styles.funFactsList}>
          {funFacts.map((f, i) => (
            <div key={i} className={styles.funFactCard}>
              <span className={styles.funFactCategory}>{f.category}</span>
              <p className={styles.funFactText}>{f.fact}</p>
            </div>
          ))}
        </div>
      </div>

      <input
        type="text"
        className={styles.search}
        placeholder="Search tips..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 && (
        <p className={styles.empty}>No tips match your search.</p>
      )}

      {filtered.map(([category, tips]) => {
        const isOpen = expanded[category] || !!query;

        return (
          <div key={category} className={styles.section}>
            <button className={styles.accordion} onClick={() => toggleCategory(category)}>
              <span className={styles.categoryTitle}>{category}</span>
              <span className={styles.tipCount}>{tips.length} tips</span>
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="currentColor"
                className={isOpen ? styles.chevronOpen : styles.chevron}
              >
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>

            {isOpen && (
              <div className={styles.tips}>
                {tips.map((tip) => (
                  <div key={tip.title} className={styles.tipCard}>
                    <h4 className={styles.tipTitle}>{tip.title}</h4>
                    <p className={styles.tipBody}>{tip.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
