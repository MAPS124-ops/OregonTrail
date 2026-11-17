import React, { useState } from 'react';
import {
  DEFAULT_PARTY_NAMES,
  DEPARTURE_MONTHS,
  PROFESSIONS,
  RANDOM_NAME_POOL,
  STORE_ITEMS,
} from '../data/trailData';
import { DepartureMonth, Inventory, ProfessionId } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface PartySetupProps {
  onConfirm: (
    profession: ProfessionId,
    names: string[],
    month: DepartureMonth
  ) => void;
  onBack: () => void;
}

export const PartySetup: React.FC<PartySetupProps> = ({ onConfirm, onBack }) => {
  const [profession, setProfession] = useState<ProfessionId>('carpenter');
  const [names, setNames] = useState<string[]>([...DEFAULT_PARTY_NAMES]);
  const [month, setMonth] = useState<DepartureMonth>('may');

  const randomizeNames = () => {
    soundEngine.playClick();
    const shuffled = [...RANDOM_NAME_POOL].sort(() => Math.random() - 0.5);
    setNames(shuffled.slice(0, 5));
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#14100C] p-4 md:p-8 overflow-y-auto">
      <div className="w-full max-w-5xl rounded-xl bg-[#1F1812] border border-amber-200/20 p-6 md:p-8 shadow-2xl my-auto">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-amber-200/15 pb-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-semibold text-amber-100">
              Expedition Charter · Independence, 1848
            </h1>
            <p className="mt-1 text-sm text-stone-300">
              Select your trade, register your five travelers, and choose your departure month.
            </p>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onBack();
            }}
            className="text-sm text-amber-200/80 hover:text-amber-100 underline underline-offset-4 cursor-pointer"
          >
            Back to Title
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Profession & Departure Month */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-amber-200 mb-3">
                01. Choose Profession
              </h2>
              <div className="space-y-2.5">
                {PROFESSIONS.map((prof) => {
                  const selected = profession === prof.id;
                  return (
                    <button
                      key={prof.id}
                      onClick={() => {
                        soundEngine.playClick();
                        setProfession(prof.id);
                      }}
                      className={`w-full text-left p-4 rounded-lg border transition-colors cursor-pointer ${
                        selected
                          ? 'bg-amber-500/15 border-amber-400 text-amber-50'
                          : 'bg-[#17120D] border-amber-200/15 text-stone-200 hover:border-amber-200/35'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-display text-lg font-semibold">
                          {prof.title}
                        </span>
                        <span className="font-mono-tabular text-sm font-semibold text-amber-300">
                          ${prof.startingCash.toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone-300 leading-relaxed">
                        {prof.description}
                      </p>
                      <div className="mt-1.5 text-xs font-mono-tabular text-amber-200/75">
                        {prof.bonusTrait}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-amber-200 mb-3">
                02. Departure Month
              </h2>
              <div className="grid grid-cols-5 gap-2">
                {DEPARTURE_MONTHS.map((m) => {
                  const active = month === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        soundEngine.playClick();
                        setMonth(m.id);
                      }}
                      className={`py-2.5 px-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                        active
                          ? 'bg-amber-500 text-stone-950 border-amber-400 font-semibold'
                          : 'bg-[#17120D] text-stone-200 border-amber-200/15 hover:border-amber-200/35'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
              {(() => {
                const chosen = DEPARTURE_MONTHS.find((m) => m.id === month)!;
                return (
                  <div className="mt-2.5 text-xs text-stone-300 flex flex-col gap-0.5">
                    <span>{chosen.summary}</span>
                    <span className="font-mono-tabular text-amber-200/80">{chosen.outlook}</span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Right: Wagon Party Roster */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-[#17120D] border border-amber-200/15 rounded-lg p-5">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-amber-200">
                  03. Wagon Party Roster
                </h2>
                <button
                  onClick={randomizeNames}
                  type="button"
                  className="text-xs text-amber-300 hover:text-amber-200 underline underline-offset-4 cursor-pointer"
                >
                  Randomize Names
                </button>
              </div>
              <div className="space-y-3">
                {names.map((val, idx) => (
                  <div key={idx}>
                    <label className="block text-xs text-stone-400 mb-1">
                      {idx === 0 ? 'Wagon Leader' : `Companion ${idx}`}
                    </label>
                    <input
                      type="text"
                      maxLength={24}
                      value={val}
                      onChange={(e) => {
                        const copy = [...names];
                        copy[idx] = e.target.value;
                        setNames(copy);
                      }}
                      className="w-full rounded-md bg-[#241C15] border border-amber-200/20 px-3 py-2 text-sm text-amber-50 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                soundEngine.playPurchase();
                onConfirm(profession, names, month);
              }}
              className="mt-6 w-full py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm transition-colors cursor-pointer"
            >
              Proceed to Matt’s General Store
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface GeneralStoreProps {
  title: string;
  subtitle: string;
  priceMultiplier: number;
  inventory: Inventory;
  isInitialOutfitting: boolean;
  onUpdateInventory: (next: Inventory) => void;
  onFinish: () => void;
}

export const GeneralStore: React.FC<GeneralStoreProps> = ({
  title,
  subtitle,
  priceMultiplier,
  inventory,
  isInitialOutfitting,
  onUpdateInventory,
  onFinish,
}) => {
  const getPrice = (base: number) => Math.max(1, Math.round(base * priceMultiplier * 100) / 100);

  const buyItem = (key: keyof Omit<Inventory, 'cash'>, qty: number, cost: number) => {
    if (inventory.cash < cost) {
      soundEngine.playAlert('warn');
      return;
    }
    soundEngine.playPurchase();
    onUpdateInventory({
      ...inventory,
      cash: Number((inventory.cash - cost).toFixed(2)),
      [key]: inventory[key] + qty,
    });
  };

  const sellItem = (key: keyof Omit<Inventory, 'cash'>, qty: number, refund: number) => {
    if (!isInitialOutfitting || inventory[key] < qty) return;
    soundEngine.playClick();
    onUpdateInventory({
      ...inventory,
      cash: Number((inventory.cash + refund).toFixed(2)),
      [key]: inventory[key] - qty,
    });
  };

  const applyRecommendedOutfit = () => {
    const budget = inventory.cash +
      inventory.oxen * 20 +
      (inventory.food / 25) * 5 +
      inventory.clothing * 10 +
      (inventory.ammo / 20) * 2 +
      (inventory.wheels + inventory.axles + inventory.tongues) * 10;

    // Scale starter kit cleanly within available budget
    let nextCash = budget;
    let oxen = 4; // 2 yokes = $80
    nextCash -= 80;
    let wheels = 1;
    let axles = 1;
    let tongues = 1;
    nextCash -= 30;
    let clothing = budget >= 600 ? 10 : 5;
    nextCash -= clothing * 10;
    let ammo = budget >= 600 ? 100 : 60;
    nextCash -= (ammo / 20) * 2;

    const maxFoodSacks = Math.floor(Math.max(0, nextCash - 60) / 5);
    const foodSacks = Math.min(28, maxFoodSacks); // up to 700 lbs
    const food = foodSacks * 25;
    nextCash -= foodSacks * 5;

    if (nextCash >= 80 && oxen < 6) {
      oxen += 2;
      nextCash -= 40;
    }

    soundEngine.playPurchase();
    onUpdateInventory({
      cash: Number(nextCash.toFixed(2)),
      oxen,
      food,
      clothing,
      ammo,
      wheels,
      axles,
      tongues,
    });
  };

  const canDepart = !isInitialOutfitting || inventory.oxen >= 2;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 md:p-8 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-xl bg-[#1F1812] border border-amber-200/25 p-6 md:p-8 shadow-2xl my-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-200/15 pb-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-amber-100">
              {title}
            </h2>
            <p className="mt-0.5 text-sm text-stone-300">{subtitle}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-stone-400">Available Funds</div>
            <div className="font-mono-tabular text-2xl font-semibold text-amber-300">
              ${inventory.cash.toFixed(2)}
            </div>
          </div>
        </div>

        {isInitialOutfitting && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-[#17120D] border border-amber-200/15 rounded-lg px-4 py-3 text-xs text-stone-300">
            <span>
              Advice from Matt: Buy at least 2 yokes of oxen (4 animals), 400+ lbs of food, warm woolens, and spare parts before leaving town.
            </span>
            <button
              onClick={applyRecommendedOutfit}
              className="px-3.5 py-1.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-medium whitespace-nowrap shrink-0 cursor-pointer"
            >
              Auto-Fill Recommended Kit
            </button>
          </div>
        )}

        <div className="mt-5 divide-y divide-amber-200/10">
          {STORE_ITEMS.map((item) => {
            const unitCost = getPrice(item.basePrice);
            const currentAmount = inventory[item.key];
            const canAfford = inventory.cash >= unitCost;
            const canRefund = isInitialOutfitting && currentAmount >= item.quantityPerPurchase;

            return (
              <div
                key={item.key}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="max-w-lg">
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-semibold text-amber-50 text-sm">
                      {item.name}
                    </span>
                    <span className="text-xs font-mono-tabular text-stone-400">
                      {item.unitLabel} · ${unitCost.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">{item.description}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-28 text-right font-mono-tabular text-sm text-amber-200">
                    Owned: <strong>{currentAmount}</strong>
                  </div>
                  {isInitialOutfitting && (
                    <button
                      onClick={() => sellItem(item.key, item.quantityPerPurchase, unitCost)}
                      disabled={!canRefund}
                      className="px-3 py-1.5 rounded-md border border-amber-200/20 bg-[#17120D] text-xs font-medium text-stone-200 hover:bg-[#2A2018] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                    >
                      -{item.quantityPerPurchase}
                    </button>
                  )}
                  <button
                    onClick={() => buyItem(item.key, item.quantityPerPurchase, unitCost)}
                    disabled={!canAfford}
                    className="px-3.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-semibold disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Buy +{item.quantityPerPurchase}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-amber-200/15 pt-4">
          <div className="text-xs text-stone-300">
            {!canDepart ? (
              <span className="text-red-400 font-medium">
                You must purchase at least 1 yoke (2 oxen) to pull your wagon out of Independence.
              </span>
            ) : (
              <span>Wagon packed and hitched. Ready to roll west.</span>
            )}
          </div>
          <button
            onClick={() => {
              soundEngine.playCampChime();
              onFinish();
            }}
            disabled={!canDepart}
            className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isInitialOutfitting ? 'Depart Independence' : 'Leave Store'}
          </button>
        </div>
      </div>
    </div>
  );
};
