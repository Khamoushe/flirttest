import AsyncStorage from '@react-native-async-storage/async-storage';
import { Thread } from './types';

const KEY = 'flirtassist:threads:v1';

export async function loadThreads(): Promise<Thread[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as Thread[]; } catch { return []; }
}

export async function saveThreads(list: Thread[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function upsertThread(t: Thread) {
  const all = await loadThreads();
  const idx = all.findIndex(x => x.id === t.id);
  if (idx >= 0) all[idx] = t; else all.unshift(t);
  await saveThreads(all);
}

export async function getThread(id: string) {
  const all = await loadThreads();
  return all.find(x => x.id === id) ?? null;
}

export async function deleteThread(id: string) {
  const all = await loadThreads();
  await saveThreads(all.filter(x => x.id !== id));
}
