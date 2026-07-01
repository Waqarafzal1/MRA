'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ComponentType } from 'react';
import {
  IconShieldHalf,
  IconUsersGroup,
  IconHome,
  IconTool,
  IconShoppingCart,
  IconScript,
  IconLock,
  IconHeart,
  IconDeviceLaptop,
  IconGenderFemale,
  IconBook,
  IconCar,
  IconSend2,
  IconAlertTriangle,
  IconDeviceMobile,
  IconScale,
  IconSettings,
} from '@tabler/icons-react';
import type { Lang, ChatMessage } from '@/lib/types';
import { T } from '@/lib/translations';
import { normalizePhone } from '@/lib/phone';

const PHONE_KEY = 'mra_user_phone';

type CatIcon = ComponentType<{ size?: number | string; stroke?: number | string; className?: string }>;

const CATEGORIES: {
  Icon: CatIcon;
  en: string;
  ur: string;
  qEn: string;
  qUr: string;
}[] = [
  { Icon: IconShieldHalf,   en: 'Police & FIR',       ur: 'پولیس / ایف آئی آر', qEn: 'Police and FIR rights in Pakistan',          qUr: 'پاکستان میں پولیس اور ایف آئی آر کے حقوق' },
  { Icon: IconUsersGroup,   en: 'Family Law',         ur: 'خاندانی قانون',       qEn: 'Family law rights in Pakistan',               qUr: 'پاکستان میں خاندانی قانون کے حقوق' },
  { Icon: IconHome,         en: 'Property & Rent',    ur: 'جائیداد / کرایہ',     qEn: 'Property and rent rights in Pakistan',        qUr: 'پاکستان میں جائیداد اور کرایہ کے حقوق' },
  { Icon: IconTool,         en: 'Labour Rights',      ur: 'مزدور حقوق',          qEn: 'Labour and worker rights in Pakistan',        qUr: 'پاکستان میں مزدور حقوق' },
  { Icon: IconShoppingCart, en: 'Consumer Rights',    ur: 'صارف حقوق',           qEn: 'Consumer protection rights in Pakistan',      qUr: 'پاکستان میں صارف تحفظ کے حقوق' },
  { Icon: IconScript,       en: 'Inheritance',        ur: 'وراثت',               qEn: 'Inheritance and wiraasat rights in Pakistan', qUr: 'پاکستان میں وراثت کے حقوق' },
  { Icon: IconLock,         en: 'Bail & Arrest',      ur: 'ضمانت / گرفتاری',    qEn: 'Bail and arrest rights in Pakistan',          qUr: 'پاکستان میں ضمانت اور گرفتاری کے حقوق' },
  { Icon: IconHeart,        en: 'Marriage & Divorce', ur: 'نکاح / طلاق',         qEn: 'Marriage and divorce rights in Pakistan',     qUr: 'پاکستان میں نکاح اور طلاق کے حقوق' },
  { Icon: IconDeviceLaptop, en: 'Cybercrime',         ur: 'سائبر کرائم',          qEn: 'Cybercrime laws in Pakistan',                 qUr: 'پاکستان میں سائبر کرائم کے قوانین' },
  { Icon: IconGenderFemale, en: "Women's Rights",     ur: 'خواتین کے حقوق',      qEn: 'Women rights and protection laws in Pakistan', qUr: 'پاکستان میں خواتین کے حقوق اور تحفظ' },
  { Icon: IconBook,         en: 'Education Rights',   ur: 'تعلیم کے حقوق',       qEn: 'Education rights in Pakistan',                qUr: 'پاکستان میں تعلیم کے حقوق' },
  { Icon: IconCar,          en: 'Traffic Law',        ur: 'ٹریفک قانون',          qEn: 'Traffic laws and fines in Pakistan',          qUr: 'پاکستان میں ٹریفک قوانین اور جرمانے' },
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
      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce-dot" />
      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce-dot-2" />
      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce-dot-3" />
    </div>
  );
}

