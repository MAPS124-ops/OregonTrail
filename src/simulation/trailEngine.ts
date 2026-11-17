import {
  DEPARTURE_MONTHS,
  INITIAL_TOMBSTONES,
  LANDMARKS,
  PROFESSIONS,
  TOTAL_TRAIL_MILES,
} from '../data/trailData';
import {
  ActiveEvent,
  BarterOffer,
  BiomeId,
  DepartureMonth,
  GameState,
  Inventory,
  Landmark,
  Pace,
  PartyMember,
  ProfessionId,
  Rations,
  RiverState,
  Tombstone,
  WeatherKind,
} from '../types/game';

export function formatTrailDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getOverallHealthLabel(party: PartyMember[]): {
  label: string;
  avg: number;
  tone: 'good' | 'warn' | 'danger';
} {
  const alive = party.filter((m) => m.alive);
  if (alive.length === 0) {
    return { label: 'Perished', avg: 0, tone: 'danger' };
  }
  const avg = Math.round(alive.reduce((sum, m) => sum + m.health, 0) / alive.length);
  const sickCount = alive.filter((m) => m.illness !== null).length;

  if (avg >= 78 && sickCount === 0) return { label: 'Good', avg, tone: 'good' };
  if (avg >= 55 && sickCount <= 1) return { label: 'Fair', avg, tone: 'good' };
  if (avg >= 32) return { label: 'Poor', avg, tone: 'warn' };
  return { label: 'Very Poor', avg, tone: 'danger' };
}

export function getCurrentBiome(miles: number): BiomeId {
  for (let i = LANDMARKS.length - 1; i >= 0; i--) {
    if (miles >= LANDMARKS[i].mile) {
      return LANDMARKS[i].biome;
    }
  }
  return 'tallgrass';
}

export function createInitialGameState(
  profession: ProfessionId,
  partyNames: string[],
  departureMonth: DepartureMonth
): GameState {
  const prof = PROFESSIONS.find((p) => p.id === profession) ?? PROFESSIONS[0];
  const monthMeta = DEPARTURE_MONTHS.find((m) => m.id === departureMonth) ?? DEPARTURE_MONTHS[2];
  const startDate = new Date(1848, monthMeta.monthIndex, 1);

  const party: PartyMember[] = partyNames.map((rawName, idx) => ({
    id: `member_${idx}`,
    name: rawName.trim() || `Traveler ${idx + 1}`,
    isLeader: idx === 0,
    alive: true,
    health: 96,
    illness: null,
    illnessDays: 0,
  }));

  return {
    screen: 'GENERAL_STORE',
    profession,
    departureMonth,
    day: 0,
    currentDate: startDate,
    miles: 0,
    targetMiles: TOTAL_TRAIL_MILES,
    nextLandmarkIndex: 1,
    visitedLandmarks: ['independence'],
    routeChoice: null,
    finalRoute: null,
    pace: 'steady',
    rations: 'filling',
    weather: 'fair',
    temperatureF: 62,
    traveling: false,
    wagonCondition: 100,
    brokenPart: null,
    party,
    inventory: {
      cash: prof.startingCash,
      oxen: 0,
      food: 0,
      clothing: 0,
      ammo: 0,
      wheels: 0,
      axles: 0,
      tongues: 0,
    },
    logs: [
      {
        day: 0,
        dateStr: formatTrailDate(startDate),
        mile: 0,
        message: 'Assembled wagon in Independence, Missouri. Visit the General Store before departing.',
        tone: 'neutral',
      },
    ],
    activeModal: null,
    activeEvent: null,
    activeRiver: null,
    activeLandmark: null,
    activeTombstone: null,
    tombstones: [...INITIAL_TOMBSTONES],
    barterOffer: null,
    huntsCompleted: 0,
    totalMeatHunted: 0,
    riversCrossed: 0,
  };
}

