export const AUTH_COOKIE_NAME = '.AspNetCore.Identity.Application';
const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5236';

// For local network access, we need the API URL to match the machine's IP, not 'localhost'
// This helper replaces localhost in the API URL with the actual host of the page if it's an IP
export const API_BASE_URL = (() => {
    if (typeof window !== 'undefined' && (baseApiUrl.includes('localhost') || baseApiUrl.includes('127.0.0.1'))) {
        const hostname = window.location.hostname;
        // If we are on a network (not localhost), replace localhost in the backend URL
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            return baseApiUrl.replace('localhost', hostname).replace('127.0.0.1', hostname);
        }
    }
    return baseApiUrl;
})();
