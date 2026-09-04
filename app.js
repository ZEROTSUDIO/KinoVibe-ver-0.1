// KinoVibe v0.1 — Core Data Layer

const STORAGE_KEY = 'kinovibe_movies';

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Score calculation
// Base = avg of 4 scores
// Final = (sum of 4 scores + totalBias) / 4, clamped 0-10
function calcScores(story, visuals, action, fun, biases = []) {
  story = Number(story) || 0;
  visuals = Number(visuals) || 0;
  action = Number(action) || 0;
  fun = Number(fun) || 0;
  const base = (story + visuals + action + fun) / 4;
  const totalBias = biases.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const raw = (story + visuals + action + fun + totalBias) / 4;
  const final_ = Math.max(0, Math.min(10, raw));
  return {
    base: Math.round(base * 10) / 10,
    totalBias,
    final: Math.round(final_ * 10) / 10
  };
}

// Returns 'high', 'mid', or 'low'
function getScoreLevel(score) {
  if (score >= 7) return 'high';
  if (score >= 4.5) return 'mid';
  return 'low';
}

// Format to 1 decimal place
function formatScore(n) {
  return Number(n).toFixed(1);
}

// Movie Store — localStorage CRUD
class MovieStore {
  static _load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  static _save(movies) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
  }

  static getAll() {
    return this._load();
  }

  static getById(id) {
    return this._load().find(m => m.id === id) || null;
  }

  static save(data) {
    const movies = this._load();
    if (data.id) {
      const idx = movies.findIndex(m => m.id === data.id);
      if (idx !== -1) {
        movies[idx] = { ...movies[idx], ...data, updatedAt: new Date().toISOString() };
        this._save(movies);
        return movies[idx];
      }
    }
    const movie = {
      id: generateId(),
      title: '',
      year: null,
      posterUrl: '',
      backdropUrl: '',
      overview: '',
      genres: [],
      runtime: null,
      tmdbId: null,
      reviewText: '',
      storyScore: 5,
      visualScore: 5,
      actionScore: 5,
      funScore: 5,
      biases: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    delete movie.id;  // remove any passed id since this is a new movie
    movie.id = generateId();
    movies.push(movie);
    this._save(movies);
    return movie;
  }

  static remove(id) {
    const movies = this._load().filter(m => m.id !== id);
    this._save(movies);
  }
}
