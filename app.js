// KinoVibe v0.2 — Core Data & Supabase Cloud Layer

const SUPABASE_URL = 'https://jiojxurcejwwqyzkyokr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppb2p4dXJjZWp3d3F5emt5b2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MjY2MjAsImV4cCI6MjEwNDEwMjYyMH0.JrWbrpOwB1G4wVQJB5paOvugV6B3udFpYg4jFjnBnYg';

// Initialize Supabase Client
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Auth Helper Functions
const Auth = {
  async getSession() {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  async getUser() {
    const session = await this.getSession();
    return session ? session.user : null;
  },

  async requireAuth() {
    const user = await this.getUser();
    if (!user) {
      window.location.href = 'login.html';
      return null;
    }
    return user;
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
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  },

  async initNav() {
    const user = await this.getUser();
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    // Remove any existing user nav item
    const existing = document.querySelector('.nav-user');
    if (existing) existing.remove();

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

// Movie Store — Supabase Cloud Database (User Scoped via RLS)
class MovieStore {
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
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching movies from Supabase:', error);
      return [];
    }
    return (data || []).map(this._mapFromDB);
  }

  static async getById(id) {
    if (!supabase || !id) return null;
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching movie ${id}:`, error);
      return null;
    }
    return this._mapFromDB(data);
  }

  static async save(data) {
    if (!supabase) throw new Error('Supabase is not initialized');
    const user = await Auth.getUser();
    if (!user) throw new Error('User must be logged in to save reviews');

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
      // Update
      const { data: updated, error } = await supabase
        .from('movies')
        .update(payload)
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return this._mapFromDB(updated);
    } else {
      // Insert
      const { data: inserted, error } = await supabase
        .from('movies')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return this._mapFromDB(inserted);
    }
  }

  static async remove(id) {
    if (!supabase || !id) return;
    const { error } = await supabase
      .from('movies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting movie ${id}:`, error);
      throw error;
    }
  }
}
