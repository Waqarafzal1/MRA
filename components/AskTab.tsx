'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Lang, ChatMessage } from '@/lib/types';
import { T } from '@/lib/translations';

const PHONE_KEY = 'mra_user_phone';

const CATEGORIES = [
  { icon: '🚔', en: 'Police & FIR',       ur: 'پولیس / ایف آئی آر', qEn: 'Police and FIR rights in Pakistan',          qUr: 'پاکستان میں پولیس اور ایف آئی آر کے حقوق' },
  { icon: '👨‍👩‍👧', en: 'Family Law',        ur: 'خاندانی قانون',       qEn: 'Family law rights in Pakistan',               qUr: 'پاکستان میں خاندانی قانون کے حقوق' },
  { icon: '🏠', en: 'Property & Rent',    ur: 'جائیداد / کرایہ',     qEn: 'Property and rent rights in Pakistan',        qUr: 'پاکستان میں جائیداد اور کرایہ کے حقوق' },
  { icon: '👷', en: 'Labour Rights',      ur: 'مزدور حقوق',          qEn: 'Labour and worker rights in Pakistan',        qUr: 'پاکستان میں مزدور حقوق' },
  { icon: '🛒', en: 'Consumer Rights',    ur: 'صارف حقوق',           qEn: 'Consumer protection rights in Pakistan',      qUr: 'پاکستان میں صارف تحفظ کے حقوق' },
  { icon: '📜', en: 'Inheritance',        ur: 'وراثت',               qEn: 'Inheritance and wiraasat rights in Pakistan', qUr: 'پاکستان میں وراثت کے حقوق' },
  { icon: '🔓', en: 'Bail & Arrest',      ur: 'ضمانت / گرفتاری',    qEn: 'Bail and arrest rights in Pakistan',          qUr: 'پاکستان میں ضمانت اور گرفتاری کے حقوق' },
  { icon: '💍', en: 'Marriage & Divorce', ur: 'نکاح / طلاق',         qEn: 'Marriage and divorce rights in Pakistan',     qUr: 'پاکستان میں نکاح اور طلاق کے حقوق' },
  { icon: '💻', en: 'Cybercrime',         ur: 'سائبر کرائم',          qEn: 'Cybercrime laws in Pakistan',                 qUr: 'پاکستان میں سائبر کرائم کے قوانین' },
  { icon: '👩', en: "Women's Rights",     ur: 'خواتین کے حقوق',      qEn: 'Women rights and protection laws in Pakistan', qUr: 'پاکستان میں خواتین کے حقوق اور تحفظ' },
  { icon: '📚', en: 'Education Rights',   ur: 'تعلیم کے حقوق',       qEn: 'Education rights in Pakistan',                qUr: 'پاکستان میں تعلیم کے حقوق' },
  { icon: '🚗', en: 'Traffic Law',        ur: 'ٹریفک قانون',          qEn: 'Traffic laws and fines in Pakistan',          qUr: 'پاکستان میں ٹریفک قوانین اور جرمانے' },
];

const CHIPS = [
  'Can police refuse my FIR?',
  'How do I get bail?',
  "My landlord won't return my deposit",
  'میری وراثت کا حق کیا ہے؟',
  'What is minimum wage in Pakistan?',
  'پولیس نے بغیر وجہ گرفتار کیا',
];

function TypingDots() {
  return (
    <div className="flex gap-1 items-center py-1">
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce-dot" />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce-dot-2" />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce-dot-3" />
    </div>
  );
}

