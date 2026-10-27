import React from 'react';
import { LEGAL_CONTENT } from '../../lib/saviourData';

interface LegalPageProps {
  legalKey: 'privacy' | 'terms' | 'responsible';
  onSelectLegalKey: (key: 'privacy' | 'terms' | 'responsible') => void;
  onBack: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({
  legalKey,
  onSelectLegalKey,
  onBack,
}) => {
  const content = LEGAL_CONTENT[legalKey] || LEGAL_CONTENT.privacy;
  const title = content[0] as string;
  const sections = content[1] as [string, string][];

  return (
    <>
      <div className="subpage-nav-bar">
        <button type="button" className="subpage-back-btn" onClick={onBack} aria-label="Back">
          &larr; Back
        </button>
        <span className="subpage-title">{title}</span>
      </div>

      <div className="lgp">
        <small>Last updated October 16, 2026</small>
        {sections.map(([h, p], idx) => (
          <React.Fragment key={idx}>
            <h3>{h}</h3>
            <p>{p}</p>
          </React.Fragment>
        ))}

        <div className="lgl">
          <a onClick={() => onSelectLegalKey('privacy')}>Privacy Policy</a>
          <a onClick={() => onSelectLegalKey('terms')}>Terms of Service</a>
          <a onClick={() => onSelectLegalKey('responsible')}>Responsible Betting</a>
        </div>
      </div>
    </>
  );
};
