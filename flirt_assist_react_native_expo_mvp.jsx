// =============================
// FlirtAssist – React Native (Expo) MVP
// Senior full‑stack mobile scaffolding
// =============================
// Notes:
// - Expo (managed). Android first. iOS later.
// - Styling via NativeWind (Tailwind RN).
// - Navigation via React Navigation.
// - Local storage via AsyncStorage.
// - OCR strategy: pick a Screenshot from gallery → send to Make.com for OCR+GPT.
//   (Optional local OCR stub left in place; replace later with ML Kit/Tesseract native module.)
// - Clean, modular API layer so Make.com can be swapped for a custom backend later.
// - History sync: local first; optional sync with backend via Make.com webhook.
// - All files below are concatenated; create them in your project with same paths.

// -----------------------------
// package.json
// -----------------------------
{
  "name": "flirtassist",
  "version": "0.1.0",
  "private": true,
  "main": "index.js",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "lint": "eslint ."
  },
  "dependencies": {
    "expo": "~51.0.18",
    "expo-image-manipulator": "~12.0.2",
    "expo-image-picker": "~16.0.4",
    "expo-media-library": "~16.0.4",
    "expo-status-bar": "~1.12.1",
    "react": "18.2.0",
    "react-native": "0.74.3",
    "@react-navigation/native": "^6.1.17",
    "@react-navigation/native-stack": "^6.9.26",
    "react-native-safe-area-context": "^4.10.5",
    "react-native-screens": "^3.31.1",
    "@react-native-async-storage/async-storage": "^1.23.1",
    "nativewind": "^4.0.36",
    "clsx": "^2.1.1",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "tailwindcss": "^3.4.9",
    "typescript": "^5.4.5",
    "eslint": "^8.57.0",
    "@types/react": "^18.2.66",
    "@types/react-native": "^0.73.0"
  }
}

// -----------------------------
// app.json (or app.config.ts if you prefer)
// -----------------------------
{
  "expo": {
    "name": "FlirtAssist",
    "slug": "flirtassist",
    "scheme": "flirtassist",
    "version": "0.1.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": { "image": "./assets/splash.png", "resizeMode": "contain", "backgroundColor": "#0f172a" },
    "updates": { "fallbackToCacheTimeout": 0 },
    "assetBundlePatterns": ["**/*"],
    "android": {
      "package": "com.nexure.flirtassist",
      "permissions": ["READ_MEDIA_IMAGES"],
      "adaptiveIcon": { "foregroundImage": "./assets/adaptive-icon.png", "backgroundColor": "#0f172a" }
    }
  }
}

// -----------------------------
// babel.config.js
// -----------------------------
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["nativewind/babel"]
  };
};

// -----------------------------
// tailwind.config.js
// -----------------------------
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#0b1220",
          card: "#111827",
          accent: "#7c3aed"
        }
      }
    }
  },
  plugins: []
};

// -----------------------------
// index.js (entry for Expo)
// -----------------------------
import { registerRootComponent } from 'expo';
import App from './App';
registerRootComponent(App);

// -----------------------------
// App.tsx
// -----------------------------
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation';

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#0b1220' }
};

export default function App() {
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <RootNavigator />
    </NavigationContainer>
  );
}

// -----------------------------
// src/navigation/index.tsx
// -----------------------------
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ConversationScreen from '../screens/ConversationScreen';

export type RootStackParamList = {
  Dashboard: undefined;
  History: undefined;
  Conversation: { threadId?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="Conversation" component={ConversationScreen} />
    </Stack.Navigator>
  );
}

// -----------------------------
// src/lib/types.ts
// -----------------------------
export type Mood = 'Funny' | 'Romantic' | 'Mysterious' | 'Sexy';

export type Suggestion = {
  id: string;
  text: string;
  mood: Mood;
  createdAt: number;
};

export type Message = {
  id: string;
  role: 'user' | 'other' | 'assistant';
  text: string;
  ts: number;
};

export type Thread = {
  id: string;
  title: string;
  mood: Mood;
  context: Message[]; // full convo context (ordered)
  suggestions?: Suggestion[];
  updatedAt: number;
  createdAt: number;
  remoteSynced?: boolean;
};

