import fs from 'fs';
import path from 'path';
import type { AppData } from './types';

const DATA_FILE = path.join(process.cwd(), 'registrations.json');

export function loadData(): AppData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as AppData;
    }
  } catch (e) {
    console.error('Load error:', (e as Error).message);
  }
  return { registrations: [], otps: {} };
}

export function saveData(data: AppData): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Save error:', (e as Error).message);
  }
}
