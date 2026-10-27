import React, { useState } from 'react';

interface BrandWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  className?: string;
  showSubtitle?: boolean;
  variant?: 'full' | 'wordmark-only' | 'icon-only';
}

export const BrandWordmark: React.FC<BrandWordmarkProps> = ({
  size = 'md',
  onClick,
  className = '',
  showSubtitle = false,
  variant = 'full',
}) => {
  const [imgError, setImgError] = useState(false);
  const [wordmarkError, setWordmarkError] = useState(false);

  const iconHeight = size === 'sm' ? 28 : size === 'lg' ? 44 : size === 'xl' ? 56 : 36;
  const wordmarkHeight = size === 'sm' ? 24 : size === 'lg' ? 36 : size === 'xl' ? 46 : 28;

  if (variant === 'icon-only') {
    return (
      <div
        onClick={onClick}
        className={`spider-icon-wrap ${onClick ? 'cursor-pointer' : ''} ${className}`}
        style={{ display: 'inline-flex', alignItems: 'center' }}
      >
        <img
          src="/assets/icon.png"
          alt="Spider Picks Icon"
          style={{
            height: `${iconHeight}px`,
            width: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 2px 8px rgba(10, 125, 55, 0.4))',
          }}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  if (variant === 'wordmark-only') {
    return (
      <div
        onClick={onClick}
        className={`spider-wordmark-wrap ${onClick ? 'cursor-pointer' : ''} ${className}`}
        style={{ display: 'inline-flex', alignItems: 'center' }}
      >
        {!wordmarkError ? (
          <img
            src="/assets/wordmark.png"
            alt="Spider Picks"
            style={{
              height: `${wordmarkHeight}px`,
              width: 'auto',
              objectFit: 'contain',
              maxWidth: '220px',
            }}
            onError={() => setWordmarkError(true)}
          />
        ) : (
          <span style={{ fontWeight: 800, fontSize: '18px', color: '#fff', letterSpacing: '-0.3px' }}>
            SPIDER<span style={{ color: 'var(--g)' }}>PICKS</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`brand-wordmark-container ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'sm' ? '8px' : '10px',
        userSelect: 'none',
      }}
    >
      {/* Spider Web Icon */}
      <img
        src="/assets/icon.png"
        alt="Spider Picks"
        style={{
          height: `${iconHeight}px`,
          width: 'auto',
          objectFit: 'contain',
          filter: 'drop-shadow(0 2px 8px rgba(10, 125, 55, 0.35))',
          flexShrink: 0,
        }}
        onError={() => setImgError(true)}
      />

      {/* Spider Picks Logo Wordmark */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {!wordmarkError ? (
          <img
            src="/assets/wordmark.png"
            alt="Spider Picks"
            style={{
              height: `${wordmarkHeight}px`,
              width: 'auto',
              objectFit: 'contain',
              maxWidth: size === 'sm' ? '140px' : size === 'lg' ? '240px' : '180px',
            }}
            onError={() => setWordmarkError(true)}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                fontWeight: 800,
                fontSize: size === 'sm' ? '15px' : size === 'lg' ? '22px' : '18px',
                letterSpacing: '-0.5px',
                fontFamily: 'Figtree, sans-serif',
                color: 'var(--tx)',
              }}
            >
              SPIDER
            </span>
            <span
              style={{
                fontWeight: 800,
                fontSize: size === 'sm' ? '10px' : size === 'lg' ? '12px' : '11px',
                padding: '2px 6px',
                borderRadius: '99px',
                background: 'var(--g)',
                color: '#ffffff',
                letterSpacing: '0.5px',
              }}
            >
              PICKS
            </span>
          </div>
        )}
        {showSubtitle && (
          <span
            style={{
              fontSize: '11px',
              color: 'var(--mu)',
              fontWeight: 600,
              marginTop: '1px',
            }}
          >
            Smarter Football Predictions
          </span>
        )}
      </div>
    </div>
  );
};
