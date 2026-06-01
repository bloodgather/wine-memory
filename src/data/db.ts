import Dexie, { type Table } from 'dexie';
import type { DrinkItem, DrinkLog } from '../types';

export class WineDatabase extends Dexie {
  drinks!: Table<DrinkItem, string>;
  logs!: Table<DrinkLog, string>;

  constructor(name = 'wine-memory') {
    super(name);
    this.version(1).stores({
      drinks:
        'id, type, name, producer, country, region, wineColor, baseSpirit, purchaseDate, purchaseSource, wantAgain, updatedAt',
      logs: 'id, drinkId, date, scene, place, rating, updatedAt',
    });
  }
}

export const db = new WineDatabase();