function PhoneModal({
  lang,
  onSave,
  onSkip,
}: {
  lang: Lang;
  onSave: (phone: string) => void;
  onSkip: () => void;
}) {
  const [val, setVal] = useState('');
  const isUr = lang === 'ur';
  const handleSave = () => {
    if (val.trim()) onSave(val.trim());
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="text-3xl text-center mb-2">📱</div>
        <h3
          className="font-bold text-gray-800 text-center text-base mb-1"
          dir={isUr ? 'rtl' : 'ltr'}
        >
          {isUr ? 'گفتگو محفوظ کریں' : 'Save Your Chat History'}
        </h3>
        <p
          className="text-xs text-gray-500 text-center mb-4 leading-relaxed"
          dir={isUr ? 'rtl' : 'ltr'}
        >
          {isUr
            ? 'اپنا فون نمبر ایک بار درج کریں تاکہ گفتگو محفوظ رہے'
            : 'Enter your phone number once to keep your conversation across sessions.'}
        </p>
        <input
          type="tel"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="03XX-XXXXXXX"
          autoFocus
          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 mb-3 text-center tracking-widest"
          dir="ltr"
        />
        <button
          onClick={handleSave}
          disabled={!val.trim()}
          className="w-full bg-green-800 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed mb-2"
        >
          {isUr ? 'محفوظ کریں ✓' : 'Save & Load History'}
        </button>
        <button
          onClick={onSkip}
          className="w-full text-gray-400 text-xs py-1.5 hover:text-gray-600 transition-colors"
        >
          {isUr ? 'ابھی نہیں' : "Skip — chat won't be saved"}
        </button>
      </div>
    </div>
  );
}

