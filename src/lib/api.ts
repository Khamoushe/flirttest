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
