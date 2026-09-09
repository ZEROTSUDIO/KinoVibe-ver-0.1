// KinoVibe v0.2 — Modular Application Bridge
import { AuthService, supabase } from './src/services/auth.service.js';
import { MovieService } from './src/services/movie.service.js';
import { calcScores, getScoreLevel, formatScore, TIERS } from './src/utils/scoring.js';
import { escapeHtml, Toast, showConfirmModal, Skeleton } from './src/utils/ui.js';

// Expose on window for vanilla HTML pages
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

export {
  supabase,
  AuthService as Auth,
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
