// KinoVibe Admin & Moderation Service
import { supabase, AuthService } from './auth.service.js';
import { Toast } from '../utils/ui.js';

export const AdminService = {
  /**
   * Fetch platform analytics and metrics
   */
  async getDashboardStats() {
    const isUserAdmin = await AuthService.isAdmin();
    if (!isUserAdmin) throw new Error('Unauthorized');

    try {
      // 1. Total users
      const { count: userCount, error: userErr } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // 2. All movies (for rating stats & tiers)
      const { data: movies, error: movieErr } = await supabase
        .from('movies')
        .select('id, final_score, is_public, created_at');

      if (userErr) console.warn('User stats error:', userErr.message);
      if (movieErr) console.warn('Movie stats error:', movieErr.message);

      const movieList = movies || [];
      const totalMovies = movieList.length;
      const publicMovies = movieList.filter(m => m.is_public !== false).length;

      let avgScore = 0;
      const tierCounts = { S: 0, A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };

      if (totalMovies > 0) {
        const sum = movieList.reduce((acc, m) => acc + (Number(m.final_score) || 0), 0);
        avgScore = Math.round((sum / totalMovies) * 10) / 10;

        movieList.forEach(m => {
          const s = Number(m.final_score) || 0;
          if (s >= 9.0) tierCounts.S++;
          else if (s >= 8.0) tierCounts.A++;
          else if (s >= 7.0) tierCounts.B++;
          else if (s >= 6.0) tierCounts.C++;
          else if (s >= 5.0) tierCounts.D++;
          else if (s >= 4.0) tierCounts.E++;
          else tierCounts.F++;
        });
      }

      return {
        totalUsers: userCount || 1,
        totalMovies,
        publicMovies,
        privateMovies: totalMovies - publicMovies,
        avgScore,
        tierCounts
      };
    } catch (err) {
      console.error('Admin getDashboardStats error:', err);
      throw err;
    }
  },

  /**
   * List registered users with movie counts
   */
  async getUsers() {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return profiles || [];
  },

  /**
   * List all movies across platform for moderation
   */
  async getModerationList({ limit = 50 } = {}) {
    const { data, error } = await supabase
      .from('movies')
      .select('id, user_id, title, year, poster_url, review_text, final_score, is_public, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Toggle visibility (is_public) for moderation
   */
  async toggleVisibility(movieId, isPublic) {
    const { data, error } = await supabase
      .from('movies')
      .update({ is_public: isPublic, updated_at: new Date().toISOString() })
      .eq('id', movieId)
      .select()
      .single();

    if (error) throw error;
    Toast.success(`Review visibility set to ${isPublic ? 'Public' : 'Hidden / Private'}`);
    return data;
  },

  /**
   * Delete movie as moderator
   */
  async deleteMovie(movieId) {
    const { error } = await supabase
      .from('movies')
      .delete()
      .eq('id', movieId);

    if (error) throw error;
    Toast.success('Review permanently removed by moderator.');
  }
};
