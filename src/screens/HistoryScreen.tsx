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