function BotAvatar() {
  return (
    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-brand-600 text-white flex-shrink-0">
      <IconScale size={15} stroke={2} />
    </span>
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="card-pop p-6 w-full max-w-sm">
        <div className="flex items-center justify-center w-14 h-14 mx-auto mb-3 rounded-2xl bg-brand-50 text-brand-600">
          <IconDeviceMobile size={28} stroke={1.8} />
        </div>
        <h3
          className="font-display font-bold text-slate-800 text-center text-base mb-1"
          dir={isUr ? 'rtl' : 'ltr'}
        >
          {isUr ? 'گفتگو محفوظ کریں' : 'Save Your Chat History'}
        </h3>
        <p
          className="text-xs text-slate-500 text-center mb-4 leading-relaxed"
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
          placeholder="03XXXXXXXXX"
          autoFocus
          className="field mb-3 text-center tracking-widest"
          dir="ltr"
        />
        <button
          onClick={handleSave}
          disabled={!val.trim()}
          className="btn btn-primary w-full mb-2"
        >
          {isUr ? 'محفوظ کریں' : 'Save & Load History'}
        </button>
        <button
          onClick={onSkip}
          className="w-full text-slate-400 text-xs py-1.5 hover:text-slate-600 transition-colors"
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollDown = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  useEffect(() => { scrollDown(); }, [messages, scrollDown]);

  // Read phone from localStorage on every mount.
  // Tab switches cause a full unmount/remount so this runs every time the tab reopens.
  useEffect(() => {
    const stored = localStorage.getItem(PHONE_KEY);
    if (stored) {
      const normalized = normalizePhone(stored);
      console.log('[AskTab] localStorage read -> raw:', stored, '-> normalized:', normalized);
      // Re-save normalized form so future reads are already clean
      if (normalized !== stored) localStorage.setItem(PHONE_KEY, normalized);
      setPhone(normalized);
    } else {
      console.log('[AskTab] no phone saved - showing modal');
      setShowPhoneModal(true);
    }
  }, []);

  // Fetch history whenever phone is set. AbortController lets React Strict Mode's
  // double-invocation cancel the first in-flight request cleanly so only the
  // second completes — no duplicate messages, no stale state.
  useEffect(() => {
    if (!phone) return;
    const url = `/api/chat-history?phone=${encodeURIComponent(phone)}`;
    console.log('[AskTab] fetching history:', url);
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const count = Array.isArray(data.messages) ? data.messages.length : 0;
        console.log('[AskTab] history returned', count, 'message(s)');
        if (count > 0) {
          const loaded: ChatMessage[] = data.messages.flatMap(
            (m: { id: string; question: string; response: string }) => [
              { id: `${m.id}-q`, role: 'user' as const, text: m.question },
              { id: `${m.id}-r`, role: 'bot' as const, text: m.response },
            ],
          );
          setMessages(loaded);
        }
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          console.warn('[AskTab] history fetch failed:', err.message);
        }
      });
    return () => controller.abort();
  }, [phone]);

  const savePhone = useCallback((p: string) => {
    const normalized = normalizePhone(p);
    console.log('[AskTab] saving phone -> raw:', p, '-> normalized:', normalized);
    localStorage.setItem(PHONE_KEY, normalized);
    setMessages([]); // clear before loading the new phone's history
    setPhone(normalized);
    setShowPhoneModal(false);
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
      <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 my-3.5 flex gap-2.5 items-start text-xs text-amber-800">
        <IconAlertTriangle size={16} stroke={1.9} className="flex-shrink-0 mt-0.5 text-amber-500" />
        <span dir={isUr ? 'rtl' : 'ltr'} className="leading-relaxed">{t.disclaimer}</span>
      </div>

      {/* Browse label + phone settings pill */}
      <div className="flex items-center justify-between mb-2.5" dir={isUr ? 'rtl' : 'ltr'}>
        <div className="section-label">{t.browseLabel}</div>
        {phone ? (
          <button
            onClick={() => setShowPhoneModal(true)}
            className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
            title={isUr ? 'فون نمبر تبدیل کریں' : 'Change phone number'}
          >
            <IconDeviceMobile size={12} stroke={1.8} /> {phone}
            <IconSettings size={12} stroke={1.8} />
          </button>
        ) : (
          <button
            onClick={() => setShowPhoneModal(true)}
            className="inline-flex items-center gap-1 text-[10px] text-brand-700 hover:text-brand-800 transition-colors font-medium"
          >
            <IconDeviceMobile size={12} stroke={1.8} /> {isUr ? 'تاریخ محفوظ کریں' : 'Save history'}
          </button>
        )}
      </div>

      {/* Categories grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" dir={isUr ? 'rtl' : 'ltr'}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.en}
            onClick={() => sendMessage(isUr ? cat.qUr : cat.qEn)}
            className="group card p-3 flex items-center gap-2.5 text-left cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-card hover:border-brand-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30"
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex-shrink-0 transition-colors group-hover:bg-brand-600 group-hover:text-white">
              <cat.Icon size={19} stroke={1.8} />
            </span>
            <span className="text-xs font-semibold text-slate-700 leading-tight">
              {isUr ? cat.ur : cat.en}
            </span>
          </button>
        ))}
      </div>

      {/* Ask label */}
      <div className="section-label mt-5 mb-3">{t.askLabel}</div>

      {/* Chat area */}
      <div className="flex flex-col gap-3 pb-40">
        {/* Welcome bubble — shown only when there are no messages */}
        {messages.length === 0 && (
          <div
            className="max-w-[90%] card rounded-2xl rounded-bl-md p-4"
            dir={isUr ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-700 mb-2">
              <BotAvatar />
              {t.botName}
              <span className="badge bg-brand-100 text-brand-700">AI</span>
            </div>
            <h2 className="font-display text-sm font-bold text-slate-800 mb-1.5">{t.welcomeTitle}</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{t.welcomeText}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setInput(chip);
                    inputRef.current?.focus();
                  }}
                  className="chip"
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
              className="max-w-[88%] ml-auto bg-gradient-to-br from-brand-600 to-brand-700 text-white px-4 py-3 text-sm leading-relaxed rounded-2xl rounded-br-md shadow-soft"
              dir={isUr ? 'rtl' : 'ltr'}
            >
              {msg.text}
            </div>
          ) : (
            <div
              key={msg.id}
              className="max-w-[90%] card rounded-2xl rounded-bl-md px-4 py-3"
              dir={isUr ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-700 mb-1.5">
                <BotAvatar />
                {t.botName}
                <span className="badge bg-brand-100 text-brand-700">AI</span>
              </div>
              {msg.text ? (
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words text-slate-700">
                  {msg.text}
                  {msg.streaming && (
                    <span className="inline-block w-0.5 h-3.5 bg-brand-600 ml-0.5 align-middle animate-blink" />
                  )}
                </div>
              ) : (
                <div>
                  <TypingDots />
                  <div className="text-[11px] text-slate-400 mt-1">{t.thinking}</div>
                </div>
              )}
            </div>
          ),
        )}
        <div ref={bottomRef} />
      </div>

      {/* Fixed input bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent px-3.5 pt-6 pb-safe-bar z-40">
        <div
          className="max-w-[760px] mx-auto flex items-center gap-2 bg-white border border-slate-200 rounded-2xl shadow-pop p-1.5 pl-2"
          dir={isUr ? 'rtl' : 'ltr'}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            maxLength={500}
            className={`flex-1 bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 font-[inherit] ${
              isUr ? 'text-right' : ''
            }`}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading}
            className="flex items-center justify-center w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-b from-brand-600 to-brand-700 text-white shadow-brand-glow hover:from-brand-500 hover:to-brand-600 transition-all disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
            aria-label="Send"
          >
            <IconSend2 size={19} stroke={1.9} />
          </button>
        </div>
      </div>
    </div>
  );
}
