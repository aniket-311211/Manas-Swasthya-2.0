import { request } from './api';
import type { AiChatResult, NextQuestionResult, AnalyzeResult } from '@/types/api';
import type { MoodAnalysis } from '@/features/journal/types';
import type { Answer, AssessmentScores, Domain } from '@/features/assessment/domain';

export interface ChatContext {
  mood?: string;
  intention?: string;
  streak?: number;
}

export function aiChat(
  clerkId: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  language?: string,
  context?: ChatContext,
): Promise<AiChatResult> {
  return request<AiChatResult>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ clerkId, messages, language, context }),
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

export interface FollowUpQuestion {
  question: string;
  options: string[];
  domain: Domain;
}

/** Only the fields the server reads. `ms` and `itemId` are local business. */
const wire = (a: Answer) => ({ question: a.question, answer: a.answer, domain: a.domain, weight: a.weight });

/**
 * Same endpoint as `aiNextQuestion`, different job: the item bank has already
 * been answered, so the model only writes a few deeper probes into the domains
 * that scored lowest.
 */
export function aiFollowUps(clerkId: string, answers: Answer[]): Promise<{ questions: FollowUpQuestion[] }> {
  return request<{ questions: FollowUpQuestion[] }>('/ai/assessment', {
    method: 'POST',
    body: JSON.stringify({ clerkId, mode: 'followups', previousResponses: answers.map(wire) }),
  });
}

/**
 * The written reflection. Scores are computed locally and sent along only so
 * the prose agrees with the numbers on screen — the model does not return them.
 */
export function aiAssessmentSummary(
  clerkId: string,
  answers: Answer[],
  scores: AssessmentScores,
): Promise<{ summary: string; recommendations: string[] }> {
  return request<{ summary: string; recommendations: string[] }>('/ai/assessment', {
    method: 'POST',
    body: JSON.stringify({ clerkId, mode: 'summary', previousResponses: answers.map(wire), scores }),
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

/**
 * Same endpoint, richer shape: `shape: 'mood'` asks for the journal
 * MoodAnalysis instead of {sentiment, themes, gentleSuggestion}. `crisis` is
 * the server's own keyword scan of the text, not something the model decided.
 */
export function aiAnalyzeMood(
  clerkId: string,
  text: string,
): Promise<MoodAnalysis & { crisis: boolean }> {
  return request<MoodAnalysis & { crisis: boolean }>('/ai/analyze', {
    method: 'POST',
    body: JSON.stringify({ clerkId, text, kind: 'journal', shape: 'mood' }),
  });
}
