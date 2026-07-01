'use client';

import { useState } from 'react';
import {
  IconUserPlus,
  IconUser,
  IconCertificate,
  IconBriefcase,
  IconNotes,
  IconMail,
  IconCircleCheck,
  IconArrowRight,
  IconAlertCircle,
  IconArrowLeft,
} from '@tabler/icons-react';
import type { Lang, Tab } from '@/lib/types';

const BAR_COUNCILS = [
  'Punjab Bar Council', 'Sindh Bar Council', 'KP Bar Council',
  'Balochistan Bar Council', 'ICT Bar Council (Islamabad)', 'AJK Bar Council', 'GB Bar Council',
];
const CITIES = [
  'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
  'Peshawar', 'Quetta', 'Gujranwala', 'Sialkot', 'Sargodha', 'Bahawalpur',
  'Hyderabad', 'Sukkur', 'Abbottabad', 'Mardan', 'Other',
];
const SPECS = [
  'Family Law', 'Criminal Law', 'Property Law', 'Labour Law', 'Corporate Law',
  "Women's Rights", 'Cybercrime', 'Consumer Rights', 'Banking Law', 'Tax Law',
  'Constitutional Law', 'General Practice',
];
const LANGS = ['Urdu', 'English', 'Punjabi', 'Sindhi', 'Pashto', 'Balochi'];

interface Props {
  lang: Lang;
  onTabChange: (t: Tab) => void;
}

type Step = 'form' | 'otp' | 'success';

