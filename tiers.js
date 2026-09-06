const TIERS = [
  { label: 'S', min: 9,   color: '#fbbf24' },
  { label: 'A', min: 8,   color: '#f43f5e' },
  { label: 'B', min: 7,   color: '#f97316' },
  { label: 'C', min: 6,   color: '#eab308' },
  { label: 'D', min: 5,   color: '#22c55e' },
  { label: 'E', min: 4,   color: '#3b82f6' },
  { label: 'F', min: -Infinity, color: '#6b7280' },
];

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', async () => {
  // Require login — redirect if not authenticated
  const user = await Auth.getUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  await Auth.initNav();

  const loadingStateEl = document.getElementById('loading-state');
  const tierCountEl = document.getElementById('tier-count');
  const tierListEl = document.getElementById('tier-list');
  const emptyStateEl = document.getElementById('empty-state');
  const toggleContainer = document.getElementById('tier-view-toggle');
  const btnPosters = document.getElementById('toggle-posters');
  const btnTitles = document.getElementById('toggle-titles');

  let currentView = localStorage.getItem('kinovibe_tier_view') || 'posters';

  // Show spinner
  if (loadingStateEl) {
    loadingStateEl.classList.remove('hidden');
    loadingStateEl.style.display = 'flex';
  }
  tierListEl.classList.add('hidden');
  emptyStateEl.classList.add('hidden');
  if (toggleContainer) toggleContainer.classList.add('hidden');

  let movies = [];
  try {
    movies = await MovieStore.getAll();
  } catch (err) {
    console.error('Failed to load movies for tier list:', err);
    movies = [];
  } finally {
    // Always hide spinner
    if (loadingStateEl) {
      loadingStateEl.classList.add('hidden');
      loadingStateEl.style.display = 'none';
    }
  }

  tierCountEl.textContent = `${movies.length} movie${movies.length !== 1 ? 's' : ''} ranked`;

  if (movies.length === 0) {
    emptyStateEl.classList.remove('hidden');
    tierListEl.classList.add('hidden');
    return;
  }

  emptyStateEl.classList.add('hidden');
  tierListEl.classList.remove('hidden');
  if (toggleContainer) toggleContainer.classList.remove('hidden');

  const tierMap = new Map();
  TIERS.forEach(t => tierMap.set(t.label, []));

  movies.forEach(movie => {
    const scores = calcScores(movie.storyScore, movie.visualScore, movie.actionScore, movie.funScore, movie.biases || []);
    const finalScore = Number(scores.final);
    
    const tier = TIERS.find(t => finalScore >= t.min);
    if (tier) {
      tierMap.get(tier.label).push({ ...movie, finalScore });
    }
  });

  TIERS.forEach(t => {
    const tierMovies = tierMap.get(t.label);
    tierMovies.sort((a, b) => {
      const scoreDiff = (b.finalScore ?? 0) - (a.finalScore ?? 0);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      return (a.title || '').localeCompare(b.title || '');
    });
  });

  function renderTierList(mode) {
    tierListEl.className = mode === 'posters' ? 'view-posters' : 'view-titles';
    tierListEl.innerHTML = '';

    TIERS.forEach(t => {
      const tierMovies = tierMap.get(t.label);
      const isEmpty = tierMovies.length === 0;
      
      let moviesHtml = '';
      tierMovies.forEach(movie => {
        const formattedScore = typeof formatScore === 'function' ? formatScore(movie.finalScore) : movie.finalScore;
        const level = typeof getScoreLevel === 'function' ? getScoreLevel(movie.finalScore) : '';
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
        <div class="tier-label" style="background: ${t.color}">${t.label}</div>
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

  if (btnPosters) {
    btnPosters.addEventListener('click', () => setView('posters'));
  }
  if (btnTitles) {
    btnTitles.addEventListener('click', () => setView('titles'));
  }

  setView(currentView);
});
