import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// Determine the base URL from the environment or use a relative path
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Standardized Web Hatchery Axios Instance
 * Automatically handles Bearer tokens and 401 Unauthorized redirects.
 */
export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Auth Token
apiClient.interceptors.request.use(
    (config) => {
        // We intentionally interact directly with localStorage here to avoid
        // reactivity issues or circular dependencies when initializing Axios outside of React.
        try {
            const authStorageStr = localStorage.getItem('auth-storage');
            if (authStorageStr) {
                const authData = JSON.parse(authStorageStr);
                // Zustand persist wraps state in a `state` object
                const token = authData?.state?.token;
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
        } catch (error) {
            console.warn('Failed to parse auth token from local storage', error);
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle 401s and standardize errors
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Intercept 401 Unauthorized and redirect to central login
        if (error.response?.status === 401) {
            const loginUrl =
                error.response?.data?.login_url ||
                import.meta.env.VITE_WEB_HATCHERY_LOGIN_URL;

            if (loginUrl) {
                // Update the Zustand store to trigger the login UI state
                useAuthStore.getState().setLoginUrl(loginUrl);
            }
        }
        return Promise.reject(error);
    }
);
