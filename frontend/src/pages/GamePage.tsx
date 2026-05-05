import { useMemo, useState, useEffect } from 'react';
import { useBackendGameStore } from '../stores/backendGameStore';
import { useGameStore } from '../stores/gameStore';
import { useSpeciesStore } from '../stores/speciesStore';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { GameShell } from '../components/layout/GameShell';
import { TopHud } from '../components/layout/TopHud';
import { CommandBar } from '../components/layout/CommandBar';
import { SpeciesSelectionModal } from '../components/game/SpeciesSelectionModal';
import { MonsterManagementPanel } from '../components/game/MonsterManagementPanel';
import { DungeonBoard } from '../components/game/DungeonBoard';
import { BuildPanel } from '../components/game/BuildPanel';
import { IntelStrip } from '../components/game/IntelStrip';
import { InspectorPanel } from '../components/game/InspectorPanel';
import { useDungeonData } from '../hooks/useDungeonData';
import { advanceGameplay, fetchGameConstantsData } from '../api/gameApi';
import type { Room } from '../types/game';
import { requirePositiveInterval } from '../utils/gameConstants';
import {
  clearGuestSession,
  getFrontpageToken,
  getStoredGuestSession,
  saveGuestSession,
  useAuthStore,
} from '../stores/authStore';

export function GamePage() {
  const { gameState, loading, error, initializeGame, refreshGameState, selectedMonster, resetVersion } =
    useBackendGameStore();
  const addLog = useGameStore(state => state.addLog);
  const { unlockedSpecies } = useSpeciesStore();
  const { user, authMode, loginUrl, setLoginUrl, login, logout } = useAuthStore();
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isStartingGuest, setIsStartingGuest] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const dungeonData = useDungeonData(3000, authReady && Boolean(user) && Boolean(gameState));

  const baseApiUrl = useMemo(() => {
    const configured = import.meta.env.VITE_API_URL as string | undefined;
    if (!configured || configured.trim().length === 0) {
      throw new Error('VITE_API_URL is required');
    }

    return configured.replace(/\/$/, '');
  }, []);

  const resolvedLoginUrl = useMemo(() => {
    const baseLoginUrl = loginUrl;

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
          const guestSession = getStoredGuestSession();
          if (!guestSession?.token) {
            throw new Error('Guest session is missing');
          }

          const response = await fetch(`${baseApiUrl}/auth/link-guest`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${frontpageToken}`,
            },
            body: JSON.stringify({ guest_token: guestSession.token }),
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

        const loginInfoResponse = await fetch(`${baseApiUrl}/auth/login-info`);
        const loginInfo = (await loginInfoResponse.json()) as {
          data?: { login_url?: string };
        };
        if (loginInfoResponse.ok && loginInfo.data?.login_url) {
          setLoginUrl(loginInfo.data.login_url);
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
  }, [baseApiUrl, login, logout, setLoginUrl]);

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

  useEffect(() => {
    if (!authReady || !user || !gameState || loading || gameState.coreDestroyed) {
      return;
    }

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const runTick = async () => {
      try {
        const result = await advanceGameplay();
        if (cancelled || !result.success) {
          return;
        }

        result.events?.forEach(event => {
          addLog({ ...event, timestamp: Date.now() });
        });
        await refreshGameState();
        window.dispatchEvent(new Event('dungeon-core:rooms-changed'));
      } catch (tickError) {
        console.error('Failed to advance gameplay:', tickError);
      }
    };

    const setupTick = async () => {
      const gameConstants = await fetchGameConstantsData();
      if (cancelled) {
        return;
      }
      const intervalMs = requirePositiveInterval(gameConstants, 'TIME_ADVANCE_INTERVAL');

      interval = setInterval(() => {
        void runTick();
      }, intervalMs);
    };

    void setupTick();

    return () => {
      cancelled = true;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [addLog, authReady, gameState?.coreDestroyed, loading, refreshGameState, resetVersion, user]);

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

  if (error && !gameState) {
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

  const playerName = (user.display_name || user.username || user.email || user.id) ?? 'Unknown';
  const selectedRoom: Room | null =
    dungeonData.floors
      .flatMap(floor => floor.rooms)
      .find(room => room.id === selectedRoomId) ?? null;
  const hasInspectorContext = Boolean(selectedRoom || selectedMonster);
  const buildAndMonsterPlacement = (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="h-[17rem] shrink-0">
        <BuildPanel dungeonData={dungeonData} />
      </div>
      <div className="min-h-0 flex-1">
        <MonsterManagementPanel />
      </div>
    </div>
  );

  return (
    <>
      {showSpeciesModal && (
        <SpeciesSelectionModal open={showSpeciesModal} onClose={handleSpeciesSelect} />
      )}

      <GameShell
        hud={
          <TopHud
            gameState={gameState}
            playerName={playerName}
            isGuest={authMode === 'guest' || Boolean(user.is_guest)}
            linkUrl={user.is_guest ? resolvedLoginUrl : undefined}
          />
        }
        commandBar={<CommandBar />}
        left={buildAndMonsterPlacement}
        center={
          <DungeonBoard
            dungeonData={dungeonData}
            selectedRoomId={selectedRoomId}
            onSelectedRoomChange={setSelectedRoomId}
          />
        }
        right={
          hasInspectorContext ? (
            <InspectorPanel dungeonData={dungeonData} selectedRoom={selectedRoom} />
          ) : undefined
        }
        intel={<IntelStrip dungeonData={dungeonData} />}
        mobileMonsters={<MonsterManagementPanel />}
        mobileEvents={<IntelStrip dungeonData={dungeonData} variant="events" />}
        mobileCore={
          hasInspectorContext ? (
            <InspectorPanel dungeonData={dungeonData} selectedRoom={selectedRoom} />
          ) : (
            <IntelStrip dungeonData={dungeonData} variant="core" />
          )
        }
      />
    </>
  );
}
