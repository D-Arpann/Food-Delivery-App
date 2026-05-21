import { useCallback, useEffect, useRef, useState } from 'react';
import { createAppClient, fetchOwnedRestaurant, logout } from '@repo/api';
import { SUPABASE_DEFAULTS, TABLES, USER_ROLES } from '@repo/utils';
import { CartProvider } from '@repo/ui';
import LoginPage from './components/LoginPage';
import WebPage from './components/WebPage';
import DiscoveryPage from './components/DiscoveryPage';
import RestaurantSignupPage from './components/RestaurantSignupPage';
import RestaurantDashboardPage from './components/RestaurantDashboardPage';
import AdminDashboardPage from './components/AdminDashboardPage';
import BackButton from './components/BackButton';
import useHistoryNavigation from './hooks/useHistoryNavigation';

const supabase = createAppClient({
  supabaseUrl:
    import.meta.env.VITE_SUPABASE_URL || SUPABASE_DEFAULTS.URL,
  supabaseKey:
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    SUPABASE_DEFAULTS.ANON_KEY,
});

const SCREEN = {
  LANDING: 'landing',
  LOGIN: 'login',
  POST_LOGIN: 'post-login',
  RESTAURANT_SIGNUP: 'restaurant-signup',
};

const APP_SCREEN_HISTORY_KEY = 'chito-mitho-app-screen';

function isAppScreen(value) {
  return Object.values(SCREEN).includes(value);
}

function getScreenLabel(screen) {
  if (screen === SCREEN.RESTAURANT_SIGNUP) {
    return 'restaurant registration';
  }

  return 'the previous screen';
}

