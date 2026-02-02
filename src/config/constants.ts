// IPMA alerts endpoint (override with VITE_IPMA_ALERTS_URL in .env)
export const IPMA_ALERTS_URL = import.meta.env.VITE_IPMA_ALERTS_URL ?? "https://api.ipma.pt/open-data/alerts.json";