import type { AcidityLevel, BaseSpirit, BodyLevel, DrinkType, SweetnessLevel, TanninLevel, WineColor } from './types';

export const DRINK_TYPE_LABELS: Record<DrinkType, string> = {
  wine: '酒款',
  cocktail: '鸡尾酒',
  beer: '啤酒',
  baijiu: '白酒',
  spirit: '洋酒',
};

export const DRINK_TYPES = Object.keys(DRINK_TYPE_LABELS) as DrinkType[];
export const WINE_COLORS: WineColor[] = ['红', '白', '桃红', '橙酒', '起泡', '加强', '甜酒', '其他'];
export const BODY_LEVELS: BodyLevel[] = ['轻盈', '中等', '饱满'];
export const SWEETNESS_LEVELS: SweetnessLevel[] = ['干型', '半干', '半甜', '甜型'];
export const ACIDITY_LEVELS: AcidityLevel[] = ['低', '中', '高'];
export const TANNIN_LEVELS: TanninLevel[] = ['低', '中', '高'];
export const BASE_SPIRITS: BaseSpirit[] = ['金酒', '朗姆', '威士忌', '伏特加', '龙舌兰', '白兰地', '利口酒', '无酒精', '其他'];

export const PURCHASE_SOURCES = ['酒商', '超市', '餐厅/酒吧', '淘宝', '天猫', '朋友赠送', '其他'] as const;

export const COMMON_FLAVOR_TAGS = [
  '黑莓',
  '樱桃',
  '柑橘',
  '热带水果',
  '花香',
  '香料',
  '草本',
  '矿物感',
  '橡木',
  '奶油',
  '坚果',
  '烟熏',
  '清爽',
  '甜感',
  '苦感',
  '酒感',
];

export const SCENE_SUGGESTIONS = ['晚餐', '独饮', '朋友聚会', '酒吧', '餐厅', '调酒练习', '节日', '盲品'];
export const EXPLORATION_COUNTRIES = ['法国', '意大利', '西班牙', '德国', '美国', '智利', '澳大利亚', '日本'];
