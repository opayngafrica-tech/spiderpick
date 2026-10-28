import React, { useState } from 'react';
import { SocialHandleItem, AppUser } from '../../types/football';
import { SocialIcon } from '../common/SocialIcons';
import { updateRemoteSocialLink, saveLocalSocialLinks } from '../../lib/socialData';

interface SocialPageProps {
  user?: AppUser | null;
  socialLinks: SocialHandleItem[];
  onUpdateSocialLinks: (updated: SocialHandleItem[]) => void;
  onBack: () => void;
  onOpenNotifications?: () => void;
  onOpenSignIn?: () => void;
}

export const SocialPage: React.FC<SocialPageProps> = ({
  user,
  socialLinks,
  onUpdateSocialLinks,
  onBack,
}) => {
  const isAdmin = user?.role === 'admin';
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editHandle, setEditHandle] = useState('');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = (id: string, url: string) => {
    if (!url) {
      showToast('No link configured yet.');
      return;
    }
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      showToast('Link copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    if (!isAdmin) return;
    const nextActive = !currentActive;
    const updated = socialLinks.map((item) =>
      item.id === id ? { ...item, isActive: nextActive } : item
    );
    onUpdateSocialLinks(updated);
    saveLocalSocialLinks(updated);

    showToast(`${id.toUpperCase()} channel is now ${nextActive ? 'ACTIVE' : 'DISABLED'}`);
    await updateRemoteSocialLink({ id, isActive: nextActive });
  };

  const startEditing = (item: SocialHandleItem) => {
    setEditingId(item.id);
    setEditUrl(item.url);
    setEditHandle(item.handle);
    setEditName(item.name);
    setEditDesc(item.description);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    setSaving(true);
    const updated = socialLinks.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          url: editUrl.trim(),
          handle: editHandle.trim(),
          name: editName.trim() || item.name,
          description: editDesc.trim() || item.description,
          isActive: editUrl.trim().length > 0 ? item.isActive : false,
        };
      }
      return item;
    });

    onUpdateSocialLinks(updated);
    saveLocalSocialLinks(updated);

    const success = await updateRemoteSocialLink({
      id,
      url: editUrl.trim(),
      handle: editHandle.trim(),
      name: editName.trim(),
      description: editDesc.trim(),
      isActive: editUrl.trim().length > 0,
    });

    setSaving(false);
    setEditingId(null);
    showToast(success ? 'Link updated & synced with Supabase!' : 'Saved locally! (Syncing Supabase)');
  };

  const activeCount = socialLinks.filter((s) => s.isActive).length;

  return (
    <div className="social-page-container" style={{ paddingBottom: '90px' }}>
      {/* Toast popup */}
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

      {/* Top Header Bar */}
      <div className="subpage-nav-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
        <button
          type="button"
          className="subpage-back-btn"
          onClick={onBack}
          aria-label="Back to previous page"
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
        <span className="subpage-title" style={{ fontSize: '16px', fontWeight: 800 }}>
          Community & Socials
        </span>
        <div style={{ width: '60px', textAlign: 'right' }}>
          {isAdmin && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 900,
                background: '#dcfce7',
                color: '#15803d',
                padding: '3px 8px',
                borderRadius: '6px',
                textTransform: 'uppercase',
              }}
            >
              Admin
            </span>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 16px' }}>
        {/* Hero Section */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0a3d24 0%, #0d5f36 50%, #0a7d37 100%)',
            borderRadius: '16px',
            padding: '24px 20px',
            color: '#ffffff',
            marginTop: '12px',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(10, 125, 55, 0.25)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: '-20px',
              bottom: '-20px',
              width: '140px',
              height: '140px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, marginBottom: '12px' }}>
            <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80' }}></span>
            OFFICIAL CHANNELS
          </div>

          <h1 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 8px 0', letterSpacing: '-0.4px', lineHeight: 1.25 }}>
            Follow SpiderPicks
          </h1>
          <p style={{ fontSize: '13px', margin: 0, opacity: 0.9, lineHeight: 1.5, maxWidth: '520px' }}>
            Join our verified digital communities for real-time banker picks, live goal alerts, fixtures insights, and matchday discussions.
          </p>

          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '12px', fontWeight: 700 }}>
            <div>
              <b style={{ fontSize: '15px' }}>{activeCount}</b> Active Channels
            </div>
            <div>&bull;</div>
            <div>
              <b style={{ fontSize: '15px' }}>100%</b> Verified Slips
            </div>
            <div>&bull;</div>
            <div>
              <b style={{ fontSize: '15px' }}>24/7</b> Live Updates
            </div>
          </div>
        </div>

        {/* Admin Banner & Switch Notice */}
        {isAdmin && (
          <div
            style={{
              background: '#f0fdf4',
              border: '1.5px solid #86efac',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#166534' }}>
                🛡️ Administrator Social Management Mode
              </div>
              <div style={{ fontSize: '11px', color: '#15803d', marginTop: '2px' }}>
                You can set links, customize handles, and toggle public visibility for any social platform.
              </div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#166534', background: '#dcfce7', padding: '4px 10px', borderRadius: '6px' }}>
              Realtime Synced
            </span>
          </div>
        )}

        {/* Social Platforms List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {socialLinks.map((item) => {
            const isEditing = editingId === item.id;
            const hasUrl = Boolean(item.url && item.url.trim().length > 0);

            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--s)',
                  border: isEditing
                    ? '2px solid var(--g)'
                    : item.isActive
                    ? '1px solid var(--b)'
                    : '1px dashed var(--b)',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  boxShadow: item.isActive ? '0 2px 10px rgba(0,0,0,0.03)' : 'none',
                  opacity: item.isActive || isAdmin ? 1 : 0.65,
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Header row of card: Icon + Info + Action/Toggle */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* Platform Icon with dedicated brand badge */}
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        background: item.bgGradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      }}
                    >
                      <SocialIcon platform={item.id} size={24} color="#ffffff" />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--tx)' }}>
                          {item.name}
                        </h3>

                        {/* Status Badges */}
                        {item.isActive ? (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              background: '#dcfce7',
                              color: '#15803d',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            Active
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              background: 'var(--s2)',
                              color: 'var(--mu)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            Coming Soon
                          </span>
                        )}

                        {item.badge && item.isActive && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              background: 'rgba(10, 125, 55, 0.1)',
                              color: 'var(--g)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--mu)', marginTop: '2px', fontWeight: 600 }}>
                        {item.handle}
                      </div>
                    </div>
                  </div>

                  {/* Admin Direct Toggle Switch */}
                  {isAdmin && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: item.isActive ? '#15803d' : 'var(--mu)' }}>
                        {item.isActive ? 'ON' : 'OFF'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item.id, item.isActive)}
                        aria-label={`Toggle ${item.name}`}
                        style={{
                          width: '44px',
                          height: '24px',
                          borderRadius: '12px',
                          background: item.isActive ? '#10b981' : '#cbd5e1',
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          padding: '2px',
                          transition: 'background 0.2s ease',
                        }}
                      >
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            transform: item.isActive ? 'translateX(20px)' : 'translateX(0)',
                            transition: 'transform 0.2s ease',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          }}
                        />
                      </button>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p style={{ fontSize: '13px', color: 'var(--tx)', margin: '12px 0 16px 0', lineHeight: 1.45, opacity: 0.9 }}>
                  {item.description}
                </p>

                {/* Inline Admin Editor */}
                {isEditing ? (
                  <div
                    style={{
                      background: 'var(--s2)',
                      borderRadius: '12px',
                      padding: '14px',
                      marginTop: '10px',
                      border: '1px solid var(--b)',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 800, marginBottom: '10px', color: 'var(--tx)' }}>
                      Edit {item.name} Settings
                    </div>

                    <div style={{ display: 'grid', gap: '10px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mu)', display: 'block', marginBottom: '4px' }}>
                          Target URL (Full Link)
                        </label>
                        <input
                          type="url"
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          placeholder="https://..."
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

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mu)', display: 'block', marginBottom: '4px' }}>
                            Handle / Display Username
                          </label>
                          <input
                            type="text"
                            value={editHandle}
                            onChange={(e) => setEditHandle(e.target.value)}
                            placeholder="@spiderpicks"
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
                            Display Title
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Telegram Official"
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
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mu)', display: 'block', marginBottom: '4px' }}>
                          Short Description
                        </label>
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="What users get from following..."
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
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={saving}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--b)',
                          background: 'transparent',
                          color: 'var(--tx)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveEdit(item.id)}
                        disabled={saving}
                        style={{
                          padding: '7px 18px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'var(--g)',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {saving ? 'Saving...' : 'Save & Publish'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Action Buttons: Follow CTA + Copy Link + Admin Edit */
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {item.isActive && hasUrl ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '9px 18px',
                          borderRadius: '10px',
                          background: item.color,
                          color: '#ffffff',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: 800,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          cursor: 'pointer',
                        }}
                      >
                        <span>Follow on {item.name.split(' ')[0]}</span>
                        <span>&nearr;</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        style={{
                          padding: '9px 16px',
                          borderRadius: '10px',
                          background: 'var(--s2)',
                          color: 'var(--mu)',
                          border: '1px solid var(--b)',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'not-allowed',
                        }}
                      >
                        {hasUrl ? 'Temporarily Inactive' : 'Handle Coming Soon'}
                      </button>
                    )}

                    {hasUrl && (
                      <button
                        type="button"
                        onClick={() => handleCopy(item.id, item.url)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '9px 14px',
                          borderRadius: '10px',
                          background: 'var(--s2)',
                          border: '1px solid var(--b)',
                          color: 'var(--tx)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <span>{copiedId === item.id ? '✓ Copied' : '🔗 Copy Link'}</span>
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => startEditing(item)}
                        style={{
                          marginLeft: 'auto',
                          padding: '7px 12px',
                          borderRadius: '8px',
                          background: 'transparent',
                          border: '1px solid var(--b)',
                          color: 'var(--g)',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        ⚙️ Edit Link
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Community Guidelines & Safety Footer */}
        <div
          style={{
            marginTop: '28px',
            padding: '16px 20px',
            borderRadius: '14px',
            background: 'var(--s2)',
            border: '1px solid var(--b)',
            fontSize: '12px',
            color: 'var(--mu)',
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontWeight: 800, color: 'var(--tx)', marginBottom: '4px' }}>
            🔒 Official Verification Notice
          </div>
          SpiderPicks will never ask for your private passwords or seed phrases on Telegram, Facebook, or any other social channel. Always ensure you are visiting our verified handles listed above.
        </div>
      </div>
    </div>
  );
};
