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
