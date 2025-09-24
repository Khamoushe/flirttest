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
