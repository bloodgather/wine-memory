import { BASE_SPIRITS, DRINK_TYPE_LABELS, EXPLORATION_COUNTRIES, WINE_COLORS } from '../constants';
import type { DrinkItem, DrinkLog, DrinkRecommendation, DrinkWithStats, PreferenceProfile, RankedSignal } from '../types';

const HIGH_RATING = 4.2;

export function attachDrinkStats(drinks: DrinkItem[], logs: DrinkLog[]): DrinkWithStats[] {
  return drinks.map((drink) => {
    const drinkLogs = logs
      .filter((log) => log.drinkId === drink.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const averageRating = drinkLogs.length
      ? drinkLogs.reduce((sum, log) => sum + log.rating, 0) / drinkLogs.length
      : undefined;
    return {
      ...drink,
      logs: drinkLogs,
      averageRating,
      lastDrankAt: drinkLogs[0]?.date,
    };
  });
}

export function buildPreferenceProfile(drinks: DrinkItem[], logs: DrinkLog[]): PreferenceProfile {
  const drinksById = new Map(drinks.map((drink) => [drink.id, drink]));
  const highSignalLogs = logs.filter((log) => log.rating >= HIGH_RATING);
  const sourceLogs = highSignalLogs.length ? highSignalLogs : logs;
  const averageRating = logs.length ? mean(logs.map((log) => log.rating)) : undefined;

  return {
    totalDrinks: drinks.length,
    totalLogs: logs.length,
    averageRating,
    topTypes: rankDrinkField(sourceLogs, drinksById, (drink) => DRINK_TYPE_LABELS[drink.type]),
    topCountries: rankDrinkField(sourceLogs, drinksById, (drink) => drink.country),
    topRegions: rankDrinkField(sourceLogs, drinksById, (drink) => drink.region),
    topWineColors: rankDrinkField(sourceLogs, drinksById, (drink) => drink.wineColor || ''),
    topBaseSpirits: rankDrinkField(sourceLogs, drinksById, (drink) => drink.baseSpirit || ''),
    topFlavors: rankManyDrinkFields(sourceLogs, drinksById, (drink) => drink.flavorTags),
    topScenes: rankLogField(sourceLogs, (log) => log.scene),
  };
}

export function buildRecommendations(drinks: DrinkItem[], logs: DrinkLog[]): DrinkRecommendation[] {
  const profile = buildPreferenceProfile(drinks, logs);
  if (!logs.length) {
    return [
      {
        id: 'starter-wine',
        kind: '继续相似风格',
        title: '先用一瓶容易判断的干型酒建立基准',
        reason: '你还没有饮用记录。先记录一瓶风格清晰的红或白，后续更容易比较酸度、酒体和香气偏好。',
        chips: ['干型', '中等酒体', '晚餐'],
      },
      {
        id: 'starter-broad',
        kind: '小幅探索',
        title: '再补一类不同酒做对照',
        reason: '把葡萄酒、啤酒、白酒、洋酒和鸡尾酒放在同一套评分里，可以更快看出你偏好清爽、甜感、苦感、酒体还是酒感。',
        chips: ['啤酒', '白酒', '洋酒'],
      },
      {
        id: 'starter-avoid',
        kind: '近期少喝',
        title: '第一版先少囤，先记录真实喜欢什么',
        reason: '样本还少时，建议用小瓶、单杯或小批量调制积累记录，再决定复购或常备。',
        chips: ['少量验证', '先记录'],
      },
    ];
  }

  const topType = profile.topTypes[0]?.label || '酒款';
  const topCountry = profile.topCountries[0]?.label || '法国';
  const topWineColor = profile.topWineColors[0]?.label || '红';
  const topBaseSpirit = profile.topBaseSpirits[0]?.label || '金酒';
  const topFlavorPair = profile.topFlavors.slice(0, 2).map((signal) => signal.label);
  const explorationCountry = EXPLORATION_COUNTRIES.find((country) => country !== topCountry) || '意大利';
  const lessUsedWineColor = WINE_COLORS.find((color) => !profile.topWineColors.some((signal) => signal.label === color)) || '白';
  const lessUsedSpirit = BASE_SPIRITS.find((spirit) => !profile.topBaseSpirits.some((signal) => signal.label === spirit)) || '朗姆';

  return [
    {
      id: 'similar',
      kind: '继续相似风格',
      title: `${topCountry}${topWineColor} / ${topBaseSpirit}方向`,
      reason: `你的高分记录里，${topType}更常出现，${topFlavorPair.length ? `${topFlavorPair.join('/')}这类标签也更集中` : '说明这个方向目前更稳'}。`,
      chips: [topType, topCountry, topWineColor, topBaseSpirit, ...topFlavorPair].filter(Boolean).slice(0, 5),
    },
    {
      id: 'explore',
      kind: '小幅探索',
      title: `保留熟悉口味，换一个${explorationCountry}或${lessUsedSpirit}`,
      reason: '只改变一个变量，能在不偏离太远的情况下测试你是否喜欢新的产区、基酒或香气结构。',
      chips: [explorationCountry, lessUsedSpirit, '单杯/小瓶'],
    },
    {
      id: 'underrepresented',
      kind: '近期少喝',
      title: `${lessUsedWineColor}或${lessUsedSpirit}先少量尝试`,
      reason: '你的记录里这类样本较少，建议先用一杯或一小瓶验证，不要直接囤货。',
      chips: [lessUsedWineColor, lessUsedSpirit, '少量验证'],
    },
  ];
}

function rankDrinkField(
  logs: DrinkLog[],
  drinksById: Map<string, DrinkItem>,
  getValue: (drink: DrinkItem) => string,
): RankedSignal[] {
  return rankSignals(
    logs.flatMap((log) => {
      const drink = drinksById.get(log.drinkId);
      return drink ? [{ label: getValue(drink), rating: log.rating }] : [];
    }),
  );
}

function rankManyDrinkFields(
  logs: DrinkLog[],
  drinksById: Map<string, DrinkItem>,
  getValues: (drink: DrinkItem) => string[],
): RankedSignal[] {
  return rankSignals(
    logs.flatMap((log) => {
      const drink = drinksById.get(log.drinkId);
      return drink ? getValues(drink).map((label) => ({ label, rating: log.rating })) : [];
    }),
  );
}

function rankLogField(logs: DrinkLog[], getValue: (log: DrinkLog) => string): RankedSignal[] {
  return rankSignals(logs.map((log) => ({ label: getValue(log), rating: log.rating })));
}

function rankSignals(values: { label: string; rating: number }[]): RankedSignal[] {
  const grouped = new Map<string, number[]>();
  values
    .filter((value) => value.label)
    .forEach((value) => {
      grouped.set(value.label, [...(grouped.get(value.label) || []), value.rating]);
    });

  return [...grouped.entries()]
    .map(([label, ratings]) => ({
      label,
      count: ratings.length,
      averageRating: mean(ratings),
    }))
    .sort((a, b) => b.averageRating - a.averageRating || b.count - a.count || a.label.localeCompare(b.label, 'zh-CN'));
}

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