export default function AskTab({ lang }: { lang: Lang }) {
  const t = T[lang];
  const isUr = lang === 'ur';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollDown = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  useEffect(() => { scrollDown(); }, [messages, scrollDown]);

  // Read phone from localStorage — runs only on the client after hydration
  useEffect(() => {
    const stored = localStorage.getItem(PHONE_KEY);
    if (stored) {
      setPhone(stored);
    } else {
      setShowPhoneModal(true);
    }
  }, []);

  // Fetch chat history once we have a phone number
  useEffect(() => {
    if (!phone || historyLoaded) return;
    setHistoryLoaded(true);
    fetch(`/api/chat-history?phone=${encodeURIComponent(phone)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          const loaded: ChatMessage[] = data.messages.flatMap(
            (m: { id: string; question: string; response: string }) => [
              { id: `${m.id}-q`, role: 'user' as const, text: m.question },
              { id: `${m.id}-r`, role: 'bot' as const, text: m.response },
            ],
          );
          setMessages(loaded);
        }
      })
      .catch(() => {}); // history load failure is non-fatal
  }, [phone, historyLoaded]);

  const savePhone = useCallback((p: string) => {
    localStorage.setItem(PHONE_KEY, p);
    setPhone(p);
    setShowPhoneModal(false);
    setHistoryLoaded(false); // re-triggers history fetch for the new number
  }, []);

  const sendMessage = useCallback(
    async (text?: string) => {
      const q = (text ?? input).trim();
      if (!q || loading) return;
      setInput('');

      const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: q };
      const botId = (Date.now() + 1).toString();
      const botMsg: ChatMessage = { id: botId, role: 'bot', text: '', streaming: true };

      setMessages((prev) => [...prev, userMsg, botMsg]);
      setLoading(true);

      try {
        const res = await fetch('/api/ask-simple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: q, lang, phone: phone ?? undefined }),
        });
        const data = await res.json();

        if (!res.ok || data.error) throw new Error(data.error || 'Request failed');

        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId ? { ...m, text: data.response, streaming: false } : m,
          ),
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId ? { ...m, text: t.errorMsg, streaming: false } : m,
          ),
        );
      } finally {
        setLoading(false);
        setMessages((prev) =>
          prev.map((m) => (m.id === botId ? { ...m, streaming: false } : m)),
        );
        inputRef.current?.focus();
      }
    },
    [input, lang, loading, phone, t.errorMsg],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className={isUr ? 'font-urdu' : ''}>
      {/* Phone number modal — shown once on first visit */}
      {showPhoneModal && (
        <PhoneModal lang={lang} onSave={savePhone} onSkip={() => setShowPhoneModal(false)} />
      )}

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-2.5 my-3 flex gap-2 items-start text-xs text-yellow-800">
        <span>⚠️</span>
        <span dir={isUr ? 'rtl' : 'ltr'}>{t.disclaimer}</span>
      </div>

      {/* Browse label + phone settings pill */}
      <div className="flex items-center justify-between mb-2" dir={isUr ? 'rtl' : 'ltr'}>
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          {t.browseLabel}
        </div>
        {phone ? (
          <button
            onClick={() => setShowPhoneModal(true)}
            className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
            title={isUr ? 'فون نمبر تبدیل کریں' : 'Change phone number'}
          >
            📱 {phone} ⚙
          </button>
        ) : (
          <button
            onClick={() => setShowPhoneModal(true)}
            className="text-[10px] text-green-700 hover:text-green-800 transition-colors"
          >
            📱 {isUr ? 'تاریخ محفوظ کریں' : 'Save history'}
          </button>
        )}
      </div>

      {/* Categories grid */}
      <div className="grid grid-cols-3 gap-1.5" dir={isUr ? 'rtl' : 'ltr'}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.en}
            onClick={() => sendMessage(isUr ? cat.qUr : cat.qEn)}
            className="bg-white border-2 border-gray-200 rounded-xl py-2.5 px-1.5 cursor-pointer text-center text-xs font-semibold text-gray-700 hover:border-green-500 hover:bg-green-100 hover:text-green-800 transition-all focus:outline-none focus:border-green-500"
          >
            <span className="text-lg block mb-0.5">{cat.icon}</span>
            {isUr ? cat.ur : cat.en}
          </button>
        ))}
      </div>

      {/* Ask label */}
      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-4 mb-3">
        {t.askLabel}
      </div>

      {/* Chat area */}
      <div className="flex flex-col gap-3 pb-32">
        {/* Welcome bubble — shown only when there are no messages */}
        {messages.length === 0 && (
          <div
            className="max-w-[88%] bg-white border-2 border-gray-200 rounded-2xl rounded-bl-sm p-3.5"
            dir={isUr ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-green-800 mb-1.5">
              ⚖️ {t.botName}
              <span className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded-full">
                AI
              </span>
            </div>
            <h2 className="text-sm font-bold text-green-800 mb-1.5">{t.welcomeTitle}</h2>
            <p className="text-xs text-gray-600 leading-relaxed">{t.welcomeText}</p>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setInput(chip);
                    inputRef.current?.focus();
                  }}
                  className="bg-green-100 text-green-800 border border-green-200 text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer hover:bg-green-800 hover:text-white transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg) =>
          msg.role === 'user' ? (
            <div
              key={msg.id}
              className="max-w-[88%] ml-auto bg-green-800 text-white px-3.5 py-3 text-sm leading-relaxed rounded-2xl rounded-br-sm"
              dir={isUr ? 'rtl' : 'ltr'}
            >
              {msg.text}
            </div>
          ) : (
            <div
              key={msg.id}
              className="max-w-[88%] bg-white border-2 border-gray-200 rounded-2xl rounded-bl-sm px-3.5 py-3"
              dir={isUr ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-green-800 mb-1.5">
                ⚖️ {t.botName}
                <span className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded-full">
                  AI
                </span>
              </div>
              {msg.text ? (
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {msg.text}
                  {msg.streaming && (
                    <span className="inline-block w-0.5 h-3.5 bg-green-800 ml-0.5 align-middle animate-blink" />
                  )}
                </div>
              ) : (
                <div>
                  <TypingDots />
                  <div className="text-[11px] text-gray-400 mt-1">{t.thinking}</div>
                </div>
              )}
            </div>
          ),
        )}
        <div ref={bottomRef} />
      </div>

      {/* Fixed input bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-3.5 py-2.5 z-40">
        <div className="max-w-[760px] mx-auto flex" dir={isUr ? 'rtl' : 'ltr'}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            maxLength={500}
            className={`flex-1 px-3.5 py-2.5 border-2 border-gray-200 text-sm text-gray-800 outline-none font-[inherit] ${
              isUr
                ? 'rounded-none rounded-r-xl border-r-2 border-l-0 text-right focus:border-green-500'
                : 'rounded-l-xl border-r-0 focus:border-green-500'
            }`}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading}
            className={`bg-green-800 text-white px-4 py-2.5 text-lg cursor-pointer hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed ${
              isUr ? 'rounded-none rounded-l-xl' : 'rounded-r-xl'
            }`}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
