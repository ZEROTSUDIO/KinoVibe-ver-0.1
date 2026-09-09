// KinoVibe v0.2 — Secure TMDB Proxy Client
// API keys are kept safely on the server (/api/tmdb/*)

import { TMDBService } from './src/services/tmdb.service.js';

window.TMDBService = TMDBService;

export { TMDBService };