function rollWeather(date: Date, miles: number): { weather: WeatherKind; tempF: number } {
  const month = date.getMonth(); // 0..11
  const biome = getCurrentBiome(miles);
  const highAltitude = biome === 'rockies' || biome === 'blue_mountains' || biome === 'high_desert';

  // Seasonal baseline temp
  let baseTemp = 64;
  if (month <= 2) baseTemp = 44; // Mar
  else if (month === 3) baseTemp = 56; // Apr
  else if (month === 4) baseTemp = 68; // May
  else if (month === 5) baseTemp = 78; // Jun
  else if (month === 6) baseTemp = 86; // Jul
  else if (month === 7) baseTemp = 82; // Aug
  else if (month === 8) baseTemp = 64; // Sep
  else if (month === 9) baseTemp = 44; // Oct
  else baseTemp = 29; // Nov+

  if (highAltitude) baseTemp -= 13;
  if (biome === 'badlands' && (month === 5 || month === 6)) baseTemp += 7;

  const tempF = Math.round(baseTemp + (Math.random() * 16 - 8));
  const r = Math.random();

  if (tempF <= 34) {
    if (r < 0.36) return { weather: 'snow', tempF };
    if (r < 0.6) return { weather: 'cold', tempF };
    return { weather: 'fair', tempF };
  }
  if (tempF >= 84) {
    if (r < 0.45) return { weather: 'hot', tempF };
    if (r < 0.6) return { weather: 'storm', tempF };
    return { weather: 'warm', tempF };
  }
  if (r < 0.16) return { weather: 'rain', tempF };
  if (r < 0.23) return { weather: 'storm', tempF };
  if (r < 0.5) return { weather: 'warm', tempF };
  return { weather: 'fair', tempF };
}

export function createRiverEncounter(landmark: Landmark, weather: WeatherKind, date: Date): RiverState {
  const defaults = landmark.riverDefaults ?? {
    widthFt: 400,
    baseDepthFt: 3.2,
    currentMph: 3.8,
    ferryCost: 5,
  };
  const month = date.getMonth();
  const springSwelling = month <= 4 ? 0.65 : month >= 7 ? -0.55 : 0;
  const rainSwelling = weather === 'rain' ? 0.5 : weather === 'storm' ? 0.95 : 0;
  const depthVariance = Math.random() * 1.1 - 0.35;
  const depthFt = Math.max(1.4, Number((defaults.baseDepthFt + springSwelling + rainSwelling + depthVariance).toFixed(1)));
  const currentMph = Math.max(1.8, Number((defaults.currentMph + (rainSwelling * 0.7) + (Math.random() * 0.8 - 0.3)).toFixed(1)));

  return {
    landmark,
    widthFt: defaults.widthFt,
    depthFt,
    currentMph,
    ferryCost: defaults.ferryCost,
    waitedDays: 0,
  };
}

export function generateBarterOffer(): BarterOffer {
  const travelers = ['Mormon Teamster', 'Trapper from Fort Hall', 'Returning Prospector', 'Missouri Drover'];
  const items: Array<{ key: keyof Omit<Inventory, 'cash'>; label: string; amountRange: [number, number] }> = [
    { key: 'food', label: 'lbs of flour & bacon', amountRange: [30, 75] },
    { key: 'clothing', label: 'sets of winter woolens', amountRange: [1, 3] },
    { key: 'ammo', label: 'bullets', amountRange: [20, 60] },
    { key: 'wheels', label: 'spare wagon wheel', amountRange: [1, 1] },
    { key: 'axles', label: 'spare wagon axle', amountRange: [1, 1] },
    { key: 'tongues', label: 'spare wagon tongue', amountRange: [1, 1] },
    { key: 'oxen', label: 'ox', amountRange: [1, 1] },
  ];

  const giveIdx = Math.floor(Math.random() * items.length);
  let wantIdx = Math.floor(Math.random() * items.length);
  while (wantIdx === giveIdx) {
    wantIdx = Math.floor(Math.random() * items.length);
  }

  const give = items[giveIdx];
  const want = items[wantIdx];

  const giveAmt =
    give.amountRange[0] + Math.floor(Math.random() * (give.amountRange[1] - give.amountRange[0] + 1));
  const wantAmt =
    want.amountRange[0] + Math.floor(Math.random() * (want.amountRange[1] - want.amountRange[0] + 1));

  return {
    id: `barter_${Date.now()}`,
    travelerName: travelers[Math.floor(Math.random() * travelers.length)],
    wantsKey: want.key,
    wantsAmount: wantAmt,
    wantsLabel: `${wantAmt} ${want.label}`,
    givesKey: give.key,
    givesAmount: giveAmt,
    givesLabel: `${giveAmt} ${give.label}`,
  };
}

