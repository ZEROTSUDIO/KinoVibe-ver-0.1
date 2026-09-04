document.addEventListener('DOMContentLoaded', async () => {
  // Check Authentication
  const user = await Auth.requireAuth();
  if (!user) return;
  await Auth.initNav();

  const grid = document.getElementById('movie-grid');
  const countEl = document.getElementById('movie-count');
  const emptyState = document.getElementById('empty-state');
  const loadingState = document.getElementById('loading-state');
  const sortSelect = document.getElementById('sort-select');

  let allMovies = [];

  async function loadAndRender() {
    loadingState?.classList.remove('hidden');
    grid.classList.add('hidden');
    emptyState.classList.add('hidden');

    allMovies = await MovieStore.getAll();
    loadingState?.classList.add('hidden');
    renderList();
  }

  function renderList() {
    const sort = sortSelect.value;
    const movies = sortMovies(allMovies, sort);

    // Update count
    countEl.textContent = `${movies.length} movie${movies.length !== 1 ? 's' : ''} logged`;

    // Show/hide empty state
    if (movies.length === 0) {
      grid.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }
    grid.classList.remove('hidden');
    emptyState.classList.add('hidden');

    // Render cards
    grid.innerHTML = '';
    movies.forEach((movie, i) => {
      const scores = calcScores(movie.storyScore, movie.visualScore, movie.actionScore, movie.funScore, movie.biases || []);
      const level = getScoreLevel(scores.final);
      
      // Poster content: image or fallback letter
      const posterContent = movie.posterUrl
        ? `<img src="${movie.posterUrl}" alt="${escapeHtml(movie.title)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="poster-fallback" style="display:none">${escapeHtml((movie.title || '?')[0])}</div>`
        : `<div class="poster-fallback">${escapeHtml((movie.title || '?')[0])}</div>`;

      const card = document.createElement('div');
      card.className = 'col-6 col-md-4 col-lg-3';
      card.innerHTML = `
        <a href="view.html?id=${movie.id}" class="movie-card fade-in" style="--delay:${i * 0.05}s">
          <div class="movie-poster">${posterContent}</div>
          <div class="ticket-cut movie-info">
            <div>
              <div class="movie-title">${escapeHtml(movie.title)}</div>
              <div class="movie-year">${escapeHtml(movie.year) || '—'}</div>
            </div>
            <div class="score-badge ${level}">${formatScore(scores.final)}</div>
          </div>
        </a>
      `;
      grid.appendChild(card);
    });
  }

  function sortMovies(movies, sort) {
    switch (sort) {
      case 'newest':
        return [...movies].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'highest':
        return [...movies].sort((a, b) => {
          const sa = calcScores(a.storyScore, a.visualScore, a.actionScore, a.funScore, a.biases || []);
          const sb = calcScores(b.storyScore, b.visualScore, b.actionScore, b.funScore, b.biases || []);
          return sb.final - sa.final;
        });
      case 'lowest':
        return [...movies].sort((a, b) => {
          const sa = calcScores(a.storyScore, a.visualScore, a.actionScore, a.funScore, a.biases || []);
          const sb = calcScores(b.storyScore, b.visualScore, b.actionScore, b.funScore, b.biases || []);
          return sa.final - sb.final;
        });
      case 'title':
        return [...movies].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      default:
        return movies;
    }
  }

  sortSelect.addEventListener('change', renderList);
  await loadAndRender();
});
