import { request } from './api';
import type { AiChatResult, NextQuestionResult, MedicineAiResult, AnalyzeResult } from '@/types/api';

export function aiChat(
  clerkId: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  language?: string,
): Promise<AiChatResult> {
  return request<AiChatResult>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ clerkId, messages, language }),
  });
}

export function aiNextQuestion(
  clerkId: string,
  previousResponses: { question: string; answer: string; domain: string }[],
): Promise<NextQuestionResult> {
  return request<NextQuestionResult>('/ai/assessment', {
    method: 'POST',
    body: JSON.stringify({ clerkId, previousResponses }),
  });
}

export function aiMedicine(clerkId: string, medicineName: string): Promise<MedicineAiResult> {
  return request<MedicineAiResult>('/ai/medicine', {
    method: 'POST',
    body: JSON.stringify({ clerkId, medicineName }),
  });
}

export function aiAnalyze(
  clerkId: string,
  text: string,
  kind: 'journal' | 'mood' | 'general' = 'general',
): Promise<AnalyzeResult> {
  return request<AnalyzeResult>('/ai/analyze', {
    method: 'POST',
    body: JSON.stringify({ clerkId, text, kind }),
  });
}
