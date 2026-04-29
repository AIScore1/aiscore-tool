'use client';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  ClipboardList,
  FileText,
  LogOut,
  Sparkles,
  Users,
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { AuditTab } from './audit/AuditTab';
import { ImproveTab } from './improve/ImproveTab';
import { RetainerTab } from './retainer/RetainerTab';
import { LeadsPanel } from './leads/LeadsPanel';
import { ApiUsagePanel } from './usage/ApiUsagePanel';

type TabKey = 'audit' | 'improve' | 'articles' | 'leads' | 'usage';

export function AppShell() {
  const [tab, setTab] = useState<TabKey>('audit');
  const [unreadHot, setUnreadHot] = useState(0);

  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await fetch('/api/leads');
        const data = await res.json();
        setUnreadHot(data.unreadHot ?? 0);
      } catch {}
    };
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [tab]);

  // Read tab from URL on first load
  useEffect(() => {
    const url = new URL(window.location.href);
    const t = url.searchParams.get('tab') as TabKey | null;
    if (t && ['audit', 'improve', 'articles', 'leads', 'usage'].includes(t)) {
      setTab(t);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Logo />
          <LogoutButton />
        </div>
        <nav className="max-w-7xl mx-auto px-6 tab-row flex gap-1 overflow-x-auto">
          <TabButton
            active={tab === 'audit'}
            onClick={() => setTab('audit')}
            icon={<BarChart3 size={16} />}
            label="GEO Audit"
          />
          <TabButton
            active={tab === 'improve'}
            onClick={() => setTab('improve')}
            icon={<Sparkles size={16} />}
            label="Improve"
          />
          <TabButton
            active={tab === 'articles'}
            onClick={() => setTab('articles')}
            icon={<FileText size={16} />}
            label="Articles"
          />
          <TabButton
            active={tab === 'leads'}
            onClick={() => setTab('leads')}
            icon={<Users size={16} />}
            label="Leads"
            badge={unreadHot}
          />
          <TabButton
            active={tab === 'usage'}
            onClick={() => setTab('usage')}
            icon={<ClipboardList size={16} />}
            label="API Usage"
          />
        </nav>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        {tab === 'audit' && <AuditTab />}
        {tab === 'improve' && <ImproveTab />}
        {tab === 'articles' && <RetainerTab />}
        {tab === 'leads' && <LeadsPanel />}
        {tab === 'usage' && <ApiUsagePanel />}
      </main>
    </div>
  );
}

function Logo() {
  return (
    <svg width="120" height="32" viewBox="0 0 120 32">
      <text
        x="0"
        y="24"
        fontFamily="SF Pro Display, Helvetica Neue, sans-serif"
        fontSize="22"
        fontWeight="600"
        fill="#29a871"
      >
        AI
      </text>
      <text
        x="32"
        y="24"
        fontFamily="SF Pro Display, Helvetica Neue, sans-serif"
        fontSize="22"
        fontWeight="400"
        fill="#1d1d1f"
      >
        Score
      </text>
    </svg>
  );
}

function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleLogout() {
    setLoading(true);
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2 text-sm text-brand-gray-dark hover:text-brand-black transition-colors disabled:opacity-50"
    >
      <LogOut size={16} />
      {loading ? 'Signing out...' : 'Logout'}
    </button>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        active
          ? 'border-brand-teal text-brand-black'
          : 'border-transparent text-brand-gray-dark hover:text-brand-black'
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge && badge > 0 ? (
        <span
          style={{
            background: '#E24B4A',
            color: '#fff',
            fontSize: 10,
            padding: '1px 6px',
            borderRadius: 999,
            fontWeight: 700,
          }}
        >
          🔥 {badge}
        </span>
      ) : null}
    </button>
  );
}
