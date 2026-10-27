import React from 'react';
import { UnifiedNavbar } from '../common/UnifiedNavbar';

interface DesktopHeaderProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  user: { n: string; e: string; role?: string } | null;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onOpenNotifications?: () => void;
  unreadCount?: number;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onGoToLanding?: () => void;
  onOpenMenu?: () => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  currentRoute,
  onNavigate,
  user,
  onSignIn,
  onSignOut,
  onGoToLanding,
  onOpenMenu,
  onNavigateSection,
}) => {
  return (
    <UnifiedNavbar
      currentRoute={currentRoute}
      isLandingPage={false}
      user={user}
      onNavigateLanding={onGoToLanding || (() => onNavigate(''))}
      onNavigateSection={(sectionId) => {
        if (onNavigateSection) {
          onNavigateSection(sectionId);
        } else if (onGoToLanding) {
          onGoToLanding();
          setTimeout(() => {
            const el = document.getElementById(sectionId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        }
      }}
      onNavigateApp={onNavigate}
      onSignIn={onSignIn || (() => {})}
      onSignOut={onSignOut || (() => {})}
      onOpenMenu={onOpenMenu}
    />
  );
};
