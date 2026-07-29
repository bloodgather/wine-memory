export type DrinkType = 'wine' | 'cocktail' | 'beer' | 'baijiu' | 'spirit';
export type WineColor = '红' | '白' | '桃红' | '橙酒' | '起泡' | '加强' | '甜酒' | '其他';
export type BodyLevel = '轻盈' | '中等' | '饱满';
export type SweetnessLevel = '干型' | '半干' | '半甜' | '甜型';
export type AcidityLevel = '低' | '中' | '高';
export type TanninLevel = '低' | '中' | '高';
export type BaseSpirit = '金酒' | '朗姆' | '威士忌' | '伏特加' | '龙舌兰' | '白兰地' | '利口酒' | '无酒精' | '其他';
export type PurchaseSource = '酒商' | '超市' | '餐厅/酒吧' | '淘宝' | '天猫' | '朋友赠送' | '其他';

export interface DrinkItem {
  id: string;
  type: DrinkType;
  name: string;
  producer: string;
  country: string;
  region: string;
  vintage?: number;
  wineColor?: WineColor;
  grapes: string[];
  body?: BodyLevel;
  sweetness?: SweetnessLevel;
  acidity?: AcidityLevel;
  tannin?: TanninLevel;
  alcoholPercent?: number;
  decantingNote: string;
  style: string;
  originMaterial: string;
  agingNote: string;
  baseSpirit?: BaseSpirit;
  recipe: string;
  method: string;
  glassware: string;
  ice: string;
  garnish: string;
  isHomemade?: boolean;
  flavorTags: string[];
  purchaseDate: string;
  purchaseUrl?: string;
  purchaseSource?: PurchaseSource;
  photoDataUrl?: string;
  photoUpdatedAt?: string;
  price?: number;
  volumeMl?: number;
  notes: string;
  wantAgain: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DrinkLog {
  id: string;
  drinkId: string;
  date: string;
  scene: string;
  place: string;
  pairing: string;
  rating: number;
  aroma: number;
  palate: number;
  finish: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DrinkWithStats extends DrinkItem {
  logs: DrinkLog[];
  averageRating?: number;
  lastDrankAt?: string;
}

export interface PreferenceProfile {
  totalDrinks: number;
  totalLogs: number;
  averageRating?: number;
  topTypes: RankedSignal[];
  topCountries: RankedSignal[];
  topRegions: RankedSignal[];
  topWineColors: RankedSignal[];
  topBaseSpirits: RankedSignal[];
  topFlavors: RankedSignal[];
  topScenes: RankedSignal[];
}

export interface RankedSignal {
  label: string;
  count: number;
  averageRating: number;
}

export type RecommendationKind = '继续相似风格' | '小幅探索' | '近期少喝';

export interface DrinkRecommendation {
  id: string;
  kind: RecommendationKind;
  title: string;
  reason: string;
  chips: string[];
}

export interface WineBackup {
  version: 1;
  exportedAt: string;
  drinks: DrinkItem[];
  logs: DrinkLog[];
}
