// KinoVibe v0.2 — Core Data & Supabase Cloud Layer

const SUPABASE_URL = 'https://jiojxurcejwwqyzkyokr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppb2p4dXJjZWp3d3F5emt5b2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MjY2MjAsImV4cCI6MjEwNDEwMjYyMH0.JrWbrpOwB1G4wVQJB5paOvugV6B3udFpYg4jFjnBnYg';

// Initialize Supabase Client
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Generate unique ID for local storage mode
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Auth Helper Functions
const Auth = {
  async getSession() {
    if (!supabase) return null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch {
      return null;
    }
  },

  async getUser() {
    const session = await this.getSession();
    return session ? session.user : null;
  },

  async requireAuth() {
    return await this.getUser();
  },

  async signUp(email, password) {
    if (!supabase) throw new Error('Supabase client not initialized');
    return await supabase.auth.signUp({ email, password });
  },

  async signIn(email, password) {
    if (!supabase) throw new Error('Supabase client not initialized');
    return await supabase.auth.signInWithPassword({ email, password });
  },

  async signOut() {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    window.location.href = 'index.html';
  },

  async initNav() {
    const user = await this.getUser();
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    // Remove any existing user nav items
    const existingUser = document.querySelector('.nav-user');
    if (existingUser) existingUser.remove();
    const existingLogin = document.querySelector('.nav-login-link');
    if (existingLogin) existingLogin.remove();

    if (user) {
      const userDiv = document.createElement('div');
      userDiv.className = 'nav-user';
      userDiv.innerHTML = `
        <span class="nav-user-email" title="${escapeHtml(user.email)}">${escapeHtml(user.email)}</span>
        <button class="nav-signout-btn" id="nav-signout-btn">Sign Out</button>
      `;
      navLinks.appendChild(userDiv);

      document.getElementById('nav-signout-btn')?.addEventListener('click', () => {
        Auth.signOut();
      });
    } else {
      const loginLink = document.createElement('a');
      loginLink.href = 'login.html';
      loginLink.className = 'nav-link nav-login-link';
      loginLink.textContent = 'Sign In / Register';
      navLinks.appendChild(loginLink);
    }
  }
};

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

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Movie Store — Hybrid: Supabase Cloud (when logged in) + LocalStorage (fallback/guest)
class MovieStore {
  static _LOCAL_KEY = 'kinovibe_movies';

  static _loadLocal() {
    try {
      return JSON.parse(localStorage.getItem(this._LOCAL_KEY)) || [];
    } catch {
      return [];
    }
  }

  static _saveLocal(movies) {
    try {
      localStorage.setItem(this._LOCAL_KEY, JSON.stringify(movies));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }

  static _mapFromDB(row) {
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      year: row.year,
      posterUrl: row.poster_url,
      reviewText: row.review_text,
      storyScore: Number(row.story_score),
      visualScore: Number(row.visual_score),
      actionScore: Number(row.action_score),
      funScore: Number(row.fun_score),
      biases: Array.isArray(row.biases) ? row.biases : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  static async getAll() {
    const user = await Auth.getUser();
    if (supabase && user) {
      try {
        const { data, error } = await supabase
          .from('movies')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map(this._mapFromDB);
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local storage:', err);
      }
    }
    return this._loadLocal();
  }

  static async getById(id) {
    if (!id) return null;
    const user = await Auth.getUser();
    if (supabase && user) {
      try {
        const { data, error } = await supabase
          .from('movies')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return this._mapFromDB(data);
        }
      } catch (err) {
        console.warn('Supabase getById failed, checking local storage:', err);
      }
    }
    return this._loadLocal().find(m => String(m.id) === String(id)) || null;
  }

  static async save(data) {
    const user = await Auth.getUser();

    // 1. If logged in to Supabase, save to cloud
    if (supabase && user) {
      try {
        const payload = {
          title: data.title,
          year: data.year || null,
          poster_url: data.posterUrl || '',
          review_text: data.reviewText || '',
          story_score: Number(data.storyScore),
          visual_score: Number(data.visualScore),
          action_score: Number(data.actionScore),
          fun_score: Number(data.funScore),
          biases: data.biases || [],
          user_id: user.id,
          updated_at: new Date().toISOString()
        };

        if (data.id) {
          const { data: updated, error } = await supabase
            .from('movies')
            .update(payload)
            .eq('id', data.id)
            .select()
            .single();

          if (!error && updated) {
            return this._mapFromDB(updated);
          }
        } else {
          const { data: inserted, error } = await supabase
            .from('movies')
            .insert([payload])
            .select()
            .single();

          if (!error && inserted) {
            return this._mapFromDB(inserted);
          }
        }
      } catch (err) {
        console.warn('Supabase save failed, saving to local storage instead:', err);
      }
    }

    // 2. Local Storage fallback / Guest mode
    const movies = this._loadLocal();
    if (data.id) {
      const idx = movies.findIndex(m => String(m.id) === String(data.id));
      if (idx !== -1) {
        movies[idx] = { ...movies[idx], ...data, updatedAt: new Date().toISOString() };
        this._saveLocal(movies);
        return movies[idx];
      }
    }

    const movie = {
      id: generateId(),
      title: data.title || '',
      year: data.year || null,
      posterUrl: data.posterUrl || '',
      reviewText: data.reviewText || '',
      storyScore: Number(data.storyScore) || 5,
      visualScore: Number(data.visualScore) || 5,
      actionScore: Number(data.actionScore) || 5,
      funScore: Number(data.funScore) || 5,
      biases: data.biases || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    if (!movie.id) movie.id = generateId();
    movies.unshift(movie);
    this._saveLocal(movies);
    return movie;
  }

  static async remove(id) {
    if (!id) return;
    const user = await Auth.getUser();
    if (supabase && user) {
      try {
        await supabase.from('movies').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase remove failed:', err);
      }
    }
    const movies = this._loadLocal().filter(m => String(m.id) !== String(id));
    this._saveLocal(movies);
  }
}
