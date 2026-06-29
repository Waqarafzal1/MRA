import { supabaseServer, rowToLegalNews } from '@/lib/supabase';
import type { LegalNews } from '@/lib/types';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function LoginForm() {
  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-stone-200 w-80">
        <h2 className="text-brand text-xl font-bold mb-5">MRA News Admin</h2>
        <form method="get">
          <input
            name="key"
            type="password"
            placeholder="Admin password"
            className="w-full px-3 py-2.5 border-2 border-stone-200 rounded-xl text-sm mb-3 outline-none focus:border-brand"
          />
          <button
            type="submit"
            className="w-full bg-brand text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-brand/90 transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

function NewsCard({
  item,
  adminKey,
  showActions,
}: {
  item: LegalNews;
  adminKey: string;
  showActions: boolean;
}) {
  const date = new Date(item.publishedDate).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="bg-white border-2 border-stone-200 rounded-xl p-4 mb-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h3 className="font-bold text-stone-800 text-sm leading-snug">{item.headline}</h3>
          <p className="text-xs text-stone-500 mt-1">
            {item.sourceName} · {date}
          </p>
        </div>
        <span
          className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            item.status === 'pending'
              ? 'bg-amber-100 text-amber-800'
              : item.status === 'approved'
                ? 'bg-brand/10 text-brand'
                : 'bg-red-100 text-red-700'
          }`}
        >
          {item.status}
        </span>
      </div>
      <p className="text-sm text-stone-600 leading-relaxed mb-3">{item.summary}</p>
      <a
        href={item.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-brand font-semibold hover:underline"
      >
        View source →
      </a>

      {showActions && (
        <div className="flex gap-2 mt-4">
          <form
            method="post"
            action={`/api/admin/news/approve/${item.id}?key=${adminKey}`}
            className="flex-1"
          >
            <button
              type="submit"
              className="w-full bg-brand text-white py-2 rounded-xl text-sm font-bold hover:bg-brand/90 transition-colors"
            >
              ✓ Approve
            </button>
          </form>
          <form
            method="post"
            action={`/api/admin/news/reject/${item.id}?key=${adminKey}`}
            className="flex-1"
          >
            <button
              type="submit"
              className="w-full bg-red-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
            >
              ✗ Reject
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center text-stone-400 py-8 bg-white rounded-xl border-2 border-stone-200 text-sm">
      {text}
    </div>
  );
}

export default async function AdminNewsPage({
  searchParams,
}: {
  searchParams: { key?: string };
}) {
  const adminPassword = process.env.ADMIN_PASSWORD || 'mra-admin-2024';
  const key = searchParams.key || '';

  if (key !== adminPassword) {
    return <LoginForm />;
  }

  const { data: rows, error } = await supabaseServer()
    .from('legal_news')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[admin/news]', error.message);
  }

  const items = (rows ?? []).map((r) => rowToLegalNews(r as Record<string, unknown>));
  const pending = items.filter((i) => i.status === 'pending');
  const approved = items.filter((i) => i.status === 'approved');
  const rejected = items.filter((i) => i.status === 'rejected');

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="bg-brand text-white px-5 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">📰 Legal News Review</h1>
            <p className="text-xs opacity-80">Approve items before they appear on the home page</p>
          </div>
          <div className="flex gap-3 text-sm">
            <Link href={`/admin?key=${key}`} className="text-white/80 hover:text-white">
              Lawyers
            </Link>
            <Link href="/admin/news" className="text-white/80 hover:text-white">
              Logout
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-5">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border-2 border-stone-200 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-amber-600">{pending.length}</div>
            <div className="text-xs text-stone-500 mt-1">Pending</div>
          </div>
          <div className="bg-white border-2 border-stone-200 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-brand">{approved.length}</div>
            <div className="text-xs text-stone-500 mt-1">Approved</div>
          </div>
          <div className="bg-white border-2 border-stone-200 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-600">{rejected.length}</div>
            <div className="text-xs text-stone-500 mt-1">Rejected</div>
          </div>
        </div>

        <h2 className="text-sm font-bold text-stone-800 mb-3 pb-2 border-b-2 border-stone-200">
          Pending review ({pending.length})
        </h2>
        {pending.length ? (
          pending.map((item) => (
            <NewsCard key={item.id} item={item} adminKey={key} showActions />
          ))
        ) : (
          <EmptyState text="No pending news items. Add rows in Supabase with status pending." />
        )}

        <h2 className="text-sm font-bold text-stone-800 mb-3 mt-6 pb-2 border-b-2 border-stone-200">
          Approved ({approved.length})
        </h2>
        {approved.length ? (
          approved.map((item) => (
            <NewsCard key={item.id} item={item} adminKey={key} showActions={false} />
          ))
        ) : (
          <EmptyState text="No approved news yet" />
        )}

        <h2 className="text-sm font-bold text-stone-800 mb-3 mt-6 pb-2 border-b-2 border-stone-200">
          Rejected ({rejected.length})
        </h2>
        {rejected.length ? (
          rejected.map((item) => (
            <NewsCard key={item.id} item={item} adminKey={key} showActions={false} />
          ))
        ) : (
          <EmptyState text="No rejected items" />
        )}
      </div>
    </div>
  );
}
