import React, { useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
  onOpenGuide: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onOpenGuide,
  muted,
  onToggleMute,
}) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onStart]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#14100C]">
      {/* Key-Art Backdrop with styled fallback */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1C263B] via-[#4A3A2E] to-[#1A130D]">
        <img
          src="/src/assets/images/title_oregon_prairie_1794926317344.jpg"
          alt="Covered wagon crossing golden frontier prairie toward distant mountains at dusk"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover object-center"
        />
        {/* Measured scrim keeping upper-left sky calm and readable */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, rgba(16,12,9,0.84) 0%, rgba(16,12,9,0.48) 42%, rgba(16,12,9,0.12) 100%)',
          }}
        />
      </div>

      {/* Top-right Audio Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1B1510]/80 hover:bg-[#2B2118] border border-amber-200/20 text-xs font-medium text-amber-100 transition-colors cursor-pointer"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span>{muted ? 'Sound Off' : 'Sound On'}</span>
        </button>
      </div>

      {/* Left Negative Space Title Lockup & Primary CTA */}
      <div className="relative z-10 flex h-full flex-col justify-between px-8 py-10 md:px-16 md:py-14 max-w-2xl">
        <div className="mt-6 md:mt-10">
          {/* Bespoke Inline SVG Title Lockup */}
          <svg
            viewBox="0 0 540 165"
            className="w-full max-w-[500px] h-auto drop-shadow-[0_4px_24px_rgba(0,0,0,0.65)]"
            role="img"
            aria-label="The Oregon Trail 1848"
          >
            {/* Ornamental Frontier Rule & Wagon Wheel Emblem */}
            <g transform="translate(28, 28)">
              <circle cx="0" cy="0" r="18" fill="none" stroke="#F59E0B" strokeWidth="2.2" />
              <circle cx="0" cy="0" r="4" fill="#F59E0B" />
              <line x1="-18" y1="0" x2="18" y2="0" stroke="#F59E0B" strokeWidth="1.4" />
              <line x1="0" y1="-18" x2="0" y2="18" stroke="#F59E0B" strokeWidth="1.4" />
              <line x1="-12.7" y1="-12.7" x2="12.7" y2="12.7" stroke="#F59E0B" strokeWidth="1.4" />
              <line x1="12.7" y1="-12.7" x2="-12.7" y2="12.7" stroke="#F59E0B" strokeWidth="1.4" />
            </g>
            <line x1="60" y1="28" x2="290" y2="28" stroke="#F59E0B" strokeOpacity="0.45" strokeWidth="1" />
            <text
              x="68"
              y="22"
              fill="#FDE68A"
              fontSize="13"
              fontFamily="'IBM Plex Mono', monospace"
              letterSpacing="3"
            >
              1848 EXPEDITION · 2,040 MILES
            </text>

            <text
              x="10"
              y="88"
              fill="#FAF3E3"
              fontSize="52"
              fontWeight="700"
              fontFamily="'Fraunces', Georgia, serif"
              letterSpacing="-0.5"
            >
              The Oregon Trail
            </text>
            <text
              x="12"
              y="124"
              fill="#E7D8BE"
              fontSize="18"
              fontFamily="'Plus Jakarta Sans', sans-serif"
            >
              Independence, Missouri to the Willamette Valley
            </text>
          </svg>

          <p className="mt-4 max-w-md text-sm md:text-base text-stone-200/90 leading-relaxed">
            Outfit your prairie schooner, manage daily rations and pace, hunt game across the plains, and guide your party safely through swollen rivers and mountain passes before winter closes in.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={onStart}
              className="px-7 py-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-base shadow-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
            >
              Start Journey
            </button>
            <button
              onClick={onOpenGuide}
              className="px-5 py-3.5 rounded-lg bg-[#1F1812]/80 hover:bg-[#2C221A] text-amber-100 border border-amber-200/25 font-medium text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Trail Guide
            </button>
          </div>
        </div>

        {/* Single flat control-hint line */}
        <div className="text-xs font-mono-tabular text-amber-100/75 tracking-wide">
          Enter Start · Space Travel/Fire · P Pace · R Rations · H Hunt · M Map · Esc Pause
        </div>
      </div>
    </div>
  );
};
