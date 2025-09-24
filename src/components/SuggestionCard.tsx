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
