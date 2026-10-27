import React, { useState } from 'react';

interface WatermarkLoaderProps {
  text?: string;
  className?: string;
  minHeight?: string;
}

export const WatermarkLoader: React.FC<WatermarkLoaderProps> = ({
  text = 'Loading live data...',
  className = '',
  minHeight = '180px',
}) => {
  return (
    <div
      className={`watermark-loader-container ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        padding: '30px 20px',
        width: '100%',
        userSelect: 'none',
      }}
    >
      <div className="watermark-pulse-wrap">
        <img
          src="/assets/wordmark.png"
          alt="SpiderPicks Loading"
          className="watermark-pulse-img"
        />
        <div className="watermark-shimmer-bar" />
      </div>
      {text && (
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--mu)',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginTop: '8px',
          }}
        >
          {text}
        </span>
      )}
    </div>
  );
};

interface WatermarkImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  aspectRatio?: string;
  borderRadius?: string;
  containerClassName?: string;
}

export const WatermarkImage: React.FC<WatermarkImageProps> = ({
  src,
  alt,
  aspectRatio = '16/9',
  borderRadius = '12px',
  containerClassName = '',
  className = '',
  style,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      className={`watermark-img-frame ${containerClassName}`}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio,
        borderRadius,
        overflow: 'hidden',
        background: 'var(--s2)',
      }}
    >
      {/* Watermark Loading Animation (shown until image is fully loaded) */}
      {!loaded && !error && (
        <div
          className="watermark-img-placeholder"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(10, 125, 55, 0.08) 0%, rgba(5, 30, 15, 0.25) 100%)',
            zIndex: 1,
          }}
        >
          <img
            src="/assets/wordmark.png"
            alt="Loading"
            className="watermark-pulse-img"
            style={{ width: '130px', height: 'auto', objectFit: 'contain' }}
          />
          <div className="watermark-shimmer-bar" />
        </div>
      )}

      {/* Target Image */}
      {!error && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={className}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.35s ease',
            ...style,
          }}
          {...props}
        />
      )}

      {/* Fallback if broken */}
      {error && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--s2)',
            color: 'var(--mu)',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          Image preview unavailable
        </div>
      )}
    </div>
  );
};
