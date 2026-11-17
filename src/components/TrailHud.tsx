import React, { useState } from 'react';
import {
  Compass,
  Crosshair,
  Map as MapIcon,
  Package,
  Pause,
  Play,
  Tent,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { LANDMARKS } from '../data/trailData';
import { formatTrailDate, getOverallHealthLabel } from '../simulation/trailEngine';
import { GameState, Pace, Rations } from '../types/game';

interface TrailHudProps {
  state: GameState;
  muted: boolean;
  onToggleTravel: () => void;
  onCyclePace: () => void;
  onCycleRations: () => void;
  onOpenRest: () => void;
  onStartHunt: () => void;
  onOpenMap: () => void;
  onOpenSupplies: () => void;
  onOpenPause: () => void;
  onToggleMute: () => void;
}

const PACE_LABELS: Record<Pace, string> = {
  steady: 'Steady',
  strenuous: 'Strenuous',
  grueling: 'Grueling',
};

const RATION_LABELS: Record<Rations, string> = {
  filling: 'Filling',
  meager: 'Meager',
  bare_bones: 'Bare Bones',
};

const WEATHER_LABELS: Record<GameState['weather'], string> = {
  fair: 'Fair',
  warm: 'Warm',
  hot: 'Hot',
  rain: 'Rain',
  storm: 'Storm',
  cold: 'Cold',
  snow: 'Snow',
};

export const TrailHud: React.FC<TrailHudProps> = ({
  state,
  muted,
  onToggleTravel,
  onCyclePace,
  onCycleRations,
  onOpenRest,
  onStartHunt,
  onOpenMap,
  onOpenSupplies,
  onOpenPause,
  onToggleMute,
}) => {
  const [logExpanded, setLogExpanded] = useState(false);

  const healthMeta = getOverallHealthLabel(state.party);
  const aliveCount = state.party.filter((m) => m.alive).length;
  const nextLandmark = LANDMARKS[state.nextLandmarkIndex] ?? null;
  const milesToNext = nextLandmark ? Math.max(0, nextLandmark.mile - state.miles) : 0;

  const healthColor =
    healthMeta.tone === 'good'
      ? 'text-emerald-300'
      : healthMeta.tone === 'warn'
      ? 'text-amber-300'
      : 'text-red-400';

  const latestLog = state.logs[0];

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-4 md:p-5">
      {/* Top Perimeter Telemetry Strip (Zero Pills, Tabular Numerals) */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="pointer-events-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-[#18120D]/88 border border-amber-200/20 px-4 py-2 text-xs md:text-sm shadow-lg">
          <span className="font-display font-semibold text-amber-200 whitespace-nowrap">
            {formatTrailDate(state.currentDate)}
          </span>
          <span className="text-amber-200/35" aria-hidden="true">·</span>
          <span className="font-mono-tabular text-stone-200 whitespace-nowrap">
            {WEATHER_LABELS[state.weather]} {state.temperatureF}°F
          </span>
          <span className="text-amber-200/35" aria-hidden="true">·</span>
          <span className="whitespace-nowrap text-stone-300">
            Party ({aliveCount}/5): <strong className={healthColor}>{healthMeta.label}</strong>
          </span>
          <span className="text-amber-200/35" aria-hidden="true">·</span>
          <span className="font-mono-tabular text-stone-200 whitespace-nowrap">
            Food: <strong className={state.inventory.food < 40 ? 'text-red-400' : 'text-amber-100'}>{state.inventory.food} lbs</strong>
          </span>
          <span className="text-amber-200/35" aria-hidden="true">·</span>
          <span className="font-mono-tabular text-stone-200 whitespace-nowrap">
            Oxen: <strong>{state.inventory.oxen}</strong>
          </span>
        </div>

        {/* Right Top: Distance Progress & Utility Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="rounded-lg bg-[#18120D]/88 border border-amber-200/20 px-4 py-2 text-xs md:text-sm font-mono-tabular shadow-lg">
            <span className="text-amber-300 font-semibold">{state.miles}</span>
            <span className="text-stone-400"> / {state.targetMiles} mi</span>
            {nextLandmark && (
              <>
                <span className="text-amber-200/35 mx-2" aria-hidden="true">·</span>
                <span className="text-stone-200">
                  {nextLandmark.name} in <strong className="text-amber-200">{milesToNext} mi</strong>
                </span>
              </>
            )}
          </div>

          <button
            onClick={onToggleMute}
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            className="p-2.5 rounded-lg bg-[#18120D]/88 hover:bg-[#2A2017] border border-amber-200/20 text-amber-100 transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenPause}
            aria-label="Pause Menu"
            className="p-2.5 rounded-lg bg-[#18120D]/88 hover:bg-[#2A2017] border border-amber-200/20 text-amber-100 transition-colors cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Perimeter: Trail Log Toast + Action Control Dock */}
      <div className="flex flex-col gap-2.5 items-center">
        {/* Compact Journal Entry Line */}
        {latestLog && (
          <div className="pointer-events-auto w-full max-w-3xl">
            {logExpanded && (
              <div className="mb-1.5 max-h-40 overflow-y-auto rounded-lg bg-[#18120D]/92 border border-amber-200/20 p-3 space-y-1.5 text-xs">
                {state.logs.slice(0, 12).map((entry, idx) => (
                  <div key={idx} className="flex items-baseline gap-2.5">
                    <span className="font-mono-tabular text-stone-400 shrink-0">
                      {entry.dateStr} · {entry.mile} mi
                    </span>
                    <span
                      className={
                        entry.tone === 'danger'
                          ? 'text-red-300'
                          : entry.tone === 'warn'
                          ? 'text-amber-300'
                          : entry.tone === 'good'
                          ? 'text-emerald-300'
                          : 'text-stone-200'
                      }
                    >
                      {entry.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setLogExpanded((v) => !v)}
              className="w-full flex items-center justify-between gap-3 rounded-lg bg-[#18120D]/85 hover:bg-[#221A13] border border-amber-200/15 px-3.5 py-1.5 text-xs text-left transition-colors cursor-pointer"
            >
              <span className="truncate text-stone-200">
                <strong className="font-mono-tabular text-amber-200/80 mr-2">
                  Day {state.day}:
                </strong>
                {latestLog.message}
              </span>
              <span className="text-amber-200/75 shrink-0 font-medium">
                {logExpanded ? 'Hide Log' : 'Trail Log'}
              </span>
            </button>
          </div>
        )}

        {/* Primary Action Dock */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-xl bg-[#18120D]/92 border border-amber-200/25 p-2 shadow-2xl">
          <button
            onClick={onToggleTravel}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              state.traveling
                ? 'bg-amber-200/15 text-amber-200 border border-amber-300/40 hover:bg-amber-200/25'
                : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
            }`}
          >
            {state.traveling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{state.traveling ? 'Halt Wagon' : 'Continue Trail'}</span>
          </button>

          <button
            onClick={onCyclePace}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-[#241B14] hover:bg-[#31251C] border border-amber-200/15 text-xs md:text-sm text-stone-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Compass className="w-4 h-4 text-amber-300" />
            <span>Pace: <strong>{PACE_LABELS[state.pace]}</strong></span>
          </button>

          <button
            onClick={onCycleRations}
            className="px-3.5 py-2.5 rounded-lg bg-[#241B14] hover:bg-[#31251C] border border-amber-200/15 text-xs md:text-sm text-stone-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Rations: <strong>{RATION_LABELS[state.rations]}</strong>
          </button>

          <button
            onClick={onOpenRest}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-[#241B14] hover:bg-[#31251C] border border-amber-200/15 text-xs md:text-sm text-stone-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Tent className="w-4 h-4 text-amber-300" />
            <span>Rest</span>
          </button>

          <button
            onClick={onStartHunt}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-[#241B14] hover:bg-[#31251C] border border-amber-200/15 text-xs md:text-sm text-stone-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Crosshair className="w-4 h-4 text-amber-300" />
            <span>Hunt</span>
          </button>

          <button
            onClick={onOpenSupplies}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-[#241B14] hover:bg-[#31251C] border border-amber-200/15 text-xs md:text-sm text-stone-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Package className="w-4 h-4 text-amber-300" />
            <span>Supplies & Trade</span>
          </button>

          <button
            onClick={onOpenMap}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-[#241B14] hover:bg-[#31251C] border border-amber-200/15 text-xs md:text-sm text-stone-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <MapIcon className="w-4 h-4 text-amber-300" />
            <span>Trail Map</span>
          </button>
        </div>
      </div>
    </div>
  );
};
