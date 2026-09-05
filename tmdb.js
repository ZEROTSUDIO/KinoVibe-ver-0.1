// KinoVibe — TMDB API Module

const TMDB_API_KEY = '5d7d698bb620168d05c62d3d3861502d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

class TMDBService {
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
    try {
      const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query.trim())}&include_adult=false&language=en-US&page=1`;
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
    try {
      const url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`TMDB Details Error: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('TMDB Details Failed:', err);
      return null;
    }
  }
}
