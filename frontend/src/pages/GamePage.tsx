import { useMemo, useState, useEffect } from 'react';
import { useBackendGameStore } from '../stores/backendGameStore';
import { useSpeciesStore } from '../stores/speciesStore';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ResourceBar } from '../components/layout/ResourceBar';
import { SpeciesSelectionModal } from '../components/game/SpeciesSelectionModal';
import { MonsterSelector } from '../components/game/MonsterSelector';
import { DungeonView } from '../components/game/DungeonView';
import { GameControls } from '../components/game/GameControls';
import { RoomSelector } from '../components/game/RoomSelector';
import {
  clearGuestSession,
  getFrontpageToken,
  getStoredGuestSession,
  saveGuestSession,
  useAuthStore,
} from '../stores/authStore';

export function GamePage() {
  const { gameState, loading, error, initializeGame, refreshGameState } = useBackendGameStore();
  const { unlockedSpecies } = useSpeciesStore();
  const { user, authMode, loginUrl, setLoginUrl, login, logout } = useAuthStore();
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isStartingGuest, setIsStartingGuest] = useState(false);

  const baseApiUrl = useMemo(() => {
    const configured = import.meta.env.VITE_API_URL as string | undefined;
    if (!configured || configured.trim().length === 0) {
      throw new Error('VITE_API_URL is required');
    }

    return configured.replace(/\/$/, '');
  }, []);

  const resolvedLoginUrl = useMemo(() => {
    const baseLoginUrl =
      loginUrl ||
      import.meta.env.VITE_WEB_HATCHERY_LOGIN_URL ||
      import.meta.env.VITE_LOGIN_URL ||
      '';

    if (!baseLoginUrl) {
      return '';
    }

    const url = new URL(baseLoginUrl, window.location.origin);
    url.searchParams.set('return_to', window.location.href);

    if (user?.is_guest && user.id) {
      url.searchParams.set('guest_user_id', user.id);
    }

    return url.toString();
  }, [loginUrl, user]);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const requestedGuestLink = params.get('guest_user_id');
        const frontpageToken = getFrontpageToken();

        if (requestedGuestLink && frontpageToken) {
          const response = await fetch(`${baseApiUrl}/auth/link-guest`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${frontpageToken}`,
            },
            body: JSON.stringify({ guest_user_id: requestedGuestLink }),
          });
          const data = (await response.json()) as { data?: { user?: typeof user } };
          if (!response.ok || !data.data?.user) {
            throw new Error('Failed to link guest account');
          }

          clearGuestSession();
          login(data.data.user, frontpageToken, 'frontpage');
          params.delete('guest_user_id');
          const nextQuery = params.toString();
          window.history.replaceState({}, document.title, `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`);
          setAuthReady(true);
          setAuthError(null);
          return;
        }

        const guestSession = getStoredGuestSession();
        if (guestSession?.token) {
          const response = await fetch(`${baseApiUrl}/auth/session`, {
            headers: {
              Authorization: `Bearer ${guestSession.token}`,
            },
          });
          const data = (await response.json()) as { data?: { user?: typeof user } };
          if (!response.ok || !data.data?.user) {
            throw new Error('Failed to load guest session');
          }

          saveGuestSession({ token: guestSession.token, user: data.data.user });
          login(data.data.user, guestSession.token, 'guest');
          setAuthReady(true);
          setAuthError(null);
          return;
        }

        if (frontpageToken) {
          const response = await fetch(`${baseApiUrl}/auth/session`, {
            headers: {
              Authorization: `Bearer ${frontpageToken}`,
            },
          });
          const data = (await response.json()) as { data?: { user?: typeof user } };
          if (!response.ok || !data.data?.user) {
            throw new Error('Failed to load frontpage session');
          }

          login(data.data.user, frontpageToken, 'frontpage');
          setAuthReady(true);
          setAuthError(null);
          return;
        }

        setAuthReady(true);
      } catch (bootstrapError) {
        console.error('Failed to initialize auth session:', bootstrapError);
        clearGuestSession();
        logout();
        setAuthError(bootstrapError instanceof Error ? bootstrapError.message : 'Failed to initialize auth session');
        setAuthReady(true);
      }
    };

    bootstrapAuth();
  }, [baseApiUrl, login, logout]);

  useEffect(() => {
    const handleLoginRequired = (event: Event) => {
      const customEvent = event as CustomEvent<{ loginUrl?: string }>;
      if (customEvent.detail?.loginUrl) {
        setLoginUrl(customEvent.detail.loginUrl);
      }
    };

    window.addEventListener('webhatchery:login-required', handleLoginRequired as EventListener);
    return () => window.removeEventListener('webhatchery:login-required', handleLoginRequired as EventListener);
  }, [setLoginUrl]);

  useEffect(() => {
    if (authReady && user) {
      initializeGame();
    }
  }, [authReady, initializeGame, user]);

  // Check if species modal should be shown
  useEffect(() => {
    if (unlockedSpecies.length === 0 && gameState) {
      setShowSpeciesModal(true);
    }
  }, [unlockedSpecies.length, gameState]);

  // Auto-refresh game state every 5 seconds
  useEffect(() => {
    if (gameState) {
      console.log('Setting up auto-refresh interval');
      const interval = setInterval(() => {
        console.log('Auto-refreshing game state...');
        refreshGameState();
      }, 5000);
      return () => {
        console.log('Clearing auto-refresh interval');
        clearInterval(interval);
      };
    }
  }, [refreshGameState, gameState]);

  // Handle species selection from modal
  const handleSpeciesSelect = () => {
    setShowSpeciesModal(false);
  };

  const handleGuestStart = async () => {
    try {
      setIsStartingGuest(true);
      setAuthError(null);
      const response = await fetch(`${baseApiUrl}/auth/guest-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = (await response.json()) as { data?: { user?: typeof user; token?: string } };
      if (!response.ok || !data.data?.user || !data.data?.token) {
        throw new Error('Failed to create guest session');
      }

      saveGuestSession({
        token: data.data.token,
        user: data.data.user,
      });
      login(data.data.user, data.data.token, 'guest');
    } catch (guestError) {
      setAuthError(guestError instanceof Error ? guestError.message : 'Failed to create guest session');
    } finally {
      setIsStartingGuest(false);
    }
  };

  if (!authReady) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-6">
        <div className="max-w-xl w-full bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold mb-3 text-emerald-300">Dungeon Core</h1>
          <p className="text-gray-300 mb-6">
            Start building your dungeon as a guest, or sign in with your WebHatchery account to link progress permanently.
          </p>
          {authError ? <p className="text-red-300 mb-4">{authError}</p> : null}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => void handleGuestStart()}
              disabled={isStartingGuest}
              className="px-5 py-3 rounded-lg bg-emerald-400 text-gray-950 font-semibold hover:bg-emerald-300 disabled:opacity-70"
            >
              {isStartingGuest ? 'Starting Guest Session...' : 'Continue as Guest'}
            </button>
            {resolvedLoginUrl ? (
              <a
                href={resolvedLoginUrl}
                className="px-5 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold text-center"
              >
                Login with WebHatchery
              </a>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="bg-red-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button
            onClick={initializeGame}
            className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="border-b border-gray-800 bg-gray-950/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-emerald-300 font-semibold">Dungeon Core</div>
            <div className="text-xs text-gray-400">
              {(user.display_name || user.username || user.email || user.id) ?? 'Unknown'}
              {authMode === 'guest' ? ' (Guest)' : ''}
            </div>
          </div>
          {user.is_guest && resolvedLoginUrl ? (
            <a
              href={resolvedLoginUrl}
              className="px-4 py-2 rounded-lg bg-amber-500 text-gray-950 font-semibold hover:bg-amber-400"
            >
              Link Account
            </a>
          ) : null}
        </div>
      </div>
      <ResourceBar gameState={gameState} />

      {showSpeciesModal && (
        <SpeciesSelectionModal open={showSpeciesModal} onClose={handleSpeciesSelect} />
      )}

      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar - Room construction */}
          <div className="lg:col-span-1">
            <RoomSelector />
          </div>

          {/* Center - Dungeon view */}
          <div className="lg:col-span-2">
            {/* DungeonView now handles its own floor/room data and monster placement */}
            <DungeonView />
          </div>

          {/* Right sidebar - Monster management */}
          <div className="lg:col-span-1">
            <MonsterSelector />

            <div className="bg-gray-800 p-4 rounded-lg mt-6">
              <h3 className="text-lg font-semibold mb-3 text-white">Monsters</h3>
              {/* Monsters will be shown by individual room components */}
              <p className="text-gray-400 text-sm">
                Monsters are displayed in their respective rooms
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating game controls at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 shadow-lg">
        <div className="container mx-auto">
          <GameControls />
        </div>
      </div>
    </div>
  );
}
