'use client';

import { useQuestionGate } from '@/lib/use-question-gate';
import { freeQuestionsLabel } from '@/lib/translations';
import { useLang } from '@/lib/lang-context';

export default function FreeQuestionsCounter() {
  const { lang, dir } = useLang();
  const { freeLeft, signedIn } = useQuestionGate();

  if (signedIn || freeLeft === null) return null;

  return (
    <p className="text-xs text-stone-500 mb-2" dir={dir}>
      {freeQuestionsLabel(lang, freeLeft)}
    </p>
  );
}
