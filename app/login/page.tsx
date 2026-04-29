'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage({ searchParams }: { searchParams: Record<string, string | string[]> }) {
  const router = useRouter();
  const redirect = Array.isArray(searchParams.redirect) ? searchParams.redirect[0] : (searchParams.redirect || '/');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
        },
      });
      if (signInError) {
        setError(signInError.message);
      }
    } catch (err) {
      setError('Failed to initiate sign-in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fbfbfd',
        fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", sans-serif',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          padding: '40px',
          borderRadius: '12px',
          background: '#fff',
          border: '1px solid #e0e0e2',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          maxWidth: '400px',
          width: '90%',
        }}
      >
        <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>AI Score</div>
        <div style={{ fontSize: '14px', color: '#6e6e73', marginBottom: '32px' }}>
          Operator Dashboard
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '500',
            background: '#0071e3',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>

        {error && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              background: '#ffebee',
              border: '1px solid #e0b0b0',
              borderRadius: '6px',
              color: '#c62828',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            background: '#f0f9ff',
            border: '1px solid #b3e5fc',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#1976d2',
            lineHeight: '1.6',
          }}
        >
          Only <strong>found@aiscore.co.za</strong> can access this dashboard.
        </div>
      </div>
    </div>
  );
}
