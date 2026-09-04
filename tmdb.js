// KinoVibe — TMDB API Module

const TMDB_DEFAULT_KEY = '5d7d698bb620168d05c62d3d3861502d';
const TMDB_STORAGE_KEY = 'kinovibe_tmdb_key';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

class TMDBService {
  static getApiKey() {
    return localStorage.getItem(TMDB_STORAGE_KEY) || TMDB_DEFAULT_KEY;
  }

  static setApiKey(key) {
    if (key) {
      localStorage.setItem(TMDB_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(TMDB_STORAGE_KEY);
    }
  }

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

  static async searchMovies(query) {
    if (!query || query.trim().length < 2) return [];
    const apiKey = this.getApiKey();
    try {
      const url = `${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query.trim())}&include_adult=false&language=en-US&page=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`TMDB API Error: ${res.status}`);
      const data = await res.json();
      return data.results || [];
    } catch (err) {
      console.error('TMDB Search Failed:', err);
      return [];
    }
  }

  static async getMovieDetails(tmdbId) {
    if (!tmdbId) return null;
    const apiKey = this.getApiKey();
    try {
      const url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${apiKey}&language=en-US`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`TMDB Details Error: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('TMDB Details Failed:', err);
      return null;
    }
  }
}
