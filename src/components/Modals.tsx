import React from 'react';
import { LANDMARKS, PROFESSIONS } from '../data/trailData';
import { computeFinalScore, formatTrailDate } from '../simulation/trailEngine';
import {
  ActiveEvent,
  GameState,
  Landmark,
  RiverState,
  Tombstone,
} from '../types/game';

/* ---------- LANDMARK MODAL ---------- */
interface LandmarkModalProps {
  landmark: Landmark;
  cash: number;
  onOpenFortStore: () => void;
  onForkSelect: (targetId: string) => void;
  onContinue: () => void;
}

export const LandmarkModal: React.FC<LandmarkModalProps> = ({
  landmark,
  cash,
  onOpenFortStore,
  onForkSelect,
  onContinue,
}) => {
  const artworkUrl =
    landmark.type === 'fort'
      ? '/src/assets/images/landmark_fort_outpost_1794926318676.jpg'
      : landmark.biome === 'rockies' ||
        landmark.biome === 'blue_mountains' ||
        landmark.biome === 'columbia_gorge'
      ? '/src/assets/images/landmark_mountain_pass_1794926318555.jpg'
      : '/src/assets/images/title_oregon_prairie_1794926317344.jpg';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 md:p-6">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-[#1F1812] border border-amber-200/25 shadow-2xl">
        <div className="relative h-48 md:h-56 w-full bg-gradient-to-br from-[#2B2118] to-[#14100C]">
          <img
            src={artworkUrl}
            alt={landmark.name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(31,24,18,1) 0%, rgba(31,24,18,0.25) 60%, rgba(0,0,0,0) 100%)',
            }}
          />
          <div className="absolute bottom-3 left-6 right-6 flex items-baseline justify-between gap-4">
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-amber-100">
              {landmark.name}
            </h2>
            <span className="font-mono-tabular text-xs text-amber-200/90 shrink-0">
              Mile {landmark.mile} · Elev {landmark.elevationFt.toLocaleString()} ft
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-stone-200 leading-relaxed">{landmark.description}</p>

          {landmark.localTip && (
            <div className="rounded-lg bg-[#16110C] border border-amber-200/15 p-3.5 text-xs text-amber-100/90 leading-relaxed">
              <strong className="text-amber-300">Frontier Dispatch: </strong>
              {landmark.localTip}
            </div>
          )}

          {landmark.type === 'fork' && landmark.forkOptions ? (
            <div className="pt-2 space-y-2.5">
              <div className="text-xs font-medium text-stone-400">
                Choose your route ahead:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => onForkSelect(landmark.forkOptions!.leftTargetId)}
                  className="py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm transition-colors cursor-pointer"
                >
                  {landmark.forkOptions.leftLabel}
                </button>
                <button
                  onClick={() => onForkSelect(landmark.forkOptions!.rightTargetId)}
                  disabled={
                    landmark.id === 'the_dalles' && cash < 5
                  }
                  className="py-3 px-4 rounded-lg bg-[#2B2118] hover:bg-[#3A2D21] border border-amber-200/25 text-amber-100 font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {landmark.forkOptions.rightLabel}
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
              {landmark.type === 'fort' && (
                <button
                  onClick={onOpenFortStore}
                  className="px-5 py-2.5 rounded-lg bg-[#2B2118] hover:bg-[#3A2D21] border border-amber-200/25 text-amber-100 font-medium text-sm transition-colors cursor-pointer"
                >
                  Visit Trading Post (${cash.toFixed(2)})
                </button>
              )}
              <button
                onClick={onContinue}
                className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm transition-colors cursor-pointer"
              >
                Continue West
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------- RIVER CROSSING MODAL ---------- */
interface RiverModalProps {
  river: RiverState;
  cash: number;
  weather: GameState['weather'];
  onAction: (method: 'ford' | 'caulk' | 'ferry' | 'wait') => void;
}

export const RiverModal: React.FC<RiverModalProps> = ({
  river,
  cash,
  weather,
  onAction,
}) => {
  const depthDanger = river.depthFt >= 3.3;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-lg rounded-xl bg-[#1F1812] border border-amber-200/25 p-6 shadow-2xl">
        <h2 className="font-display text-2xl font-semibold text-amber-100">
          {river.landmark.name}
        </h2>
        <p className="mt-1.5 text-sm text-stone-300 leading-relaxed">
          {river.landmark.description}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3 rounded-lg bg-[#16110C] border border-amber-200/15 p-3.5 text-center font-mono-tabular">
          <div>
            <div className="text-xs text-stone-400">River Width</div>
            <div className="mt-0.5 text-base font-semibold text-amber-100">
              {river.widthFt} ft
            </div>
          </div>
          <div>
            <div className="text-xs text-stone-400">Channel Depth</div>
            <div
              className={`mt-0.5 text-base font-semibold ${
                depthDanger ? 'text-red-400' : 'text-emerald-300'
              }`}
            >
              {river.depthFt.toFixed(1)} ft
            </div>
          </div>
          <div>
            <div className="text-xs text-stone-400">Current</div>
            <div className="mt-0.5 text-base font-semibold text-amber-200">
              {river.currentMph.toFixed(1)} mph
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-stone-400">
          Weather: <span className="text-stone-200 capitalize">{weather}</span> ·{' '}
          {depthDanger
            ? 'Water is deeper than wagon axles (>3.2 ft); fording carries real risk of swamping.'
            : 'Shallow enough for careful fording.'}
        </div>

        <div className="mt-5 space-y-2.5">
          <button
            onClick={() => onAction('ford')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-[#2A2018] hover:bg-[#382B20] border border-amber-200/20 text-left text-sm transition-colors cursor-pointer"
          >
            <span className="font-medium text-amber-100">Ford the river</span>
            <span className="text-xs text-stone-400">
              {depthDanger ? 'High swamping risk' : 'Safe below 3.2 ft'}
            </span>
          </button>

          <button
            onClick={() => onAction('caulk')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-[#2A2018] hover:bg-[#382B20] border border-amber-200/20 text-left text-sm transition-colors cursor-pointer"
          >
            <span className="font-medium text-amber-100">Caulk wagon box and float</span>
            <span className="text-xs text-stone-400">
              Moderate risk in swift currents
            </span>
          </button>

          <button
            onClick={() => onAction('ferry')}
            disabled={cash < river.ferryCost}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <span>Hire Ferry (${river.ferryCost.toFixed(2)})</span>
            <span className="text-xs text-stone-900">Safest passage · 1 day</span>
          </button>

          <button
            onClick={() => onAction('wait')}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#16110C] hover:bg-[#231B14] border border-amber-200/15 text-sm text-stone-300 transition-colors cursor-pointer"
          >
            <span>Wait a day for waters to drop</span>
            <span className="text-xs text-stone-400">Waited {river.waitedDays}d</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------- EVENT MODAL ---------- */
interface EventModalProps {
  event: ActiveEvent;
  onChoice: (actionId: string) => void;
  onDismiss: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  event,
  onChoice,
  onDismiss,
}) => {
  const accentText =
    event.tone === 'danger'
      ? 'text-red-300'
      : event.tone === 'warning'
      ? 'text-amber-300'
      : event.tone === 'positive'
      ? 'text-emerald-300'
      : 'text-amber-100';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-md rounded-xl bg-[#1F1812] border border-amber-200/25 p-6 shadow-2xl">
        <h2 className={`font-display text-2xl font-semibold ${accentText}`}>
          {event.title}
        </h2>
        <p className="mt-2.5 text-sm text-stone-200 leading-relaxed">
          {event.narrative}
        </p>

        <div className="mt-6 space-y-2.5">
          {event.choices && event.choices.length > 0 ? (
            event.choices.map((c) => (
              <button
                key={c.actionId}
                disabled={c.disabled}
                onClick={() => onChoice(c.actionId)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-[#2A2018] hover:bg-[#382B20] border border-amber-200/20 text-left text-sm text-amber-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <span className="font-medium">{c.label}</span>
                {c.hint && <span className="text-xs text-stone-400">{c.hint}</span>}
              </button>
            ))
          ) : (
            <button
              onClick={onDismiss}
              className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm transition-colors cursor-pointer"
            >
              Continue Trail
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------- TOMBSTONE MODAL ---------- */
export const TombstoneModal: React.FC<{
  tombstone: Tombstone;
  onDismiss: () => void;
}> = ({ tombstone, onDismiss }) => (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
    <div className="w-full max-w-sm rounded-xl bg-[#241E19] border border-stone-500/35 p-6 text-center shadow-2xl">
      <div className="mx-auto mb-4 w-32 rounded-t-full border-2 border-stone-400/50 bg-stone-800/80 px-3 py-5">
        <div className="text-[11px] font-mono-tabular uppercase tracking-widest text-stone-400">
          Here Lies
        </div>
        <div className="mt-1 font-display text-base font-semibold text-stone-100">
          {tombstone.name}
        </div>
        <div className="mt-1 text-xs font-mono-tabular text-stone-400">
          {tombstone.dateStr}
        </div>
      </div>
      <p className="text-sm italic text-stone-300 leading-relaxed">
        “{tombstone.epitaph}”
      </p>
      <div className="mt-2 text-xs font-mono-tabular text-stone-400">
        Mile {tombstone.mile}
      </div>
      <button
        onClick={onDismiss}
        className="mt-5 w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm transition-colors cursor-pointer"
      >
        Pay Respects & Continue
      </button>
    </div>
  </div>
);

/* ---------- REST MODAL ---------- */
export const RestModal: React.FC<{
  onRestDays: (days: number) => void;
  onClose: () => void;
}> = ({ onRestDays, onClose }) => (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
    <div className="w-full max-w-md rounded-xl bg-[#1F1812] border border-amber-200/25 p-6 shadow-2xl">
      <h2 className="font-display text-2xl font-semibold text-amber-100">
        Make Camp & Rest
      </h2>
      <p className="mt-2 text-sm text-stone-300">
        Resting allows sick travelers to recover and restores strength, though your party continues consuming daily rations.
      </p>
      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {[1, 2, 3].map((d) => (
          <button
            key={d}
            onClick={() => onRestDays(d)}
            className="py-3 px-3 rounded-lg bg-[#2B2118] hover:bg-amber-500 hover:text-stone-950 border border-amber-200/25 text-amber-100 font-semibold text-sm transition-colors cursor-pointer"
          >
            Rest {d} {d === 1 ? 'Day' : 'Days'}
          </button>
        ))}
      </div>
      <button
        onClick={onClose}
        className="mt-4 w-full py-2 text-xs text-stone-400 hover:text-stone-200 cursor-pointer"
      >
        Cancel
      </button>
    </div>
  </div>
);

/* ---------- SUPPLIES & TRADE MODAL ---------- */
interface SuppliesModalProps {
  state: GameState;
  onAcceptTrade: () => void;
  onRefreshTrade: () => void;
  onClose: () => void;
}

export const SuppliesModal: React.FC<SuppliesModalProps> = ({
  state,
  onAcceptTrade,
  onRefreshTrade,
  onClose,
}) => {
  const offer = state.barterOffer;
  const canAcceptTrade =
    offer !== null && state.inventory[offer.wantsKey] >= offer.wantsAmount;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-xl bg-[#1F1812] border border-amber-200/25 p-6 shadow-2xl my-auto">
        <div className="flex items-center justify-between border-b border-amber-200/15 pb-3">
          <h2 className="font-display text-2xl font-semibold text-amber-100">
            Wagon Manifest & Party Health
          </h2>
          <button
            onClick={onClose}
            className="text-sm text-amber-200 hover:text-amber-100 cursor-pointer"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Party Roster */}
          <div>
            <h3 className="text-xs font-semibold text-amber-200 mb-2.5">
              Travelers ({state.party.filter((m) => m.alive).length}/5 Alive)
            </h3>
            <div className="space-y-2.5">
              {state.party.map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg bg-[#16110C] border border-amber-200/15 px-3.5 py-2.5"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className={m.alive ? 'text-amber-50 font-medium' : 'text-stone-500 line-through'}>
                      {m.name} {m.isLeader ? '(Leader)' : ''}
                    </span>
                    <span className="font-mono-tabular text-xs text-stone-300">
                      {m.alive ? `${m.health}%` : 'Deceased'}
                    </span>
                  </div>
                  {m.alive ? (
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="h-1.5 flex-1 rounded-full bg-stone-800 overflow-hidden">
                        <div
                          className={`h-full ${
                            m.health > 65
                              ? 'bg-emerald-500'
                              : m.health > 35
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${m.health}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-amber-300">
                        {m.illness ?? 'Healthy'}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-stone-500">
                      {m.causeOfDeath} (Mile {m.deathMile})
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Inventory & Barter */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-amber-200 mb-2.5">
                Wagon Cargo · Condition {state.wagonCondition}%
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono-tabular bg-[#16110C] border border-amber-200/15 rounded-lg p-3.5">
                <div className="text-stone-400">Cash</div>
                <div className="text-right text-amber-300 font-semibold">${state.inventory.cash.toFixed(2)}</div>
                <div className="text-stone-400">Oxen</div>
                <div className="text-right text-stone-100">{state.inventory.oxen} animals</div>
                <div className="text-stone-400">Food</div>
                <div className="text-right text-stone-100">{state.inventory.food} lbs</div>
                <div className="text-stone-400">Clothing</div>
                <div className="text-right text-stone-100">{state.inventory.clothing} sets</div>
                <div className="text-stone-400">Ammunition</div>
                <div className="text-right text-stone-100">{state.inventory.ammo} rounds</div>
                <div className="text-stone-400">Spare Parts</div>
                <div className="text-right text-stone-100">
                  {state.inventory.wheels}W / {state.inventory.axles}A / {state.inventory.tongues}T
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-[#16110C] border border-amber-200/20 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-amber-200">
                  Trail Barter
                </h3>
                <button
                  onClick={onRefreshTrade}
                  className="text-xs text-amber-300 hover:text-amber-200 underline underline-offset-4 cursor-pointer"
                >
                  Look for Another Trader
                </button>
              </div>
              {offer ? (
                <div className="mt-2.5 space-y-3">
                  <p className="text-xs text-stone-300">
                    <strong className="text-amber-100">{offer.travelerName}</strong> offers{' '}
                    <strong className="text-emerald-300">{offer.givesLabel}</strong> in exchange for{' '}
                    <strong className="text-amber-300">{offer.wantsLabel}</strong>.
                  </p>
                  <button
                    onClick={onAcceptTrade}
                    disabled={!canAcceptTrade}
                    className="w-full py-2 px-3 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {canAcceptTrade ? 'Accept Barter' : `Need ${offer.wantsLabel}`}
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-xs text-stone-400">
                  No wagon trains nearby right now. Click above to hail passing travelers.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- INTERACTIVE SVG TRAIL MAP ---------- */
export const TrailMapModal: React.FC<{
  miles: number;
  visitedLandmarks: string[];
  onClose: () => void;
}> = ({ miles, visitedLandmarks, onClose }) => {
  const progressPct = Math.min(100, Math.round((miles / 2040) * 100));

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-xl bg-[#1F1812] border border-amber-200/25 p-6 shadow-2xl my-auto">
        <div className="flex items-center justify-between border-b border-amber-200/15 pb-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-amber-100">
              1848 Oregon Trail Route Map
            </h2>
            <p className="text-xs font-mono-tabular text-stone-300">
              {miles} of 2,040 miles completed ({progressPct}%)
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-[#2B2118] hover:bg-[#3B2E22] text-xs font-medium text-amber-100 cursor-pointer"
          >
            Close Map
          </button>
        </div>

        <div className="mt-4 rounded-lg bg-[#E9DCC3] border border-amber-900/40 p-4 overflow-x-auto">
          <svg viewBox="0 0 900 260" className="w-full min-w-[640px] h-auto">
            {/* Cartographic Grid */}
            <rect x="0" y="0" width="900" height="260" fill="#E9DCC3" />
            <line x1="20" y1="220" x2="880" y2="220" stroke="#A69072" strokeWidth="1" />

            {/* Trail Path */}
            <path
              d="M 855 185 C 760 175, 690 155, 610 140 C 520 120, 460 112, 380 122 C 295 130, 225 96, 155 88 C 110 82, 72 72, 42 66"
              fill="none"
              stroke="#7C4D2B"
              strokeWidth="4"
              strokeDasharray="7 5"
            />

            {/* Landmarks from East (right) to West (left) */}
            {LANDMARKS.map((lm, i) => {
              const t = lm.mile / 2040;
              const x = 855 - t * 813;
              const y =
                185 -
                Math.sin(t * Math.PI * 0.65) * 35 -
                t * 118 +
                (i % 2 === 0 ? 6 : -6);
              const reached = miles >= lm.mile || visitedLandmarks.includes(lm.id);

              return (
                <g key={lm.id}>
                  <circle
                    cx={x}
                    cy={y}
                    r={lm.type === 'fort' ? 6 : lm.type === 'river' ? 5 : 4.5}
                    fill={
                      reached
                        ? '#15803D'
                        : lm.type === 'river'
                        ? '#0369A1'
                        : '#78350F'
                    }
                    stroke="#FAF3E3"
                    strokeWidth="1.5"
                  />
                  {i % 2 === 0 ? (
                    <text
                      x={x}
                      y={y - 11}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="600"
                      fill="#291D14"
                      fontFamily="'Plus Jakarta Sans', sans-serif"
                    >
                      {lm.name.replace(' Crossing', '').replace(' (Continental Divide)', '').replace(' (Willamette Valley)', '')}
                    </text>
                  ) : (
                    <text
                      x={x}
                      y={y + 18}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="600"
                      fill="#291D14"
                      fontFamily="'Plus Jakarta Sans', sans-serif"
                    >
                      {lm.name.replace(' Crossing', '').replace(' Summit', '')}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Current Wagon Marker */}
            {(() => {
              const t = Math.min(1, miles / 2040);
              const wx = 855 - t * 813;
              const wy = 185 - Math.sin(t * Math.PI * 0.65) * 35 - t * 118;
              return (
                <g transform={`translate(${wx}, ${wy})`}>
                  <circle cx="0" cy="0" r="10" fill="#D97706" stroke="#1F1812" strokeWidth="2.5" />
                  <text
                    x="0"
                    y="-16"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#991B1B"
                    fontFamily="'IBM Plex Mono', monospace"
                  >
                    WAGON ({miles} mi)
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>
      </div>
    </div>
  );
};

/* ---------- GUIDE MODAL ---------- */
export const GuideModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
    <div className="w-full max-w-xl rounded-xl bg-[#1F1812] border border-amber-200/25 p-6 shadow-2xl my-auto">
      <h2 className="font-display text-2xl font-semibold text-amber-100">
        Emigrant’s Trail Guide
      </h2>
      <div className="mt-4 space-y-3 text-sm text-stone-300 leading-relaxed">
        <p>
          <strong className="text-amber-200">Pace & Rations:</strong> Steady pace preserves party health and prevents broken axles. Strenuous and grueling paces cover more ground before autumn blizzards, at a steep cost to health.
        </p>
        <p>
          <strong className="text-amber-200">River Crossings:</strong> Always check river depth before crossing. Below 3.2 feet, fording is generally safe. Above that, caulking your wagon or hiring the ferry protects supplies and lives.
        </p>
        <p>
          <strong className="text-amber-200">Hunting:</strong> Aim with Mouse or WASD/Arrows and fire with Click or Space. Each expedition can haul up to 100 lbs of fresh meat back to the wagon.
        </p>
        <p>
          <strong className="text-amber-200">Scoring:</strong> Your final expedition score reflects surviving travelers, remaining health, wagon condition, cargo, and your chosen profession multiplier (1x Banker, 2x Carpenter, 3x Farmer).
        </p>
      </div>
      <button
        onClick={onClose}
        className="mt-6 w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm cursor-pointer"
      >
        Close Guide
      </button>
    </div>
  </div>
);

/* ---------- PAUSE MODAL ---------- */
export const PauseModal: React.FC<{
  onResume: () => void;
  onOpenGuide: () => void;
  onRestart: () => void;
}> = ({ onResume, onOpenGuide, onRestart }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
    <div className="w-full max-w-sm rounded-xl bg-[#1F1812] border border-amber-200/25 p-6 shadow-2xl">
      <h2 className="font-display text-2xl font-semibold text-amber-100">
        Expedition Paused
      </h2>
      <div className="mt-5 space-y-2.5">
        <button
          onClick={onResume}
          className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm cursor-pointer"
        >
          Resume Trail
        </button>
        <button
          onClick={onOpenGuide}
          className="w-full py-2.5 px-4 rounded-lg bg-[#2B2118] hover:bg-[#3A2D21] border border-amber-200/20 text-amber-100 font-medium text-sm cursor-pointer"
        >
          Trail Guide
        </button>
        <button
          onClick={onRestart}
          className="w-full py-2.5 px-4 rounded-lg bg-[#16110C] hover:bg-red-950/50 border border-red-400/25 text-red-200 font-medium text-sm cursor-pointer"
        >
          Abandon & Start New Expedition
        </button>
      </div>
    </div>
  </div>
);

/* ---------- END GAME (VICTORY / GAME OVER) MODAL ---------- */
export const EndGameModal: React.FC<{
  state: GameState;
  onPlayAgain: () => void;
}> = ({ state, onPlayAgain }) => {
  const isVictory = state.screen === 'VICTORY';
  const score = computeFinalScore(state);
  const prof = PROFESSIONS.find((p) => p.id === state.profession)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl bg-[#1F1812] border border-amber-200/25 p-7 shadow-2xl my-auto">
        <div className="text-xs font-mono-tabular text-amber-300">
          {isVictory ? 'WILLAMETTE VALLEY · ARRIVAL' : 'EXPEDITION LOST'}
        </div>
        <h2 className="mt-1 font-display text-3xl font-semibold text-amber-100">
          {isVictory ? 'You Reached Oregon City!' : 'The Trail Claimed Your Party'}
        </h2>
        <p className="mt-2 text-sm text-stone-300 leading-relaxed">
          {isVictory
            ? `After ${state.day} days across 2,040 miles of prairie, river, and mountain pass, your wagon arrived on ${formatTrailDate(
                state.currentDate
              )}.`
            : `Your expedition ended on ${formatTrailDate(
                state.currentDate
              )} at mile ${state.miles} after ${state.day} days on the trail.`}
        </p>

        {isVictory && (
          <div className="mt-5 rounded-lg bg-[#16110C] border border-amber-200/15 p-4 space-y-2 text-xs font-mono-tabular">
            <div className="flex justify-between text-stone-300">
              <span>Survivors ({state.party.filter((m) => m.alive).length}/5)</span>
              <span>{score.survivorPoints} pts</span>
            </div>
            <div className="flex justify-between text-stone-300">
              <span>Wagon Condition ({state.wagonCondition}%)</span>
              <span>{score.wagonPoints} pts</span>
            </div>
            <div className="flex justify-between text-stone-300">
              <span>Remaining Cargo & Livestock</span>
              <span>{score.supplyPoints} pts</span>
            </div>
            <div className="flex justify-between text-stone-300">
              <span>Cash Remaining (${state.inventory.cash.toFixed(2)})</span>
              <span>{score.cashPoints} pts</span>
            </div>
            <div className="flex justify-between text-amber-200 border-t border-amber-200/15 pt-2">
              <span>{prof.title} Multiplier</span>
              <span>×{score.multiplier}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-amber-300 pt-1">
              <span>Final Score</span>
              <span>{score.totalScore.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-mono-tabular text-stone-300">
          <div className="rounded-md bg-[#16110C] p-2.5 border border-amber-200/10">
            <div className="text-stone-400">Miles</div>
            <div className="text-sm font-semibold text-amber-100">{state.miles}</div>
          </div>
          <div className="rounded-md bg-[#16110C] p-2.5 border border-amber-200/10">
            <div className="text-stone-400">Rivers Crossed</div>
            <div className="text-sm font-semibold text-amber-100">{state.riversCrossed}</div>
          </div>
          <div className="rounded-md bg-[#16110C] p-2.5 border border-amber-200/10">
            <div className="text-stone-400">Meat Hunted</div>
            <div className="text-sm font-semibold text-amber-100">{state.totalMeatHunted} lbs</div>
          </div>
        </div>

        <button
          onClick={onPlayAgain}
          className="mt-6 w-full py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm transition-colors cursor-pointer"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};
