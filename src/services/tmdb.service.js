// KinoVibe TMDB Service — Secure Proxy-Based Client
// All requests route through /api/tmdb to keep API keys shielded on the server.

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export class TMDBService {
  static getPosterUrl(path, size = 'w500') {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
  }

  static getBackdropUrl(path, size = 'w1280') {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
  }

  /**
   * Search movies via serverless proxy /api/tmdb/search
   */
  static async searchMovies(query) {
    if (!query || query.trim().length < 2) return [];
    try {
      const url = `/api/tmdb/search?query=${encodeURIComponent(query.trim())}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `TMDB Search failed (status ${res.status})`);
      }

      const data = await res.json();
      return data.results || [];
    } catch (err) {
      console.warn('TMDB Search Warning:', err.message);
      return [];
    }
  }

  /**
   * Get movie details via serverless proxy /api/tmdb/details
   */
  static async getMovieDetails(tmdbId) {
    if (!tmdbId) return null;
    try {
      const url = `/api/tmdb/details?id=${encodeURIComponent(tmdbId)}`;
      const res = await fetch(url);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `TMDB Details failed (status ${res.status})`);
      }

      return await res.json();
    } catch (err) {
      console.warn('TMDB Details Warning:', err.message);
      return null;
    }
  }
}
