// Override per environment with VITE_BACKEND_URL (e.g. the production API).
export const BACKEND_URL: string = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3010/api";
