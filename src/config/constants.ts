// Google Maps API configuration
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
export const GOOGLE_MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID;

// This is safe to store in the frontend since Google Maps API keys are meant to be public
// and can be restricted by domain in the Google Cloud Console