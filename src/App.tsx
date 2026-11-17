import { useCallback, useEffect, useState } from 'react';
import { soundEngine } from './audio/soundEngine';
import { ColumbiaRaftGame } from './components/ColumbiaRaftGame';
import { HuntingMiniGame } from './components/HuntingMiniGame';
import {
  EndGameModal,
  EventModal,
  GuideModal,
  LandmarkModal,
  PauseModal,
  RestModal,
  RiverModal,
  SuppliesModal,
  TombstoneModal,
  TrailMapModal,
} from './components/Modals';
import { GeneralStore, PartySetup } from './components/SetupFlow';
import { TitleScreen } from './components/TitleScreen';
import { TrailCanvas } from './components/TrailCanvas';
import { TrailHud } from './components/TrailHud';
import {
  FORT_PRICE_MULTIPLIER,
  LANDMARKS,
  TOTAL_TRAIL_MILES,
} from './data/trailData';
import {
  advanceOneDay,
  createInitialGameState,
  formatTrailDate,
  generateBarterOffer,
  getCurrentBiome,
} from './simulation/trailEngine';
import {
  DepartureMonth,
  GameState,
  Inventory,
  Pace,
  ProfessionId,
  Rations,
} from './types/game';

export default function App() {
  const [state, setState] = useState<GameState | null>(null);
  const [screen, setScreen] = useState<'TITLE_MENU' | 'PARTY_SETUP'>('TITLE_MENU');
  const [showGuideOnTitle, setShowGuideOnTitle] = useState(false);
  const [muted, setMuted] = useState(false);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      if (!next) soundEngine.playClick();
      return next;
    });
  }, []);

  // Daily travel simulation tick
  useEffect(() => {
    if (
      !state ||
      state.screen !== 'PLAYING' ||
      !state.traveling ||
      state.activeModal !== null
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      soundEngine.playWheelStep();
      setState((prev) => {
        if (!prev || prev.screen !== 'PLAYING' || !prev.traveling || prev.activeModal !== null) {
          return prev;
        }
        const res = advanceOneDay(prev, 'travel');
        if (res.soundCue === 'warn') soundEngine.playAlert('warn');
        else if (res.soundCue === 'danger') soundEngine.playAlert('danger');
        else if (res.soundCue === 'good') soundEngine.playCampChime();
        else if (res.soundCue === 'victory') soundEngine.playVictory();
        return res.nextState;
      });
    }, 850);

    return () => window.clearInterval(timer);
  }, [state?.screen, state?.traveling, state?.activeModal]);

  // Global keyboard shortcuts during PLAYING / PAUSED
  useEffect(() => {
    if (!state || (state.screen !== 'PLAYING' && state.screen !== 'PAUSED')) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setState((prev): GameState | null => {
          if (!prev) return prev;
          if (prev.activeModal && prev.activeModal !== 'RIVER' && prev.activeModal !== 'EVENT') {
            return { ...prev, activeModal: null };
          }
          if (prev.screen === 'PAUSED') {
            return { ...prev, screen: 'PLAYING' };
          }
          if (!prev.activeModal) {
            return { ...prev, screen: 'PAUSED', traveling: false };
          }
          return prev;
        });
        return;
      }

      if (state.screen !== 'PLAYING' || state.activeModal !== null) return;

      if (e.code === 'Space') {
        e.preventDefault();
        soundEngine.playClick();
        setState((prev) => (prev ? { ...prev, traveling: !prev.traveling } : prev));
      } else if (e.code === 'KeyP') {
        soundEngine.playClick();
        setState((prev) => {
          if (!prev) return prev;
          const order: Pace[] = ['steady', 'strenuous', 'grueling'];
          const next = order[(order.indexOf(prev.pace) + 1) % order.length];
          return { ...prev, pace: next };
        });
      } else if (e.code === 'KeyR') {
        soundEngine.playClick();
        setState((prev) => {
          if (!prev) return prev;
          const order: Rations[] = ['filling', 'meager', 'bare_bones'];
          const next = order[(order.indexOf(prev.rations) + 1) % order.length];
          return { ...prev, rations: next };
        });
      } else if (e.code === 'KeyH') {
        soundEngine.playClick();
        setState((prev) => (prev ? { ...prev, traveling: false, screen: 'HUNTING' } : prev));
      } else if (e.code === 'KeyM') {
        soundEngine.playClick();
        setState((prev) => (prev ? { ...prev, traveling: false, activeModal: 'MAP' } : prev));
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state]);

  const handlePartyConfirmed = (
    profession: ProfessionId,
    names: string[],
    month: DepartureMonth
  ) => {
    const initial = createInitialGameState(profession, names, month);
    setState(initial);
  };

  const handleUpdateInventory = (nextInv: Inventory) => {
    setState((prev) => (prev ? { ...prev, inventory: nextInv } : prev));
  };

  const handleDepartStore = () => {
    setState((prev): GameState | null => {
      if (!prev) return prev;
      if (prev.screen === 'GENERAL_STORE') {
        return {
          ...prev,
          screen: 'PLAYING',
          traveling: true,
          logs: [
            {
              day: 0,
              dateStr: formatTrailDate(prev.currentDate),
              mile: 0,
              message: 'Departed Independence, Missouri with high hopes for Oregon.',
              tone: 'good' as const,
            },
            ...prev.logs,
          ],
        };
      }
      // Returning from Fort Store
      return {
        ...prev,
        activeModal: prev.activeLandmark ? 'LANDMARK' : null,
      };
    });
  };

  const handleCyclePace = () => {
    soundEngine.playClick();
    setState((prev) => {
      if (!prev) return prev;
      const order: Pace[] = ['steady', 'strenuous', 'grueling'];
      const next = order[(order.indexOf(prev.pace) + 1) % order.length];
      return { ...prev, pace: next };
    });
  };

  const handleCycleRations = () => {
    soundEngine.playClick();
    setState((prev) => {
      if (!prev) return prev;
      const order: Rations[] = ['filling', 'meager', 'bare_bones'];
      const next = order[(order.indexOf(prev.rations) + 1) % order.length];
      return { ...prev, rations: next };
    });
  };

  const handleRestDays = (days: number) => {
    soundEngine.playCampChime();
    setState((prev): GameState | null => {
      if (!prev) return prev;
      let curr: GameState = { ...prev, activeModal: null, traveling: false };
      for (let i = 0; i < days; i++) {
        const res = advanceOneDay(curr, 'rest');
        curr = res.nextState;
        if (curr.screen === 'GAME_OVER') break;
      }
      if (curr.screen === 'PLAYING') {
        curr.logs = [
          {
            day: curr.day,
            dateStr: formatTrailDate(curr.currentDate),
            mile: curr.miles,
            message: `Rested in camp for ${days} ${days === 1 ? 'day' : 'days'}.`,
            tone: 'neutral' as const,
          },
          ...curr.logs,
        ].slice(0, 40);
      }
      return curr;
    });
  };

  const handleHuntingComplete = (meatGained: number, ammoUsed: number) => {
    setState((prev): GameState | null => {
      if (!prev) return prev;
      const nextAmmo = Math.max(0, prev.inventory.ammo - ammoUsed);
      const nextFood = prev.inventory.food + meatGained;
      // Hunting takes 1 afternoon; advance 1 rest-like day without extra travel
      const res = advanceOneDay(
        {
          ...prev,
          screen: 'PLAYING',
          inventory: { ...prev.inventory, ammo: nextAmmo, food: nextFood },
          huntsCompleted: prev.huntsCompleted + 1,
          totalMeatHunted: prev.totalMeatHunted + meatGained,
        },
        'rest'
      );
      res.nextState.logs = [
        {
          day: res.nextState.day,
          dateStr: formatTrailDate(res.nextState.currentDate),
          mile: res.nextState.miles,
          message:
            meatGained > 0
              ? `Hunting expedition yielded ${meatGained} lbs of fresh meat (${ammoUsed} rounds fired).`
              : `Returned from hunting empty-handed (${ammoUsed} rounds fired).`,
          tone: meatGained > 0 ? ('good' as const) : ('neutral' as const),
        },
        ...res.nextState.logs,
      ].slice(0, 40);
      return res.nextState;
    });
  };

  const handleRiverAction = (method: 'ford' | 'caulk' | 'ferry' | 'wait') => {
    setState((prev): GameState | null => {
      if (!prev || !prev.activeRiver) return prev;
      const river = prev.activeRiver;

      if (method === 'wait') {
        soundEngine.playClick();
        const res = advanceOneDay(prev, 'rest');
        if (res.nextState.screen === 'GAME_OVER') return res.nextState;
        const drop = Math.random() * 0.65 - 0.12;
        const nextDepth = Math.max(1.5, Number((river.depthFt - drop).toFixed(1)));
        const nextCurrent = Math.max(1.8, Number((river.currentMph - drop * 0.4).toFixed(1)));
        return {
          ...res.nextState,
          activeModal: 'RIVER',
          activeRiver: {
            ...river,
            depthFt: nextDepth,
            currentMph: nextCurrent,
            waitedDays: river.waitedDays + 1,
          },
        };
      }

      soundEngine.playSplash();
      const inv = { ...prev.inventory };
      const party = prev.party.map((m) => ({ ...m }));
      let title = `Crossed ${river.landmark.name}`;
      let narrative = 'Your wagon crossed the channel safely and climbed onto the western bank.';
      let tone: 'positive' | 'warning' | 'danger' = 'positive';

      if (method === 'ferry') {
        inv.cash = Math.max(0, Number((inv.cash - river.ferryCost).toFixed(2)));
        narrative = `Paid $${river.ferryCost.toFixed(2)} for the timber ferry. Wagon and oxen crossed high and dry.`;
      } else if (method === 'ford') {
        const risk = Math.max(0.05, (river.depthFt - 2.6) * 0.34);
        if (Math.random() < risk) {
          tone = 'warning';
          title = 'Swamped While Fording!';
          const lostFood = Math.min(inv.food, 35 + Math.floor(Math.random() * 45));
          const lostAmmo = Math.min(inv.ammo, 15 + Math.floor(Math.random() * 20));
          inv.food -= lostFood;
          inv.ammo -= lostAmmo;
          if (Math.random() < 0.4 && inv.clothing > 0) inv.clothing -= 1;
          narrative = `Deep channel currents flooded the wagon bed! You lost ${lostFood} lbs of food and ${lostAmmo} rounds before the oxen hauled you out.`;
          soundEngine.playAlert('warn');
        }
      } else if (method === 'caulk') {
        const risk = Math.max(0.06, (river.currentMph - 3.3) * 0.22);
        if (Math.random() < risk) {
          tone = 'warning';
          title = 'Wagon Tipped in Swift Current!';
          const lostFood = Math.min(inv.food, 25 + Math.floor(Math.random() * 35));
          inv.food -= lostFood;
          const oxenLost = inv.oxen > 1 && Math.random() < 0.35 ? 1 : 0;
          inv.oxen -= oxenLost;
          narrative = `Rapid eddies spun the floating wagon box, spilling ${lostFood} lbs of flour${
            oxenLost ? ' and sweeping away 1 ox' : ''
          }.`;
          soundEngine.playAlert('warn');
        } else {
          narrative = 'Pitch-caulked planks kept the wagon buoyant across the deep channel.';
        }
      }

      const dateStr = formatTrailDate(prev.currentDate);
      return {
        ...prev,
        inventory: inv,
        party,
        riversCrossed: prev.riversCrossed + 1,
        activeRiver: null,
        activeModal: 'EVENT',
        activeEvent: {
          id: `river_done_${prev.day}`,
          title,
          narrative,
          tone,
        },
        logs: [
          {
            day: prev.day,
            dateStr,
            mile: prev.miles,
            message: `${title} at ${river.landmark.name}.`,
            tone: tone === 'positive' ? ('good' as const) : ('warn' as const),
          },
          ...prev.logs,
        ].slice(0, 40),
      };
    });
  };

  const handleEventChoice = (actionId: string) => {
    setState((prev): GameState | null => {
      if (!prev) return prev;
      const inv = { ...prev.inventory };

      if (actionId.startsWith('repair_spare_')) {
        const part = actionId.replace('repair_spare_', '') as 'wheel' | 'axle' | 'tongue';
        if (part === 'wheel' && inv.wheels > 0) inv.wheels -= 1;
        if (part === 'axle' && inv.axles > 0) inv.axles -= 1;
        if (part === 'tongue' && inv.tongues > 0) inv.tongues -= 1;
        soundEngine.playPurchase();
        return {
          ...prev,
          inventory: inv,
          brokenPart: null,
          wagonCondition: Math.min(100, prev.wagonCondition + 15),
          activeModal: null,
          activeEvent: null,
          traveling: true,
          logs: [
            {
              day: prev.day,
              dateStr: formatTrailDate(prev.currentDate),
              mile: prev.miles,
              message: `Installed spare ${part} and resumed travel.`,
              tone: 'good' as const,
            },
            ...prev.logs,
          ].slice(0, 40),
        };
      }

      if (actionId.startsWith('repair_improvise_')) {
        const part = actionId.replace('repair_improvise_', '') as 'wheel' | 'axle' | 'tongue';
        soundEngine.playClick();
        let curr: GameState = {
          ...prev,
          brokenPart: null,
          wagonCondition: Math.max(30, prev.wagonCondition - 12),
          activeModal: null,
          activeEvent: null,
        };
        for (let i = 0; i < 2; i++) {
          const res = advanceOneDay(curr, 'rest');
          curr = res.nextState;
          if (curr.screen === 'GAME_OVER') break;
        }
        if (curr.screen === 'PLAYING') {
          curr.logs = [
            {
              day: curr.day,
              dateStr: formatTrailDate(curr.currentDate),
              mile: curr.miles,
              message: `Splinted broken ${part} after 2 days of hard timber work.`,
              tone: 'warn' as const,
            },
            ...curr.logs,
          ].slice(0, 40);
        }
        return curr;
      }

      return { ...prev, activeModal: null, activeEvent: null };
    });
  };

  const handleForkSelect = (targetId: string) => {
    soundEngine.playClick();
    setState((prev): GameState | null => {
      if (!prev) return prev;
      if (targetId === 'raft_columbia') {
        return {
          ...prev,
          finalRoute: 'columbia',
          activeModal: null,
          activeLandmark: null,
          traveling: false,
          screen: 'RAFTING',
        };
      }

      if (targetId === 'oregon_city') {
        // Barlow Toll Road ($5) -> advance straight into Oregon City smoothly
        const inv = {
          ...prev.inventory,
          cash: Math.max(0, Number((prev.inventory.cash - 5).toFixed(2))),
        };
        soundEngine.playVictory();
        return {
          ...prev,
          finalRoute: 'barlow',
          inventory: inv,
          miles: TOTAL_TRAIL_MILES,
          activeModal: null,
          activeLandmark: null,
          traveling: false,
          screen: 'VICTORY',
          visitedLandmarks: [...prev.visitedLandmarks, 'oregon_city'],
        };
      }

      // South Pass fork: Fort Bridger vs Sublette Cutoff (skip Fort Bridger straight toward Green River)
      if (targetId === 'green_river') {
        const greenIdx = LANDMARKS.findIndex((l) => l.id === 'green_river');
        return {
          ...prev,
          routeChoice: 'sublette',
          nextLandmarkIndex: greenIdx,
          activeModal: null,
          activeLandmark: null,
          traveling: true,
          logs: [
            {
              day: prev.day,
              dateStr: formatTrailDate(prev.currentDate),
              mile: prev.miles,
              message: 'Took the Sublette Cutoff directly toward the Green River.',
              tone: 'neutral' as const,
            },
            ...prev.logs,
          ].slice(0, 40),
        };
      }

      return {
        ...prev,
        routeChoice: 'fort_bridger',
        activeModal: null,
        activeLandmark: null,
        traveling: true,
      };
    });
  };

  const handleRaftComplete = (hullRemaining: number, foodBonus: number) => {
    setState((prev) => {
      if (!prev) return prev;
      const inv = { ...prev.inventory };
      if (hullRemaining <= 0) {
        inv.food = Math.round(inv.food * 0.5);
        inv.ammo = Math.round(inv.ammo * 0.5);
      } else {
        inv.food += foodBonus;
      }
      return {
        ...prev,
        inventory: inv,
        miles: TOTAL_TRAIL_MILES,
        day: prev.day + 4,
        screen: 'VICTORY',
        visitedLandmarks: [...prev.visitedLandmarks, 'oregon_city'],
      };
    });
  };

  const handleAcceptTrade = () => {
    setState((prev): GameState | null => {
      if (!prev || !prev.barterOffer) return prev;
      const offer = prev.barterOffer;
      if (prev.inventory[offer.wantsKey] < offer.wantsAmount) return prev;
      soundEngine.playPurchase();
      const inv = {
        ...prev.inventory,
        [offer.wantsKey]: prev.inventory[offer.wantsKey] - offer.wantsAmount,
        [offer.givesKey]: prev.inventory[offer.givesKey] + offer.givesAmount,
      };
      return {
        ...prev,
        inventory: inv,
        barterOffer: null,
        logs: [
          {
            day: prev.day,
            dateStr: formatTrailDate(prev.currentDate),
            mile: prev.miles,
            message: `Traded ${offer.wantsLabel} for ${offer.givesLabel} with ${offer.travelerName}.`,
            tone: 'good' as const,
          },
          ...prev.logs,
        ].slice(0, 40),
      };
    });
  };

  const handlePlayAgain = () => {
    soundEngine.playClick();
    setState(null);
    setScreen('PARTY_SETUP');
  };

  // ---------- RENDER ----------
  if (!state) {
    if (screen === 'PARTY_SETUP') {
      return (
        <PartySetup
          onConfirm={handlePartyConfirmed}
          onBack={() => setScreen('TITLE_MENU')}
        />
      );
    }

    return (
      <>
        <TitleScreen
          onStart={() => {
            soundEngine.playClick();
            setScreen('PARTY_SETUP');
          }}
          onOpenGuide={() => {
            soundEngine.playClick();
            setShowGuideOnTitle(true);
          }}
          muted={muted}
          onToggleMute={toggleMute}
        />
        {showGuideOnTitle && <GuideModal onClose={() => setShowGuideOnTitle(false)} />}
      </>
    );
  }

  if (state.screen === 'GENERAL_STORE') {
    return (
      <GeneralStore
        title="Matt’s General Store · Independence, MO"
        subtitle="Outfit your wagon before leaving Missouri. Unused items may be sold back before departure."
        priceMultiplier={1}
        inventory={state.inventory}
        isInitialOutfitting={true}
        onUpdateInventory={handleUpdateInventory}
        onFinish={handleDepartStore}
      />
    );
  }

  if (state.screen === 'HUNTING') {
    const biome = getCurrentBiome(state.miles).replace('_', ' ');
    return (
      <HuntingMiniGame
        initialAmmo={state.inventory.ammo}
        biomeName={biome.replace(/\b\w/g, (c) => c.toUpperCase())}
        onComplete={handleHuntingComplete}
      />
    );
  }

  if (state.screen === 'RAFTING') {
    return <ColumbiaRaftGame onComplete={handleRaftComplete} />;
  }

  const nextLandmark = LANDMARKS[state.nextLandmarkIndex] ?? null;
  const currentBiome = getCurrentBiome(state.miles);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#14100C]">
      {/* 60fps Canvas World */}
      <TrailCanvas
        miles={state.miles}
        biome={currentBiome}
        weather={state.weather}
        traveling={state.traveling && state.screen === 'PLAYING' && state.activeModal === null}
        pace={state.pace}
        oxenCount={state.inventory.oxen}
        nextLandmark={nextLandmark}
        wagonCondition={state.wagonCondition}
      />

      {/* Perimeter HUD */}
      <TrailHud
        state={state}
        muted={muted}
        onToggleTravel={() => {
          soundEngine.playClick();
          setState((p) => (p ? { ...p, traveling: !p.traveling } : p));
        }}
        onCyclePace={handleCyclePace}
        onCycleRations={handleCycleRations}
        onOpenRest={() => {
          soundEngine.playClick();
          setState((p) => (p ? { ...p, traveling: false, activeModal: 'REST' } : p));
        }}
        onStartHunt={() => {
          soundEngine.playClick();
          setState((p) => (p ? { ...p, traveling: false, screen: 'HUNTING' } : p));
        }}
        onOpenMap={() => {
          soundEngine.playClick();
          setState((p) => (p ? { ...p, traveling: false, activeModal: 'MAP' } : p));
        }}
        onOpenSupplies={() => {
          soundEngine.playClick();
          setState((p) =>
            p
              ? {
                  ...p,
                  traveling: false,
                  barterOffer: p.barterOffer ?? generateBarterOffer(),
                  activeModal: 'SUPPLIES',
                }
              : p
          );
        }}
        onOpenPause={() => {
          soundEngine.playClick();
          setState((p) => (p ? { ...p, traveling: false, screen: 'PAUSED' } : p));
        }}
        onToggleMute={toggleMute}
      />

      {/* Modals */}
      {state.activeModal === 'LANDMARK' && state.activeLandmark && (
        <LandmarkModal
          landmark={state.activeLandmark}
          cash={state.inventory.cash}
          onOpenFortStore={() => {
            soundEngine.playClick();
            setState((p) => (p ? { ...p, activeModal: 'FORT_STORE' } : p));
          }}
          onForkSelect={handleForkSelect}
          onContinue={() => {
            soundEngine.playClick();
            setState((p) =>
              p ? { ...p, activeModal: null, activeLandmark: null, traveling: true } : p
            );
          }}
        />
      )}

      {state.activeModal === 'FORT_STORE' && state.activeLandmark && (
        <GeneralStore
          title={`${state.activeLandmark.name} · Trading Post`}
          subtitle="Frontier outpost prices reflect the steep haul from Missouri."
          priceMultiplier={FORT_PRICE_MULTIPLIER[state.activeLandmark.id] ?? 1.5}
          inventory={state.inventory}
          isInitialOutfitting={false}
          onUpdateInventory={handleUpdateInventory}
          onFinish={handleDepartStore}
        />
      )}

      {state.activeModal === 'RIVER' && state.activeRiver && (
        <RiverModal
          river={state.activeRiver}
          cash={state.inventory.cash}
          weather={state.weather}
          onAction={handleRiverAction}
        />
      )}

      {state.activeModal === 'EVENT' && state.activeEvent && (
        <EventModal
          event={state.activeEvent}
          onChoice={handleEventChoice}
          onDismiss={() => {
            soundEngine.playClick();
            setState((p) =>
              p ? { ...p, activeModal: null, activeEvent: null, traveling: true } : p
            );
          }}
        />
      )}

      {state.activeModal === 'TOMBSTONE' && state.activeTombstone && (
        <TombstoneModal
          tombstone={state.activeTombstone}
          onDismiss={() => {
            soundEngine.playClick();
            setState((p) =>
              p ? { ...p, activeModal: null, activeTombstone: null, traveling: true } : p
            );
          }}
        />
      )}

      {state.activeModal === 'REST' && (
        <RestModal
          onRestDays={handleRestDays}
          onClose={() => setState((p) => (p ? { ...p, activeModal: null } : p))}
        />
      )}

      {state.activeModal === 'SUPPLIES' && (
        <SuppliesModal
          state={state}
          onAcceptTrade={handleAcceptTrade}
          onRefreshTrade={() => {
            soundEngine.playClick();
            setState((p) => (p ? { ...p, barterOffer: generateBarterOffer() } : p));
          }}
          onClose={() => setState((p) => (p ? { ...p, activeModal: null } : p))}
        />
      )}

      {state.activeModal === 'MAP' && (
        <TrailMapModal
          miles={state.miles}
          visitedLandmarks={state.visitedLandmarks}
          onClose={() => setState((p) => (p ? { ...p, activeModal: null } : p))}
        />
      )}

      {state.activeModal === 'GUIDE' && (
        <GuideModal
          onClose={() => setState((p) => (p ? { ...p, activeModal: null } : p))}
        />
      )}

      {state.screen === 'PAUSED' && state.activeModal !== 'GUIDE' && (
        <PauseModal
          onResume={() => {
            soundEngine.playClick();
            setState((p) => (p ? { ...p, screen: 'PLAYING' } : p));
          }}
          onOpenGuide={() => {
            soundEngine.playClick();
            setState((p) => (p ? { ...p, activeModal: 'GUIDE' } : p));
          }}
          onRestart={handlePlayAgain}
        />
      )}

      {(state.screen === 'VICTORY' || state.screen === 'GAME_OVER') && (
        <EndGameModal state={state} onPlayAgain={handlePlayAgain} />
      )}
    </div>
  );
}
