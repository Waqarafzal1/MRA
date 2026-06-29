'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  FREE_QUESTION_LIMIT,
  getFreeQuestionsLeft,
  getQuestionCount,
  isQuestionLimitReached,
} from '@/lib/question-gate';

export function useQuestionGate() {
  const { userEmail } = useAuth();
  const signedIn = !!userEmail;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (signedIn) return;

    const sync = () => setCount(getQuestionCount());
    sync();

    window.addEventListener('mra_question_count_changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('mra_question_count_changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, [signedIn]);

  if (signedIn) {
    return {
      count: 0,
      freeLeft: null as number | null,
      atLimit: false,
      signedIn: true,
      limit: FREE_QUESTION_LIMIT,
    };
  }

  return {
    count,
    freeLeft: getFreeQuestionsLeft(count),
    atLimit: isQuestionLimitReached(count),
    signedIn: false,
    limit: FREE_QUESTION_LIMIT,
  };
}
