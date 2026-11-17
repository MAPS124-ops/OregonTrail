import { DepartureMonth, Landmark, Profession, Tombstone } from '../types/game';

export const TOTAL_TRAIL_MILES = 2040;

export const PROFESSIONS: Profession[] = [
  {
    id: 'banker',
    title: 'Banker from Boston',
    origin: 'Boston, Massachusetts',
    startingCash: 1600,
    scoreMultiplier: 1,
    description: 'Ample capital to outfit your wagon thoroughly before leaving Independence.',
    bonusTrait: '1x Final Score · Highest starting funds',
  },
  {
    id: 'carpenter',
    title: 'Carpenter from Ohio',
    origin: 'Cincinnati, Ohio',
    startingCash: 800,
    scoreMultiplier: 2,
    description: 'Skilled with timber and ironwork, lowering the chance of catastrophic wagon breakdowns.',
    bonusTrait: '2x Final Score · Faster wagon repairs',
  },
  {
    id: 'farmer',
    title: 'Farmer from Illinois',
    origin: 'Springfield, Illinois',
    startingCash: 400,
    scoreMultiplier: 3,
    description: 'Hardened by prairie weather and livestock care, stretching meager rations and keeping oxen healthy.',
    bonusTrait: '3x Final Score · Resilient oxen & party',
  },
];

export const DEPARTURE_MONTHS: Array<{
  id: DepartureMonth;
  label: string;
  monthIndex: number; // 0-indexed JS month
  summary: string;
  outlook: string;
}> = [
  {
    id: 'march',
    label: 'March',
    monthIndex: 2,
    summary: 'Early start leaves plenty of time before mountain snows, though spring mud and swollen rivers await.',
    outlook: 'Muddy trails · Sparse early grass',
  },
  {
    id: 'april',
    label: 'April',
    monthIndex: 3,
    summary: 'A balanced spring departure with rising prairie grass and steady crossing conditions.',
    outlook: 'Balanced weather · Rising rivers',
  },
  {
    id: 'may',
    label: 'May',
    monthIndex: 4,
    summary: 'The classic wagon-train window: lush grazing across the plains, provided you keep pace before autumn.',
    outlook: 'Prime grass · Watch autumn snows',
  },
  {
    id: 'june',
    label: 'June',
    monthIndex: 5,
    summary: 'Warm dry crossings early on, but you must push hard to clear the Blue Mountains before October.',
    outlook: 'Dry rivers · Late mountain snow risk',
  },
  {
    id: 'july',
    label: 'July',
    monthIndex: 6,
    summary: 'A desperate late departure. Summer heat scorches the Platte, and winter storms threaten the Cascades.',
    outlook: 'Extreme heat · High winter peril',
  },
];

export const DEFAULT_PARTY_NAMES = [
  'Clara Vance',
  'Thomas Mercer',
  'Abigail Vance',
  'Samuel Mercer',
  'Hattie Brooks',
];

export const RANDOM_NAME_POOL = [
  'Ezra Holloway',
  'Martha Sterling',
  'Caleb Whitmore',
  'Lydia Boone',
  'Josiah Finch',
  'Eleanor Crane',
  'Gideon Marsh',
  'Ruthie Alden',
  'Nathaniel Cole',
  'Beatrice Shaw',
  'Silas Fletcher',
  'Miriam Vance',
];

export interface StoreItemSpec {
  key: 'oxen' | 'food' | 'clothing' | 'ammo' | 'wheels' | 'axles' | 'tongues';
  name: string;
  unitLabel: string;
  basePrice: number; // in Independence
  quantityPerPurchase: number;
  maxRecommended: number;
  description: string;
}

export const STORE_ITEMS: StoreItemSpec[] = [
  {
    key: 'oxen',
    name: 'Yoke of Oxen',
    unitLabel: '1 yoke (2 oxen)',
    basePrice: 40,
    quantityPerPurchase: 2,
    maxRecommended: 6,
    description: 'At least 2 yokes (4 oxen) are needed to pull a loaded wagon smoothly across mountain grades.',
  },
  {
    key: 'food',
    name: 'Flour, Bacon & Beans',
    unitLabel: '25 lbs sack',
    basePrice: 5,
    quantityPerPurchase: 25,
    maxRecommended: 800,
    description: 'Recommended 200 lbs per person for the full crossing, supplemented by hunting on the plains.',
  },
  {
    key: 'clothing',
    name: 'Wool & Canvas Clothing',
    unitLabel: '1 set',
    basePrice: 10,
    quantityPerPurchase: 1,
    maxRecommended: 12,
    description: 'At least 2 sets per traveler guard against freezing rains in the Rockies and Blue Mountains.',
  },
  {
    key: 'ammo',
    name: 'Lead Shot & Powder',
    unitLabel: '1 box (20 rounds)',
    basePrice: 2,
    quantityPerPurchase: 20,
    maxRecommended: 200,
    description: 'Essential for hunting buffalo, elk, and deer across the Great Plains.',
  },
  {
    key: 'wheels',
    name: 'Spare Wagon Wheel',
    unitLabel: '1 wheel',
    basePrice: 10,
    quantityPerPurchase: 1,
    maxRecommended: 3,
    description: 'Rocky riverbeds and rutted canyon tracks frequently splinter wooden spokes.',
  },
  {
    key: 'axles',
    name: 'Spare Wagon Axle',
    unitLabel: '1 axle',
    basePrice: 10,
    quantityPerPurchase: 1,
    maxRecommended: 3,
    description: 'A snapped axle halts the wagon completely unless a spare iron-shod axle is onboard.',
  },
  {
    key: 'tongues',
    name: 'Spare Wagon Tongue',
    unitLabel: '1 tongue',
    basePrice: 10,
    quantityPerPurchase: 1,
    maxRecommended: 3,
    description: 'Connects the oxen yoke to the wagon frame; sharp turns on steep grades can snap it.',
  },
];

