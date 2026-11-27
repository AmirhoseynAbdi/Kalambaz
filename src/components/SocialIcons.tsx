import React from 'react';

export const KALAMBAZ_SOCIALS = {
  telegram: {
    handle: '@kalambaz_ir',
    url: 'https://t.me/kalambaz_ir',
    name: 'تلگرام',
  },
  x: {
    handle: '@Kalambaz_ir',
    url: 'https://x.com/Kalambaz_ir',
    name: 'ایکس (X)',
  },
} as const;

export const TelegramIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M21.94 4.66c.29-1.22-.44-1.7-1.26-1.39L2.88 10.13c-1.21.48-1.19 1.17-.22 1.47l4.55 1.42 10.55-6.66c.5-.3.96-.14.58.19l-8.54 7.7-.33 4.74c.49 0 .7-.22.97-.49l2.33-2.27 4.85 3.58c.89.49 1.53.24 1.75-.82l3.17-14.93Z" />
  </svg>
);

export const XSocialIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
