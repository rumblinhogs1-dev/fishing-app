import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { isAdmin, getReports, getModerationLog, updateReportStatus, getUser } from '../utils/admin';
import { Navigate } from 'react-router-dom';
import styles from './AdminModeration.module.css';

function TimeAgo({ timestamp }) {
  if (!timestamp) return <span className={styles.muted}>—</span>;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return <span>just now</span>;
  if (mins < 60) return <span>{mins}m ago</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return <span>{hrs}h ago</span>;
  const days = Math.floor(hrs / 24);
  return <span>{days}d ago</span>;
}

function Badge({ type }) {
  const colors = {
    pending: { bg: '#fff3e0', color: '#e65100' },
    reviewed: { bg: '#e8f5e9', color: '#2e7d32' },
    dismissed: { bg: '#f5f5f5', color: '#888' },
    removed: { bg: '#fdecea', color: '#d32f2f' },
    message: { bg: '#e3f2fd', color: '#1565c0' },
    comment: { bg: '#f3e5f5', color: '#7b1fa2' },
    catch: { bg: '#fff8e1', color: '#f57c00' },
  };
  const c = colors[type] || colors.pending;
  return <span className={styles.badge} style={{ background: c.bg, color: c.color }}>{type}</span>;
}

export default function AdminModeration() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [tab, setTab] = useState('reports');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [reports, setReports] = useState([]);
  const [modLog, setModLog] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingLog, setLoadingLog] = useState(true);
  const [userCache, setUserCache] = useState({});

  const resolveUser = useCallback(async (uid) => {
    if (!uid) return;
    setUserCache(prev => {
      if (prev[uid]) return prev; // already cached, no update needed
      getUser(uid).then(u => {
        if (u) setUserCache(c => ({ ...c, [uid]: u }));
      });
      return prev;
    });
  }, []);

  useEffect(() => {
    if (!user || !isAdmin(user.uid)) return;
    async function load() {
      setLoadingReports(true);
      try {
        const { reports: r } = await getReports({ status: statusFilter });
        setReports(r);
        r.forEach(rep => resolveUser(rep.reportedBy));
      } catch {
        addToast('Failed to load reports', 'error');
      }
      setLoadingReports(false);
    }
    load();
  }, [statusFilter, user, resolveUser, addToast]);

  useEffect(() => {
    if (!user || !isAdmin(user.uid) || tab !== 'automod') return;
    async function load() {
      setLoadingLog(true);
      try {
        const { entries } = await getModerationLog();
        setModLog(entries);
        entries.forEach(e => resolveUser(e.userId));
      } catch {
        addToast('Failed to load moderation log', 'error');
      }
      setLoadingLog(false);
    }
    load();
  }, [tab, user, resolveUser, addToast]);

  if (!user || !isAdmin(user.uid)) {
    return <Navigate to="/" replace />;
  }

  async function handleAction(reportId, action) {
    try {
      await updateReportStatus(reportId, action, user.uid);
      setReports(prev => prev.filter(r => r.id !== reportId));
      addToast(`Report ${action}`, 'success');
    } catch {
      addToast('Failed to update report', 'error');
    }
  }

  function userName(uid) {
    const u = userCache[uid];
    return u?.displayName || u?.email || uid?.slice(0, 8) + '...' || '—';
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Moderation Dashboard</h1>
        <p className={styles.subtitle}>Review flagged content and user reports</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'reports' ? styles.active : ''}`}
          onClick={() => setTab('reports')}
        >
          User Reports
        </button>
        <button
          className={`${styles.tab} ${tab === 'automod' ? styles.active : ''}`}
          onClick={() => setTab('automod')}
        >
          Auto-Moderated
        </button>
      </div>

      {tab === 'reports' && (
        <>
          <div className={styles.filters}>
            {['pending', 'reviewed', 'dismissed'].map(s => (
              <button
                key={s}
                className={`${styles.filterBtn} ${statusFilter === s ? styles.activeFilter : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {loadingReports ? (
            <div className={styles.loading}>Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className={styles.empty}>
              <p>No {statusFilter} reports</p>
            </div>
          ) : (
            <div className={styles.list}>
              {reports.map(r => (
                <div key={r.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardMeta}>
                      <Badge type={r.contentType} />
                      <Badge type={r.status} />
                      <TimeAgo timestamp={r.createdAt} />
                    </div>
                    <span className={styles.cardId}>#{r.id.slice(0, 8)}</span>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>Reason</span>
                      <span className={styles.fieldValue}>{r.reason}</span>
                    </div>
                    {r.details && (
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Details</span>
                        <span className={styles.fieldValue}>{r.details}</span>
                      </div>
                    )}
                    <div className={styles.fieldRow}>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Reported by</span>
                        <span className={styles.fieldValue}>{userName(r.reportedBy)}</span>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Content ID</span>
                        <span className={styles.fieldValue + ' ' + styles.mono}>{r.contentId?.slice(0, 12)}...</span>
                      </div>
                    </div>
                  </div>
                  {r.status === 'pending' && (
                    <div className={styles.cardActions}>
                      <button className={styles.reviewBtn} onClick={() => handleAction(r.id, 'reviewed')}>
                        Mark Reviewed
                      </button>
                      <button className={styles.dismissBtn} onClick={() => handleAction(r.id, 'dismissed')}>
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'automod' && (
        <>
          {loadingLog ? (
            <div className={styles.loading}>Loading moderation log...</div>
          ) : modLog.length === 0 ? (
            <div className={styles.empty}>
              <p>No auto-moderated content yet</p>
            </div>
          ) : (
            <div className={styles.list}>
              {modLog.map(e => (
                <div key={e.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardMeta}>
                      <Badge type={e.contentType} />
                      <Badge type={e.action} />
                      <TimeAgo timestamp={e.createdAt} />
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>Original Text</span>
                      <span className={styles.fieldValue + ' ' + styles.flaggedText}>{e.originalText}</span>
                    </div>
                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>AI Reason</span>
                      <span className={styles.fieldValue}>{e.reason || '—'}</span>
                    </div>
                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>User</span>
                      <span className={styles.fieldValue}>{userName(e.userId)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
