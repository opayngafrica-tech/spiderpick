import React from 'react';
import { NotificationItem } from '../../types/football';
import { Ico, I } from '../common/Icons';
import { ago } from '../../lib/saviourData';

interface NotificationsPageProps {
  notifications: NotificationItem[];
  readIds: number[];
  onMarkAllRead: () => void;
  onReadNotification: (id: number) => void;
  onOpenMatch: (matchId: number) => void;
  onBack: () => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  notifications,
  readIds,
  onMarkAllRead,
  onReadNotification,
  onOpenMatch,
  onBack,
}) => {
  return (
    <>
      <div className="subpage-nav-bar">
        <button type="button" className="subpage-back-btn" onClick={onBack} aria-label="Back">
          &larr; Back
        </button>
        <span className="subpage-title">Notifications</span>
        <button className="mk2 subpage-action-btn" onClick={onMarkAllRead}>
          Mark all read
        </button>
      </div>

      <div style={{ marginTop: '8px' }}>
        {notifications.map((n) => {
          const isUnread = !readIds.includes(n.id);

          return (
            <a
              key={n.id}
              className="row nt"
              onClick={() => {
                onReadNotification(n.id);
                if (n.m) onOpenMatch(n.m);
                else onBack();
              }}
            >
              <span className="nic">
                <Ico path={I.b} />
              </span>
              <span
                className="tms"
                style={{ fontWeight: 600, fontSize: '14px', lineHeight: 1.35 }}
              >
                {n.x}
                <small style={{ color: 'var(--mu)', fontWeight: 500 }}>
                  {ago(n.t)}
                </small>
              </span>
              {isUnread && <i className="dot"></i>}
            </a>
          );
        })}
      </div>
    </>
  );
};