const ILLNESS_NAMES = ['Dysentery', 'Cholera', 'Typhoid Fever', 'Mountain Fever', 'Exhaustion'];

export interface DailyStepResult {
  nextState: GameState;
  arrivedAtLandmark: Landmark | null;
  triggeredTombstone: Tombstone | null;
  triggeredEvent: ActiveEvent | null;
  soundCue: 'none' | 'warn' | 'danger' | 'good' | 'victory';
}

export function advanceOneDay(prev: GameState, mode: 'travel' | 'rest'): DailyStepResult {
  const nextDate = new Date(prev.currentDate.getTime());
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDay = prev.day + 1;
  const dateStr = formatTrailDate(nextDate);

  const { weather, tempF } = rollWeather(nextDate, prev.miles);
  const inv: Inventory = { ...prev.inventory };
  const party: PartyMember[] = prev.party.map((m) => ({ ...m }));
  const logs = [...prev.logs];
  const tombstones = [...prev.tombstones];

  let miles = prev.miles;
  let wagonCondition = prev.wagonCondition;
  let brokenPart = prev.brokenPart;
  let nextLandmarkIndex = prev.nextLandmarkIndex;
  let soundCue: DailyStepResult['soundCue'] = 'none';
  let triggeredEvent: ActiveEvent | null = null;
  let arrivedAtLandmark: Landmark | null = null;
  let triggeredTombstone: Tombstone | null = null;

  const aliveMembers = party.filter((m) => m.alive);
  const aliveCount = aliveMembers.length;

  // 1. Food consumption
  const rationMultiplier: Record<Rations, number> = {
    filling: 3,
    meager: 2,
    bare_bones: 1,
  };
  const farmerStretch = prev.profession === 'farmer' ? 0.85 : 1;
  const dailyFoodNeeded = Math.round(aliveCount * rationMultiplier[prev.rations] * farmerStretch);
  const foodShortage = inv.food < dailyFoodNeeded;
  inv.food = Math.max(0, inv.food - dailyFoodNeeded);

  // 2. Travel mileage calculation
  let milesToday = 0;
  if (mode === 'travel') {
    if (inv.oxen <= 0) {
      milesToday = 0;
      triggeredEvent = {
        id: 'no_oxen',
        title: 'No Oxen Remain',
        narrative: 'Without at least one ox to pull the wagon, you are stranded on the trail until you can trade for livestock.',
        tone: 'danger',
      };
      soundCue = 'danger';
    } else if (brokenPart) {
      milesToday = 0;
      triggeredEvent = {
        id: 'broken_wagon_halt',
        title: `Broken Wagon ${brokenPart.charAt(0).toUpperCase() + brokenPart.slice(1)}`,
        narrative: `Your wagon cannot roll forward with a broken ${brokenPart}. Repair it using a spare part or improvise a splint.`,
        tone: 'warning',
        choices: buildRepairChoices(brokenPart, inv),
      };
      soundCue = 'warn';
    } else {
      const paceBase: Record<Pace, number> = {
        steady: 16,
        strenuous: 22,
        grueling: 28,
      };
      let speed = paceBase[prev.pace];
      if (inv.oxen === 1) speed *= 0.55;
      else if (inv.oxen === 2) speed *= 0.82;
      else if (inv.oxen >= 4) speed *= 1.08;

      if (weather === 'storm') speed *= 0.55;
      else if (weather === 'snow') speed *= 0.48;
      else if (weather === 'rain') speed *= 0.78;

      const biome = getCurrentBiome(miles);
      if (biome === 'rockies' || biome === 'blue_mountains') speed *= 0.84;

      if (wagonCondition < 50) speed *= 0.82;
      milesToday = Math.max(4, Math.round(speed + (Math.random() * 4 - 2)));
    }
  }

  // Check if crossing a Tombstone mile marker
  const prevMiles = miles;
  const targetLandmark = LANDMARKS[nextLandmarkIndex];

  if (mode === 'travel' && milesToday > 0 && targetLandmark) {
    if (prevMiles + milesToday >= targetLandmark.mile) {
      miles = targetLandmark.mile;
      arrivedAtLandmark = targetLandmark;
    } else {
      miles = prevMiles + milesToday;
    }
  }

  // Tombstone encounter check
  if (!arrivedAtLandmark && mode === 'travel') {
    const passedGrave = tombstones.find((t) => t.mile > prevMiles && t.mile <= miles);
    if (passedGrave) {
      triggeredTombstone = passedGrave;
    }
  }

  // 3. Party Health & Illness progression
  const coldPenalty =
    (weather === 'snow' || weather === 'cold' || tempF <= 38) && inv.clothing < aliveCount * 1.5
      ? -5
      : 0;
  const rationDelta =
    foodShortage ? -9 : prev.rations === 'filling' ? 3 : prev.rations === 'meager' ? 0 : -3;
  const paceDelta =
    mode === 'rest'
      ? 7
      : prev.pace === 'steady'
      ? 1
      : prev.pace === 'strenuous'
      ? -2
      : -5;
  const farmerResilience = prev.profession === 'farmer' ? 1 : 0;

  for (const member of party) {
    if (!member.alive) continue;
    let delta = rationDelta + paceDelta + coldPenalty + farmerResilience;

    if (member.illness) {
      member.illnessDays += 1;
      delta -= mode === 'rest' ? 2 : 6;
      // Chance of recovery improves when resting & well-fed
      const recoverChance =
        (mode === 'rest' ? 0.34 : 0.12) +
        (prev.rations === 'filling' ? 0.12 : 0) -
        (prev.pace === 'grueling' ? 0.08 : 0);
      if (member.illnessDays >= 2 && Math.random() < recoverChance) {
        const curedIllness = member.illness;
        member.illness = null;
        member.illnessDays = 0;
        logs.unshift({
          day: nextDay,
          dateStr,
          mile: miles,
          message: `${member.name} has recovered from ${curedIllness}.`,
          tone: 'good',
        });
      }
    }

    member.health = Math.max(0, Math.min(100, member.health + delta));

    if (member.health <= 0) {
      member.alive = false;
      member.deathDay = nextDay;
      member.deathMile = miles;
      member.causeOfDeath = member.illness
        ? `Died of ${member.illness}`
        : foodShortage
        ? 'Starvation on the trail'
        : 'Exhaustion and exposure';
      soundCue = 'danger';

      tombstones.push({
        mile: miles,
        name: member.name,
        dateStr,
        epitaph: `${member.causeOfDeath} at mile ${miles}.`,
      });

      logs.unshift({
        day: nextDay,
        dateStr,
        mile: miles,
        message: `${member.name} has died (${member.causeOfDeath}).`,
        tone: 'danger',
      });

      if (!triggeredEvent && !arrivedAtLandmark) {
        triggeredEvent = {
          id: `death_${member.id}_${nextDay}`,
          title: `${member.name} Has Passed Away`,
          narrative: `${member.causeOfDeath} near mile ${miles}. The party pauses in solemn silence to mark the grave before pressing westward.`,
          tone: 'danger',
        };
      }
    }
  }

  // Check total wipeout
  const survivorsLeft = party.filter((m) => m.alive).length;
  if (survivorsLeft === 0) {
    return {
      nextState: {
        ...prev,
        screen: 'GAME_OVER',
        day: nextDay,
        currentDate: nextDate,
        miles,
        weather,
        temperatureF: tempF,
        traveling: false,
        wagonCondition,
        brokenPart,
        party,
        inventory: inv,
        logs: logs.slice(0, 40),
        tombstones,
        activeModal: null,
        activeEvent: null,
      },
      arrivedAtLandmark: null,
      triggeredTombstone: null,
      triggeredEvent: null,
      soundCue: 'danger',
    };
  }

  // 4. Random Trail Events (only when traveling and no landmark arrived)
  if (mode === 'travel' && !arrivedAtLandmark && !triggeredEvent && !brokenPart) {
    const eventRoll = Math.random();
    const breakdownRisk =
      (prev.pace === 'grueling' ? 0.08 : prev.pace === 'strenuous' ? 0.045 : 0.025) *
      (prev.profession === 'carpenter' ? 0.6 : 1);

    if (eventRoll < breakdownRisk) {
      const parts: Array<'wheel' | 'axle' | 'tongue'> = ['wheel', 'axle', 'tongue'];
      const part = parts[Math.floor(Math.random() * parts.length)];
      brokenPart = part;
      wagonCondition = Math.max(25, wagonCondition - 18);
      soundCue = 'warn';
      logs.unshift({
        day: nextDay,
        dateStr,
        mile: miles,
        message: `A wagon ${part} snapped on rough ruts!`,
        tone: 'warn',
      });
      triggeredEvent = {
        id: `break_${part}_${nextDay}`,
        title: `Broken Wagon ${part.charAt(0).toUpperCase() + part.slice(1)}`,
        narrative: `A sharp jolt across granite ruts cracked your wagon ${part}. You cannot travel until it is repaired.`,
        tone: 'warning',
        choices: buildRepairChoices(part, inv),
      };
    } else if (eventRoll < breakdownRisk + 0.055) {
      // Illness strikes a healthy member
      const healthy = party.filter((m) => m.alive && !m.illness);
      if (healthy.length > 0) {
        const victim = healthy[Math.floor(Math.random() * healthy.length)];
        const illness = ILLNESS_NAMES[Math.floor(Math.random() * ILLNESS_NAMES.length)];
        victim.illness = illness;
        victim.illnessDays = 0;
        soundCue = 'warn';
        logs.unshift({
          day: nextDay,
          dateStr,
          mile: miles,
          message: `${victim.name} came down with ${illness}.`,
          tone: 'warn',
        });
        triggeredEvent = {
          id: `illness_${nextDay}`,
          title: `${victim.name} Has ${illness}`,
          narrative: `${victim.name} shows signs of ${illness}. Resting at camp and keeping rations filling will improve recovery odds.`,
          tone: 'warning',
        };
      }
    } else if (eventRoll < breakdownRisk + 0.085) {
      // Positive trail discovery
      const positiveRoll = Math.random();
      if (positiveRoll < 0.45) {
        const berries = 18 + Math.floor(Math.random() * 20);
        inv.food += berries;
        soundCue = 'good';
        logs.unshift({
          day: nextDay,
          dateStr,
          mile: miles,
          message: `Found wild serviceberries and prairie turnips (+${berries} lbs food).`,
          tone: 'good',
        });
        triggeredEvent = {
          id: `berries_${nextDay}`,
          title: 'Wild Fruit & Herbs Found',
          narrative: `Your party gathered ${berries} lbs of wild berries and edible roots along a creek bed, lifting everyone’s spirits.`,
          tone: 'positive',
        };
      } else if (positiveRoll < 0.78) {
        const salvagedAmmo = 20;
        inv.food += 15;
        inv.ammo += salvagedAmmo;
        soundCue = 'good';
        logs.unshift({
          day: nextDay,
          dateStr,
          mile: miles,
          message: `Salvaged an abandoned wagon (+15 lbs food, +20 bullets).`,
          tone: 'good',
        });
        triggeredEvent = {
          id: `salvage_${nextDay}`,
          title: 'Abandoned Wagon Salvage',
          narrative: `You come across a lightened wagon left by an earlier train and salvage 15 lbs of salt pork and a box of 20 rounds.`,
          tone: 'positive',
        };
      } else {
        // Traveler wants to trade
        const offer = generateBarterOffer();
        soundCue = 'good';
        return {
          nextState: {
            ...prev,
            day: nextDay,
            currentDate: nextDate,
            miles,
            weather,
            temperatureF: tempF,
            traveling: false,
            wagonCondition,
            brokenPart,
            party,
            inventory: inv,
            logs: logs.slice(0, 40),
            tombstones,
            barterOffer: offer,
            activeModal: 'SUPPLIES',
          },
          arrivedAtLandmark: null,
          triggeredTombstone: null,
          triggeredEvent: null,
          soundCue: 'good',
        };
      }
    } else if (eventRoll < breakdownRisk + 0.105 && inv.oxen > 1) {
      // Lost trail / ox wanders / thief
      if (Math.random() < 0.5 && inv.food > 40) {
        const stolen = Math.min(inv.food, 25 + Math.floor(Math.random() * 25));
        inv.food -= stolen;
        soundCue = 'warn';
        logs.unshift({
          day: nextDay,
          dateStr,
          mile: miles,
          message: `Raiders crept into camp overnight and made off with ${stolen} lbs of provisions.`,
          tone: 'warn',
        });
        triggeredEvent = {
          id: `thief_${nextDay}`,
          title: 'Nighttime Pilferage',
          narrative: `During the night, ${stolen} lbs of dried provisions were taken from the rear storage chest.`,
          tone: 'warning',
        };
      } else {
        // Impassable washout loses a day
        miles = Math.max(prevMiles, miles - Math.round(milesToday * 0.5));
        logs.unshift({
          day: nextDay,
          dateStr,
          mile: miles,
          message: 'Swollen creek washout forced a long detour.',
          tone: 'warn',
        });
      }
    }
  }

  // Check if reached final landmark (Oregon City)
  if (arrivedAtLandmark && arrivedAtLandmark.type === 'finish') {
    soundCue = 'victory';
    logs.unshift({
      day: nextDay,
      dateStr,
      mile: TOTAL_TRAIL_MILES,
      message: 'Reached Oregon City in the Willamette Valley!',
      tone: 'good',
    });
    return {
      nextState: {
        ...prev,
        screen: 'VICTORY',
        day: nextDay,
        currentDate: nextDate,
        miles: TOTAL_TRAIL_MILES,
        weather,
        temperatureF: tempF,
        traveling: false,
        wagonCondition,
        brokenPart,
        party,
        inventory: inv,
        logs: logs.slice(0, 40),
        tombstones,
        visitedLandmarks: [...prev.visitedLandmarks, arrivedAtLandmark.id],
        activeModal: null,
      },
      arrivedAtLandmark,
      triggeredTombstone: null,
      triggeredEvent: null,
      soundCue: 'victory',
    };
  }

  // Check if food ran out warning
  if (foodShortage && inv.food === 0 && !triggeredEvent && !arrivedAtLandmark && Math.random() < 0.45) {
    logs.unshift({
      day: nextDay,
      dateStr,
      mile: miles,
      message: 'Food supplies are completely exhausted! Hunt or trade immediately.',
      tone: 'danger',
    });
  }

  // Check if arrived at river or other landmark
  let nextModal = prev.activeModal;
  let activeRiver = prev.activeRiver;
  let activeLandmark = prev.activeLandmark;
  let traveling = prev.traveling;

  if (arrivedAtLandmark) {
    traveling = false;
    nextLandmarkIndex = Math.min(LANDMARKS.length - 1, nextLandmarkIndex + 1);
    logs.unshift({
      day: nextDay,
      dateStr,
      mile: miles,
      message: `Arrived at ${arrivedAtLandmark.name}.`,
      tone: 'good',
    });
    if (arrivedAtLandmark.type === 'river') {
      activeRiver = createRiverEncounter(arrivedAtLandmark, weather, nextDate);
      nextModal = 'RIVER';
      soundCue = 'warn';
    } else {
      activeLandmark = arrivedAtLandmark;
      nextModal = 'LANDMARK';
      soundCue = 'good';
    }
  } else if (triggeredEvent) {
    traveling = false;
    nextModal = 'EVENT';
  } else if (triggeredTombstone) {
    traveling = false;
    nextModal = 'TOMBSTONE';
  }

  const nextState: GameState = {
    ...prev,
    day: nextDay,
    currentDate: nextDate,
    miles,
    nextLandmarkIndex,
    visitedLandmarks:
      arrivedAtLandmark && !prev.visitedLandmarks.includes(arrivedAtLandmark.id)
        ? [...prev.visitedLandmarks, arrivedAtLandmark.id]
        : prev.visitedLandmarks,
    weather,
    temperatureF: tempF,
    traveling,
    wagonCondition,
    brokenPart,
    party,
    inventory: inv,
    logs: logs.slice(0, 40),
    tombstones,
    activeModal: nextModal,
    activeEvent: triggeredEvent,
    activeRiver,
    activeLandmark,
    activeTombstone: triggeredTombstone,
  };

  return {
    nextState,
    arrivedAtLandmark,
    triggeredTombstone,
    triggeredEvent,
    soundCue,
  };
}

