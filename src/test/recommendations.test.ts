import { describe, expect, it } from 'vitest';
import { attachDrinkStats, buildPreferenceProfile, buildRecommendations } from '../services/recommendations';
import type { DrinkItem, DrinkLog } from '../types';

describe('recommendations', () => {
  it('attaches drink stats', () => {
    const stats = attachDrinkStats([drink({ id: 'wine-1' })], [log({ drinkId: 'wine-1', rating: 4 }), log({ drinkId: 'wine-1', rating: 5 })]);

    expect(stats[0].logs).toHaveLength(2);
    expect(stats[0].averageRating).toBe(4.5);
  });

  it('builds a preference profile from high scoring logs', () => {
    const profile = buildPreferenceProfile(
      [
        drink({ id: 'wine-1', country: '法国', wineColor: '红', flavorTags: ['樱桃'] }),
        drink({ id: 'cocktail-1', type: 'cocktail', baseSpirit: '金酒', flavorTags: ['清爽'] }),
      ],
      [log({ drinkId: 'wine-1', rating: 4.6, scene: '晚餐' }), log({ drinkId: 'cocktail-1', rating: 3.5, scene: '酒吧' })],
    );

    expect(profile.averageRating).toBeCloseTo(4.05);
    expect(profile.topCountries[0].label).toBe('法国');
    expect(profile.topFlavors[0].label).toBe('樱桃');
  });

  it('returns starter recommendations without logs', () => {
    const recommendations = buildRecommendations([], []);

    expect(recommendations).toHaveLength(3);
    expect(recommendations[0].title).toContain('基准');
  });
});

function drink(overrides: Partial<DrinkItem> = {}): DrinkItem {
  return {
    id: 'drink',
    type: 'wine',
    name: 'Wine',
    producer: '',
    country: '意大利',
    region: '托斯卡纳',
    wineColor: '红',
    grapes: [],
    body: '中等',
    sweetness: '干型',
    acidity: '中',
    tannin: '中',
    decantingNote: '',
    recipe: '',
    method: '',
    glassware: '',
    ice: '',
    garnish: '',
    flavorTags: [],
    purchaseDate: '2026-01-01',
    notes: '',
    wantAgain: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function log(overrides: Partial<DrinkLog> = {}): DrinkLog {
  return {
    id: 'log',
    drinkId: 'drink',
    date: '2026-01-02',
    scene: '晚餐',
    place: '',
    pairing: '',
    rating: 4,
    aroma: 3,
    palate: 3,
    finish: 3,
    notes: '',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  };
}
