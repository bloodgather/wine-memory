import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Dexie, { type Table } from 'dexie';
import { createWineRepository } from '../data/repository';
import { WineDatabase } from '../data/db';
import type { DrinkItem, DrinkLog } from '../types';

let database: WineDatabase;
let repository: ReturnType<typeof createWineRepository>;

beforeEach(() => {
  database = new WineDatabase(`wine-memory-test-${crypto.randomUUID()}`);
  repository = createWineRepository(database);
});

afterEach(async () => {
  await database.delete();
  database.close();
});

describe('wine repository', () => {
  it('saves and lists drinks and logs', async () => {
    const drink = createDrink({ id: 'drink-1', name: 'Chianti' });
    const log = createLog({ id: 'log-1', drinkId: drink.id, rating: 4.4 });

    await repository.saveDrink(drink);
    await repository.saveLog(log);

    await expect(repository.listDrinks()).resolves.toMatchObject([{ id: 'drink-1', name: 'Chianti' }]);
    await expect(repository.listLogsForDrink(drink.id)).resolves.toMatchObject([{ id: 'log-1', rating: 4.4 }]);
  });

  it('deletes a drink with related logs', async () => {
    const drink = createDrink({ id: 'drink-1' });
    await repository.saveDrink(drink);
    await repository.saveLog(createLog({ id: 'log-1', drinkId: drink.id }));
    await repository.saveLog(createLog({ id: 'log-2', drinkId: drink.id }));

    await repository.deleteDrink(drink.id);

    await expect(repository.listDrinks()).resolves.toHaveLength(0);
    await expect(repository.listLogs()).resolves.toHaveLength(0);
  });

  it('exports and imports a backup', async () => {
    const drink = createDrink({ id: 'drink-1', name: 'Negroni', type: 'cocktail' });
    const log = createLog({ id: 'log-1', drinkId: drink.id });
    await repository.saveDrink(drink);
    await repository.saveLog(log);

    const backup = await repository.exportBackup();
    await repository.clearAll();
    await repository.importBackup(backup);

    await expect(repository.listDrinks()).resolves.toMatchObject([{ id: 'drink-1', name: 'Negroni' }]);
    await expect(repository.listLogs()).resolves.toMatchObject([{ id: 'log-1' }]);
  });

  it('normalizes old backup data during import', async () => {
    await repository.importBackup({
      version: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      drinks: [createLegacyDrink({ id: 'legacy-backup' }) as DrinkItem],
      logs: [],
    });

    await expect(repository.listDrinks()).resolves.toMatchObject([
      {
        id: 'legacy-backup',
        style: '',
        originMaterial: '',
        agingNote: '',
      },
    ]);
  });

  it('rejects unsupported backups', async () => {
    await expect(repository.importBackup({ version: 2, drinks: [], logs: [] } as never)).rejects.toThrow('备份文件格式不支持');
  });

  it('fills new general drink fields when upgrading old local data', async () => {
    const name = `wine-memory-upgrade-${crypto.randomUUID()}`;
    const oldDatabase = new OldWineDatabase(name);
    await oldDatabase.drinks.put(createLegacyDrink({ id: 'legacy-wine' }));
    oldDatabase.close();

    const upgradedDatabase = new WineDatabase(name);
    const upgradedRepository = createWineRepository(upgradedDatabase);
    const [drink] = await upgradedRepository.listDrinks();

    expect(drink).toMatchObject({
      id: 'legacy-wine',
      style: '',
      originMaterial: '',
      agingNote: '',
    });

    await upgradedDatabase.delete();
    upgradedDatabase.close();
  });
});

class OldWineDatabase extends Dexie {
  drinks!: Table<Omit<DrinkItem, 'style' | 'originMaterial' | 'agingNote'>, string>;
  logs!: Table<DrinkLog, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      drinks:
        'id, type, name, producer, country, region, wineColor, baseSpirit, purchaseDate, purchaseSource, wantAgain, updatedAt',
      logs: 'id, drinkId, date, scene, place, rating, updatedAt',
    });
  }
}

function createDrink(overrides: Partial<DrinkItem> = {}): DrinkItem {
  return {
    id: 'drink',
    type: 'wine',
    name: 'House Wine',
    producer: 'Producer',
    country: '意大利',
    region: '托斯卡纳',
    wineColor: '红',
    grapes: ['桑娇维塞'],
    body: '中等',
    sweetness: '干型',
    acidity: '中',
    tannin: '中',
    decantingNote: '',
    style: '',
    originMaterial: '',
    agingNote: '',
    recipe: '',
    method: '',
    glassware: '',
    ice: '',
    garnish: '',
    flavorTags: ['樱桃'],
    purchaseDate: '2026-01-01',
    purchaseSource: '酒商',
    notes: '',
    wantAgain: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function createLegacyDrink(
  overrides: Partial<Omit<DrinkItem, 'style' | 'originMaterial' | 'agingNote'>> = {},
): Omit<DrinkItem, 'style' | 'originMaterial' | 'agingNote'> {
  const { style: _style, originMaterial: _originMaterial, agingNote: _agingNote, ...drink } = createDrink(overrides as Partial<DrinkItem>);
  return drink;
}

function createLog(overrides: Partial<DrinkLog> = {}): DrinkLog {
  return {
    id: 'log',
    drinkId: 'drink',
    date: '2026-01-02',
    scene: '晚餐',
    place: '家里',
    pairing: '牛排',
    rating: 4,
    aroma: 3,
    palate: 4,
    finish: 3,
    notes: '',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  };
}
