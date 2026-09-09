// KinoVibe Modular Application Bridge & Shared Utilities
import { AuthService, supabase } from './services/auth.service.js';
import { MovieService } from './services/movie.service.js';
import { calcScores, getScoreLevel, formatScore, TIERS } from './utils/scoring.js';
import { escapeHtml, Toast, showConfirmModal, Skeleton } from './utils/ui.js';

// Expose on window for backwards-compatibility
if (typeof window !== 'undefined') {
  window._db = supabase;
  window.Auth = AuthService;
  window.MovieStore = MovieService;
  window.calcScores = calcScores;
  window.getScoreLevel = getScoreLevel;
  window.formatScore = formatScore;
  window.escapeHtml = escapeHtml;
  window.Toast = Toast;
  window.showConfirmModal = showConfirmModal;
  window.Skeleton = Skeleton;
  window.TIERS = TIERS;
}

export {
  supabase,
  AuthService,
  AuthService as Auth,
  MovieService,
  MovieService as MovieStore,
  calcScores,
  getScoreLevel,
  formatScore,
  escapeHtml,
  Toast,
  showConfirmModal,
  Skeleton,
  TIERS
};
