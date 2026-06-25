import { supabaseServer, rowToRegistration } from '@/lib/supabase';
import type { Registration } from '@/lib/types';

export const dynamic = 'force-dynamic';

function LoginForm() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-lg w-80">
        <h2 className="text-green-800 text-xl font-bold mb-5">MRA Admin</h2>
        <form method="get">
          <input
            name="key"
            type="password"
            placeholder="Admin password"
            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm mb-3 outline-none focus:border-green-500"
          />
          <button
            type="submit"
            className="w-full bg-green-800 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Registration['status'] }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`ml-auto px-3 py-0.5 rounded-full text-xs font-bold ${styles[status]}`}>
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
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 mb-3">
      <div className="flex items-center gap-3 mb-2.5">
        <div className="w-11 h-11 rounded-full bg-green-100 text-green-800 flex items-center justify-center font-bold text-base flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1">
          <div className="font-bold text-gray-800">{r.fullName}</div>
          <div className="text-xs text-gray-500">
            {r.city} | {r.barCouncil} | License: {r.licenseNumber}
          </div>
        </div>
        <StatusBadge status={r.status} />
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-xs text-gray-500 mb-2.5">
        <div>📞 {r.phone}</div>
        <div>✉️ {r.email} {r.emailVerified ? '✅' : ''}</div>
        <div>⚖️ {r.court || '-'}</div>
        <div>🕐 {r.experience} years</div>
        <div>🔖 {(r.specializations || []).join(', ')}</div>
        <div>🆔 CNIC: {r.cnic}</div>
      </div>

      {r.about && <div className="text-xs text-gray-600 mb-2.5">{r.about}</div>}

      {showActions && (
        <div className="flex gap-2">
          <form method="post" action={`/api/admin/approve/${r.id}?key=${adminKey}`} className="flex-1">
            <button
              type="submit"
              className="w-full bg-green-800 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors"
            >
              ✓ Approve
            </button>
          </form>
          <form method="post" action={`/api/admin/reject/${r.id}?key=${adminKey}`} className="flex-1">
            <button
              type="submit"
              className="w-full bg-red-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
            >
              ✗ Reject
            </button>
          </form>
        </div>
      )}

      <div className="text-[11px] text-gray-400 mt-2">
        Submitted: {new Date(r.submittedAt).toLocaleString('en-PK')}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center text-gray-400 py-8 bg-white rounded-xl border-2 border-gray-200">
      {text}
    </div>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900 to-green-800 text-white px-5 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">⚖️ MRA Admin Panel</h1>
            <p className="text-xs opacity-70">My Rights App — Lawyer Registration Management</p>
          </div>
          <a href="/admin" className="text-white/70 text-sm hover:text-white">
            Logout
          </a>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-500">{pending.length}</div>
            <div className="text-xs text-gray-500 mt-1">Pending Review</div>
          </div>
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-800">{approved.length}</div>
            <div className="text-xs text-gray-500 mt-1">Approved &amp; Live</div>
          </div>
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-600">{rejected.length}</div>
            <div className="text-xs text-gray-500 mt-1">Rejected</div>
          </div>
        </div>

        {/* Sections */}
        <h2 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b-2 border-gray-200">
          🕐 Pending Review ({pending.length})
        </h2>
        {pending.length ? (
          pending.map((r) => <RegCard key={r.id} r={r} adminKey={key} showActions />)
        ) : (
          <EmptyState text="No pending registrations" />
        )}

        <h2 className="text-sm font-bold text-gray-800 mb-3 mt-6 pb-2 border-b-2 border-gray-200">
          ✅ Approved ({approved.length})
        </h2>
        {approved.length ? (
          approved.map((r) => (
            <RegCard key={r.id} r={r} adminKey={key} showActions={false} />
          ))
        ) : (
          <EmptyState text="No approved lawyers yet" />
        )}

        <h2 className="text-sm font-bold text-gray-800 mb-3 mt-6 pb-2 border-b-2 border-gray-200">
          ✗ Rejected ({rejected.length})
        </h2>
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
