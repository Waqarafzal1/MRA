export type Lang = 'en' | 'ur';
export type Tab = 'ask' | 'whatsapp' | 'lawyers' | 'register';

export interface Registration {
  id: string;
  fullName: string;
  cnic: string;
  licenseNumber: string;
  barCouncil: string;
  specializations: string[];
  city: string;
  court: string;
  experience: number;
  phone: string;
  email: string;
  languages: string[];
  about: string;
  status: 'pending' | 'approved' | 'rejected';
  emailVerified: boolean;
  submittedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
}

export interface OtpEntry {
  otp: string;
  expiresAt: number;
  registrationData: Registration;
}

export interface AppData {
  registrations: Registration[];
  otps: Record<string, OtpEntry>;
}

export interface Lawyer {
  name: string;
  city: string;
  spec: string;
  exp: string;
  court: string;
  phone: string;
  avatar: string;
  verified?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  streaming?: boolean;
}

export interface LawSection {
  id: string;
  lawName: string;
  sectionRef: string;
  heading: string;
  body: string;
  source: string;
  sourceUrl: string;
  amendedUpTo: string;
}

export type LegalNewsStatus = 'pending' | 'approved' | 'rejected';

export interface LegalNews {
  id: string;
  headline: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  publishedDate: string;
  status: LegalNewsStatus;
  createdAt: string;
}

export type LegalAidOrgType = 'government' | 'bar_committee' | 'ngo' | 'helpline';

export interface LegalAid {
  id: string;
  name: string;
  orgType: LegalAidOrgType;
  helpsWith: string[];
  whoQualifies: string;
  coverage: string;
  phone: string | null;
  address: string | null;
  website: string | null;
  isFree: boolean;
  isVerified: boolean;
  sourceUrl: string;
  lastVerified: string | null;
}
