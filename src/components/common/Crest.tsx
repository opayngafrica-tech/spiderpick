import React, { useState } from 'react';
import { col, LOGOS } from '../../lib/saviourData';

interface CrestProps {
  name: string;
  large?: boolean;
}

// Authentic SVG shield emblems for major clubs
const CLUB_SVG_BADGES: Record<string, { bg: string; border: string; emblem: React.ReactNode }> = {
  Arsenal: {
    bg: '#ef0107',
    border: '#023474',
    emblem: (
      <svg viewBox="0 0 24 24" width="100%" height="100%">
        {/* Shield */}
        <path d="M12 2L4 5v7c0 5.5 3.5 10 8 11 4.5-1 8-5.5 8-11V5l-8-3z" fill="#ef0107" stroke="#9c824a" strokeWidth="1.2" />
        {/* Gold Cannon */}
        <path d="M6 13h10v2H6zm9-1.5l3-1.5v5l-3-1.5zM8 15a2 2 0 100-4 2 2 0 000 4z" fill="#fdb913" />
      </svg>
    ),
  },
  Chelsea: {
    bg: '#034694',
    border: '#dba111',
    emblem: (
      <svg viewBox="0 0 24 24" width="100%" height="100%">
        <circle cx="12" cy="12" r="10" fill="#034694" stroke="#dba111" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="7.5" fill="#ffffff" />
        {/* Lion rampant */}
        <path d="M12 7c-1 0-1.8.8-1.8 1.8 0 .5.2.9.5 1.2L9.5 13l2 .5.5 3.5h2l.5-4-1.5-.5 1-2.5c.3.1.6.2.9.2.8 0 1.5-.7 1.5-1.5S14.8 7 14 7h-2z" fill="#034694" />
        <path d="M10 9l-1 2h2z" fill="#ee2e24" />
      </svg>
    ),
  },
  'Man City': {
    bg: '#6cabdd',
    border: '#1c2c5b',
    emblem: (
      <svg viewBox="0 0 24 24" width="100%" height="100%">
        <circle cx="12" cy="12" r="10" fill="#ffffff" stroke="#1c2c5b" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="7.5" fill="#6cabdd" />
        {/* Golden Ship */}
        <path d="M7 11h10l-1.5 3h-7L7 11z" fill="#ffd700" />
        <path d="M12 7v4m-2-2h4" stroke="#ffd700" strokeWidth="1.2" />
        {/* Red rose bottom */}
        <circle cx="12" cy="15.5" r="1.5" fill="#ee2e24" />
      </svg>
    ),
  },
  Liverpool: {
    bg: '#c8102e',
    border: '#00b2a9',
    emblem: (
      <svg viewBox="0 0 24 24" width="100%" height="100%">
        <path d="M12 2L4 5v7c0 5 3.5 9 8 10 4.5-1 8-5 8-10V5l-8-3z" fill="#c8102e" stroke="#00b2a9" strokeWidth="1.2" />
        {/* Liverbird silhouette */}
        <path d="M12 6c-1 0-1.5.8-1.5 1.5 0 .5.3 1 .8 1.3L10 12h4l-1.3-3.2c.5-.3.8-.8.8-1.3 0-.7-.5-1.5-1.5-1.5zM9 13l3 4 3-4H9z" fill="#ffffff" />
      </svg>
    ),
  },
  'Man United': {
    bg: '#da291c',
    border: '#fbe122',
    emblem: (
      <svg viewBox="0 0 24 24" width="100%" height="100%">
        <path d="M12 2L4 5v7c0 5.5 3.5 10 8 11 4.5-1 8-5.5 8-11V5l-8-3z" fill="#da291c" stroke="#fbe122" strokeWidth="1.2" />
        {/* Ship on top */}
        <path d="M9 7h6l-1 2H10L9 7z" fill="#fbe122" />
        {/* Red Devil trident */}
        <path d="M12 11v6m-2-4l2-2 2 2" stroke="#fbe122" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  'Real Madrid': {
    bg: '#ffffff',
    border: '#ffd700',
    emblem: (
      <svg viewBox="0 0 24 24" width="100%" height="100%">
        {/* Crown on top */}
        <path d="M8 5l2 2 2-3 2 3 2-2v2H8V5z" fill="#ffd700" />
        <circle cx="12" cy="14" r="7.5" fill="#ffffff" stroke="#ffd700" strokeWidth="1.5" />
        {/* Purple diagonal band */}
        <path d="M6 10l10 10" stroke="#5d2a8b" strokeWidth="2.5" />
        <circle cx="12" cy="14" r="3" fill="none" stroke="#ffd700" strokeWidth="1" />
      </svg>
    ),
  },
  Barcelona: {
    bg: '#004d98',
    border: '#edbb00',
    emblem: (
      <svg viewBox="0 0 24 24" width="100%" height="100%">
        <path d="M12 2L5 4v8c0 4.5 3 8 7 9 4-1 7-4.5 7-9V4l-7-2z" fill="#004d98" stroke="#edbb00" strokeWidth="1.2" />
        {/* St George Cross top left */}
        <path d="M5 4h5v4H5z" fill="#ffffff" />
        <path d="M7.5 4v4M5 6h5" stroke="#edbb00" strokeWidth="1" />
        {/* Blaugrana stripes bottom */}
        <path d="M7 11h2v7H7zm4 0h2v8h-2zm4 0h2v7h-2z" fill="#a50044" />
      </svg>
    ),
  },
  'Bayern Munich': {
    bg: '#dc052d',
    border: '#0066b2',
    emblem: (
      <svg viewBox="0 0 24 24" width="100%" height="100%">
        <circle cx="12" cy="12" r="10" fill="#dc052d" stroke="#ffffff" strokeWidth="1.2" />
        <circle cx="12" cy="12" r="6" fill="#0066b2" />
        {/* Bavarian Diamonds */}
        <path d="M9 10l3-2 3 2-3 2zm0 4l3-2 3 2-3 2z" fill="#ffffff" opacity="0.9" />
      </svg>
    ),
  },
  'Inter Milan': {
    bg: '#010e80',
    border: '#000000',
    emblem: (
      <svg viewBox="0 0 24 24" width="100%" height="100%">
        <circle cx="12" cy="12" r="10" fill="#000000" stroke="#010e80" strokeWidth="2" />
        <circle cx="12" cy="12" r="7.5" fill="#010e80" />
        <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="900" fill="#ffffff" fontFamily="sans-serif">IM</text>
      </svg>
    ),
  },
  'AC Milan': {
    bg: '#fb090b',
    border: '#000000',
    emblem: (
      <svg viewBox="0 0 24 24" width="100%" height="100%">
        <ellipse cx="12" cy="12" rx="7" ry="10" fill="#ffffff" stroke="#000000" strokeWidth="1.2" />
        {/* Left red/black stripes, right red cross */}
        <path d="M6 7h3v10H6z" fill="#fb090b" />
        <path d="M9 7h3v10H9z" fill="#000000" />
        <path d="M14 6v12M12 12h4" stroke="#fb090b" strokeWidth="1.5" />
      </svg>
    ),
  },
  Juventus: {
    bg: '#000000',
    border: '#ffffff',
    emblem: (
      <svg viewBox="0 0 24 24" width="100%" height="100%">
        <rect x="3" y="3" width="18" height="18" rx="4" fill="#000000" stroke="#ffffff" strokeWidth="1.2" />
        {/* Distinctive JJ crest */}
        <path d="M8 6h3v8a2 2 0 01-2 2H8V6zm5 0h3v10a3 3 0 01-3 3h-2v-3h2a1 1 0 001-1V6z" fill="#ffffff" />
      </svg>
    ),
  },
  Dortmund: {
    bg: '#fde100',
    border: '#000000',
    emblem: (
      <svg viewBox="0 0 24 24" width="100%" height="100%">
        <circle cx="12" cy="12" r="10" fill="#fde100" stroke="#000000" strokeWidth="1.5" />
        <text x="12" y="16" textAnchor="middle" fontSize="8" fontWeight="900" fill="#000000" fontFamily="sans-serif">BVB</text>
      </svg>
    ),
  },
  'Paris Saint-Germain': {
    bg: '#001c3e',
    border: '#da291c',
    emblem: (
      <svg viewBox="0 0 24 24" width="100%" height="100%">
        <circle cx="12" cy="12" r="10" fill="#001c3e" stroke="#ffffff" strokeWidth="1" />
        {/* Eiffel Tower in red */}
        <path d="M12 5l-4 13h2l1-3h2l1 3h2L12 5zm0 4l1 4h-2l1-4z" fill="#da291c" />
        <circle cx="12" cy="17" r="1" fill="#fdb913" />
      </svg>
    ),
  },
  PSG: {
    bg: '#001c3e',
    border: '#da291c',
    emblem: (
      <svg viewBox="0 0 24 24" width="100%" height="100%">
        <circle cx="12" cy="12" r="10" fill="#001c3e" stroke="#ffffff" strokeWidth="1" />
        <path d="M12 5l-4 13h2l1-3h2l1 3h2L12 5zm0 4l1 4h-2l1-4z" fill="#da291c" />
        <circle cx="12" cy="17" r="1" fill="#fdb913" />
      </svg>
    ),
  },
};

export const Crest: React.FC<CrestProps> = ({ name, large }) => {
  const [imgError, setImgError] = useState(false);

  // 1. Check if we have an official SVG badge crafted for this club
  const svgBadge = CLUB_SVG_BADGES[name];
  if (svgBadge) {
    const size = large ? 46 : 28;
    return (
      <span
        className={`cr ${large ? 'l' : ''}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: 'transparent',
          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
        }}
        title={name}
      >
        {svgBadge.emblem}
      </span>
    );
  }

  // 2. Check if we have an external image logo from media repository
  const logoUrl = LOGOS[name];
  if (logoUrl && !imgError) {
    return (
      <span
        className={`cr ${large ? 'l' : ''}`}
        style={{ background: 'transparent' }}
      >
        <img
          src={logoUrl}
          alt={name}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </span>
    );
  }

  // 3. Crisp fallback shield with club colors and monogram
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

  const brandColor = col(name);

  return (
    <span
      className={`cr ${large ? 'l' : ''}`}
      style={{
        background: brandColor,
        color: '#ffffff',
        border: '1.5px solid rgba(255,255,255,0.3)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        fontWeight: 900,
        letterSpacing: '-0.3px',
      }}
      title={name}
    >
      {initials}
    </span>
  );
};