export const LANDMARKS: Landmark[] = [
  {
    id: 'independence',
    name: 'Independence, Missouri',
    mile: 0,
    type: 'start',
    biome: 'tallgrass',
    elevationFt: 1030,
    description: 'The bustling jumping-off town on the Missouri frontier where hundreds of prairie schooners assemble each spring.',
    localTip: 'Pack plenty of bacon and at least two spare wheels before crossing the Kansas prairie.',
  },
  {
    id: 'kansas_river',
    name: 'Kansas River Crossing',
    mile: 102,
    type: 'river',
    biome: 'tallgrass',
    elevationFt: 910,
    description: 'Muddy spring runoff swells the Kaw River. Wagon tracks converge at Pappan’s Ferry.',
    localTip: 'Check the depth carefully—if the water exceeds three feet, caulking your wagon or hiring the ferry is far safer than fording.',
    riverDefaults: { widthFt: 620, baseDepthFt: 3.8, currentMph: 3.4, ferryCost: 5 },
  },
  {
    id: 'big_blue',
    name: 'Big Blue River Crossing',
    mile: 185,
    type: 'river',
    biome: 'tallgrass',
    elevationFt: 1120,
    description: 'Steep limestone banks drop down into the swift Big Blue River near Alcove Spring.',
    localTip: 'Spring storms can raise this river two feet overnight. Waiting a day often drops the crest.',
    riverDefaults: { widthFt: 340, baseDepthFt: 3.1, currentMph: 4.1, ferryCost: 5 },
  },
  {
    id: 'fort_kearny',
    name: 'Fort Kearny',
    mile: 304,
    type: 'fort',
    biome: 'platte',
    elevationFt: 2150,
    description: 'An adobe-and-timber military outpost overlooking the wide, braided channels of the Platte River.',
    localTip: 'Buffalo herds thicken west of here. Keep your powder dry and watch for summer thunderstorms.',
  },
  {
    id: 'chimney_rock',
    name: 'Chimney Rock',
    mile: 554,
    type: 'monument',
    biome: 'badlands',
    elevationFt: 3880,
    description: 'A dramatic 325-foot spire of clay and sandstone rising out of the North Platte valley—the most sketched landmark on the trail.',
    localTip: 'You are nearing the high plains. Nights grow chilly even in June.',
  },
  {
    id: 'fort_laramie',
    name: 'Fort Laramie',
    mile: 640,
    type: 'fort',
    biome: 'badlands',
    elevationFt: 4250,
    description: 'A vital stone and timber trading post where the Laramie and North Platte rivers meet below the foothills.',
    localTip: 'Rest your oxen here if they are worn; steep rocky climbs begin straight past the fort.',
  },
  {
    id: 'independence_rock',
    name: 'Independence Rock',
    mile: 830,
    type: 'monument',
    biome: 'rockies',
    elevationFt: 5900,
    description: 'A whale-backed granite monolith along the Sweetwater River, inscribed with thousands of pioneer names.',
    localTip: 'Emigrants aim to reach this rock by the Fourth of July to clear the Cascades before winter.',
  },
  {
    id: 'south_pass',
    name: 'South Pass (Continental Divide)',
    mile: 932,
    type: 'fork',
    biome: 'rockies',
    elevationFt: 7550,
    description: 'A broad, windswept sagebrush saddle across the Continental Divide where waters begin flowing toward the Pacific.',
    localTip: 'The Sublette Cutoff saves days of travel across dry sagebrush, while Fort Bridger offers repairs and supplies.',
    forkOptions: {
      leftLabel: 'Head to Fort Bridger (Supplies & Rest)',
      leftTargetId: 'fort_bridger',
      rightLabel: 'Take Sublette Cutoff (Direct to Green River)',
      rightTargetId: 'green_river',
    },
  },
  {
    id: 'fort_bridger',
    name: 'Fort Bridger',
    mile: 1020,
    type: 'fort',
    biome: 'rockies',
    elevationFt: 6670,
    description: 'Jim Bridger’s log blacksmith and trading post nestled in a green valley of cold mountain streams.',
    localTip: 'Stock up on spare axles and warm clothing before crossing the dry Bear River hills.',
  },
  {
    id: 'green_river',
    name: 'Green River Crossing',
    mile: 1085,
    type: 'river',
    biome: 'high_desert',
    elevationFt: 6180,
    description: 'Fast, icy snowmelt rushes down from the Wind River Range across shifting gravel bars.',
    localTip: 'The current here is deceptive and cold. Never attempt a straight ford when depth exceeds three feet.',
    riverDefaults: { widthFt: 440, baseDepthFt: 3.9, currentMph: 4.8, ferryCost: 6 },
  },
  {
    id: 'soda_springs',
    name: 'Soda Springs',
    mile: 1210,
    type: 'monument',
    biome: 'high_desert',
    elevationFt: 5780,
    description: 'Effervescent mineral springs bubbling through volcanic limestone along the Bear River bend.',
    localTip: 'Travelers use the carbonated spring water to leaven sourdough biscuits.',
  },
  {
    id: 'fort_hall',
    name: 'Fort Hall',
    mile: 1288,
    type: 'fort',
    biome: 'high_desert',
    elevationFt: 4460,
    description: 'An adobe Hudson’s Bay Company post on the Snake River plain where wagons lighten loads for the desert canyon ahead.',
    localTip: 'The Snake River lava plains ahead are dusty and unforgiving on wagon wheels.',
  },
  {
    id: 'snake_river',
    name: 'Snake River Crossing',
    mile: 1480,
    type: 'river',
    biome: 'high_desert',
    elevationFt: 2510,
    description: 'A wide, perilous crossing between basalt canyon walls at Three Island Ford.',
    localTip: 'Sandbars shift daily; check depth and consider floating the wagon box.',
    riverDefaults: { widthFt: 760, baseDepthFt: 4.1, currentMph: 4.5, ferryCost: 7 },
  },
  {
    id: 'fort_boise',
    name: 'Fort Boise',
    mile: 1610,
    type: 'fort',
    biome: 'blue_mountains',
    elevationFt: 2220,
    description: 'The final fortified supply post before climbing the timbered ridges of the Blue Mountains.',
    localTip: 'Make sure every traveler has warm woolens; frost hits early in the Blue Mountains.',
  },
  {
    id: 'blue_mountains',
    name: 'Blue Mountains Summit',
    mile: 1765,
    type: 'monument',
    biome: 'blue_mountains',
    elevationFt: 4820,
    description: 'Towering ponderosa pines and steep rocky switchbacks overlooking the Grande Ronde valley.',
    localTip: 'Downhill descents require locking rear wheels with chains so the wagon does not overrun the oxen.',
  },
  {
    id: 'the_dalles',
    name: 'The Dalles',
    mile: 1925,
    type: 'fork',
    biome: 'columbia_gorge',
    elevationFt: 160,
    description: 'Basalt narrows along the mighty Columbia River—the final barrier before the lush Willamette Valley.',
    localTip: 'You can raft the treacherous Columbia Gorge rapids yourself, or pay the toll to haul over the steep Barlow Road.',
    forkOptions: {
      leftLabel: 'Raft the Columbia River (Interactive Rapids)',
      leftTargetId: 'raft_columbia',
      rightLabel: 'Take the Barlow Toll Road ($5 toll, safer)',
      rightTargetId: 'oregon_city',
    },
  },
  {
    id: 'oregon_city',
    name: 'Oregon City (Willamette Valley)',
    mile: 2040,
    type: 'finish',
    biome: 'columbia_gorge',
    elevationFt: 135,
    description: 'Emerald riverbanks, roaring Willamette Falls, and fertile homesteads at the end of the 2,040-mile Oregon Trail.',
  },
];

export const INITIAL_TOMBSTONES: Tombstone[] = [
  {
    mile: 245,
    name: 'Jediah Mercer',
    dateStr: 'May 19, 1847',
    epitaph: 'Swollen waters of the Big Blue claimed his wagon and his life.',
  },
  {
    mile: 590,
    name: 'Sarah E. Holloway',
    dateStr: 'June 12, 1847',
    epitaph: 'Taken by prairie fever within sight of Chimney Rock.',
  },
  {
    mile: 970,
    name: 'Capt. Elias Boone',
    dateStr: 'July 4, 1846',
    epitaph: 'Crossed the Divide on Independence Day; rests beneath Wyoming sage.',
  },
  {
    mile: 1510,
    name: 'Young Eli Vance',
    dateStr: 'August 9, 1847',
    epitaph: 'Bit by a canyon rattler along the Snake River trail.',
  },
];

export const FORT_PRICE_MULTIPLIER: Record<string, number> = {
  fort_kearny: 1.25,
  fort_laramie: 1.45,
  fort_bridger: 1.6,
  fort_hall: 1.75,
  fort_boise: 1.9,
};
