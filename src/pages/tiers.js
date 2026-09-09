// KinoVibe Tier List Page Controller
import { AuthService } from '../services/auth.service.js';
import { MovieService } from '../services/movie.service.js';
import { TIERS, calcScores, formatScore, getScoreLevel, getTierForScore } from '../utils/scoring.js';
import { escapeHtml } from '../utils/ui.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Require login — redirect if not authenticated
  const user = await AuthService.getUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  await AuthService.initNav();

  const loadingStateEl = document.getElementById('loading-state');
  const tierCountEl = document.getElementById('tier-count');
  const tierListEl = document.getElementById('tier-list');
  const emptyStateEl = document.getElementById('empty-state');
  const toggleContainer = document.getElementById('tier-view-toggle');
  const btnPosters = document.getElementById('toggle-posters');
  const btnTitles = document.getElementById('toggle-titles');
  const tagFilterBar = document.getElementById('tag-filter-bar');

  let currentView = localStorage.getItem('kinovibe_tier_view') || 'posters';
  let activeTags = new Set();

  // Read URL param (e.g. tiers.html?tag=rewatchable)
  const urlParams = new URLSearchParams(window.location.search);
  const urlTag = urlParams.get('tag');
  if (urlTag) activeTags.add(urlTag.trim().toLowerCase());

  // Show spinner
  if (loadingStateEl) {
    loadingStateEl.classList.remove('hidden');
    loadingStateEl.style.display = 'flex';
  }
  tierListEl.classList.add('hidden');
  emptyStateEl.classList.add('hidden');
  if (toggleContainer) toggleContainer.classList.add('hidden');

  let allMovies = [];
  try {
    allMovies = await MovieService.getAll();
  } catch (err) {
    console.error('Failed to load movies for tier list:', err);
    allMovies = [];
  } finally {
    if (loadingStateEl) {
      loadingStateEl.classList.add('hidden');
      loadingStateEl.style.display = 'none';
    }
  }

  if (allMovies.length === 0) {
    emptyStateEl.classList.remove('hidden');
    tierListEl.classList.add('hidden');
    return;
  }

  emptyStateEl.classList.add('hidden');
  tierListEl.classList.remove('hidden');
  if (toggleContainer) toggleContainer.classList.remove('hidden');

  // ─── Tag Filter Bar ──────────────────────────────────
  function renderTagFilterBar() {
    const allTags = MovieService.getAllTags(allMovies);
    if (allTags.length === 0) {
      tagFilterBar.classList.add('hidden');
      return;
    }
    tagFilterBar.classList.remove('hidden');

    tagFilterBar.innerHTML = `
      <button class="tag-pill ${activeTags.size === 0 ? 'active' : ''}" data-tag="__all__">
        All <span class="tag-pill-count">${allMovies.length}</span>
      </button>
      ${allTags.map(tag => {
        const isActive = activeTags.has(tag);
        const cnt = allMovies.filter(m => Array.isArray(m.tags) && m.tags.includes(tag)).length;
        return `<button class="tag-pill ${isActive ? 'active' : ''}" data-tag="${escapeHtml(tag)}">
          ${escapeHtml(tag)} <span class="tag-pill-count">${cnt}</span>
        </button>`;
      }).join('')}
    `;

    tagFilterBar.querySelectorAll('.tag-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.dataset.tag;
        if (tag === '__all__') {
          activeTags.clear();
        } else {
          activeTags.has(tag) ? activeTags.delete(tag) : activeTags.add(tag);
        }
        if (activeTags.size === 1) {
          const [t] = activeTags;
          history.replaceState(null, '', `?tag=${encodeURIComponent(t)}`);
        } else {
          history.replaceState(null, '', window.location.pathname);
        }
        renderTagFilterBar();
        setView(currentView);
      });
    });
  }

  function getFilteredMovies() {
    if (activeTags.size === 0) return allMovies;
    return allMovies.filter(m => {
      const movieTags = Array.isArray(m.tags) ? m.tags : [];
      for (const t of activeTags) {
        if (movieTags.includes(t)) return true;
      }
      return false;
    });
  }
  // ────────────────────────────────────────────────────

  function buildTierMap(movies) {
    const tierMap = new Map();
    TIERS.forEach(t => tierMap.set(t.label, []));

    movies.forEach(movie => {
      const scores = calcScores(movie.storyScore, movie.visualScore, movie.actionScore, movie.funScore, movie.biases || []);
      const finalScore = Number(scores.final);
      const tier = getTierForScore(finalScore);
      if (tier && tierMap.has(tier.label)) {
        tierMap.get(tier.label).push({ ...movie, finalScore });
      }
    });

    TIERS.forEach(t => {
      const tierMovies = tierMap.get(t.label);
      tierMovies.sort((a, b) => {
        const scoreDiff = (b.finalScore ?? 0) - (a.finalScore ?? 0);
        return scoreDiff !== 0 ? scoreDiff : (a.title || '').localeCompare(b.title || '');
      });
    });

    return tierMap;
  }

  function renderTierList(mode) {
    const filtered = getFilteredMovies();
    const tierMap = buildTierMap(filtered);

    // Update count
    if (activeTags.size > 0) {
      tierCountEl.textContent = `${filtered.length} / ${allMovies.length} movie${allMovies.length !== 1 ? 's' : ''} ranked`;
    } else {
      tierCountEl.textContent = `${allMovies.length} movie${allMovies.length !== 1 ? 's' : ''} ranked`;
    }

    tierListEl.className = mode === 'posters' ? 'view-posters' : 'view-titles';
    tierListEl.innerHTML = '';

    TIERS.forEach(t => {
      const tierMovies = tierMap.get(t.label);
      const isEmpty = tierMovies.length === 0;
      
      let moviesHtml = '';
      tierMovies.forEach(movie => {
        const formattedScore = formatScore(movie.finalScore);
        const level = getScoreLevel(movie.finalScore);
        const titleYear = `${escapeHtml(movie.title)} (${escapeHtml(movie.year) || '—'})`;
        const tooltip = `${titleYear} · Score: ${formattedScore}`;

        if (mode === 'posters') {
          const posterContent = movie.posterUrl
            ? `<img src="${escapeHtml(movie.posterUrl)}" alt="${escapeHtml(movie.title)}" class="tier-poster-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
               <div class="tier-poster-fallback" style="display:none">
                 <div class="tier-poster-fallback-letter">${escapeHtml((movie.title || '?')[0])}</div>
                 <div class="tier-poster-fallback-title">${escapeHtml(movie.title || '')}</div>
               </div>`
            : `<div class="tier-poster-fallback">
                 <div class="tier-poster-fallback-letter">${escapeHtml((movie.title || '?')[0])}</div>
                 <div class="tier-poster-fallback-title">${escapeHtml(movie.title || '')}</div>
               </div>`;

          moviesHtml += `
            <a href="view.html?id=${movie.id}" class="tier-poster-card" title="${tooltip}">
              ${posterContent}
              <div class="tier-poster-score ${level}">${formattedScore}</div>
            </a>
          `;
        } else {
          moviesHtml += `<a href="view.html?id=${movie.id}" class="tier-movie" title="${tooltip}">${titleYear}</a>`;
        }
      });

      const tierRow = document.createElement('div');
      tierRow.className = `tier-row ${isEmpty ? 'tier-empty' : ''}`;
      
      tierRow.innerHTML = `
        <div class="tier-label tier-${t.label.toLowerCase()}">${t.label}</div>
        <div class="tier-movies">
          ${moviesHtml}
        </div>
      `;
      
      tierListEl.appendChild(tierRow);
    });
  }

  function setView(mode) {
    currentView = mode;
    localStorage.setItem('kinovibe_tier_view', mode);

    if (btnPosters) btnPosters.classList.toggle('active', mode === 'posters');
    if (btnTitles) btnTitles.classList.toggle('active', mode === 'titles');

    renderTierList(mode);
  }

  if (btnPosters) btnPosters.addEventListener('click', () => setView('posters'));
  if (btnTitles) btnTitles.addEventListener('click', () => setView('titles'));

  renderTagFilterBar();
  setView(currentView);
});
