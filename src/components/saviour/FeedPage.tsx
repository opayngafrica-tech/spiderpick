import React, { useState } from 'react';
import { PostItem, MatchItem } from '../../types/football';
import { Crest } from '../common/Crest';
import { Ico, I } from '../common/Icons';
import { WatermarkImage } from '../common/WatermarkLoader';
import { ago } from '../../lib/saviourData';

interface FeedPageProps {
  user: { n: string; e: string } | null;
  posts: PostItem[];
  matches?: MatchItem[];
  onAddPost: (newPost: Omit<PostItem, 'id' | 't' | 'lk' | 'liked' | 'cm'>) => void;
  onLikePost: (postId: number) => void;
  onAddComment: (postId: number, comment: string) => void;
  onOpenMatch: (matchId: number) => void;
  onOpenNotifications: () => void;
  onOpenMembership?: () => void;
  onOpenSignIn?: () => void;
  onGoToLanding?: () => void;
  onOpenMenu?: () => void;
  unreadCount: number;
}

export const FeedPage: React.FC<FeedPageProps> = ({
  user,
  posts,
  matches = [],
  onAddPost,
  onLikePost,
  onAddComment,
  onOpenMatch,
  onOpenNotifications,
  onOpenMembership,
  onOpenSignIn,
  onGoToLanding,
  onOpenMenu,
  unreadCount,
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [openComments, setOpenComments] = useState<Set<number>>(new Set());
  const [copiedCodes, setCopiedCodes] = useState<Record<number, boolean>>({});
  const [copiedShareToast, setCopiedShareToast] = useState(false);

  // Compose sheet form state
  const [dcap, setDcap] = useState('');
  const [dcode, setDcode] = useState('');
  const [dbk, setDbk] = useState('SportyBet');
  const [drafts, setDrafts] = useState<string[]>([]);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});

  // Real-time post feed
  const allPosts = posts;

  const toggleComments = (id: number) => {
    setOpenComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodes((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedCodes((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const handleShare = async (p: PostItem) => {
    const text = (p.txt || '').slice(0, 100);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Spider Picks',
          text,
          url: window.location.href,
        });
      } catch (err) {
        // cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShareToast(true);
      setTimeout(() => setCopiedShareToast(false), 2200);
    }
  };

  const handlePickFiles = (files: FileList | null) => {
    if (!files) return;
    const fs = Array.from(files).slice(0, 6 - drafts.length);

    Promise.all(
      fs.map(
        (f) =>
          new Promise<string | null>((resolve) => {
            const rd = new FileReader();
            rd.onload = () => {
              const img = new Image();
              img.onload = () => {
                const s = Math.min(1, 900 / Math.max(img.width, img.height));
                const c = document.createElement('canvas');
                c.width = img.width * s;
                c.height = img.height * s;
                const ctx = c.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0, c.width, c.height);
                  resolve(c.toDataURL('image/jpeg', 0.72));
                } else {
                  resolve(null);
                }
              };
              img.onerror = () => resolve(null);
              img.src = rd.result as string;
            };
            rd.readAsDataURL(f);
          })
      )
    ).then((images) => {
      setDrafts((prev) => [...prev, ...(images.filter(Boolean) as string[])]);
    });
  };

  const handleCreatePost = () => {
    if (!user) {
      if (onOpenSignIn) onOpenSignIn();
      return;
    }
    const code = dcode.replace(/[^\w-]/g, '').slice(0, 24);
    const txt = dcap.trim();
    if (!txt && !drafts.length && !code) return;

    onAddPost({
      n: user.n,
      txt,
      imgs: drafts,
      img: drafts[0],
      code: code || undefined,
      bk: code ? dbk : undefined,
    });

    setDcap('');
    setDcode('');
    setDrafts([]);
    setSheetOpen(false);
  };

  // Like with authentication enforcement
  const handleLikeClick = (postId: number) => {
    if (!user) {
      if (onOpenSignIn) onOpenSignIn();
      return;
    }
    onLikePost(postId);
  };

  // Comment with authentication enforcement
  const handleSendComment = (postId: number) => {
    if (!user) {
      if (onOpenSignIn) onOpenSignIn();
      return;
    }
    const val = (commentInputs[postId] || '').trim();
    if (!val) return;

    onAddComment(postId, val);
    setCommentInputs({ ...commentInputs, [postId]: '' });
  };

  const renderGrid = (imgs?: string[]) => {
    if (!imgs || !imgs.length) return null;
    const n = imgs.length;
    const extra = n - 5;
    const gridClass = `gr g${Math.min(n, 5)}`;

    return (
      <div className={gridClass}>
        {imgs.slice(0, 5).map((src, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <WatermarkImage src={src} alt="SpiderPicks Match Screenshot" />
            {i === 4 && extra > 0 && <b className="mo">+{extra}</b>}
          </div>
        ))}
      </div>
    );
  };

  const banker = matches.length > 0 ? (matches.find((m) => m.id === 1) || matches[0]) : null;

  return (
    <>
      {/* Floating Copied Toast */}
      {copiedShareToast && (
        <div
          style={{
            position: 'fixed',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            background: 'var(--g)',
            color: '#fff',
            padding: '8px 18px',
            borderRadius: '99px',
            fontSize: '13px',
            fontWeight: 700,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            animation: 'upk 0.25s ease-out',
          }}
        >
          ✓ Link copied to clipboard!
        </div>
      )}

      {/* Main Container - Responsive Dual Column on Tablet/Desktop */}
      <div className="feed-layout-grid">
        {/* Left Column: Feed Stream */}
        <div>
          {/* Composer Trigger */}
          <div className="cmpz">
            <Crest name={user ? user.n : 'Guest'} />
            <button
              onClick={() => {
                if (!user && onOpenSignIn) {
                  onOpenSignIn();
                } else {
                  setSheetOpen(true);
                }
              }}
            >
              {user ? 'What is on your mind?' : 'Sign in to post analysis & booking codes...'}
            </button>
          </div>

          {/* Posts Stream */}
          {allPosts.length === 0 ? (
            <div
              className="card rvs in"
              style={{
                textAlign: 'center',
                padding: '52px 20px',
                background: 'var(--s)',
                borderRadius: '16px',
                border: '1px solid var(--b)',
                margin: '12px 0',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(10, 125, 55, 0.08)',
                  color: 'var(--g)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>

              <b style={{ fontSize: '18px', color: 'var(--tx)', display: 'block', marginBottom: '6px' }}>
                No posts yet
              </b>
              <p style={{ fontSize: '13px', color: 'var(--mu)', margin: '0 auto 18px', maxWidth: '380px', lineHeight: 1.5 }}>
                There are no community feed posts in the database yet. Be the first to share match predictions, tips, or booking codes!
              </p>

              <button
                onClick={() => {
                  if (!user && onOpenSignIn) {
                    onOpenSignIn();
                  } else {
                    setSheetOpen(true);
                  }
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: '99px',
                  background: 'var(--g)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(10, 125, 55, 0.25)',
                }}
              >
                {user ? '+ Create First Post' : 'Sign In to Post'}
              </button>
            </div>
          ) : (
            allPosts.map((p) => {
              const isCommentOpen = openComments.has(p.id);

              return (
              <article className="post" key={p.id}>
                <div className="ph">
                  <span className="av">
                    <Crest name={p.n} />
                  </span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <b>{p.n}</b>
                      {(p.n.toLowerCase().includes('admin') || p.n.toLowerCase().includes('spider picks') || p.n.toLowerCase().includes('moderator')) && (
                        <span
                          style={{
                            background: '#d97706',
                            color: '#ffffff',
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            letterSpacing: '0.4px',
                            textTransform: 'uppercase',
                          }}
                        >
                          Admin
                        </span>
                      )}
                    </div>
                    <small>
                      {ago(p.t)} &bull; <Ico path={I.g} />
                    </small>
                  </div>
                </div>

                {p.txt && <p>{p.txt}</p>}

                {renderGrid(p.imgs)}

                {p.code && (
                  <div className="cd">
                    <div>
                      <small>{p.bk}</small>
                      <b>{p.code}</b>
                    </div>
                    <button onClick={() => handleCopyCode(p.id, p.code!)}>
                      {copiedCodes[p.id] ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}

                {p.m && (
                  <a className="lk" onClick={() => onOpenMatch(p.m!)}>
                    Open match &rsaquo;
                  </a>
                )}

                <div className="rc">
                  <span>
                    {p.lk > 0 && (
                      <>
                        <i className="tb" style={{ background: '#ef4444' }}>
                          <Ico path={I.t} />
                        </i>
                        {p.lk}
                      </>
                    )}
                  </span>
                  <span onClick={() => toggleComments(p.id)}>
                    {p.cm && p.cm.length ? `${p.cm.length} comments` : ''}
                  </span>
                </div>

                {/* Like Button: requires sign in if guest */}
                <div className="ac">
                  <button
                    className={p.liked ? 'lkd' : ''}
                    onClick={() => handleLikeClick(p.id)}
                  >
                    <Ico path={I.t} />
                    Like
                  </button>
                  <button onClick={() => toggleComments(p.id)}>
                    <Ico path={I.c} />
                    Comment
                  </button>
                  <button onClick={() => handleShare(p)}>
                    <Ico path={I.s} />
                    <span>Share</span>
                  </button>
                </div>

                {/* Comments section */}
                {isCommentOpen && (
                  <div className="cms">
                    {p.cm && p.cm.length > 0 ? (
                      p.cm.map((c, idx) => (
                        <div className="cm" key={idx}>
                          <Crest name={c.n} />
                          <div>
                            <b>{c.n}</b> {c.x}
                            <small>{ago(c.t)}</small>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--mu)', textAlign: 'center' }}>
                        No comments yet. Be the first to share your thoughts!
                      </div>
                    )}

                    {/* Comment Composer: only for logged in user; guest gets sign-in CTA */}
                    {user ? (
                      <div className="ci">
                        <input
                          id={`c${p.id}`}
                          placeholder="Write a comment..."
                          value={commentInputs[p.id] || ''}
                          onChange={(e) =>
                            setCommentInputs({ ...commentInputs, [p.id]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSendComment(p.id);
                            }
                          }}
                        />
                        <button onClick={() => handleSendComment(p.id)}>
                          Send
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          if (onOpenSignIn) onOpenSignIn();
                        }}
                        style={{
                          marginTop: '10px',
                          padding: '12px 14px',
                          background: 'var(--s2)',
                          border: '1px solid var(--ln)',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: '13px', color: 'var(--mu)', fontWeight: 600 }}>
                          Log in to comment and join the discussion
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenSignIn) onOpenSignIn();
                          }}
                          style={{
                            background: 'var(--g)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '99px',
                            padding: '5px 14px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Sign In
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          }))}
        </div>

        {/* Right Sidebar (Desktop & Tablet View) */}
        <div className="hidden md:block space-y-4" style={{ position: 'sticky', top: '80px' }}>
          {/* Banker Highlight Card (Only if real matches exist) */}
          {banker && (
            <div className="card" style={{ padding: '16px', background: 'var(--s)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--g)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ⭐ Banker of the Day
                </span>
                <span style={{ fontSize: '11px', color: 'var(--mu)' }}>{banker.l}</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--tx)', marginBottom: '8px' }}>
                {banker.h} vs {banker.a}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--s2)', padding: '10px 12px', borderRadius: '10px' }}>
                <div>
                  <small style={{ color: 'var(--mu)', display: 'block', fontSize: '11px' }}>Pick</small>
                  <b style={{ color: 'var(--g)', fontSize: '14px' }}>{banker.tip}</b>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <small style={{ color: 'var(--mu)', display: 'block', fontSize: '11px' }}>Confidence</small>
                  <b style={{ fontSize: '15px' }}>{banker.c}%</b>
                </div>
              </div>
              <button
                onClick={() => onOpenMatch(banker.id)}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  height: '38px',
                  borderRadius: '99px',
                  background: 'var(--g)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                View Match Analysis
              </button>
            </div>
          )}

          {/* VIP Membership Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--g2) 0%, var(--g) 100%)',
              color: '#ffffff',
              borderRadius: '16px',
              padding: '18px',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', opacity: 0.85 }}>
              Spider Picks VIP Club
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '2px', marginBottom: '6px' }}>
              VIP Membership
            </div>
            <p style={{ fontSize: '12px', opacity: 0.9, lineHeight: 1.4, marginBottom: '12px' }}>
              We have membership club benefits coming soon with banker accas, xG models, and analyst hotline.
            </p>
            {onOpenMembership && (
              <button
                onClick={onOpenMembership}
                style={{
                  width: '100%',
                  height: '38px',
                  borderRadius: '99px',
                  background: '#ffffff',
                  color: 'var(--g2)',
                  fontWeight: 800,
                  fontSize: '12px',
                }}
              >
                Learn More & Join Waitlist
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button (Mobile) - Prompt sign in if guest */}
      <button
        className="fab"
        onClick={() => {
          if (!user && onOpenSignIn) {
            onOpenSignIn();
          } else {
            setSheetOpen(true);
          }
        }}
        aria-label="New post"
      >
        +
      </button>

      {/* Compose Post Sheet Modal */}
      {sheetOpen && (
        <div
          className="sh"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSheetOpen(false);
          }}
        >
          <div className="shc">
            <div className="who">
              <span className="av">
                <Crest name={user ? user.n : 'Guest'} />
              </span>
              <b>{user ? user.n : 'Guest'}</b>
            </div>

            <textarea
              placeholder="What is on your mind? (text, photos or both)"
              value={dcap}
              onChange={(e) => setDcap(e.target.value)}
            />

            {drafts.length > 0 && (
              <div className="th">
                {drafts.map((s, i) => (
                  <img key={i} src={s} alt="" />
                ))}
              </div>
            )}

            <label className="up s">
              {drafts.length ? 'Add more photos' : 'Add photos or paste an image'}
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => handlePickFiles(e.target.files)}
              />
            </label>

            <div className="cr2">
              <select value={dbk} onChange={(e) => setDbk(e.target.value)}>
                {['SportyBet', 'Bet9ja', '1xBet', 'BetKing', 'Other'].map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <input
                placeholder="Booking code (optional)"
                value={dcode}
                onChange={(e) => setDcode(e.target.value)}
              />
            </div>

            <button className="go2" onClick={handleCreatePost}>
              Post
            </button>
          </div>
        </div>
      )}
    </>
  );
};