// -----------------------------
// src/lib/storage.ts – local history via AsyncStorage
// -----------------------------
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

// -----------------------------
// src/lib/api.ts – Make.com webhook client (modular)
// -----------------------------
/**
 * Replace MAKE_WEBHOOK_URL with your Make.com custom webhook URL.
 * Expected Make.com behavior:
 *  - Receive { imageBase64?, text?, mood, thread }.
 *  - If image provided: do OCR (either in Make.com or via 3rd-party OCR API),
 *    extract text, merge with thread context, call OpenAI GPT-4o-mini, return 3 suggestions.
 *  - Response shape: { suggestions: string[], ocrText?: string, title?: string }
 */
const MAKE_WEBHOOK_URL = 'https://hook.integromat.com/REPLACE_ME';

import { Thread, Mood } from './types';

export async function requestSuggestions(params: {
  imageBase64?: string; // screenshot optional
  text?: string;        // raw text (if OCR already done)
  mood: Mood;
  thread?: Thread | null;
}): Promise<{ suggestions: string[]; ocrText?: string; title?: string }>
{
  const res = await fetch(MAKE_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Make.com request failed: ${res.status} ${msg}`);
  }
  return res.json();
}

// -----------------------------
// src/lib/ocr.ts – Screenshot import & OCR (stub + gallery picker)
// -----------------------------
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

/**
 * Prompts the user to pick a recent screenshot from the gallery.
 * Tip: On Android, screenshots typically live in an album named "Screenshots".
 */
export async function pickScreenshotFromGallery(): Promise<{ base64?: string, uri?: string } | null> {
  // Request permissions
  const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!libPerm.granted) return null;

  // Try to open the Screenshots album first
  try {
    const album = await MediaLibrary.getAlbumAsync('Screenshots');
    if (album) {
      const assets = await MediaLibrary.getAssetsAsync({ album: album.id, sortBy: [[MediaLibrary.SortBy.creationTime, false]], first: 50, mediaType: 'photo' });
      // Fallback to generic picker if no assets
      if (assets.assets.length > 0) {
        // Manually open picker restricted to images (Expo ImagePicker cannot filter by album yet)
        // So show recent images and let user choose – we will still allow any image.
      }
    }
  } catch {}

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    base64: true,
    quality: 0.8
  });
  if (result.canceled) return null;
  const asset = result.assets?.[0];
  return { base64: asset?.base64, uri: asset?.uri };
}

/**
 * Local OCR stub (TODO): integrate ML Kit or Tesseract when ejecting to bare RN.
 * For Expo managed, rely on Make.com/remote OCR for now.
 */
export async function localOcrExtract(_uri: string): Promise<string | null> {
  // TODO: Implement native OCR integration (ML Kit / Tesseract) once we move to bare/react-native.
  return null;
}

// -----------------------------
// src/hooks/useSuggestions.ts – encapsulate suggest flow
// -----------------------------
import { useState, useCallback } from 'react';
import { getThread, upsertThread } from '../lib/storage';
import { Thread, Suggestion, Mood } from '../lib/types';
import { requestSuggestions } from '../lib/api';

export function useSuggestions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggest = useCallback(async (opts: {
    mood: Mood;
    threadId?: string;
    imageBase64?: string;
    textOverride?: string; // if you already have extracted text
  }) => {
    setLoading(true); setError(null);
    try {
      const thread = opts.threadId ? await getThread(opts.threadId) : null;
      const res = await requestSuggestions({
        imageBase64: opts.imageBase64,
        text: opts.textOverride,
        mood: opts.mood,
        thread: thread ?? undefined
      });

      // Build suggestions and update thread
      const now = Date.now();
      const suggestions: Suggestion[] = (res.suggestions || []).map((text, i) => ({ id: `${now}-${i}`, text, mood: opts.mood, createdAt: now }));

      let newThread: Thread;
      if (thread) {
        newThread = { ...thread, suggestions, updatedAt: now };
      } else {
        newThread = {
          id: `${now}`,
          title: res.title || 'New Conversation',
          mood: opts.mood,
          context: [],
          suggestions,
          createdAt: now,
          updatedAt: now
        };
      }
      await upsertThread(newThread);
      return { thread: newThread, ocrText: res.ocrText };
    } catch (e: any) {
      setError(e?.message || 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { suggest, loading, error };
}

// -----------------------------
// src/components/MoodSelector.tsx
// -----------------------------
import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { Mood } from '../lib/types';

const moods: Mood[] = ['Funny', 'Romantic', 'Mysterious', 'Sexy'];

export default function MoodSelector({ value, onChange }: { value: Mood; onChange: (m: Mood) => void; }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {moods.map((m) => (
        <Pressable
          key={m}
          onPress={() => onChange(m)}
          className={`px-3 py-2 rounded-xl ${value === m ? 'bg-base-accent' : 'bg-base-card'} border border-white/10`}
        >
          <Text className="text-white font-semibold">{m}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// -----------------------------
// src/components/SuggestionCard.tsx
// -----------------------------
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export default function SuggestionCard({ text, onUse }: { text: string; onUse?: () => void }) {
  const copy = async () => {
    await Clipboard.setStringAsync(text);
    onUse?.();
  };
  return (
    <Pressable onPress={copy} className="bg-base-card rounded-2xl p-4 border border-white/10 active:opacity-80">
      <Text className="text-white text-base leading-6">{text}</Text>
      <Text className="text-white/50 text-xs mt-2">Tap to copy</Text>
    </Pressable>
  );
}

// -----------------------------
// src/screens/DashboardScreen.tsx
// -----------------------------
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import MoodSelector from '../components/MoodSelector';
import { Mood, Thread } from '../lib/types';
import { loadThreads } from '../lib/storage';
import { pickScreenshotFromGallery } from '../lib/ocr';
import { useSuggestions } from '../hooks/useSuggestions';

export default function DashboardScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Dashboard'>) {
  const [mood, setMood] = useState<Mood>('Funny');
  const [recent, setRecent] = useState<Thread[]>([]);
  const { suggest, loading } = useSuggestions();

  useEffect(() => {
    (async () => {
      setRecent(await loadThreads());
    })();
  }, []);

  const startFromScreenshot = async () => {
    const picked = await pickScreenshotFromGallery();
    if (!picked?.base64) {
      Alert.alert('No image', 'Please select a screenshot image.');
      return;
    }
    const res = await suggest({ mood, imageBase64: picked.base64 });
    if (res?.thread) navigation.navigate('Conversation', { threadId: res.thread.id });
  };

  return (
    <ScrollView className="flex-1 bg-base-bg" contentContainerStyle={{ padding: 16 }}>
      <Text className="text-white text-2xl font-bold mb-2">FlirtAssist</Text>
      <Text className="text-white/70 mb-6">Pick a mood, import your chat screenshot, get 3 smart replies. Android first.</Text>

      <Text className="text-white mb-2 font-semibold">Mood</Text>
      <MoodSelector value={mood} onChange={setMood} />

      <Pressable
        onPress={startFromScreenshot}
        disabled={loading}
        className={`mt-6 rounded-2xl px-4 py-3 items-center ${loading ? 'bg-white/20' : 'bg-base-accent'}`}
      >
        <Text className="text-white text-base font-semibold">{loading ? 'Thinking…' : 'Import Screenshot & Get Replies'}</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('History')}
        className="mt-4 rounded-2xl px-4 py-3 items-center bg-base-card border border-white/10"
      >
        <Text className="text-white text-base">Open History</Text>
      </Pressable>

      <Text className="text-white text-lg font-semibold mt-8 mb-3">Recent Threads</Text>
      <View className="gap-3">
        {recent.slice(0, 5).map((t) => (
          <Pressable key={t.id} className="bg-base-card p-4 rounded-2xl border border-white/10" onPress={() => navigation.navigate('Conversation', { threadId: t.id })}>
            <Text className="text-white font-semibold">{t.title}</Text>
            <Text className="text-white/60 text-xs mt-1">Mood: {t.mood} • Updated {new Date(t.updatedAt).toLocaleString()}</Text>
          </Pressable>
        ))}
        {recent.length === 0 && (
          <Text className="text-white/60">No conversations yet. Import a screenshot to start.</Text>
        )}
      </View>

      <View className="mt-10 p-3 rounded-xl border border-white/10">
        <Text className="text-white font-semibold mb-1">TODOs / Roadmap</Text>
        <Text className="text-white/70 text-sm">• Auto-detect new screenshots (Android MediaStore observer) – requires bare RN/native module.\n• Floating overlay bubble to paste suggestions – requires SYSTEM_ALERT_WINDOW.\n• Local OCR via ML Kit – add native module.\n• iOS build + Photos permissions.\n• Auth + cloud sync via Supabase/Firebase.</Text>
      </View>
    </ScrollView>
  );
}

// -----------------------------
// src/screens/HistoryScreen.tsx
// -----------------------------
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { loadThreads, deleteThread } from '../lib/storage';
import { Thread } from '../lib/types';

export default function HistoryScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'History'>) {
  const [items, setItems] = useState<Thread[]>([]);

  const refresh = async () => setItems(await loadThreads());
  useEffect(() => { refresh(); }, []);

  const remove = async (id: string) => {
    await deleteThread(id);
    await refresh();
  };

  return (
    <ScrollView className="flex-1 bg-base-bg" contentContainerStyle={{ padding: 16 }}>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-white text-2xl font-bold">History</Text>
        <Pressable onPress={() => navigation.goBack()} className="px-3 py-2 rounded-xl bg-base-card border border-white/10">
          <Text className="text-white">Back</Text>
        </Pressable>
      </View>

      {items.map((t) => (
        <View key={t.id} className="bg-base-card p-4 rounded-2xl border border-white/10 mb-3">
          <Pressable onPress={() => navigation.navigate('Conversation', { threadId: t.id })}>
            <Text className="text-white font-semibold">{t.title}</Text>
            <Text className="text-white/60 text-xs mt-1">Mood: {t.mood} • {new Date(t.updatedAt).toLocaleString()}</Text>
          </Pressable>
          <View className="flex-row gap-2 mt-3">
            <Pressable onPress={() => remove(t.id)} className="px-3 py-2 rounded-xl bg-red-600/70">
              <Text className="text-white text-sm">Delete</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {items.length === 0 && <Text className="text-white/60">Nothing here yet.</Text>}
    </ScrollView>
  );
}

// -----------------------------
// src/screens/ConversationScreen.tsx
// -----------------------------
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { getThread, upsertThread } from '../lib/storage';
import { Message, Thread } from '../lib/types';
import SuggestionCard from '../components/SuggestionCard';
import { useSuggestions } from '../hooks/useSuggestions';

export default function ConversationScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'Conversation'>) {
  const { threadId } = route.params || {};
  const [thread, setThread] = useState<Thread | null>(null);
  const [input, setInput] = useState('');
  const { suggest, loading } = useSuggestions();

  useEffect(() => {
    (async () => {
      if (!threadId) return;
      const t = await getThread(threadId);
      setThread(t);
    })();
  }, [threadId]);

  const addUserMessage = async () => {
    if (!thread || !input.trim()) return;
    const msg: Message = { id: `${Date.now()}`, role: 'user', text: input.trim(), ts: Date.now() };
    const updated: Thread = { ...thread, context: [...thread.context, msg], updatedAt: Date.now() };
    await upsertThread(updated);
    setThread(updated);
    setInput('');
  };

  const regenerate = async () => {
    if (!thread) return;
    const res = await suggest({ mood: thread.mood, threadId: thread.id, textOverride: undefined });
    if (res?.thread) setThread(res.thread);
  };

  if (!thread) {
    return (
      <View className="flex-1 bg-base-bg items-center justify-center">
        <Text className="text-white/70">Loading…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-base-bg" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-white text-xl font-bold">{thread.title}</Text>
          <Pressable onPress={() => navigation.goBack()} className="px-3 py-2 rounded-xl bg-base-card border border-white/10">
            <Text className="text-white">Back</Text>
          </Pressable>
        </View>
        <Text className="text-white/60 text-xs mb-4">Mood: {thread.mood}</Text>

        <Text className="text-white font-semibold mb-2">Context</Text>
        <View className="gap-2">
          {thread.context.map((m) => (
            <View key={m.id} className={`p-3 rounded-xl ${m.role === 'user' ? 'bg-base-accent/30' : 'bg-base-card'} border border-white/10`}>
              <Text className="text-white/80 text-xs mb-1">{m.role.toUpperCase()}</Text>
              <Text className="text-white">{m.text}</Text>
            </View>
          ))}
          {thread.context.length === 0 && (
            <Text className="text-white/60">No context yet. Add your last message to steer the suggestions.</Text>
          )}
        </View>

        <Text className="text-white font-semibold mt-6 mb-2">Suggestions</Text>
        <View className="gap-3">
          {thread.suggestions?.map(s => (
            <SuggestionCard key={s.id} text={s.text} onUse={() => { /* clipboard handled inside */ }} />
          ))}
          {!thread.suggestions?.length && (
            <Text className="text-white/60">No suggestions yet. Tap Regenerate.</Text>
          )}
        </View>

        <Pressable onPress={regenerate} disabled={loading} className={`mt-4 rounded-2xl px-4 py-3 items-center ${loading ? 'bg-white/20' : 'bg-base-accent'}`}>
          <Text className="text-white font-semibold">{loading ? 'Thinking…' : 'Regenerate Suggestions'}</Text>
        </Pressable>

        <View className="mt-8">
          <Text className="text-white font-semibold mb-2">Add to Context</Text>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type your last message or her/his reply…"
            placeholderTextColor="#94a3b8"
            multiline
            className="text-white bg-base-card border border-white/10 rounded-2xl p-3 min-h-[80px]"
          />
          <Pressable onPress={addUserMessage} className="mt-3 rounded-2xl px-4 py-3 items-center bg-base-card border border-white/10">
            <Text className="text-white">Save to Context</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// -----------------------------
// README (setup & operations)
// -----------------------------
/**
# FlirtAssist – MVP Setup

## 1) Create project
```bash
npx create-expo-app flirtassist -t expo-template-blank-typescript
cd flirtassist
```

## 2) Add deps
```bash
npm i @react-native-async-storage/async-storage @react-navigation/native @react-navigation/native-stack react-native-safe-area-context react-native-screens nativewind clsx zod expo-image-picker expo-media-library expo-image-manipulator expo-status-bar
npm i -D tailwindcss @babel/core typescript eslint
```

## 3) Tailwind / NativeWind
- Add `babel.config.js` with `nativewind/babel` plugin.
- Add `tailwind.config.js` (see above) and create `global.css` if using className on web (optional).

## 4) Permissions (Android)
- Expo will prompt for Photos/Media. Ensure `READ_MEDIA_IMAGES` in `app.json`.

## 5) Make.com Webhook
- Create a custom webhook in Make.
- In the scenario: HTTP → (optional) OCR module → OpenAI (GPT‑4o‑mini) → Return JSON `{ suggestions: string[], ocrText?: string, title?: string }`.
- Paste the webhook URL into `src/lib/api.ts`.

## 6) Run
```bash
npm run start
```

## OCR Integration Notes
- **Current flow**: user manually picks a Screenshot from gallery. The image (base64) is posted to Make.com which performs OCR + GPT.
- **Local OCR (later)**: integrate ML Kit or Tesseract with a bare RN app (not Expo managed). Replace `localOcrExtract` and switch API to send text only.
- **Auto-detect screenshots (later)**: implement a native Android MediaStore observer (ContentObserver) service; not available in Expo managed. Stubbed in TODOs.

## Data Model & Sync
- Local-first via AsyncStorage (`src/lib/storage.ts`).
- Optional: in Make.com, push threads to Supabase/Firebase; add a thin sync layer later.

*/
