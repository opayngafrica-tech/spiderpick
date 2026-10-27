import React, { useState, useEffect } from 'react';
import { supabase } from './utils/supabase';
import { MatchItem, LiveMatchItem, PostItem, NotificationItem } from './types/football';
import { NT, INITIAL_POSTS } from './lib/saviourData';
import { LandingPage } from './components/saviour/LandingPage';
import { AuthPage } from './components/saviour/AuthPage';
import { FeedPage } from './components/saviour/FeedPage';
import { LivePage } from './components/saviour/LivePage';
import { PicksPage } from './components/saviour/PicksPage';
import { MatchDetailPage } from './components/saviour/MatchDetailPage';
import { AnalysisPage } from './components/saviour/AnalysisPage';
import { ProfilePage } from './components/saviour/ProfilePage';
import { NotificationsPage } from './components/saviour/NotificationsPage';
import { LegalPage } from './components/saviour/LegalPage';
import { BottomNav } from './components/saviour/BottomNav';
import { DesktopHeader } from './components/saviour/DesktopHeader';
import { MembershipPage } from './components/saviour/MembershipPage';
import { SideMenu } from './components/common/SideMenu';

export default function App() {
  // Supabase todos integration
  const [todos, setTodos] = useState<any[]>([]);

  useEffect(() => {
    async function getTodos() {
      try {
        const { data, error } = await supabase.from('todos').select();
        if (data && !error) {
          setTodos(data);
        }
      } catch (err) {
        console.warn('Supabase connection initialized:', err);
      }
    }

    getTodos();
  }, []);

  // Theme state: light mode default as requested
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('sa_theme');
    if (saved) return saved === 'dark';
    return false; // Default: Light mode
  });

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    localStorage.setItem('sa_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // User state with role and VIP attributes
  const [user, setUser] = useState<{
    n: string;
    e: string;
    role?: 'admin' | 'user';
    isVip?: boolean;
    subscriptionTier?: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('sa_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          role: parsed.role || 'user',
        };
      }
      return null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!user) {
      document.body.classList.add('guest-mode');
    } else {
      document.body.classList.remove('guest-mode');
    }
  }, [user]);

  const handleUpdateUserRole = (newRole: 'admin' | 'user') => {
    if (!user) {
      const demoUser = { n: 'Admin Manager', e: 'admin@spiderpicks.com', role: newRole, isVip: true };
      setUser(demoUser);
      localStorage.setItem('sa_user', JSON.stringify(demoUser));
      return;
    }
    const updated = { ...user, role: newRole, isVip: newRole === 'admin' ? true : user.isVip };
    setUser(updated);
    localStorage.setItem('sa_user', JSON.stringify(updated));
  };

  // Admin Tab Maintenance Status: true means tab is turned off / under maintenance
  const [tabDisabledState, setTabDisabledState] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('sa_tab_status');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleToggleTabState = (tabKey: string) => {
    setTabDisabledState((prev) => {
      const next = { ...prev, [tabKey]: !prev[tabKey] };
      localStorage.setItem('sa_tab_status', JSON.stringify(next));
      return next;
    });
  };

  // Supabase Auth Session Sync & Profile Loading
  useEffect(() => {
    async function syncSession(authUser: any) {
      if (!authUser) return;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        const userRole = (profile?.role === 'admin' || profile?.subscription_tier === 'admin') ? 'admin' : 'user';
        const subTier = profile?.subscription_tier || 'free';
        const isVip = subTier === 'vip' || userRole === 'admin';
        const displayName = profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0];

        const fullUser = {
          id: authUser.id,
          n: displayName,
          e: authUser.email,
          role: userRole as 'admin' | 'user',
          subscriptionTier: subTier,
          isVip,
        };
        setUser(fullUser);
        localStorage.setItem('sa_user', JSON.stringify(fullUser));
      } catch (err) {
        console.warn('Session sync note:', err);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncSession(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        syncSession(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Matches State (Synced with Supabase picks backend, empty if no games)
  const [matches, setMatches] = useState<MatchItem[]>(() => {
    try {
      const saved = localStorage.getItem('sa_matches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Fetch published picks from Supabase picks table + Realtime updates
  useEffect(() => {
    async function loadPicksFromDb() {
      try {
        const { data, error } = await supabase
          .from('picks')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const mapped: MatchItem[] = data.map((item: any) => ({
            id: Number(item.id),
            h: item.home_team,
            a: item.away_team,
            l: item.league,
            t: item.match_time,
            tip: item.tip,
            o: Number(item.odds || 1.5),
            c: Number(item.confidence || 85),
            s: item.status || 'p',
            isVip: Boolean(item.is_vip),
            date: item.match_date,
            scores: item.score_projections,
            h2h: item.h2h_meetings,
            trends: item.h2h_trends,
            selections: item.selections,
          }));
          setMatches(mapped);
          localStorage.setItem('sa_matches', JSON.stringify(mapped));
        }
      } catch (err) {
        console.warn('Supabase picks query note:', err);
      }
    }

    loadPicksFromDb();

    const picksChannel = supabase
      .channel('public:picks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'picks' }, () => {
        loadPicksFromDb();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(picksChannel);
    };
  }, []);

  // Live Scores Feed State (Synced between LivePage and AnalysisPage)
  const [liveList, setLiveList] = useState<any[]>([]);

  useEffect(() => {
    async function syncBackendLiveFeed() {
      try {
        const res = await fetch('/api/football/live');
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : Array.isArray(data?.matches) ? data.matches : [];
          setLiveList(list);
        }
      } catch (err) {}
    }
    syncBackendLiveFeed();
    const interval = setInterval(syncBackendLiveFeed, 45000);
    return () => clearInterval(interval);
  }, []);

  const handleAddDailyPick = async (newPick: MatchItem) => {
    setMatches((prev) => [newPick, ...prev]);
    try {
      const todayDate = new Date().toISOString().slice(0, 10);
      await supabase.from('picks').insert({
        home_team: newPick.h,
        away_team: newPick.a,
        league: newPick.l,
        match_date: todayDate,
        match_time: newPick.t,
        tip: newPick.tip,
        odds: newPick.o,
        confidence: newPick.c,
        status: newPick.s,
        is_vip: Boolean(newPick.isVip),
        score_projections: newPick.scores || [],
        h2h_meetings: newPick.h2h || [],
        h2h_trends: newPick.trends || [],
        selections: newPick.selections || [],
      });
    } catch (err) {
      console.warn('Failed to insert pick into Supabase picks table:', err);
    }
  };

  // Helper: Parse active route state from window.location.hash and localStorage
  interface AppRouteState {
    flow: 'land' | 'app' | 'auth' | 'legal';
    route: string;
    authMode: 'in' | 'up';
    legalKey: 'privacy' | 'terms' | 'responsible';
  }

  const parseRouteState = (): AppRouteState => {
    const raw = window.location.hash.replace(/^#\/?/, '').trim();
    const savedLp = localStorage.getItem('sa_lp') as 'land' | 'app' | 'auth' | 'legal' | null;
    const savedRoute = localStorage.getItem('sa_route') || '';
    const savedAuthMode = (localStorage.getItem('sa_auth_mode') as 'in' | 'up') || 'in';
    const savedLegalKey = (localStorage.getItem('sa_legal_key') as 'privacy' | 'terms' | 'responsible') || 'privacy';

    // 1. Explicit Auth routes
    if (raw === 'auth' || raw === 'signin' || raw === 'login') {
      return { flow: 'auth', route: '', authMode: 'in', legalKey: 'privacy' };
    }
    if (raw === 'signup' || raw === 'register') {
      return { flow: 'auth', route: '', authMode: 'up', legalKey: 'privacy' };
    }

    // 2. Explicit Legal routes
    if (raw === 'privacy' || raw === 'terms' || raw === 'responsible') {
      return { flow: 'legal', route: '', authMode: 'in', legalKey: raw };
    }

    // 3. Explicit Landing page route
    if (raw === 'landing' || raw === 'home') {
      return { flow: 'land', route: '', authMode: 'in', legalKey: 'privacy' };
    }

    // 4. Explicit App Tab routes
    const appTabs = ['live', 'picks', 'analysis', 'membership', 'profile', 'notifications', 'feed'];
    if (appTabs.includes(raw) || raw.startsWith('m/')) {
      return { flow: 'app', route: raw === 'feed' ? '' : raw, authMode: 'in', legalKey: 'privacy' };
    }

    // 5. Fallback to localStorage saved flow if hash is empty
    if (savedLp === 'app') {
      return { flow: 'app', route: savedRoute, authMode: 'in', legalKey: 'privacy' };
    }
    if (savedLp === 'auth') {
      return { flow: 'auth', route: '', authMode: savedAuthMode, legalKey: 'privacy' };
    }
    if (savedLp === 'legal') {
      return { flow: 'legal', route: '', authMode: 'in', legalKey: savedLegalKey };
    }

    // If user is already logged in, show app feed
    try {
      const savedUser = localStorage.getItem('sa_user');
      if (savedUser && JSON.parse(savedUser)) {
        return { flow: 'app', route: savedRoute || '', authMode: 'in', legalKey: 'privacy' };
      }
    } catch {}

    return { flow: 'land', route: '', authMode: 'in', legalKey: 'privacy' };
  };

  const initialRouteState = parseRouteState();

  // Flow State: 'land' | 'app' | 'auth' | 'legal'
  const [lp, setLp] = useState<'land' | 'app' | 'auth' | 'legal'>(initialRouteState.flow);
  const [route, setRoute] = useState<string>(initialRouteState.route);
  const [authMode, setAuthMode] = useState<'in' | 'up'>(initialRouteState.authMode);
  const [legalKey, setLegalKey] = useState<'privacy' | 'terms' | 'responsible'>(initialRouteState.legalKey);
  const [legalBack, setLegalBack] = useState<'land' | 'app'>('land');

  // Posts state with Real-Time Supabase Sync
  const [posts, setPosts] = useState<PostItem[]>(() => {
    try {
      const saved = localStorage.getItem('sa_posts2');
      return saved ? JSON.parse(saved) : INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sa_posts2', JSON.stringify(posts.slice(0, 30)));
    } catch {}
  }, [posts]);

  // Load live feed from Supabase & subscribe to real-time additions
  useEffect(() => {
    async function loadSupabaseFeed() {
      try {
        const { data, error } = await supabase
          .from('feed_posts')
          .select('*')
          .order('id', { ascending: false })
          .limit(40);

        if (data && data.length > 0 && !error) {
          const mapped: PostItem[] = data.map((item: any) => ({
            id: Number(item.id),
            n: item.user_name || 'Community Tipper',
            txt: item.caption || item.text || '',
            img: item.img || undefined,
            imgs: item.imgs || (item.img ? [item.img] : []),
            code: item.booking_code || undefined,
            bk: item.bookmaker || 'SportyBet',
            t: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
            lk: item.likes_count || 0,
            liked: false,
            cm: Array.isArray(item.comments) ? item.comments : [],
          }));
          setPosts(mapped);
        }
      } catch (err) {
        console.warn('Supabase feed load fallback to local store:', err);
      }
    }

    loadSupabaseFeed();

    // Subscribe to live Postgres changes
    const channel = supabase
      .channel('realtime_feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feed_posts' },
        (payload) => {
          const newItem = payload.new;
          if (newItem) {
            const mapped: PostItem = {
              id: Number(newItem.id),
              n: newItem.user_name || 'Community Tipper',
              txt: newItem.caption || newItem.text || '',
              img: newItem.img || undefined,
              imgs: newItem.imgs || (newItem.img ? [newItem.img] : []),
              code: newItem.booking_code || undefined,
              bk: newItem.bookmaker || 'SportyBet',
              t: newItem.created_at ? new Date(newItem.created_at).getTime() : Date.now(),
              lk: newItem.likes_count || 0,
              liked: false,
              cm: Array.isArray(newItem.comments) ? newItem.comments : [],
            };
            setPosts((prev) => {
              if (prev.some((p) => p.id === mapped.id)) return prev;
              return [mapped, ...prev];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Notifications read state
  const [readNotifIds, setReadNotifIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('sa_nread');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sa_nread', JSON.stringify(readNotifIds));
    } catch {}
  }, [readNotifIds]);

  const unreadCount = NT.filter((n) => !readNotifIds.includes(n.id)).length;

  // Listen to hash changes and keep URL in sync
  useEffect(() => {
    const currentHash = window.location.hash.replace(/^#\/?/, '').trim();
    if (!currentHash) {
      if (lp === 'app') {
        window.location.hash = route ? `#/${route}` : '#/feed';
      } else if (lp === 'auth') {
        window.location.hash = authMode === 'up' ? '#/signup' : '#/signin';
      } else if (lp === 'legal') {
        window.location.hash = `#/${legalKey}`;
      } else {
        window.location.hash = '#/landing';
      }
    }

    const handleHash = () => {
      const state = parseRouteState();
      setLp(state.flow);
      setRoute(state.route);
      setAuthMode(state.authMode);
      setLegalKey(state.legalKey);
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateTo = (r: string) => {
    setLp('app');
    setRoute(r);
    localStorage.setItem('sa_lp', 'app');
    localStorage.setItem('sa_route', r);
    const targetHash = r ? `#/${r}` : '#/feed';
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    window.scrollTo(0, 0);
  };

  const goToLanding = () => {
    setLp('land');
    setRoute('');
    localStorage.setItem('sa_lp', 'land');
    localStorage.setItem('sa_route', '');
    if (window.location.hash !== '#/landing') {
      window.location.hash = '#/landing';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const promptSignIn = (mode: 'in' | 'up' = 'in') => {
    setLp('auth');
    setAuthMode(mode);
    localStorage.setItem('sa_lp', 'auth');
    localStorage.setItem('sa_auth_mode', mode);
    const targetHash = mode === 'up' ? '#/signup' : '#/signin';
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    window.scrollTo(0, 0);
  };

  // Scroll reveal observer active across all tabs & routes
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    const observe = () => {
      const elements = document.querySelectorAll('.rvs');
      elements.forEach((el) => observer.observe(el));
    };

    observe();
    const t = setTimeout(observe, 80);

    return () => {
      clearTimeout(t);
      observer.disconnect();
    };
  }, [route, lp]);

  // Side Menu Drawer State across all pages
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const handleOpenMenu = () => setSideMenuOpen(true);
  const handleCloseMenu = () => setSideMenuOpen(false);

  const handleNavigateFromMenu = (targetRoute: string) => {
    setSideMenuOpen(false);
    navigateTo(targetRoute);
  };

  const handleNavigateLandingFromMenu = () => {
    setSideMenuOpen(false);
    goToLanding();
  };

  // Auth Handlers
  const handleAuthSuccess = (authenticatedUser: { n: string; e: string; role?: 'admin' | 'user' }) => {
    const fullUser = {
      ...authenticatedUser,
      role: authenticatedUser.role || 'user',
    };
    setUser(fullUser);
    localStorage.setItem('sa_user', JSON.stringify(fullUser));
    navigateTo('');
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {}
    setUser(null);
    localStorage.removeItem('sa_user');
    goToLanding();
  };

  const openLegal = (key: 'privacy' | 'terms' | 'responsible') => {
    setLegalKey(key);
    setLegalBack(lp === 'app' ? 'app' : 'land');
    setLp('legal');
    localStorage.setItem('sa_lp', 'legal');
    localStorage.setItem('sa_legal_key', key);
    const targetHash = `#/${key}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    window.scrollTo(0, 0);
  };

  // Post Actions with Supabase real-time persistence
  const handleAddPost = async (newPost: Omit<PostItem, 'id' | 't' | 'lk' | 'liked' | 'cm'>) => {
    const created: PostItem = {
      ...newPost,
      id: Date.now(),
      t: Date.now(),
      lk: 0,
      liked: false,
      cm: [],
    };
    setPosts([created, ...posts]);

    try {
      await supabase.from('feed_posts').insert([
        {
          user_name: newPost.n,
          user_email: user?.e || '',
          caption: newPost.txt,
          booking_code: newPost.code || null,
          bookmaker: newPost.bk || 'SportyBet',
          likes_count: 0,
          comments: [],
        },
      ]);
    } catch (err) {
      console.warn('Supabase post insert fallback:', err);
    }
  };

  const handleLikePost = (postId: number) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const liked = !p.liked;
          return {
            ...p,
            liked,
            lk: p.lk + (liked ? 1 : -1),
          };
        }
        return p;
      })
    );
  };

  const handleAddComment = async (postId: number, commentText: string) => {
    if (!user) return;
    const newComment = { n: user.n, t: Date.now(), x: commentText };
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            cm: [...p.cm, newComment],
          };
        }
        return p;
      })
    );

    try {
      const current = posts.find((p) => p.id === postId);
      if (current) {
        await supabase
          .from('feed_posts')
          .update({ comments: [...current.cm, newComment] })
          .eq('id', postId);
      }
    } catch (err) {
      console.warn('Supabase comment fallback:', err);
    }
  };

  // Notifications actions
  const handleMarkAllRead = () => {
    setReadNotifIds(NT.map((n) => n.id));
  };

  const handleReadNotification = (id: number) => {
    if (!readNotifIds.includes(id)) {
      setReadNotifIds((prev) => [...prev, id]);
    }
  };

  // RENDER MODES:
  // 1. Legal page
  if (lp === 'legal') {
    return (
      <LegalPage
        legalKey={legalKey}
        onSelectLegalKey={(k) => {
          setLegalKey(k);
          localStorage.setItem('sa_legal_key', k);
          window.location.hash = `#/${k}`;
        }}
        onBack={() => {
          if (legalBack === 'app') {
            navigateTo(route || '');
          } else {
            goToLanding();
          }
        }}
      />
    );
  }

  // 2. Landing Page
  if (lp === 'land') {
    return (
      <>
        <LandingPage
          isLoggedIn={Boolean(user)}
          user={user}
          onSignOut={handleSignOut}
          onGetStarted={() => promptSignIn('up')}
          onSignIn={() => promptSignIn('in')}
          onOpenFeed={() => navigateTo('')}
          onNavigateApp={(targetRoute) => navigateTo(targetRoute)}
          onOpenLegal={openLegal}
          onOpenMenu={handleOpenMenu}
        />
        <SideMenu
          isOpen={sideMenuOpen}
          onClose={handleCloseMenu}
          user={user}
          currentRoute={route}
          isLandingPage={true}
          onNavigateLanding={handleNavigateLandingFromMenu}
          onNavigateApp={handleNavigateFromMenu}
          onSignIn={() => {
            handleCloseMenu();
            promptSignIn('in');
          }}
          onSignOut={() => {
            handleCloseMenu();
            handleSignOut();
          }}
          onOpenLegal={(k) => {
            handleCloseMenu();
            openLegal(k);
          }}
        />
      </>
    );
  }

  // 3. Auth Page
  if (lp === 'auth') {
    return (
      <AuthPage
        initialMode={authMode}
        onSuccess={handleAuthSuccess}
        onBackHome={goToLanding}
        onOpenLegal={openLegal}
      />
    );
  }

  // 4. Main App Pages
  const isMatchDetail = route.startsWith('m/');
  const matchId = isMatchDetail ? parseInt(route.replace('m/', ''), 10) : null;
  const isNotifications = route === 'notifications';
  const isMembership = route === 'membership';

  const isAdmin = user?.role === 'admin';
  const isCurrentTabDisabled = Boolean(tabDisabledState[route]);

  return (
    <>
      {/* Unified Top Navigation Header */}
      <DesktopHeader
        currentRoute={route}
        onNavigate={(r: string) => navigateTo(r)}
        user={user}
        onSignIn={() => promptSignIn('in')}
        onSignOut={handleSignOut}
        onGoToLanding={goToLanding}
        onOpenMenu={handleOpenMenu}
      />


      {/* Admin Tab Disabled Banner (Admins see banner, regular users get maintenance screen) */}
      {isCurrentTabDisabled && isAdmin && (
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', padding: '10px 16px', margin: '10px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#dc2626' }}>
            ⚠️ Admin Notice: This tab is currently turned OFF for regular visitors and members.
          </span>
          <button
            onClick={() => handleToggleTabState(route)}
            style={{ fontSize: '11px', fontWeight: 800, background: '#dc2626', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}
          >
            Turn Back On
          </button>
        </div>
      )}

      {/* Tab Maintenance Screen for Non-Admins if Tab is Turned Off */}
      {isCurrentTabDisabled && !isAdmin ? (
        <div className="card" style={{ textAlign: 'center', padding: '56px 20px', margin: '24px auto', maxWidth: '500px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '8px', color: 'var(--tx)' }}>
            Section Temporarily Offline
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--mu)', lineHeight: 1.5, marginBottom: '24px' }}>
            This section has been temporarily taken offline by the SpiderPicks administration team for real-time model calibrations. Please check back shortly.
          </p>
          <button
            onClick={() => navigateTo('profile')}
            style={{
              padding: '12px 24px',
              borderRadius: '99px',
              background: 'var(--g)',
              color: '#fff',
              border: 'none',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Go to Profile & Settings
          </button>
        </div>
      ) : isNotifications ? (
        <NotificationsPage
          notifications={NT}
          readIds={readNotifIds}
          onMarkAllRead={handleMarkAllRead}
          onReadNotification={handleReadNotification}
          onOpenMatch={(mId) => navigateTo(`m/${mId}`)}
          onBack={() => navigateTo('')}
        />
      ) : isMatchDetail && matchId ? (
        <MatchDetailPage
          matchId={matchId}
          matches={matches}
          user={user}
          onOpenSignIn={() => promptSignIn('in')}
          onBack={() => navigateTo('')}
        />
      ) : isMembership ? (
        <MembershipPage
          user={user}
          onOpenSignIn={() => promptSignIn('in')}
          onSubscriptionSuccess={(tier) => {
            if (user) {
              const updated = { ...user, isVip: true, subscriptionTier: tier };
              setUser(updated);
              localStorage.setItem('sa_user', JSON.stringify(updated));
            }
          }}
          onBack={() => navigateTo('')}
          onOpenNotifications={() => navigateTo('notifications')}
          onOpenMenu={handleOpenMenu}
          onNavigateApp={(r: string) => navigateTo(r)}
          onOpenLegal={openLegal}
          unreadCount={unreadCount}
        />
      ) : route === 'live' ? (
        <LivePage
          matches={matches}
          liveList={liveList}
          user={user}
          onOpenMatch={(mId) => navigateTo(`m/${mId}`)}
          onOpenNotifications={() => navigateTo('notifications')}
          onOpenSignIn={() => promptSignIn('in')}
          onGoToLanding={goToLanding}
          onOpenMenu={handleOpenMenu}
          unreadCount={unreadCount}
        />
      ) : route === 'picks' ? (
        <PicksPage
          matches={matches}
          user={user}
          onOpenMatch={(mId) => navigateTo(`m/${mId}`)}
          onOpenNotifications={() => navigateTo('notifications')}
          onOpenSignIn={() => promptSignIn('up')}
          onOpenMembership={() => navigateTo('membership')}
          onAddDailyPick={handleAddDailyPick}
          onGoToLanding={goToLanding}
          onOpenMenu={handleOpenMenu}
          unreadCount={unreadCount}
        />
      ) : route === 'analysis' ? (
        <AnalysisPage
          user={user}
          liveList={liveList}
          onOpenNotifications={() => navigateTo('notifications')}
          onOpenMembership={() => navigateTo('membership')}
          onGoToLanding={goToLanding}
          onOpenMenu={handleOpenMenu}
          unreadCount={unreadCount}
        />
      ) : route === 'profile' ? (
        <ProfilePage
          user={user}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onOpenNotifications={() => navigateTo('notifications')}
          onOpenMembership={() => navigateTo('membership')}
          onOpenLegal={openLegal}
          onSignOut={handleSignOut}
          onSignIn={() => promptSignIn('in')}
          onOpenMenu={handleOpenMenu}
          unreadCount={unreadCount}
          onUpdateRole={handleUpdateUserRole}
          tabDisabledState={tabDisabledState}
          onToggleTab={handleToggleTabState}
          matches={matches}
          onAddDailyPick={handleAddDailyPick}
        />
      ) : (
        /* Default: Feed */
        <FeedPage
          user={user}
          posts={posts}
          onAddPost={handleAddPost}
          onLikePost={handleLikePost}
          onAddComment={handleAddComment}
          onOpenMatch={(mId) => navigateTo(`m/${mId}`)}
          onOpenNotifications={() => navigateTo('notifications')}
          onOpenMembership={() => navigateTo('membership')}
          onOpenSignIn={() => promptSignIn('in')}
          onGoToLanding={goToLanding}
          onOpenMenu={handleOpenMenu}
          unreadCount={unreadCount}
        />
      )}

      {/* Persistent Stationary Bottom Nav for Mobile Viewers */}
      {!isMatchDetail && !isNotifications && (
        <BottomNav
          currentRoute={route}
          onNavigate={(r) => navigateTo(r)}
        />
      )}

      {/* Universal Side Menu Drawer across all pages */}
      <SideMenu
        isOpen={sideMenuOpen}
        onClose={handleCloseMenu}
        user={user}
        currentRoute={route}
        isLandingPage={false}
        onNavigateLanding={handleNavigateLandingFromMenu}
        onNavigateApp={handleNavigateFromMenu}
        onSignIn={() => {
          handleCloseMenu();
          promptSignIn('in');
        }}
        onSignOut={() => {
          handleCloseMenu();
          handleSignOut();
        }}
        onOpenLegal={(k) => {
          handleCloseMenu();
          openLegal(k);
        }}
      />
    </>
  );
}