export function buildRepairChoices(
  part: 'wheel' | 'axle' | 'tongue',
  inv: Inventory
): ActiveEvent['choices'] {
  const spareCount = part === 'wheel' ? inv.wheels : part === 'axle' ? inv.axles : inv.tongues;
  const labelPart = part.charAt(0).toUpperCase() + part.slice(1);
  return [
    {
      label: `Use Spare ${labelPart} (${spareCount} onboard)`,
      actionId: `repair_spare_${part}`,
      disabled: spareCount <= 0,
      hint: spareCount > 0 ? 'Restores wagon smoothly in 1 day' : 'No spare part in wagon',
    },
    {
      label: `Jury-rig Timber Splint (Costs 2 days)`,
      actionId: `repair_improvise_${part}`,
      hint: 'Keeps you rolling, but reduces wagon condition',
    },
  ];
}

export function computeFinalScore(state: GameState): {
  survivorPoints: number;
  wagonPoints: number;
  supplyPoints: number;
  cashPoints: number;
  multiplier: number;
  totalScore: number;
} {
  const alive = state.party.filter((m) => m.alive);
  const avgHealth =
    alive.length > 0 ? alive.reduce((s, m) => s + m.health, 0) / alive.length : 0;
  const survivorPoints = Math.round(alive.length * (350 + avgHealth * 1.5));
  const wagonPoints = Math.round(state.wagonCondition * 2.5);
  const supplyPoints = Math.round(
    state.inventory.oxen * 18 +
      state.inventory.food * 0.25 +
      state.inventory.clothing * 12 +
      state.inventory.ammo * 0.5 +
      (state.inventory.wheels + state.inventory.axles + state.inventory.tongues) * 15
  );
  const cashPoints = Math.round(state.inventory.cash * 0.4);
  const prof = PROFESSIONS.find((p) => p.id === state.profession) ?? PROFESSIONS[0];
  const multiplier = prof.scoreMultiplier;
  const totalScore = (survivorPoints + wagonPoints + supplyPoints + cashPoints) * multiplier;

  return {
    survivorPoints,
    wagonPoints,
    supplyPoints,
    cashPoints,
    multiplier,
    totalScore,
  };
}