export default function RegisterTab({ lang, onTabChange }: Props) {
  const isUr = lang === 'ur';
  const [step, setStep] = useState<Step>('form');
  const [regId, setRegId] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [formMsg, setFormMsg] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [otpMsg, setOtpMsg] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [cnic, setCnic] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [barCouncil, setBarCouncil] = useState('');
  const [city, setCity] = useState('');
  const [experience, setExperience] = useState('');
  const [court, setCourt] = useState('');
  const [specs, setSpecs] = useState<string[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>(['Urdu', 'English']);
  const [about, setAbout] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [otpValue, setOtpValue] = useState('');

  function toggleSpec(s: string) {
    setSpecs((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }
  function toggleLang(l: string) {
    setSelectedLangs((prev) => prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]);
  }

  async function submitRegistration() {
    setFormMsg(null);
    if (!fullName) return setFormMsg({ text: 'Please enter your full name.', type: 'error' });
    if (!cnic || !/^\d{13}$/.test(cnic.replace(/-/g, ''))) return setFormMsg({ text: 'CNIC must be exactly 13 digits (no dashes).', type: 'error' });
    if (!licenseNumber) return setFormMsg({ text: 'Please enter your Bar Council license number.', type: 'error' });
    if (!barCouncil) return setFormMsg({ text: 'Please select your Bar Council.', type: 'error' });
    if (!city) return setFormMsg({ text: 'Please select your city.', type: 'error' });
    if (!experience) return setFormMsg({ text: 'Please select your years of experience.', type: 'error' });
    if (!phone) return setFormMsg({ text: 'Please enter your WhatsApp / mobile number.', type: 'error' });
    if (!email || !email.includes('@')) return setFormMsg({ text: 'Please enter a valid email address.', type: 'error' });
    if (specs.length === 0) return setFormMsg({ text: 'Please select at least one area of specialization.', type: 'error' });
    if (!agreed) return setFormMsg({ text: 'Please agree to the terms before submitting.', type: 'error' });

    setSubmitting(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName, cnic: cnic.replace(/-/g, ''), licenseNumber, barCouncil, city,
          court, experience, phone, email, about,
          specializations: specs, languages: selectedLangs,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormMsg({ text: data.error || 'Submission failed. Please try again.', type: 'error' });
        return;
      }
      setRegId(data.registrationId);
      setOtpEmail(email);
      setStep('otp');
    } catch {
      setFormMsg({ text: 'Network error. Please check your connection and try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyOTP() {
    setOtpMsg(null);
    if (!otpValue || otpValue.length !== 6) {
      return setOtpMsg({ text: 'Please enter the 6-digit OTP from your email.', type: 'error' });
    }
    try {
      const res = await fetch('/api/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: regId, otp: otpValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        return setOtpMsg({ text: data.error || 'Verification failed.', type: 'error' });
      }
      setStep('success');
    } catch {
      setOtpMsg({ text: 'Network error. Please try again.', type: 'error' });
    }
  }

  const labelCls = 'text-xs font-bold text-slate-700';

  function MsgBox({ msg }: { msg: { text: string; type: 'error' | 'success' } }) {
    return (
      <div
        className={`flex items-start gap-2 px-3.5 py-2.5 rounded-xl text-sm mb-3 border ${
          msg.type === 'error'
            ? 'bg-red-50 text-red-600 border-red-200'
            : 'bg-brand-50 text-brand-800 border-brand-200'
        }`}
      >
        <IconAlertCircle size={16} stroke={1.9} className="flex-shrink-0 mt-0.5" />
        <span>{msg.text}</span>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="card p-6 mt-3.5">
        <div className="text-center py-4">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-50 text-brand-600">
            <IconMail size={32} stroke={1.7} />
          </div>
          <h3 className="font-display text-brand-800 text-base font-bold mb-2">Check Your Email</h3>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            We sent a 6-digit OTP to <strong className="text-slate-800">{otpEmail}</strong>.<br />
            Enter it below to verify your email and submit your registration.
          </p>
          {otpMsg && (
            <div className="text-left">
              <MsgBox msg={otpMsg} />
            </div>
          )}
          <input
            type="text"
            value={otpValue}
            onChange={(e) => setOtpValue(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && verifyOTP()}
            placeholder="000000"
            maxLength={6}
            className="w-52 text-center text-3xl font-bold tracking-[10px] px-3 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/25 font-mono text-slate-800"
          />
          <div className="mt-5">
            <button onClick={verifyOTP} className="btn btn-primary px-8 py-3">
              Verify OTP <IconArrowRight size={17} stroke={2} />
            </button>
          </div>
          <button
            onClick={() => setStep('form')}
            className="mt-3 inline-flex items-center gap-1 bg-transparent border-none text-slate-400 text-xs cursor-pointer hover:text-slate-600"
          >
            <IconArrowLeft size={14} stroke={2} /> Go back and change email
          </button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="card p-6 mt-3.5">
        <div className="text-center py-6">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-50 text-brand-600">
            <IconCircleCheck size={34} stroke={1.7} />
          </div>
          <h3 className="font-display text-brand-800 text-base font-bold mb-2">Registration Submitted!</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your email has been verified and your registration is now under review.<br /><br />
            Our team will verify your Bar Council credentials within{' '}
            <strong className="text-slate-800">2–3 business days</strong>. You will receive an email when your profile goes live on MRA.
          </p>
          <button
            onClick={() => onTabChange('lawyers')}
            className="btn btn-primary px-8 py-3 mt-6"
          >
            View Lawyer Directory <IconArrowRight size={17} stroke={2} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 mt-3.5 mb-4" dir={isUr ? 'rtl' : 'ltr'}>
      <h3 className="font-display flex items-center gap-2 text-brand-800 text-base font-bold mb-1">
        <IconUserPlus size={20} stroke={1.9} /> Register as a Lawyer on MRA
      </h3>
      <p className="text-xs text-slate-600 mb-4">
        Your profile will be verified and approved before going live. Fields marked{' '}
        <span className="text-red-600">*</span> are required.
      </p>

      {formMsg && <MsgBox msg={formMsg} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Personal */}
        <div className="col-span-1 sm:col-span-2 section-label mt-1">
          <IconUser size={13} stroke={2} /> Personal Information
        </div>

        <div className="col-span-1 sm:col-span-2 flex flex-col gap-1">
          <label className={labelCls}>Full Name <span className="text-red-600">*</span></label>
          <input className="field" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Muhammad Bilal Khan" maxLength={100} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>CNIC Number <span className="text-red-600">*</span></label>
          <input className="field" value={cnic} onChange={(e) => setCnic(e.target.value)} placeholder="3520212345678" maxLength={15} />
          <span className="text-[11px] text-slate-400">13 digits, no dashes</span>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>WhatsApp / Mobile <span className="text-red-600">*</span></label>
          <input className="field" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03001234567" />
        </div>

        <div className="col-span-1 sm:col-span-2 flex flex-col gap-1">
          <label className={labelCls}>Email Address <span className="text-red-600">*</span></label>
          <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="youremail@gmail.com" />
          <span className="text-[11px] text-slate-400">An OTP will be sent here to verify your email</span>
        </div>

        <hr className="col-span-1 sm:col-span-2 border-slate-200/70" />
        <div className="col-span-1 sm:col-span-2 section-label mt-1">
          <IconCertificate size={13} stroke={2} /> Professional Credentials
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>Bar Council License No. <span className="text-red-600">*</span></label>
          <input className="field" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="e.g. PBC-2019-12345" />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>Issuing Bar Council <span className="text-red-600">*</span></label>
          <select className="field cursor-pointer" value={barCouncil} onChange={(e) => setBarCouncil(e.target.value)}>
            <option value="">Select Bar Council</option>
            {BAR_COUNCILS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>City <span className="text-red-600">*</span></label>
          <select className="field cursor-pointer" value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">Select City</option>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>Years of Experience <span className="text-red-600">*</span></label>
          <select className="field cursor-pointer" value={experience} onChange={(e) => setExperience(e.target.value)}>
            <option value="">Select</option>
            <option value="1">Less than 1 year</option>
            <option value="2">1–2 years</option>
            <option value="5">3–5 years</option>
            <option value="8">6–10 years</option>
            <option value="15">11–20 years</option>
            <option value="25">20+ years</option>
          </select>
        </div>

        <div className="col-span-1 sm:col-span-2 flex flex-col gap-1">
          <label className={labelCls}>Court(s) Where You Practice</label>
          <input className="field" value={court} onChange={(e) => setCourt(e.target.value)} placeholder="e.g. Lahore High Court, Sessions Court Lahore" />
        </div>

        <hr className="col-span-1 sm:col-span-2 border-slate-200/70" />
        <div className="col-span-1 sm:col-span-2 section-label mt-1">
          <IconBriefcase size={13} stroke={2} /> Specialization
        </div>

        <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
          <label className={labelCls}>Areas of Practice <span className="text-red-600">*</span></label>
          <div className="flex flex-wrap gap-2 mt-1">
            {SPECS.map((s) => {
              const on = specs.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSpec(s)}
                  className={`chip ${on ? 'chip-active' : ''}`}
                >
                  {on && <IconCircleCheck size={13} stroke={2} />}
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
          <label className={labelCls}>Languages</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {LANGS.map((l) => {
              const on = selectedLangs.includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => toggleLang(l)}
                  className={`chip ${on ? 'chip-active' : ''}`}
                >
                  {on && <IconCircleCheck size={13} stroke={2} />}
                  {l}
                </button>
              );
            })}
          </div>
        </div>

        <hr className="col-span-1 sm:col-span-2 border-slate-200/70" />
        <div className="col-span-1 sm:col-span-2 section-label mt-1">
          <IconNotes size={13} stroke={2} /> About You
        </div>

        <div className="col-span-1 sm:col-span-2 flex flex-col gap-1">
          <label className={labelCls}>Brief Bio / About</label>
          <textarea
            className="field resize-y min-h-[80px]"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Tell citizens about your practice, experience, and how you can help them..."
          />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-brand-700 flex-shrink-0"
            />
            I confirm that the information provided is accurate and I am a registered lawyer with the stated Bar Council. I agree to MRA&apos;s terms of service.
          </label>
        </div>
      </div>

      <button
        onClick={submitRegistration}
        disabled={submitting}
        className="btn btn-primary w-full py-3.5 mt-5"
      >
        {submitting ? 'Sending OTP...' : (
          <>Submit Registration & Verify Email <IconArrowRight size={17} stroke={2} /></>
        )}
      </button>
    </div>
  );
}
