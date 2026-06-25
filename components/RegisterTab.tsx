'use client';

import { useState } from 'react';
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

  const inputCls = 'w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:border-green-500 font-[inherit]';
  const labelCls = 'text-xs font-bold text-gray-700';

  if (step === 'otp') {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 mt-3.5">
        <div className="text-center py-5">
          <div className="text-5xl mb-3">📧</div>
          <h3 className="text-green-800 text-base font-bold mb-2">Check Your Email</h3>
          <p className="text-sm text-gray-600 mb-4">
            We sent a 6-digit OTP to <strong>{otpEmail}</strong>.<br />
            Enter it below to verify your email and submit your registration.
          </p>
          {otpMsg && (
            <div className={`text-left px-3.5 py-2.5 rounded-lg text-sm mb-3 border ${otpMsg.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-100 text-green-800 border-green-200'}`}>
              {otpMsg.text}
            </div>
          )}
          <input
            type="text"
            value={otpValue}
            onChange={(e) => setOtpValue(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && verifyOTP()}
            placeholder="000000"
            maxLength={6}
            className="w-48 text-center text-3xl font-bold tracking-[10px] px-3 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500 font-mono"
          />
          <div className="mt-4">
            <button
              onClick={verifyOTP}
              className="bg-green-800 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors"
            >
              Verify OTP →
            </button>
          </div>
          <button
            onClick={() => setStep('form')}
            className="mt-3 bg-transparent border-none text-gray-400 text-xs cursor-pointer hover:text-gray-600"
          >
            ← Go back and change email
          </button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 mt-3.5">
        <div className="text-center py-8">
          <div className="text-5xl mb-3">✅</div>
          <h3 className="text-green-800 text-base font-bold mb-2">Registration Submitted!</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Your email has been verified and your registration is now under review.<br /><br />
            Our team will verify your Bar Council credentials within{' '}
            <strong>2–3 business days</strong>. You will receive an email when your profile goes live on MRA.
          </p>
          <button
            onClick={() => onTabChange('lawyers')}
            className="mt-6 bg-green-800 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors"
          >
            View Lawyer Directory →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 mt-3.5 mb-4" dir={isUr ? 'rtl' : 'ltr'}>
      <h3 className="text-green-800 text-sm font-bold mb-1">📝 Register as a Lawyer on MRA</h3>
      <p className="text-xs text-gray-600 mb-4">
        Your profile will be verified and approved before going live. Fields marked{' '}
        <span className="text-red-600">*</span> are required.
      </p>

      {formMsg && (
        <div className={`px-3.5 py-2.5 rounded-lg text-sm mb-3 border ${formMsg.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-100 text-green-800 border-green-200'}`}>
          {formMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Personal */}
        <div className="col-span-1 sm:col-span-2 text-[11px] font-bold text-gray-400 uppercase tracking-wide mt-1">
          Personal Information
        </div>

        <div className="col-span-1 sm:col-span-2 flex flex-col gap-1">
          <label className={labelCls}>Full Name <span className="text-red-600">*</span></label>
          <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Muhammad Bilal Khan" maxLength={100} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>CNIC Number <span className="text-red-600">*</span></label>
          <input className={inputCls} value={cnic} onChange={(e) => setCnic(e.target.value)} placeholder="3520212345678" maxLength={15} />
          <span className="text-[11px] text-gray-400">13 digits, no dashes</span>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>WhatsApp / Mobile <span className="text-red-600">*</span></label>
          <input className={inputCls} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03001234567" />
        </div>

        <div className="col-span-1 sm:col-span-2 flex flex-col gap-1">
          <label className={labelCls}>Email Address <span className="text-red-600">*</span></label>
          <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="youremail@gmail.com" />
          <span className="text-[11px] text-gray-400">An OTP will be sent here to verify your email</span>
        </div>

        <hr className="col-span-1 sm:col-span-2 border-gray-200" />
        <div className="col-span-1 sm:col-span-2 text-[11px] font-bold text-gray-400 uppercase tracking-wide mt-1">
          Professional Credentials
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>Bar Council License No. <span className="text-red-600">*</span></label>
          <input className={inputCls} value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="e.g. PBC-2019-12345" />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>Issuing Bar Council <span className="text-red-600">*</span></label>
          <select className={inputCls} value={barCouncil} onChange={(e) => setBarCouncil(e.target.value)}>
            <option value="">Select Bar Council</option>
            {BAR_COUNCILS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>City <span className="text-red-600">*</span></label>
          <select className={inputCls} value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">Select City</option>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>Years of Experience <span className="text-red-600">*</span></label>
          <select className={inputCls} value={experience} onChange={(e) => setExperience(e.target.value)}>
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
          <input className={inputCls} value={court} onChange={(e) => setCourt(e.target.value)} placeholder="e.g. Lahore High Court, Sessions Court Lahore" />
        </div>

        <hr className="col-span-1 sm:col-span-2 border-gray-200" />
        <div className="col-span-1 sm:col-span-2 text-[11px] font-bold text-gray-400 uppercase tracking-wide mt-1">
          Specialization
        </div>

        <div className="col-span-1 sm:col-span-2 flex flex-col gap-1">
          <label className={labelCls}>Areas of Practice <span className="text-red-600">*</span></label>
          <div className="flex flex-wrap gap-2 mt-1">
            {SPECS.map((s) => (
              <label key={s} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={specs.includes(s)}
                  onChange={() => toggleSpec(s)}
                  className="w-3.5 h-3.5 accent-green-800"
                />
                {s}
              </label>
            ))}
          </div>
        </div>

        <div className="col-span-1 sm:col-span-2 flex flex-col gap-1">
          <label className={labelCls}>Languages</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {LANGS.map((l) => (
              <label key={l} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedLangs.includes(l)}
                  onChange={() => toggleLang(l)}
                  className="w-3.5 h-3.5 accent-green-800"
                />
                {l}
              </label>
            ))}
          </div>
        </div>

        <hr className="col-span-1 sm:col-span-2 border-gray-200" />
        <div className="col-span-1 sm:col-span-2 text-[11px] font-bold text-gray-400 uppercase tracking-wide mt-1">
          About You
        </div>

        <div className="col-span-1 sm:col-span-2 flex flex-col gap-1">
          <label className={labelCls}>Brief Bio / About</label>
          <textarea
            className={`${inputCls} resize-y min-h-[80px]`}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Tell citizens about your practice, experience, and how you can help them..."
          />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <label className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 accent-green-800 flex-shrink-0"
            />
            I confirm that the information provided is accurate and I am a registered lawyer with the stated Bar Council. I agree to MRA&apos;s terms of service.
          </label>
        </div>
      </div>

      <button
        onClick={submitRegistration}
        disabled={submitting}
        className="w-full bg-green-800 text-white py-3.5 rounded-xl text-sm font-bold mt-4 hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {submitting ? 'Sending OTP...' : 'Submit Registration & Verify Email →'}
      </button>
    </div>
  );
}
