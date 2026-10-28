import React, { useState } from 'react';
import { NotificationItem, AppUser } from '../../types/football';
import { Ico, I } from '../common/Icons';
import { ago } from '../../lib/saviourData';
import { supabase } from '../../utils/supabase';

interface NotificationsPageProps {
  notifications: NotificationItem[];
  readIds: (number | string)[];
  onMarkAllRead: () => void;
  onReadNotification: (id: number | string) => void;
  onOpenMatch: (matchId: number) => void;
  onBack: () => void;
  user?: AppUser | null;
  onSendNotification?: (notif: { title: string; message: string; type?: string; matchId?: number }) => Promise<void>;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  notifications,
  readIds,
  onMarkAllRead,
  onReadNotification,
  onOpenMatch,
  onBack,
  user,
  onSendNotification,
}) => {
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'banker' | 'promo'>('all');
  const [showComposer, setShowComposer] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'info' | 'banker' | 'score' | 'promo'>('banker');
  const [isSending, setIsSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifMessage.trim()) {
      showToast('Please enter a notification message.');
      return;
    }

    try {
      setIsSending(true);
      const title = notifTitle.trim() || (notifType === 'banker' ? '🔥 Lock Banker Pick' : '📢 SpiderPicks Update');
      const message = notifMessage.trim();

      if (onSendNotification) {
        await onSendNotification({ title, message, type: notifType });
      } else {
        // Direct Supabase insert
        await supabase.from('notifications').insert({
          title,
          message,
          type: notifType,
          user_id: null, // Broadcast to all users
        });
      }

      setNotifTitle('');
      setNotifMessage('');
      setShowComposer(false);
      showToast('⚡ Realtime notification broadcast to all users!');
    } catch (err: any) {
      console.error('Error broadcasting notification:', err);
      showToast('Failed to broadcast. Saved locally.');
    } finally {
      setIsSending(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const isUnread = !readIds.includes(n.id);
    if (activeFilter === 'unread') return isUnread;
    if (activeFilter === 'banker') return n.type === 'banker' || n.x.toLowerCase().includes('pick') || n.x.toLowerCase().includes('banker');
    if (activeFilter === 'promo') return n.type === 'promo' || n.x.toLowerCase().includes('vip') || n.x.toLowerCase().includes('welcome');
    return true;
  });

  const unreadTotal = notifications.filter((n) => !readIds.includes(n.id)).length;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '90px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0f172a',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '99px',
            fontSize: '13px',
            fontWeight: 700,
            zIndex: 9999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <div className="subpage-nav-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
        <button
          type="button"
          className="subpage-back-btn"
          onClick={onBack}
          aria-label="Back"
          style={{
            background: 'var(--s2)',
            border: '1px solid var(--b)',
            padding: '6px 14px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--tx)',
          }}
        >
          &larr; Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="subpage-title" style={{ fontSize: '16px', fontWeight: 800 }}>
            Notifications
          </span>
          {unreadTotal > 0 && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 900,
                background: '#ef4444',
                color: '#fff',
                padding: '2px 7px',
                borderRadius: '10px',
              }}
            >
              {unreadTotal} new
            </span>
          )}
        </div>

        <button
          type="button"
          className="mk2 subpage-action-btn"
          onClick={onMarkAllRead}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--g)',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          Mark all read
        </button>
      </div>

      {/* Realtime Live Connection Header */}
      <div
        style={{
          background: 'var(--s)',
          borderBottom: '1px solid var(--b)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981',
            }}
          />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--tx)' }}>
            Realtime Live Alerts Active
          </span>
          <span style={{ fontSize: '11px', color: 'var(--mu)' }}>
            (Supabase WebSocket)
          </span>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowComposer(!showComposer)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--g)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{showComposer ? '✕ Close Composer' : '+ Broadcast Alert'}</span>
          </button>
        )}
      </div>

      {/* Admin Broadcast Composer */}
      {isAdmin && showComposer && (
        <form
          onSubmit={handleBroadcast}
          style={{
            background: 'var(--s2)',
            border: '1.5px solid var(--g)',
            borderRadius: '14px',
            margin: '14px 16px',
            padding: '16px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--tx)' }}>
              📢 Broadcast Realtime Notification to All Users
            </span>
            <span style={{ fontSize: '10px', fontWeight: 800, background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px' }}>
              ADMIN
            </span>
          </div>

          <div style={{ display: 'grid', gap: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mu)', display: 'block', marginBottom: '4px' }}>
                  Alert Title (Optional)
                </label>
                <input
                  type="text"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="e.g. 🔥 Lock Banker of the Day"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--b)',
                    background: 'var(--s)',
                    color: 'var(--tx)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mu)', display: 'block', marginBottom: '4px' }}>
                  Category
                </label>
                <select
                  value={notifType}
                  onChange={(e) => setNotifType(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--b)',
                    background: 'var(--s)',
                    color: 'var(--tx)',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  <option value="banker">Banker Pick</option>
                  <option value="score">Live Goal</option>
                  <option value="promo">VIP / Promo</option>
                  <option value="info">General Info</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mu)', display: 'block', marginBottom: '4px' }}>
                Notification Message *
              </label>
              <textarea
                rows={3}
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                placeholder="Arsenal v Chelsea: High value pick confirmed. Kickoff in 2 hours."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--b)',
                  background: 'var(--s)',
                  color: 'var(--tx)',
                  fontSize: '13px',
                  resize: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowComposer(false)}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid var(--b)',
                color: 'var(--tx)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              style={{
                padding: '7px 18px',
                borderRadius: '8px',
                background: 'var(--g)',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {isSending ? 'Transmitting...' : '⚡ Send Instant Broadcast'}
            </button>
          </div>
        </form>
      )}

      {/* Category Pills Filter */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 16px',
          overflowX: 'auto',
          borderBottom: '1px solid var(--b)',
          background: 'var(--s)',
        }}
      >
        {[
          { id: 'all', label: `All (${notifications.length})` },
          { id: 'unread', label: `Unread (${unreadTotal})` },
          { id: 'banker', label: 'Banker Picks' },
          { id: 'promo', label: 'Announcements' },
        ].map((tab) => {
          const active = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as any)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: active ? 'none' : '1px solid var(--b)',
                background: active ? 'var(--g)' : 'var(--s2)',
                color: active ? '#ffffff' : 'var(--tx)',
                fontSize: '12px',
                fontWeight: active ? 800 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div style={{ marginTop: '4px' }}>
        {filteredNotifications.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 20px',
              color: 'var(--mu)',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔔</div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--tx)', marginBottom: '4px' }}>
              No notifications here
            </div>
            <div style={{ fontSize: '12px' }}>
              {activeFilter === 'unread'
                ? "You're all caught up! New alerts will arrive in real time."
                : 'No alerts match this filter.'}
            </div>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isUnread = !readIds.includes(n.id);

            return (
              <div
                key={n.id}
                className="row nt"
                onClick={() => {
                  onReadNotification(n.id);
                  if (n.m) onOpenMatch(n.m);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--b)',
                  background: isUnread ? 'rgba(10, 125, 55, 0.04)' : 'transparent',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.15s ease',
                }}
              >
                {/* Notification Icon */}
                <span
                  className="nic"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background:
                      n.type === 'banker'
                        ? 'rgba(239, 68, 68, 0.1)'
                        : n.type === 'score'
                        ? 'rgba(59, 130, 246, 0.1)'
                        : 'rgba(10, 125, 55, 0.1)',
                    color:
                      n.type === 'banker'
                        ? '#ef4444'
                        : n.type === 'score'
                        ? '#3b82f6'
                        : 'var(--g)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                    flexShrink: 0,
                  }}
                >
                  <Ico path={I.b} />
                </span>

                {/* Notification Content */}
                <span
                  className="tms"
                  style={{
                    flex: 1,
                    fontWeight: isUnread ? 700 : 500,
                    fontSize: '13px',
                    lineHeight: 1.4,
                    color: 'var(--tx)',
                  }}
                >
                  {n.title && (
                    <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--tx)', marginBottom: '2px' }}>
                      {n.title}
                    </div>
                  )}
                  <div>{n.x}</div>
                  <small
                    style={{
                      color: 'var(--mu)',
                      fontWeight: 500,
                      fontSize: '11px',
                      display: 'block',
                      marginTop: '4px',
                    }}
                  >
                    {ago(n.t)} {n.m ? '• Tap to open match' : ''}
                  </small>
                </span>

                {/* Unread dot indicator */}
                {isUnread && (
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--g)',
                      marginLeft: '10px',
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
