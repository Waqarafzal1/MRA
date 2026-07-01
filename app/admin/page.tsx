import {
  IconScale,
  IconClock,
  IconCircleCheck,
  IconX,
  IconCheck,
  IconPhone,
  IconMail,
  IconGavel,
  IconTag,
  IconId,
  IconLogout,
  IconClipboardList,
} from '@tabler/icons-react';
import { supabaseServer, rowToRegistration } from '@/lib/supabase';
import type { Registration } from '@/lib/types';

export const dynamic = 'force-dynamic';

function LoginForm() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card-pop p-8 w-full max-w-xs">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-brand-glow">
          <IconScale size={24} stroke={1.9} />
        </div>
        <h2 className="font-display text-slate-800 text-lg font-bold text-center mb-1">MRA Admin</h2>
        <p className="text-xs text-slate-500 text-center mb-5">Lawyer Registration Management</p>
        <form method="get">
          <input
            name="key"
            type="password"
            placeholder="Admin password"
            className="field mb-3"
          />
          <button type="submit" className="btn btn-primary w-full">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Registration['status'] }) {
  const styles = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-brand-100 text-brand-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`badge ms-auto px-3 py-1 ${styles[status]}`}>
      {status.toUpperCase()}
    </span>
  );
}

function RegCard({
  r,
  adminKey,
  showActions,
}: {
  r: Registration;
  adminKey: string;
  showActions: boolean;
}) {
  const initials = r.fullName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  return (
    <div className="card p-4 mb-3">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-soft">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-800">{r.fullName}</div>
          <div className="text-xs text-slate-500 truncate">
            {r.city} · {r.barCouncil} · License: {r.licenseNumber}
          </div>
        </div>
        <StatusBadge status={r.status} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-500 mb-3">
        <div className="inline-flex items-center gap-1.5">
          <IconPhone size={14} stroke={1.8} className="text-slate-400 flex-shrink-0" /> {r.phone}
        </div>
        <div className="inline-flex items-center gap-1.5 min-w-0">
          <IconMail size={14} stroke={1.8} className="text-slate-400 flex-shrink-0" />
          <span className="truncate">{r.email}</span>
          {r.emailVerified && <IconCircleCheck size={14} stroke={1.9} className="text-brand-600 flex-shrink-0" />}
        </div>
        <div className="inline-flex items-center gap-1.5">
          <IconGavel size={14} stroke={1.8} className="text-slate-400 flex-shrink-0" /> {r.court || '-'}
        </div>
        <div className="inline-flex items-center gap-1.5">
          <IconClock size={14} stroke={1.8} className="text-slate-400 flex-shrink-0" /> {r.experience} years
        </div>
        <div className="inline-flex items-center gap-1.5 sm:col-span-2">
          <IconTag size={14} stroke={1.8} className="text-slate-400 flex-shrink-0" /> {(r.specializations || []).join(', ')}
        </div>
        <div className="inline-flex items-center gap-1.5 sm:col-span-2">
          <IconId size={14} stroke={1.8} className="text-slate-400 flex-shrink-0" /> CNIC: {r.cnic}
        </div>
      </div>

      {r.about && <div className="text-xs text-slate-600 mb-3 leading-relaxed">{r.about}</div>}

      {showActions && (
        <div className="flex gap-2">
          <form method="post" action={`/api/admin/approve/${r.id}?key=${adminKey}`} className="flex-1">
            <button type="submit" className="btn btn-primary btn-sm w-full py-2">
              <IconCheck size={15} stroke={2.2} /> Approve
            </button>
          </form>
          <form method="post" action={`/api/admin/reject/${r.id}?key=${adminKey}`} className="flex-1">
            <button
              type="submit"
              className="btn btn-sm w-full py-2 text-white bg-red-600 hover:bg-red-700 shadow-soft"
            >
              <IconX size={15} stroke={2.2} /> Reject
            </button>
          </form>
        </div>
      )}

      <div className="text-[11px] text-slate-400 mt-2.5">
        Submitted: {new Date(r.submittedAt).toLocaleString('en-PK')}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center text-slate-400 text-sm py-8 card bg-slate-50/60">
      {text}
    </div>
  );
}

function SectionHeading({
  Icon,
  text,
  count,
}: {
  Icon: React.ComponentType<{ size?: number | string; stroke?: number | string; className?: string }>;
  text: string;
  count: number;
}) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3 pb-2 border-b border-slate-200">
      <Icon size={16} stroke={1.9} className="text-brand-600" /> {text} ({count})
    </h2>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { key?: string };
}) {
  const adminPassword = process.env.ADMIN_PASSWORD || 'mra-admin-2024';
  const key = searchParams.key || '';

  if (key !== adminPassword) {
    return <LoginForm />;
  }

  const { data: rows } = await supabaseServer()
    .from('registrations')
    .select('*')
    .order('submitted_at', { ascending: false });

  const registrations = (rows ?? []).map((r) =>
    rowToRegistration(r as Record<string, unknown>),
  );

  const pending = registrations.filter((r) => r.status === 'pending');
  const approved = registrations.filter((r) => r.status === 'approved');
  const rejected = registrations.filter((r) => r.status === 'rejected');

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 text-white px-5 py-4 shadow-card">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/95 text-brand-700 shadow-soft ring-1 ring-white/40">
              <IconScale size={20} stroke={1.9} />
            </div>
            <div>
              <h1 className="font-display text-lg font-extrabold tracking-tight">MRA Admin Panel</h1>
              <p className="text-xs text-white/60">My Rights App — Lawyer Registration Management</p>
            </div>
          </div>
          <a href="/admin" className="inline-flex items-center gap-1.5 text-white/70 text-sm hover:text-white transition-colors">
            <IconLogout size={16} stroke={1.9} /> Logout
          </a>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card p-4 text-center">
            <div className="font-display text-3xl font-extrabold text-amber-500">{pending.length}</div>
            <div className="text-xs text-slate-500 mt-1">Pending Review</div>
          </div>
          <div className="card p-4 text-center">
            <div className="font-display text-3xl font-extrabold text-brand-700">{approved.length}</div>
            <div className="text-xs text-slate-500 mt-1">Approved &amp; Live</div>
          </div>
          <div className="card p-4 text-center">
            <div className="font-display text-3xl font-extrabold text-red-600">{rejected.length}</div>
            <div className="text-xs text-slate-500 mt-1">Rejected</div>
          </div>
        </div>

        {/* Sections */}
        <SectionHeading Icon={IconClock} text="Pending Review" count={pending.length} />
        {pending.length ? (
          pending.map((r) => <RegCard key={r.id} r={r} adminKey={key} showActions />)
        ) : (
          <EmptyState text="No pending registrations" />
        )}

        <div className="mt-6">
          <SectionHeading Icon={IconCircleCheck} text="Approved" count={approved.length} />
        </div>
        {approved.length ? (
          approved.map((r) => (
            <RegCard key={r.id} r={r} adminKey={key} showActions={false} />
          ))
        ) : (
          <EmptyState text="No approved lawyers yet" />
        )}

        <div className="mt-6">
          <SectionHeading Icon={IconClipboardList} text="Rejected" count={rejected.length} />
        </div>
        {rejected.length ? (
          rejected.map((r) => (
            <RegCard key={r.id} r={r} adminKey={key} showActions={false} />
          ))
        ) : (
          <EmptyState text="No rejected registrations" />
        )}
      </div>
    </div>
  );
}
