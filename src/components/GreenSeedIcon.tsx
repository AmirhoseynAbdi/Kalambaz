import React from 'react';

interface GreenSeedIconProps {
  className?: string;
}

/**
 * Dual Green & Purple Seeds Icon (دو بذر سبز و بنفش کلمباز)
 * Renders two vibrant overlapping botanical seeds—one royal purple seed and one lime-emerald seed—matching the Kalabaz palette.
 */
export const GreenSeedIcon: React.FC<GreenSeedIconProps> = ({
  className = 'w-4 h-4',
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Back/Right Seed: Vibrant Royal Purple Seed (tilted +18deg) */}
      <g transform="translate(3.5, 0.5) rotate(16 12 13)">
        <path
          d="M13 3.2C13 3.2 7.8 8.8 7.8 13.8C7.8 17.1 10.1 19.6 13 19.6C15.9 19.6 18.2 17.1 18.2 13.8C18.2 8.8 13 3.2 13 3.2Z"
          fill="#9333ea"
          stroke="#e9d5ff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M13 5.6C11.5 7.9 9.5 11.1 9.5 13.8C9.5 16 11 17.8 13 17.8C15 17.8 16.5 16 16.5 13.8C16.5 11.1 14.5 7.9 13 5.6Z"
          fill="#a855f7"
        />
        <path
          d="M14.6 11.2C15 12.2 15 13.4 14.5 14.4"
          stroke="#f3e8ff"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>

      {/* Front/Left Seed: Vibrant Lime & Emerald Green Seed (tilted -14deg) */}
      <g transform="translate(-2.8, 1.5) rotate(-14 11 13)">
        <path
          d="M10.5 3.2C10.5 3.2 5.2 8.9 5.2 14C5.2 17.4 7.6 20 10.5 20C13.4 20 15.8 17.4 15.8 14C15.8 8.9 10.5 3.2 10.5 3.2Z"
          fill="#16a34a"
          stroke="#bef264"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M10.5 5.6C9 7.9 7 11.2 7 14C7 16.3 8.5 18.1 10.5 18.1C12.5 18.1 14 16.3 14 14C14 11.2 12 7.9 10.5 5.6Z"
          fill="#84cc16"
        />
        <path
          d="M8.5 11.6C8.1 12.6 8.1 13.8 8.6 14.8"
          stroke="#ecfccb"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};
