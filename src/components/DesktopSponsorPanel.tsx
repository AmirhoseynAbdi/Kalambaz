import React from 'react';
import { AdBanner } from './AdBanner';
import { BANNER_ADS } from '../config/advertisements';

interface DesktopSponsorPanelProps {
  side?: 'right' | 'left';
  adIndices?: [number, number];
  darkMode: boolean;
  showAds: boolean;
  onOpenContact: () => void;
  onNotify: (msg: string) => void;
}

export const DesktopSponsorPanel: React.FC<DesktopSponsorPanelProps> = ({
  side = 'left',
  adIndices = [0, 1],
  darkMode,
  showAds,
  onOpenContact,
  onNotify,
}) => {
  if (!showAds || BANNER_ADS.length === 0) {
    return <div className="hidden lg:block" aria-hidden="true" />;
  }

  return (
    <aside
      aria-label={side === 'right' ? 'بخش تبلیغات سمت راست' : 'بخش تبلیغات سمت چپ'}
      className={`relative z-10 hidden lg:flex flex-col gap-3 w-full max-w-[265px] xl:max-w-[285px] self-center ${
        side === 'right' ? 'justify-self-start' : 'justify-self-end'
      }`}
    >
      {adIndices.map((idx, slotPosition) => (
        <AdBanner
          key={`${side}-ad-${idx}-${slotPosition}`}
          position="sidebar"
          adIndex={idx % BANNER_ADS.length}
          darkMode={darkMode}
          onNotify={onNotify}
          onOpenContact={onOpenContact}
        />
      ))}
    </aside>
  );
};


