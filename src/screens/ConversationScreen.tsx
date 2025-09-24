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