function PostLoginTransition({ returnScreen, onBack, onContinue, onReturn }) {
  const returnLabel = getScreenLabel(returnScreen);

  return (
    <main className="post-login-shell">
      <section className="post-login-panel" aria-label="Signed in">
        <BackButton className="post-login-back" onClick={onBack} />
        <div className="post-login-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="section-tag">Signed in</span>
        <h1>Welcome back.</h1>
        <p>
          You are signed in. Choose whether to open your workspace now or return to
          {' '}
          {returnLabel}.
        </p>
        <div className="post-login-actions">
          <button type="button" className="btn btn-primary" onClick={onContinue}>
            Open my workspace
          </button>
          <button type="button" className="btn btn-outline" onClick={onReturn}>
            Back to {returnLabel}
          </button>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState(null);
  const [accountRole, setAccountRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [screen, setScreen] = useState(SCREEN.LANDING);
  const [loginReturnScreen, setLoginReturnScreen] = useState(SCREEN.LANDING);
  const [postLoginReturnScreen, setPostLoginReturnScreen] = useState(SCREEN.LANDING);
  const [showPublicAfterLogin, setShowPublicAfterLogin] = useState(false);
  const [accessMessage, setAccessMessage] = useState('');
  const roleResolvedRef = useRef(false);

  const handleScreenChange = useCallback((nextScreen) => {
    setAccessMessage('');
    setScreen(nextScreen);
  }, []);

  const handleScreenHistoryNavigate = useCallback((nextScreen, { source } = {}) => {
    if (source === 'popstate' && session?.user?.id && (
      nextScreen === SCREEN.LANDING ||
      nextScreen === SCREEN.RESTAURANT_SIGNUP
    )) {
      setShowPublicAfterLogin(true);
    }
  }, [session?.user?.id]);

  const {
    goBack: handleGoBack,
    navigate: navigateToScreen,
  } = useHistoryNavigation({
    value: screen,
    onChange: handleScreenChange,
    stateKey: APP_SCREEN_HISTORY_KEY,
    fallbackValue: SCREEN.LANDING,
    isValidValue: isAppScreen,
    onNavigate: handleScreenHistoryNavigate,
  });

  const handlePostLoginBack = useCallback(() => {
    setShowPublicAfterLogin(true);
    handleGoBack();
  }, [handleGoBack]);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }

      setSession(data?.session || null);
      setBooting(false);
    });

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (roleResolvedRef.current) {
        // Once the user's role is resolved, ignore events that don't change
        // the authenticated identity.  TOKEN_REFRESHED fires every time the
        // browser tab regains focus; USER_UPDATED fires on profile-metadata
        // saves.  Neither should restart the role-resolution flow.
        if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          // Still keep the session reference up-to-date (for fresh tokens)
          // but use a functional update so React can bail out when the user
          // id hasn't actually changed.
          setSession((prev) => {
            if (prev?.user?.id === nextSession?.user?.id) return prev;
            return nextSession || null;
          });
          return;
        }
      }

      setSession(nextSession || null);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  // Derive a stable key so the effect only re-runs when the actual user
  // changes, not on every token refresh (which creates a new object ref).
  const sessionUserId = session?.user?.id ?? null;

  useEffect(() => {
    if (!session?.user?.id) {
      setAccountRole(null);
      setRoleLoading(false);
      return undefined;
    }

    if (screen === SCREEN.LOGIN || screen === SCREEN.POST_LOGIN) {
      setRoleLoading(false);
      return undefined;
    }

    if (screen === SCREEN.RESTAURANT_SIGNUP) {
      const trustedRole = session.user?.app_metadata?.role || session.user?.user_metadata?.role || '';
      const trustedVerificationStatus =
        session.user?.app_metadata?.verification_status ||
        session.user?.user_metadata?.verification_status ||
        '';

      if (!(trustedRole === USER_ROLES.RIDER && trustedVerificationStatus === 'verified')) {
        setRoleLoading(false);
        return undefined;
      }
    }

    let active = true;
    setRoleLoading(true);

    async function resolveAccountRole() {
      try {
        const trustedRole = session.user?.app_metadata?.role || session.user?.user_metadata?.role || '';
        const trustedVerificationStatus =
          session.user?.app_metadata?.verification_status ||
          session.user?.user_metadata?.verification_status ||
          '';
        const hasTrustedRole = Object.values(USER_ROLES).includes(trustedRole);

        if (session.isTemporaryAuth) {
          if (active) {
            setAccountRole(hasTrustedRole ? trustedRole : USER_ROLES.CUSTOMER);
          }
          return;
        }

        const { data: profile, error } = await supabase
          .from(TABLES.USER_PROFILES)
          .select('role, verification_status')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!active) {
          return;
        }

        if (error) {
          console.error('Error fetching profile role:', error);
          setAccountRole(hasTrustedRole ? trustedRole : USER_ROLES.CUSTOMER);
          return;
        }

        if (!profile) {
          if (trustedRole === USER_ROLES.RIDER && trustedVerificationStatus === 'verified') {
            await logout(supabase);
            if (active) {
              setSession(null);
              setAccountRole(null);
              setAccessMessage('Rider accounts should use the mobile app.');
              setScreen(SCREEN.LOGIN);
            }
            return;
          }

          if (hasTrustedRole) {
            setAccountRole(trustedRole);
            return;
          }

          await logout(supabase);
          if (active) {
            setSession(null);
            setAccountRole(null);
            setScreen(SCREEN.LOGIN);
          }
          return;
        }

        const resolvedRole = profile?.role || (hasTrustedRole ? trustedRole : USER_ROLES.CUSTOMER);
        const resolvedVerificationStatus = profile?.verification_status || trustedVerificationStatus || 'verified';

        if (resolvedRole === USER_ROLES.RIDER && resolvedVerificationStatus === 'verified') {
          await logout(supabase);
          if (active) {
            setSession(null);
            setAccountRole(null);
            setAccessMessage('Rider accounts should use the mobile app.');
            setScreen(SCREEN.LOGIN);
          }
          return;
        }

        if (resolvedRole === USER_ROLES.RESTAURANT_OWNER) {
          setScreen(SCREEN.LANDING);
          setAccountRole(USER_ROLES.RESTAURANT_OWNER);
          return;
        }

        if (resolvedRole === USER_ROLES.CUSTOMER) {
          const { data: ownedRestaurant, error: restaurantError } = await fetchOwnedRestaurant(
            supabase,
            session.user.id,
          );

          if (!active) {
            return;
          }

          if (restaurantError) {
            console.error('Error fetching owned restaurant:', restaurantError);
          } else if (ownedRestaurant?.verification_status === 'verified') {
            setAccountRole(USER_ROLES.RESTAURANT_OWNER);
            return;
          } else if (ownedRestaurant?.verification_status === 'pending') {
            setScreen(SCREEN.RESTAURANT_SIGNUP);
          }
        }

        setAccountRole(resolvedRole);
      } catch (error) {
        console.error('Error resolving account role:', error);
        if (active) {
          setAccountRole(USER_ROLES.CUSTOMER);
        }
      } finally {
        if (active) {
          setRoleLoading(false);
          roleResolvedRef.current = true;
        }
      }
    }

    resolveAccountRole();

    return () => {
      active = false;
    };
  }, [screen, sessionUserId]);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    await logout(supabase);
    setSession(null);
    setAccountRole(null);
    setPostLoginReturnScreen(SCREEN.LANDING);
    setShowPublicAfterLogin(false);
    navigateToScreen(SCREEN.LANDING, { resetHistory: true });
  };

  const handleOpenRestaurantSignup = () => {
    setShowPublicAfterLogin(false);
    navigateToScreen(SCREEN.RESTAURANT_SIGNUP);
  };

  const handleOpenLogin = (returnScreen = screen) => {
    setLoginReturnScreen(returnScreen);
    setAccessMessage('');
    setShowPublicAfterLogin(false);
    navigateToScreen(SCREEN.LOGIN);
  };

  const handleContinueToApp = useCallback(() => {
    setShowPublicAfterLogin(false);
    setPostLoginReturnScreen(SCREEN.LANDING);
    navigateToScreen(SCREEN.LANDING, { resetHistory: true });
  }, [navigateToScreen]);

  const handleReturnAfterLogin = useCallback(() => {
    setShowPublicAfterLogin(true);
    navigateToScreen(postLoginReturnScreen || SCREEN.LANDING, { resetHistory: true });
    setLoginReturnScreen(SCREEN.LANDING);
  }, [navigateToScreen, postLoginReturnScreen]);

  const handleRestaurantApplicationVerified = useCallback(() => {
    setAccountRole(USER_ROLES.RESTAURANT_OWNER);
    setShowPublicAfterLogin(false);
    navigateToScreen(SCREEN.LANDING, { resetHistory: true });
  }, [navigateToScreen]);

  if (booting) {
    return (
      <main className="screen-center">
        <div className="pulse" />
        <p>Loading Chito Mitho...</p>
      </main>
    );
  }

  const showPublicShell = !session ||
    screen === SCREEN.LOGIN ||
    screen === SCREEN.POST_LOGIN ||
    screen === SCREEN.RESTAURANT_SIGNUP ||
    showPublicAfterLogin;

  if (showPublicShell) {
    return (
      <>
        {screen === SCREEN.POST_LOGIN ? (
          <PostLoginTransition
            returnScreen={postLoginReturnScreen}
            onBack={handlePostLoginBack}
            onContinue={handleContinueToApp}
            onReturn={handleReturnAfterLogin}
          />
        ) : screen === SCREEN.RESTAURANT_SIGNUP ? (
          <RestaurantSignupPage
            supabase={supabase}
            session={session}
            onBack={handleGoBack}
            onAuthenticated={setSession}
            onApplicationVerified={handleRestaurantApplicationVerified}
          />
        ) : screen === SCREEN.LOGIN ? (
          <LoginPage
            supabase={supabase}
            notice={accessMessage}
            onBack={handleGoBack}
            onOpenRestaurantSignup={handleOpenRestaurantSignup}
            onAuthenticated={(nextSession) => {
              const nextReturnScreen = loginReturnScreen || SCREEN.LANDING;
              setAccessMessage('');
              setSession(nextSession);
              setPostLoginReturnScreen(nextReturnScreen);
              setShowPublicAfterLogin(false);
              navigateToScreen(SCREEN.POST_LOGIN, { replace: true });
              setLoginReturnScreen(SCREEN.LANDING);
            }}
          />
        ) : (
          <WebPage
            supabase={supabase}
            isAuthenticated={Boolean(session)}
            onBack={handleGoBack}
            onContinueToApp={handleContinueToApp}
            onOpenLogin={() => handleOpenLogin(SCREEN.LANDING)}
            onOpenRestaurantSignup={handleOpenRestaurantSignup}
          />
        )}
      </>
    );
  }

  if (roleLoading) {
    return (
      <main className="screen-center">
        <div className="pulse" />
        <p>Loading your workspace...</p>
      </main>
    );
  }

  if (accountRole === USER_ROLES.RESTAURANT_OWNER) {
    return (
      <RestaurantDashboardPage
        session={session}
        supabase={supabase}
        onBack={handleGoBack}
        onLogout={handleLogout}
      />
    );
  }

  if (accountRole === USER_ROLES.ADMIN) {
    return (
      <AdminDashboardPage
        session={session}
        supabase={supabase}
        onBack={handleGoBack}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <CartProvider>
      <DiscoveryPage
        session={session}
        supabase={supabase}
        onBack={handleGoBack}
        onLogout={handleLogout}
      />
    </CartProvider>
  );
}
