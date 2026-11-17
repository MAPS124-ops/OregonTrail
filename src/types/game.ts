export type GameScreen =
  | 'TITLE_MENU'
  | 'PARTY_SETUP'
  | 'GENERAL_STORE'
  | 'PLAYING'
  | 'PAUSED'
  | 'HUNTING'
  | 'RAFTING'
  | 'VICTORY'
  | 'GAME_OVER';

export type ProfessionId = 'banker' | 'carpenter' | 'farmer';

export interface Profession {
  id: ProfessionId;
  title: string;
  origin: string;
  startingCash: number;
  scoreMultiplier: number;
  description: string;
  bonusTrait: string;
}

export type DepartureMonth = 'march' | 'april' | 'may' | 'june' | 'july';

export type Pace = 'steady' | 'strenuous' | 'grueling';
export type Rations = 'filling' | 'meager' | 'bare_bones';
export type WeatherKind = 'fair' | 'warm' | 'hot' | 'rain' | 'storm' | 'cold' | 'snow';

export interface PartyMember {
  id: string;
  name: string;
  isLeader: boolean;
  alive: boolean;
  health: number; // 0-100
  illness: string | null;
  illnessDays: number;
  deathDay?: number;
  deathMile?: number;
  causeOfDeath?: string;
}

export interface Inventory {
  cash: number;
  oxen: number; // individual oxen (2 = 1 yoke)
  food: number; // pounds
  clothing: number; // sets
  ammo: number; // individual bullets (bought in boxes of 20)
  wheels: number;
  axles: number;
  tongues: number;
}

export type BiomeId =
  | 'tallgrass'
  | 'platte'
  | 'badlands'
  | 'rockies'
  | 'high_desert'
  | 'blue_mountains'
  | 'columbia_gorge';

export type LandmarkType = 'start' | 'river' | 'fort' | 'monument' | 'fork' | 'finish';

export interface Landmark {
  id: string;
  name: string;
  mile: number;
  type: LandmarkType;
  biome: BiomeId;
  elevationFt: number;
  description: string;
  localTip?: string;
  riverDefaults?: {
    widthFt: number;
    baseDepthFt: number;
    currentMph: number;
    ferryCost: number;
  };
  forkOptions?: {
    leftLabel: string;
    leftTargetId: string;
    rightLabel: string;
    rightTargetId: string;
  };
}

export interface RiverState {
  landmark: Landmark;
  widthFt: number;
  depthFt: number;
  currentMph: number;
  ferryCost: number;
  waitedDays: number;
}

export interface ActiveEvent {
  id: string;
  title: string;
  narrative: string;
  tone: 'info' | 'warning' | 'danger' | 'positive';
  choices?: Array<{
    label: string;
    actionId: string;
    disabled?: boolean;
    hint?: string;
  }>;
}

export interface Tombstone {
  mile: number;
  name: string;
  dateStr: string;
  epitaph: string;
}

export interface BarterOffer {
  id: string;
  travelerName: string;
  wantsLabel: string;
  wantsKey: keyof Omit<Inventory, 'cash'>;
  wantsAmount: number;
  givesLabel: string;
  givesKey: keyof Omit<Inventory, 'cash'>;
  givesAmount: number;
}

export interface TrailLogEntry {
  day: number;
  dateStr: string;
  mile: number;
  message: string;
  tone: 'neutral' | 'good' | 'warn' | 'danger';
}

export type ModalType =
  | null
  | 'LANDMARK'
  | 'RIVER'
  | 'EVENT'
  | 'MAP'
  | 'SUPPLIES'
  | 'FORT_STORE'
  | 'TOMBSTONE'
  | 'GUIDE'
  | 'REST';

export interface GameState {
  screen: GameScreen;
  profession: ProfessionId;
  departureMonth: DepartureMonth;
  day: number; // days elapsed since departure
  currentDate: Date;
  miles: number;
  targetMiles: number;
  nextLandmarkIndex: number;
  visitedLandmarks: string[];
  routeChoice: 'sublette' | 'fort_bridger' | null;
  finalRoute: 'barlow' | 'columbia' | null;
  pace: Pace;
  rations: Rations;
  weather: WeatherKind;
  temperatureF: number;
  traveling: boolean;
  wagonCondition: number; // 0-100
  brokenPart: 'wheel' | 'axle' | 'tongue' | null;
  party: PartyMember[];
  inventory: Inventory;
  logs: TrailLogEntry[];
  activeModal: ModalType;
  activeEvent: ActiveEvent | null;
  activeRiver: RiverState | null;
  activeLandmark: Landmark | null;
  activeTombstone: Tombstone | null;
  tombstones: Tombstone[];
  barterOffer: BarterOffer | null;
  huntsCompleted: number;
  totalMeatHunted: number;
  riversCrossed: number;
}
