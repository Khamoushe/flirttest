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
