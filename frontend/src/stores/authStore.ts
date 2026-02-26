import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthState {
    user: any;
    token: string | null;
    loginUrl: string | null;
    setLoginUrl: (url: string | null) => void;
    login: (user: any, token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            loginUrl: null,
            setLoginUrl: (url) => set({ loginUrl: url }),
            login: (user, token) => set({ user, token, loginUrl: null }),
            logout: () => {
                set({ user: null, token: null });
                localStorage.removeItem('auth-storage');
            },
        }),
        { name: 'auth-storage' }
    )
);
