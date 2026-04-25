import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthMode = 'frontpage' | 'guest';

export interface AuthUser {
    id: string;
    email?: string | null;
    username?: string | null;
    display_name?: string | null;
    role?: string;
    roles?: string[];
    auth_type?: AuthMode | string;
    is_guest?: boolean;
}

export interface StoredGuestSession {
    token: string;
    user: AuthUser;
}

export const WEBHATCHERY_AUTH_STORAGE_KEY = 'auth-storage';
export const GUEST_AUTH_STORAGE_KEY = 'dungeon-core-guest-session';

export interface AuthState {
    user: AuthUser | null;
    token: string | null;
    authMode: AuthMode | null;
    loginUrl: string | null;
    setLoginUrl: (url: string | null) => void;
    login: (user: AuthUser, token: string, authMode?: AuthMode) => void;
    logout: () => void;
}

export const getFrontpageToken = (): string | null => {
    try {
        const raw = localStorage.getItem(WEBHATCHERY_AUTH_STORAGE_KEY);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as { state?: { token?: string | null } };
        return parsed.state?.token ?? null;
    } catch {
        return null;
    }
};

export const getStoredGuestSession = (): StoredGuestSession | null => {
    try {
        const raw = localStorage.getItem(GUEST_AUTH_STORAGE_KEY);
        if (!raw) {
            return null;
        }

        return JSON.parse(raw) as StoredGuestSession;
    } catch {
        return null;
    }
};

export const saveGuestSession = (session: StoredGuestSession): void => {
    localStorage.setItem(GUEST_AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const clearGuestSession = (): void => {
    localStorage.removeItem(GUEST_AUTH_STORAGE_KEY);
};

export const getActiveAuthToken = (): string | null => {
    const guestSession = getStoredGuestSession();
    if (guestSession?.token) {
        return guestSession.token;
    }

    return getFrontpageToken();
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            authMode: null,
            loginUrl: null,
            setLoginUrl: (url) => set({ loginUrl: url }),
            login: (user, token, authMode = 'frontpage') => set({ user, token, authMode, loginUrl: null }),
            logout: () => {
                set({ user: null, token: null, authMode: null });
                clearGuestSession();
            },
        }),
        { name: 'dungeon-core-auth-store' }
    )
);
