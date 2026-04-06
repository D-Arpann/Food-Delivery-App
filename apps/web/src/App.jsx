import { useEffect, useState } from 'react';
import { createAppClient, logout } from '@repo/api';
import { SUPABASE_DEFAULTS } from '@repo/utils';
import { Button } from '@repo/ui';
import LoginPopup from './components/LoginPopup';
import WebPage from './components/WebPage';

const supabase = createAppClient({
  supabaseUrl:
    import.meta.env.VITE_SUPABASE_URL || SUPABASE_DEFAULTS.URL,
  supabaseKey:
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    SUPABASE_DEFAULTS.ANON_KEY,
});

export default function App() {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }

      setSession(data?.session || null);
      setBooting(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const userName =
    session?.user?.user_metadata?.full_name ||
    session?.user?.phone ||
    'Hey User';

  const firstName = userName.split(' ')[0] || userName;

  const handleLogout = async () => {
    await logout(supabase);
    setSession(null);
  };

  if (booting) {
    return (
      <main className="screen-center">
        <div className="pulse" />
        <p>Loading Chito Mitho...</p>
      </main>
    );
  }

  const showAuthShell = !session || isLoginOpen;

  if (showAuthShell) {
    return (
      <>
        <WebPage onOpenLogin={() => setIsLoginOpen(true)} />
        <LoginPopup
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          supabase={supabase}
          onAuthenticated={setSession}
        />
      </>
    );
  }

  const user = session?.user;
  const accountRows = [
    { label: 'User ID', value: user?.id },
    { label: 'Phone', value: user?.phone },
    { label: 'Email', value: user?.email },
    { label: 'Full Name', value: user?.user_metadata?.full_name },
    { label: 'Date of Birth', value: user?.user_metadata?.date_of_birth },
    {
      label: 'Created At',
      value: user?.created_at
        ? new Date(user.created_at).toLocaleString()
        : null,
    },
  ];

  return (
    <main className="account-shell">
      <header className="account-top">
        <div className="hello-block">
          <div className="avatar-bubble">{firstName.slice(0, 1).toUpperCase()}</div>
          <div>
            <p className="hello-title">Hey {firstName}</p>
            <p className="hello-subtitle">Account placeholder page</p>
          </div>
        </div>
        <Button
          title="Logout"
          variant="outline"
          onClick={handleLogout}
          style={{ minHeight: '44px', padding: '0 18px' }}
        />
      </header>

      <section className="account-placeholder">
        <h2>Welcome</h2>
        <p className="account-note">
          Next pages will be added in upcoming steps. For now, this screen shows account details.
        </p>

        <div className="account-grid">
          {accountRows.map((row) => (
            <div className="account-row" key={row.label}>
              <span className="account-label">{row.label}</span>
              <span className="account-value">{row.value || 'Not available'}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
