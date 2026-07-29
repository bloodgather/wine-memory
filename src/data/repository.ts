import { db, type WineDatabase } from './db';
import type { DrinkItem, DrinkLog, WineBackup } from '../types';

export interface WineRepository {
  listDrinks(): Promise<DrinkItem[]>;
  listLogs(): Promise<DrinkLog[]>;
  listLogsForDrink(drinkId: string): Promise<DrinkLog[]>;
  saveDrink(drink: DrinkItem): Promise<void>;
  saveLog(log: DrinkLog): Promise<void>;
  deleteDrink(drinkId: string): Promise<void>;
  deleteLog(logId: string): Promise<void>;
  exportBackup(): Promise<WineBackup>;
  importBackup(backup: WineBackup): Promise<void>;
  clearAll(): Promise<void>;
}

export function createWineRepository(database: WineDatabase = db): WineRepository {
  return {
    async listDrinks() {
      return database.drinks.orderBy('updatedAt').reverse().toArray();
    },
    async listLogs() {
      return database.logs.orderBy('date').reverse().toArray();
    },
    async listLogsForDrink(drinkId) {
      return database.logs.where('drinkId').equals(drinkId).reverse().sortBy('date');
    },
    async saveDrink(drink) {
      await database.drinks.put(drink);
    },
    async saveLog(log) {
      await database.logs.put(log);
    },
    async deleteDrink(drinkId) {
      await database.transaction('rw', database.drinks, database.logs, async () => {
        await database.logs.where('drinkId').equals(drinkId).delete();
        await database.drinks.delete(drinkId);
      });
    },
    async deleteLog(logId) {
      await database.logs.delete(logId);
    },
    async exportBackup() {
      const [drinks, logs] = await Promise.all([database.drinks.toArray(), database.logs.toArray()]);
      return {
        version: 1,
        exportedAt: new Date().toISOString(),
        drinks,
        logs,
      };
    },
    async importBackup(backup) {
      if (backup.version !== 1 || !Array.isArray(backup.drinks) || !Array.isArray(backup.logs)) {
        throw new Error('备份文件格式不支持');
      }
      await database.transaction('rw', database.drinks, database.logs, async () => {
        await database.drinks.clear();
        await database.logs.clear();
        await database.drinks.bulkPut(backup.drinks.map(normalizeDrink));
        await database.logs.bulkPut(backup.logs);
      });
    },
    async clearAll() {
      await database.transaction('rw', database.drinks, database.logs, async () => {
        await database.logs.clear();
        await database.drinks.clear();
      });
    },
  };
}

export const wineRepository = createWineRepository();

function normalizeDrink(drink: DrinkItem): DrinkItem {
  return {
    ...drink,
    grapes: drink.grapes ?? [],
    decantingNote: drink.decantingNote ?? '',
    style: drink.style ?? '',
    originMaterial: drink.originMaterial ?? '',
    agingNote: drink.agingNote ?? '',
    recipe: drink.recipe ?? '',
    method: drink.method ?? '',
    glassware: drink.glassware ?? '',
    ice: drink.ice ?? '',
    garnish: drink.garnish ?? '',
    flavorTags: drink.flavorTags ?? [],
    notes: drink.notes ?? '',
  };
}
