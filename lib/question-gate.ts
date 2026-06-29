export const QUESTION_COUNT_KEY = 'mra_question_count';
export const FREE_QUESTION_LIMIT = 5;

export const GATE_MESSAGE =
  "You've used your 5 free questions. Sign in free to keep going — it only takes a second.";

export function getQuestionCount(): number {
  if (typeof window === 'undefined') return 0;
  const raw = localStorage.getItem(QUESTION_COUNT_KEY);
  const n = parseInt(raw ?? '0', 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function incrementQuestionCount(): number {
  const next = getQuestionCount() + 1;
  localStorage.setItem(QUESTION_COUNT_KEY, String(next));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mra_question_count_changed'));
  }
  return next;
}

export function getFreeQuestionsLeft(count = getQuestionCount()): number {
  return Math.max(0, FREE_QUESTION_LIMIT - count);
}

export function isQuestionLimitReached(count = getQuestionCount()): boolean {
  return count >= FREE_QUESTION_LIMIT;
}
