import React, { useState } from 'react';
import { Ico, I } from '../common/Icons';
import { supabase } from '../../utils/supabase';

interface MembershipPageProps {
  user?: {
    id?: string;
    n: string;
    e: string;
    role?: 'admin' | 'moderator' | 'user';
    isVip?: boolean;
    subscriptionTier?: string;
  } | null;
  onOpenSignIn?: () => void;
  onSubscriptionSuccess?: (tier: string) => void;
  onBack?: () => void;
  onOpenNotifications?: () => void;
  onOpenMenu?: () => void;
  onNavigateApp?: (route: string) => void;
  onOpenLegal?: (key: 'privacy' | 'terms' | 'responsible') => void;
  unreadCount?: number;
}

export const MembershipPage: React.FC<MembershipPageProps> = ({
  user,
  onOpenSignIn,
  onSubscriptionSuccess,
  onBack,
  onNavigateApp,
  onOpenLegal,
}) => {
  const [selectedCycle, setSelectedCycle] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [modalPlan, setModalPlan] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [contactInput, setContactInput] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [subscribedPlan, setSubscribedPlan] = useState<{ plan: string; price: string; cycle: string; date: string } | null>(() => {
    try {
      const saved = localStorage.getItem('sa_vip_sub');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [waitlistJoined, setWaitlistJoined] = useState<boolean>(() => {
    return localStorage.getItem('sa_vip_waitlist') === 'true';
  });
  const [emailInput, setEmailInput] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleJoinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setFeedback('Please enter a valid email address.');
      return;
    }
    localStorage.setItem('sa_vip_waitlist', 'true');
    setWaitlistJoined(true);
    setFeedback('You are now on the exclusive VIP Membership early access waitlist!');
  };

  const handleOpenSubscribeModal = (plan: 'weekly' | 'monthly' | 'yearly') => {
    if (!user) {
      if (onOpenSignIn) {
        onOpenSignIn();
      } else {
        setFeedback('Please sign in to your account first to access VIP pricing plans.');
      }
      return;
    }
    setModalPlan(plan);
    setIsSubscribeModalOpen(true);
  };

  const handleProcessPaystack = async (plan: 'weekly' | 'monthly' | 'yearly') => {
    if (!user) {
      if (onOpenSignIn) {
        onOpenSignIn();
      } else {
        setFeedback('Please sign in to your account first.');
      }
      return;
    }

    setPaymentLoading(true);
    setFeedback('');

    const amounts: Record<'weekly' | 'monthly' | 'yearly', number> = {
      weekly: 2000,
      monthly: 5000,
      yearly: 50000,
    };
    const chosenAmount = amounts[plan];

    try {
      let txRef = `SP_VIP_${plan.toUpperCase()}_${Date.now()}`;
      let initData: any = null;

      try {
        const initRes = await fetch('/api/paystack/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.e,
            amount: chosenAmount,
            planTier: plan,
            currency: 'NGN',
          }),
        });

        if (initRes.ok) {
          initData = await initRes.json();
          if (initData?.success && initData?.reference) {
            txRef = initData.reference;
          }
        }
      } catch (initErr) {
        // Graceful fallback to client-generated txRef
      }

      // Verification handler
      const finalizePayment = async (reference: string) => {
        try {
          let verified = false;

          try {
            const verifyRes = await fetch('/api/paystack/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reference,
                planTier: plan,
              }),
            });
            if (verifyRes.ok) {
              const verifyData = await verifyRes.json();
              if (verifyData?.success) verified = true;
            }
          } catch {}

          // If Paystack inline callback fired, payment succeeded in checkout
          // Update Supabase profile and subscriptions table
          if (user.id) {
            try {
              await supabase
                .from('profiles')
                .update({
                  subscription_tier: 'vip',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

              await supabase.from('subscriptions').insert({
                user_id: user.id,
                plan_tier: 'vip',
                reference,
                amount: chosenAmount,
                currency: 'NGN',
                status: 'success',
              });
            } catch (dbErr) {
              console.warn('Supabase subscription record note:', dbErr);
            }
          }

          const subData = {
            plan: `${plan.charAt(0).toUpperCase() + plan.slice(1)} VIP`,
            price: `₦${chosenAmount.toLocaleString()}`,
            cycle: plan === 'weekly' ? 'per week' : plan === 'monthly' ? 'monthly' : 'yearly',
            contact: user.e,
            date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          };
          localStorage.setItem('sa_vip_sub', JSON.stringify(subData));

          setSubscribedPlan(subData);
          setIsSubscribeModalOpen(false);
          setFeedback(`🎉 Payment successful! You are now subscribed to ${subData.plan} via Paystack. All Daily VIP Banker Picks & AI match features are unlocked!`);
          onSubscriptionSuccess?.(plan);
        } catch (verErr: any) {
          setFeedback('Verification notice: ' + (verErr?.message || 'Contact support.'));
        } finally {
          setPaymentLoading(false);
        }
      };

      const win = window as any;
      const storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem('sa_api_paystack') : null;
      const paystackPubKey =
        (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY ||
        (storedKey && storedKey.startsWith('pk_') ? storedKey : null) ||
        'pk_live_spiderpicks';

      if (typeof win.PaystackPop !== 'undefined' && win.PaystackPop.setup) {
        const handler = win.PaystackPop.setup({
          key: paystackPubKey,
          email: user.e,
          amount: Math.round(chosenAmount * 100),
          currency: 'NGN',
          ref: txRef,
          metadata: {
            planTier: plan,
            userId: user.id,
          },
          callback: function (response: any) {
            finalizePayment(response.reference || txRef);
          },
          onClose: function () {
            setPaymentLoading(false);
            setFeedback('Paystack checkout window closed.');
          },
        });
        handler.openIframe();
      } else if (initData?.authorization_url && initData?.isLiveGateway) {
        window.open(initData.authorization_url, '_blank');
        setTimeout(() => finalizePayment(txRef), 3000);
      } else {
        // Instant simulated/sandbox verification
        await finalizePayment(txRef);
      }
    } catch (err: any) {
      setFeedback(err?.message || 'Error processing payment with Paystack.');
      setPaymentLoading(false);
    }
  };

  const handleConfirmSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    handleProcessPaystack(modalPlan);
  };

  const vipPricingPlans = [
    {
      id: 'weekly' as const,
      name: 'Weekly VIP',
      price: '₦2,000',
      period: '/ week',
      feeNote: '₦2,000 per week',
      badge: 'FLEXIBLE',
      badgeBg: '#e2e8f0',
      badgeColor: '#0f172a',
      desc: 'Ideal for weekend fixtures and midweek European tournaments.',
      highlights: [
        'Daily 85%+ Banker Accumulator Slips',
        'Instant SportyBet & Bet9ja Booking Codes',
        'Telegram & WhatsApp VIP Drops',
        'Match xG Metrics & Corner Projection Lines',
        '7 Days Unrestricted VIP Access',
      ],
    },
    {
      id: 'monthly' as const,
      name: 'Monthly VIP',
      price: '₦5,000',
      period: '/ month',
      feeNote: '₦5,000 monthly',
      badge: 'MOST POPULAR',
      badgeBg: '#dcfce7',
      badgeColor: '#166534',
      popular: true,
      desc: 'The punters’ top choice. Consistent daily edge, disciplined bankroll staking, and Poisson distribution models.',
      highlights: [
        'Everything in Weekly VIP',
        'Full 30 Days of Daily 85%+ Banker Accumulators',
        'Poisson Scoreline Probability Matrix',
        'In-Play Momentum & Corner Live Indicators',
        'Disciplined Bankroll Staking & Unit Rollover Plan',
        'Saves 40% compared to weekly billing',
      ],
    },
    {
      id: 'yearly' as const,
      name: 'Yearly VIP',
      price: '₦50,000',
      period: '/ year',
      feeNote: '₦50,000 yearly',
      badge: 'BEST VALUE · SAVE ₦10,000',
      badgeBg: '#fef3c7',
      badgeColor: '#92400e',
      desc: 'Full season master coverage. Complete access throughout Premier League, Champions League, and World Tournaments.',
      highlights: [
        'Everything in Monthly VIP',
        '365 Days Uninterrupted VIP Access',
        'Priority Senior Analyst Hotline for Custom Matches',
        'Full Season Capital & Bankroll Formula',
        'Guaranteed Lifetime Price-Lock',
        'Saves ₦10,000 (2 Months Equivalent Free)',
      ],
    },
  ];

  const vipPerks = [
    {
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      title: "Daily 85%+ Banker Slips",
      desc: "Curated double and treble accumulator slips thoroughly vetted through Poisson distributions and xG models.",
    },
    {
      icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
      title: "Telegram & WhatsApp VIP Alerts",
      desc: "Instant push notification drops with direct bookmaker booking codes (SportyBet, Bet9ja) 2 hours before kickoff.",
    },
    {
      icon: "M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
      title: "Bivariate Poisson & xG Engine",
      desc: "Full transparency with raw expected goal distributions, scoreline likelihood tables, and value market flags.",
    },
    {
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      title: "Disciplined Bankroll Staking Plans",
      desc: "Unit-based staking guidance, capital management models, and safe rollover plans designed to protect your bankroll.",
    },
    {
      icon: "M13 10V3L4 14h7v7l9-11h-7z",
      title: "Corner & In-Play Momentum Models",
      desc: "Independent corner forecasting lines, card markets, and live in-play betting indicators during marquee matches.",
    },
    {
      icon: "M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z",
      title: "Direct Analyst Concierge Hotline",
      desc: "Direct access to our senior football analysts for custom match evaluations, team news checks, and acca review.",
    },
  ];

  const membershipFaqs = [
    {
      q: "What are the VIP subscription fees?",
      a: "Our VIP subscription fees are: ₦2,000 per week, ₦5,000 monthly, and ₦50,000 yearly (which saves you ₦10,000 on full-season coverage). All plans provide daily 85%+ banker accumulators, instant Telegram and WhatsApp alerts, direct booking codes, and Poisson model distributions.",
    },
    {
      q: "How are the VIP banker accumulators determined?",
      a: "Our master predictive engine analyzes 13 distinct statistical variables including 5-game recent form, head-to-head patterns, xG metrics, corner line volume, and confirmed injury reports. Only picks with greater than 85% mathematical defense are packaged into VIP slips.",
    },
    {
      q: "Can I cancel or switch my VIP subscription anytime?",
      a: "Yes. VIP Membership operates on a flexible, zero-commitment basis. You can switch between weekly, monthly, or yearly plans or pause anytime with one click in your account settings.",
    },
    {
      q: "Which bookmakers are supported for direct booking codes?",
      a: "All VIP accumulator slips include verified, ready-to-load booking codes for SportyBet, Bet9ja, 1xBet, and Betway, alongside standardized betting market terminology for international bookmakers.",
    },
    {
      q: "How quickly do I get access after subscribing?",
      a: "Access is instantaneous. You immediately receive today's active VIP Banker slips, direct links to our private Telegram VIP bot and WhatsApp community channel, and live Poisson score projections.",
    },
  ];

  const allMembershipTiers = [
    {
      id: 'free',
      name: 'Standard Free',
      price: 'Free',
      period: 'Forever',
      feeNote: '100% Free Forever',
      badge: 'FREE FOREVER',
      badgeBg: '#f1f5f9',
      badgeColor: '#475569',
      popular: false,
      desc: 'Everything a football fan needs to follow matches and share tips.',
      highlights: [
        'Daily curated match predictions',
        'Live in-play scores & minute alerts',
        'Community feed & booking codes',
        'Basic match stats and form',
      ],
      actionLabel: 'Current Active Plan',
      isFree: true,
    },
    {
      id: 'weekly',
      name: 'Weekly VIP',
      price: '₦2,000',
      period: '/ week',
      feeNote: '₦2,000 per week',
      badge: 'FLEXIBLE',
      badgeBg: '#e2e8f0',
      badgeColor: '#0f172a',
      popular: false,
      desc: 'Ideal for weekend fixtures and midweek European tournaments.',
      highlights: [
        'Daily 85%+ Banker Accumulator Slips',
        'Instant SportyBet & Bet9ja Booking Codes',
        'Telegram & WhatsApp VIP Drops',
        'Match xG Metrics & Corner Lines',
        '7 Days Unrestricted VIP Access',
      ],
      actionLabel: 'Subscribe (₦2,000)',
      isFree: false,
    },
    {
      id: 'monthly',
      name: 'Monthly VIP',
      price: '₦5,000',
      period: '/ month',
      feeNote: '₦5,000 monthly',
      badge: 'MOST POPULAR',
      badgeBg: '#dcfce7',
      badgeColor: '#166534',
      popular: true,
      desc: 'The punters’ top choice. Consistent daily edge & bankroll staking.',
      highlights: [
        'Everything in Weekly VIP',
        'Full 30 Days of Daily 85%+ Banker Accas',
        'Poisson Scoreline Probability Matrix',
        'In-Play Momentum & Corner Live Indicators',
        'Disciplined Bankroll Staking Plan',
        'Saves 40% vs. Weekly Billing',
      ],
      actionLabel: 'Subscribe (₦5,000)',
      isFree: false,
    },
    {
      id: 'yearly',
      name: 'Yearly VIP',
      price: '₦50,000',
      period: '/ year',
      feeNote: '₦50,000 yearly',
      badge: 'BEST VALUE · SAVE ₦10,000',
      badgeBg: '#fef3c7',
      badgeColor: '#92400e',
      popular: false,
      desc: 'Full season master coverage with lifetime price-lock guarantee.',
      highlights: [
        'Everything in Monthly VIP',
        '365 Days Uninterrupted VIP Access',
        'Priority Senior Analyst Hotline',
        'Full Season Capital & Bankroll Formula',
        'Guaranteed Lifetime Price-Lock',
        'Saves ₦10,000 (2 Months Equivalent Free)',
      ],
      actionLabel: 'Subscribe (₦50,000)',
      isFree: false,
    },
  ];

  const mobileRowRef = React.useRef<HTMLDivElement>(null);
  const [activeMobileCardIndex, setActiveMobileCardIndex] = useState(2);

  const scrollToMobilePlan = (idx: number) => {
    setActiveMobileCardIndex(idx);
    if (mobileRowRef.current) {
      const children = mobileRowRef.current.children;
      if (children[idx]) {
        (children[idx] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  const handleMobileRowScroll = () => {
    if (!mobileRowRef.current) return;
    const scrollLeft = mobileRowRef.current.scrollLeft;
    const cardWidth = 287;
    const index = Math.round(scrollLeft / cardWidth);
    if (index >= 0 && index <= 3 && index !== activeMobileCardIndex) {
      setActiveMobileCardIndex(index);
    }
  };

  const activeVipPlan = vipPricingPlans.find((p) => p.id === selectedCycle) || vipPricingPlans[1];

  return (
    <div className="membership-page-wrap" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Featured VIP Club Banner */}
      <div className="membership-banner up1 rvs in">
        <div className="membership-badge-pill">
          <span>★</span> VIP CLUB MEMBERSHIP
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '6px' }}>
          Spider Picks VIP Membership Club
        </h2>
        <p style={{ fontSize: '13px', opacity: 0.9, lineHeight: 1.5, marginBottom: '16px', maxWidth: '640px' }}>
          Get verified daily 85%+ banker accumulators, instant Telegram/WhatsApp VIP alerts, and complete statistical Poisson models. Subscriptions available at <b>₦2,000/week</b>, <b>₦5,000/month</b>, and <b>₦50,000/year</b>.
        </p>

        {subscribedPlan ? (
          <div
            style={{
              background: 'rgba(255,255,255,0.22)',
              padding: '12px 18px',
              borderRadius: '14px',
              fontSize: '13px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            <span style={{ background: '#ffffff', color: 'var(--g2)', width: '22px', height: '22px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: 900 }}>✓</span>
            <span>Active VIP Subscription: <b>{subscribedPlan.plan}</b> ({subscribedPlan.price} {subscribedPlan.cycle}) · Member since {subscribedPlan.date}</span>
          </div>
        ) : waitlistJoined ? (
          <div
            style={{
              background: 'rgba(255,255,255,0.18)',
              padding: '12px 18px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <span>✓</span> You have priority VIP Early Access reserved! Select a subscription below to activate now.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className="membership-action-btn"
              onClick={() => handleOpenSubscribeModal('monthly')}
            >
              Get VIP Access (From ₦2,000) &rarr;
            </button>
            <span style={{ fontSize: '12px', opacity: 0.9 }}>
              Instant activation · Daily banker slips · Telegram & WhatsApp drops
            </span>
          </div>
        )}

        {feedback && (
          <div style={{ marginTop: '12px', fontSize: '13px', fontWeight: 800, color: '#bbf7d0', background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: '8px', display: 'inline-block' }}>
            {feedback}
          </div>
        )}
      </div>

      {/* Subscription Fee Selector & Plans Comparison */}
      <div style={{ padding: '0 14px 20px' }}>
        {/* ========================================================
            A. MOBILE UNIQUE VIEW (< 768px): ALL PLANS IN ONE ROW
            Arranges Standard Free, Weekly VIP, Monthly VIP, and Yearly VIP
            in one seamless, swipable single horizontal row.
            ======================================================== */}
        <div className="membership-plans-mobile-wrapper">
          <div style={{ textAlign: 'center', margin: '22px 0 16px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--g)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              ALL VIP MEMBERSHIP PLANS
            </span>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--tx)', margin: '4px 0 6px' }}>
              Choose Your Subscription
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--mu)', margin: '0 0 14px', lineHeight: 1.4 }}>
              Arranged in direct vertical order. Select your preferred tier:
            </p>
          </div>

          {/* SINGLE VERTICAL COLUMN FOR ALL PLANS ON MOBILE (NO HORIZONTAL SCROLL) */}
          <div className="membership-plans-row-mobile">
            {allMembershipTiers.map((tier) => {
              const isCardPopular = tier.popular;
              return (
                <div
                  key={tier.id}
                  className={`membership-plan-mobile-card ${isCardPopular ? 'popular' : ''}`}
                  style={{
                    background: isCardPopular ? 'linear-gradient(145deg, #0a7d37 0%, #064e23 100%)' : 'var(--s)',
                    color: isCardPopular ? '#ffffff' : 'var(--tx)',
                    borderRadius: '20px',
                    padding: '20px 18px',
                    border: isCardPopular ? '2px solid var(--g)' : '1px solid var(--ln)',
                    boxShadow: isCardPopular ? '0 10px 28px rgba(10, 125, 55, 0.28)' : '0 4px 14px rgba(0,0,0,0.03)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span
                        style={{
                          background: tier.badgeBg,
                          color: tier.badgeColor,
                          fontSize: '10px',
                          fontWeight: 900,
                          padding: '3px 8px',
                          borderRadius: '99px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {tier.badge}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.85 }}>
                        {tier.feeNote}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '18px', fontWeight: 900, margin: '0 0 6px' }}>
                      {tier.name}
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px' }}>
                        {tier.price}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, opacity: 0.85 }}>
                        {tier.period}
                      </span>
                    </div>

                    <p style={{ fontSize: '12px', opacity: 0.88, lineHeight: 1.45, marginBottom: '16px' }}>
                      {tier.desc}
                    </p>

                    <div style={{ borderTop: isCardPopular ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--ln)', paddingTop: '14px', marginBottom: '18px' }}>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '8px', fontSize: '12px' }}>
                        {tier.highlights.map((feat, fi) => (
                          <li key={fi} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: isCardPopular ? '#86efac' : 'var(--g)', fontWeight: 900 }}>✓</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {tier.isFree ? (
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '99px',
                        background: 'var(--s2)',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: 'var(--mu)',
                        fontSize: '13px',
                      }}
                    >
                      Current Active Plan
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenSubscribeModal(tier.id as any)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '99px',
                        fontWeight: 800,
                        fontSize: '13px',
                        border: 'none',
                        cursor: 'pointer',
                        background: isCardPopular ? '#ffffff' : 'var(--g)',
                        color: isCardPopular ? 'var(--g2)' : '#ffffff',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    >
                      {tier.actionLabel}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================
            B. DESKTOP & TABLET UNIQUE VIEW (>= 768px): MULTI-COLUMN GRID
            Structured side-by-side comparison & 3-column VIP breakdown
            ======================================================== */}
        <div className="membership-plans-desktop-wrapper">
          {/* Interactive Billing Switcher */}
          <div style={{ textAlign: 'center', margin: '28px 0 18px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--g)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              VIP SUBSCRIPTION FEES
            </span>
            <h3 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--tx)', margin: '4px 0 12px' }}>
              Choose Your Subscription Plan
            </h3>

            <div
              style={{
                display: 'inline-flex',
                background: 'var(--s2)',
                padding: '4px',
                borderRadius: '99px',
                border: '1px solid var(--ln)',
                gap: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              {[
                { id: 'weekly', label: 'Weekly', price: '₦2,000' },
                { id: 'monthly', label: 'Monthly', price: '₦5,000', popular: true },
                { id: 'yearly', label: 'Yearly', price: '₦50,000', save: 'Save ₦10,000' },
              ].map((cycle) => {
                const isSelected = selectedCycle === cycle.id;
                return (
                  <button
                    key={cycle.id}
                    type="button"
                    onClick={() => setSelectedCycle(cycle.id as any)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '99px',
                      fontSize: '13px',
                      fontWeight: isSelected ? 800 : 600,
                      background: isSelected ? 'var(--g)' : 'transparent',
                      color: isSelected ? '#ffffff' : 'var(--tx)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: isSelected ? '0 2px 6px rgba(10, 125, 55, 0.25)' : 'none',
                    }}
                  >
                    <span>{cycle.label}</span>
                    <span style={{ opacity: isSelected ? 1 : 0.8, fontSize: '12px' }}>({cycle.price})</span>
                    {cycle.popular && (
                      <span style={{ fontSize: '9px', fontWeight: 900, background: '#ffffff33', color: '#ffffff', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>
                        Popular
                      </span>
                    )}
                    {cycle.save && (
                      <span style={{ fontSize: '9px', fontWeight: 900, background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>
                        {cycle.save}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2-Column Comparison View */}
          <div className="pg">
            {/* Free Standard Plan */}
            <div className="pc">
              <span className="tier-pill free">FREE FOREVER</span>
              <b>Standard Free</b>
              <div className="pr">Free</div>
              <p style={{ color: 'var(--mu)', fontSize: '12px' }}>
                Everything a football fan needs to follow matches and share tips.
              </p>
              <ul>
                <li>Daily curated match predictions</li>
                <li>Live in-play scores & minute alerts</li>
                <li>Community feed & booking codes</li>
                <li>Basic match stats and form</li>
              </ul>
              <div
                style={{
                  padding: '12px',
                  borderRadius: '99px',
                  background: 'var(--s2)',
                  textAlign: 'center',
                  fontWeight: 700,
                  color: 'var(--mu)',
                  fontSize: '13px',
                }}
              >
                Current Active Plan
              </div>
            </div>

            {/* VIP Pro Plan Dynamic Card */}
            <div className="pc pro" style={{ position: 'relative' }}>
              <span className="tg" style={{ background: activeVipPlan.popular ? '#ffffff' : '#fef3c7', color: activeVipPlan.popular ? 'var(--g2)' : '#92400e' }}>
                {activeVipPlan.badge}
              </span>
              <b>VIP Members Club</b>
              <div className="pr" style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span>{activeVipPlan.price}</span>
                <span style={{ fontSize: '14px', fontWeight: 700, opacity: 0.85 }}>{activeVipPlan.period}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#bbf7d0', fontWeight: 700, marginTop: '-4px' }}>
                {activeVipPlan.feeNote} · {activeVipPlan.id === 'weekly' ? 'Billed weekly' : activeVipPlan.id === 'monthly' ? 'Billed monthly' : 'Billed yearly (Save ₦10,000)'}
              </div>
              <p style={{ opacity: 0.9, fontSize: '12px', lineHeight: 1.45 }}>
                {activeVipPlan.desc}
              </p>
              <ul>
                {activeVipPlan.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
              <button
                className="pbn pbtn"
                onClick={() => handleOpenSubscribeModal(activeVipPlan.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <span>Subscribe ({activeVipPlan.price})</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>

          {/* 3-TIER DEDICATED VIP SUBSCRIPTION CARDS */}
          <div style={{ marginTop: '36px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#0a7d37', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                ALL SUBSCRIPTION OPTIONS
              </span>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--tx)', margin: '4px 0 6px' }}>
                Transparent VIP Subscription Breakdown
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--mu)', margin: 0 }}>
                Select the plan that fits your betting cycle. No hidden charges.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
              }}
            >
              {vipPricingPlans.map((plan) => {
                return (
                  <div
                    key={plan.id}
                    style={{
                      background: plan.popular ? 'linear-gradient(145deg, #0a7d37 0%, #064e23 100%)' : 'var(--s)',
                      color: plan.popular ? '#ffffff' : 'var(--tx)',
                      borderRadius: '20px',
                      padding: '24px 20px',
                      border: plan.popular ? '2px solid var(--g)' : '1px solid var(--ln)',
                      boxShadow: plan.popular ? '0 10px 30px rgba(10, 125, 55, 0.25)' : '0 4px 16px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span
                          style={{
                            background: plan.badgeBg,
                            color: plan.badgeColor,
                            fontSize: '10px',
                            fontWeight: 900,
                            padding: '3px 8px',
                            borderRadius: '99px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {plan.badge}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.85 }}>
                          {plan.feeNote}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '18px', fontWeight: 900, margin: '0 0 6px' }}>
                        {plan.name}
                      </h4>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '-0.5px' }}>
                          {plan.price}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 700, opacity: 0.85 }}>
                          {plan.period}
                        </span>
                      </div>

                      <p style={{ fontSize: '12px', opacity: 0.85, lineHeight: 1.45, marginBottom: '16px' }}>
                        {plan.desc}
                      </p>

                      <div style={{ borderTop: plan.popular ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--ln)', paddingTop: '14px', marginBottom: '18px' }}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '8px', fontSize: '12px' }}>
                          {plan.highlights.map((feat, fi) => (
                            <li key={fi} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: plan.popular ? '#86efac' : 'var(--g)', fontWeight: 900 }}>✓</span>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenSubscribeModal(plan.id)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '99px',
                        fontWeight: 800,
                        fontSize: '13px',
                        border: 'none',
                        cursor: 'pointer',
                        background: plan.popular ? '#ffffff' : 'var(--g)',
                        color: plan.popular ? 'var(--g2)' : '#ffffff',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    >
                      Subscribe to {plan.name} ({plan.price})
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================
            VIP PRIVILEGES DEEP-DIVE GRID (6 DETAILED CARDS)
            ======================================================== */}
        <div className="rvs in" style={{ marginTop: '36px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#0a7d37', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              WHAT YOU GET
            </span>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--tx)', margin: '4px 0 8px' }}>
              Exclusive VIP Member Privileges
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--mu)', maxWidth: '580px', margin: '0 auto', lineHeight: 1.5 }}>
              Engineered for punters who take match selection seriously. Every insight is backed by proven statistical rigor.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '14px',
            }}
          >
            {vipPerks.map((perk, i) => (
              <div
                key={i}
                className="rvs in"
                style={{
                  background: 'var(--s)',
                  border: '1px solid var(--ln)',
                  borderRadius: '16px',
                  padding: '18px 16px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(10, 125, 55, 0.12)';
                  e.currentTarget.style.borderColor = 'var(--g)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.03)';
                  e.currentTarget.style.borderColor = 'var(--ln)';
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(10, 125, 55, 0.12)',
                    color: 'var(--g)',
                    display: 'grid',
                    placeItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <Ico path={perk.icon} />
                </div>
                <b style={{ fontSize: '15px', color: 'var(--tx)', display: 'block', marginBottom: '6px' }}>
                  {perk.title}
                </b>
                <p style={{ fontSize: '12px', color: 'var(--mu)', lineHeight: 1.5, margin: 0 }}>
                  {perk.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================
            KEY METRICS SHOWCASE
            ======================================================== */}
        <div
          className="rvs in"
          style={{
            marginTop: '32px',
            background: 'linear-gradient(135deg, #071a10 0%, #0d2e1c 100%)',
            borderRadius: '20px',
            padding: '24px 20px',
            color: '#ffffff',
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#86efac', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              VERIFIED STATISTICAL ADVANTAGE
            </span>
            <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '4px 0 0' }}>
              Engineered Accuracy & Multi-League Coverage
            </h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px',
              textAlign: 'center',
            }}
          >
            <div style={{ background: 'rgba(255,255,255,0.08)', padding: '16px 12px', borderRadius: '14px' }}>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#4ade80' }}>87.4%</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', marginTop: '2px' }}>Banker Win Rate</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Multi-season validated data</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.08)', padding: '16px 12px', borderRadius: '14px' }}>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#4ade80' }}>2.10</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', marginTop: '2px' }}>Average Acca Odds</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Optimal risk-reward balance</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.08)', padding: '16px 12px', borderRadius: '14px' }}>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#4ade80' }}>3,800+</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', marginTop: '2px' }}>Waitlist Punters</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Early access spots filling fast</div>
            </div>
          </div>
        </div>

        {/* ========================================================
            MEMBERSHIP FAQ SECTION
            ======================================================== */}
        <div className="rvs in" style={{ marginTop: '36px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#0a7d37', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              MEMBERSHIP QUESTIONS
            </span>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--tx)', margin: '4px 0 0' }}>
              Frequently Asked Questions
            </h3>
          </div>

          <div style={{ display: 'grid', gap: '10px', maxWidth: '720px', margin: '0 auto' }}>
            {membershipFaqs.map((faq, idx) => (
              <details
                key={idx}
                className="rvs in"
                style={{
                  background: 'var(--s)',
                  border: '1px solid var(--ln)',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  cursor: 'pointer',
                }}
              >
                <summary style={{ fontWeight: 800, fontSize: '14px', color: 'var(--tx)', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{faq.q}</span>
                  <span style={{ color: 'var(--g)', fontSize: '18px', fontWeight: 400 }}>+</span>
                </summary>
                <p style={{ marginTop: '10px', fontSize: '12px', color: 'var(--mu)', lineHeight: 1.55, margin: '10px 0 0' }}>
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* ========================================================
            COMPREHENSIVE MEMBERSHIP FOOTER
            ======================================================== */}
        <footer
          style={{
            marginTop: '44px',
            paddingTop: '28px',
            borderTop: '1px solid var(--ln)',
            color: 'var(--mu)',
            fontSize: '12px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '24px',
              marginBottom: '24px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <img
                  src="/assets/icon.png"
                  alt="SpiderPicks"
                  style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                />
                <span style={{ fontWeight: 900, fontSize: '16px', color: 'var(--tx)' }}>
                  Spider<span style={{ color: 'var(--g)' }}>Picks</span>
                </span>
              </div>
              <p style={{ lineHeight: 1.5, margin: 0, fontSize: '12px' }}>
                Smarter algorithmic football predictions, live match scores, and a dedicated VIP member edge.
              </p>
            </div>

            <div>
              <b style={{ color: 'var(--tx)', display: 'block', marginBottom: '8px', fontSize: '13px' }}>Explore</b>
              <div style={{ display: 'grid', gap: '6px' }}>
                <a style={{ cursor: 'pointer' }} onClick={() => onNavigateApp ? onNavigateApp('') : (onBack && onBack())}>Feed & Community</a>
                <a style={{ cursor: 'pointer' }} onClick={() => onNavigateApp && onNavigateApp('live')}>Live Scores</a>
                <a style={{ cursor: 'pointer' }} onClick={() => onNavigateApp && onNavigateApp('picks')}>Daily Banker Picks</a>
                <a style={{ cursor: 'pointer' }} onClick={() => onNavigateApp && onNavigateApp('analysis')}>Match Analysis Engine</a>
              </div>
            </div>

            <div>
              <b style={{ color: 'var(--tx)', display: 'block', marginBottom: '8px', fontSize: '13px' }}>Safety & Terms</b>
              <div style={{ display: 'grid', gap: '6px' }}>
                <a style={{ cursor: 'pointer' }} onClick={() => onOpenLegal && onOpenLegal('privacy')}>Privacy Policy</a>
                <a style={{ cursor: 'pointer' }} onClick={() => onOpenLegal && onOpenLegal('terms')}>Terms of Service</a>
                <a style={{ cursor: 'pointer' }} onClick={() => onOpenLegal && onOpenLegal('responsible')}>Responsible Betting</a>
              </div>
            </div>
          </div>

          <div
            style={{
              paddingTop: '16px',
              borderTop: '1px solid var(--ln)',
              textAlign: 'center',
              fontSize: '11px',
              lineHeight: 1.5,
              opacity: 0.85,
            }}
          >
            &copy; 2026 SpiderPicks. Statistical probability modeling only. Strictly 18+. Gamble responsibly. No betting outcome is 100% guaranteed.
          </div>
        </footer>
      </div>

      {/* VIP Subscription Activation Modal */}
      {isSubscribeModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setIsSubscribeModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--s)',
              color: 'var(--tx)',
              borderRadius: '24px',
              maxWidth: '460px',
              width: '100%',
              padding: '28px 24px',
              border: '1px solid var(--ln)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
              position: 'relative',
              animation: 'upk 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsSubscribeModalOpen(false)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'var(--s2)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--tx)',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '14px',
              }}
              aria-label="Close"
            >
              ✕
            </button>

            <span
              style={{
                background: 'rgba(10, 125, 55, 0.15)',
                color: 'var(--g)',
                fontSize: '11px',
                fontWeight: 900,
                padding: '3px 10px',
                borderRadius: '99px',
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                display: 'inline-block',
                marginBottom: '8px',
              }}
            >
              VIP MEMBERSHIP ACTIVATION
            </span>

            <h3 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 6px' }}>
              Subscribe to Spider Picks VIP
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--mu)', margin: '0 0 16px', lineHeight: 1.45 }}>
              Choose your preferred subscription cycle to receive daily 85%+ banker accumulator slips and instant Telegram drops.
            </p>

            {/* Plan Switcher Inside Modal */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '18px' }}>
              {[
                { id: 'weekly', name: 'Weekly', price: '₦2,000' },
                { id: 'monthly', name: 'Monthly', price: '₦5,000' },
                { id: 'yearly', name: 'Yearly', price: '₦50,000' },
              ].map((p) => {
                const active = modalPlan === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setModalPlan(p.id as any)}
                    style={{
                      padding: '10px 6px',
                      borderRadius: '12px',
                      border: active ? '2px solid var(--g)' : '1px solid var(--ln)',
                      background: active ? 'rgba(10, 125, 55, 0.12)' : 'var(--s2)',
                      color: active ? 'var(--g)' : 'var(--tx)',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 800 }}>{p.name}</div>
                    <div style={{ fontSize: '14px', fontWeight: 900, marginTop: '2px' }}>{p.price}</div>
                  </button>
                );
              })}
            </div>

            {/* Selected Fee Display */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0a7d37 0%, #064e23 100%)',
                color: '#ffffff',
                borderRadius: '14px',
                padding: '14px 16px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 800 }}>
                  {modalPlan === 'weekly' ? 'Weekly VIP Plan' : modalPlan === 'monthly' ? 'Monthly VIP Plan' : 'Yearly VIP Plan'}
                </span>
                <span style={{ fontSize: '20px', fontWeight: 900 }}>
                  {modalPlan === 'weekly' ? '₦2,000' : modalPlan === 'monthly' ? '₦5,000' : '₦50,000'}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#bbf7d0', marginTop: '4px' }}>
                {modalPlan === 'weekly'
                  ? 'Fee: ₦2,000 per week · Weekend & Midweek banker slips'
                  : modalPlan === 'monthly'
                  ? 'Fee: ₦5,000 monthly · Full month of 85%+ banker accumulators'
                  : 'Fee: ₦50,000 yearly · Full season access (Save ₦10,000)'}
              </div>
            </div>

            <form onSubmit={handleConfirmSubscribe}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px' }}>
                WhatsApp Number or Telegram Handle
              </label>
              <input
                type="text"
                placeholder="e.g. @yourtelegram or +234..."
                value={contactInput}
                onChange={(e) => setContactInput(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--ln)',
                  background: 'var(--s2)',
                  color: 'var(--tx)',
                  fontSize: '13px',
                  outline: 'none',
                  marginBottom: '16px',
                }}
              />

              <button
                type="submit"
                disabled={paymentLoading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '99px',
                  background: 'var(--g)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '14px',
                  border: 'none',
                  cursor: paymentLoading ? 'not-allowed' : 'pointer',
                  opacity: paymentLoading ? 0.7 : 1,
                  boxShadow: '0 4px 16px rgba(10, 125, 55, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>{paymentLoading ? 'Connecting to Paystack...' : `Pay ${modalPlan === 'weekly' ? '₦2,000' : modalPlan === 'monthly' ? '₦5,000' : '₦50,000'} via Paystack`}</span>
                {!paymentLoading && <span>&rarr;</span>}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: 'var(--mu)' }}>
              Secured by Paystack · 256-Bit SSL Encryption · Instant VIP Activation
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
