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
  const user = await Auth.requireAuth();
  if (!user) return;
  await Auth.initNav();

  const loadingStateEl = document.getElementById('loading-state');
  const tierCountEl = document.getElementById('tier-count');
  const tierListEl = document.getElementById('tier-list');
  const emptyStateEl = document.getElementById('empty-state');

  loadingStateEl?.classList.remove('hidden');
  tierListEl.classList.add('hidden');
  emptyStateEl.classList.add('hidden');

  const movies = await MovieStore.getAll();
  loadingStateEl?.classList.add('hidden');

  tierCountEl.textContent = `${movies.length} movies ranked`;

  if (movies.length === 0) {
    emptyStateEl.classList.remove('hidden');
    tierListEl.classList.add('hidden');
    return;
  }

  emptyStateEl.classList.add('hidden');
  tierListEl.classList.remove('hidden');

  const tierMap = new Map();
  TIERS.forEach(t => tierMap.set(t.label, []));

  movies.forEach(movie => {
    const scores = calcScores(movie.storyScore, movie.visualScore, movie.actionScore, movie.funScore, movie.biases || []);
    const finalScore = Number(scores.final);
    
    const tier = TIERS.find(t => finalScore >= t.min);
    if (tier) {
      tierMap.get(tier.label).push(movie);
    }
  });

  TIERS.forEach(t => {
    const tierMovies = tierMap.get(t.label);
    tierMovies.sort((a, b) => a.title.localeCompare(b.title));
  });

  tierListEl.innerHTML = '';
  
  TIERS.forEach(t => {
    const tierMovies = tierMap.get(t.label);
    const isEmpty = tierMovies.length === 0;
    
    let moviesHtml = '';
    tierMovies.forEach(movie => {
      moviesHtml += `<a href="view.html?id=${movie.id}" class="tier-movie">${escapeHtml(movie.title)} (${movie.year})</a>`;
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
});
