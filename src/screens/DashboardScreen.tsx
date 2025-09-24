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
