document.addEventListener('DOMContentLoaded', async () => {
  // Require login — redirect to login page if not authenticated
  const user = await Auth.getUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  await Auth.initNav();

  const grid = document.getElementById('movie-grid');
  const countEl = document.getElementById('movie-count');
  const emptyState = document.getElementById('empty-state');
  const loadingState = document.getElementById('loading-state');
  const sortSelect = document.getElementById('sort-select');
  const tagFilterBar = document.getElementById('tag-filter-bar');

  let allMovies = [];
  let activeTags = new Set(); // AND filter: movie must have ALL active tags

  // Read URL param on load (e.g. library.html?tag=rewatchable)
  const urlParams = new URLSearchParams(window.location.search);
  const urlTag = urlParams.get('tag');
  if (urlTag) activeTags.add(urlTag.trim().toLowerCase());

  async function loadAndRender() {
    // Show spinner, hide everything else
    if (loadingState) {
      loadingState.classList.remove('hidden');
      loadingState.style.display = 'flex';
    }
    grid.classList.add('hidden');
    emptyState.classList.add('hidden');
    tagFilterBar.classList.add('hidden');

    try {
      allMovies = await MovieStore.getAll();
    } catch (err) {
      console.error('Failed to load movies:', err);
      allMovies = [];
    } finally {
      if (loadingState) {
        loadingState.classList.add('hidden');
        loadingState.style.display = 'none';
      }
    }

    renderTagFilterBar();
    renderList();
  }

  // ─── Tag Filter Bar ─────────────────────────────────
  function renderTagFilterBar() {
    const allTags = MovieStore.getAllTags(allMovies);

    if (allTags.length === 0) {
      tagFilterBar.classList.add('hidden');
      return;
    }

    tagFilterBar.classList.remove('hidden');

    const filtered = getFilteredMovies();
    const countLabel = activeTags.size > 0
      ? `${filtered.length} / ${allMovies.length}`
      : allMovies.length;

    tagFilterBar.innerHTML = `
      <button class="tag-pill ${activeTags.size === 0 ? 'active' : ''}" data-tag="__all__">
        All <span class="tag-pill-count">${countLabel}</span>
      </button>
      ${allTags.map(tag => {
        const isActive = activeTags.has(tag);
        const movieCount = allMovies.filter(m => Array.isArray(m.tags) && m.tags.includes(tag)).length;
        return `<button class="tag-pill ${isActive ? 'active' : ''}" data-tag="${escapeHtml(tag)}">
          ${escapeHtml(tag)} <span class="tag-pill-count">${movieCount}</span>
        </button>`;
      }).join('')}
    `;

    tagFilterBar.querySelectorAll('.tag-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.dataset.tag;
        if (tag === '__all__') {
          activeTags.clear();
        } else {
          if (activeTags.has(tag)) {
            activeTags.delete(tag);
          } else {
            activeTags.add(tag);
          }
        }
        // Update URL param (single tag for deep-linking; multi-tag keeps last)
        if (activeTags.size === 1) {
          const [t] = activeTags;
          history.replaceState(null, '', `?tag=${encodeURIComponent(t)}`);
        } else {
          history.replaceState(null, '', window.location.pathname);
        }
        renderTagFilterBar();
        renderList();
      });
    });
  }

  function getFilteredMovies() {
    if (activeTags.size === 0) return allMovies;
    return allMovies.filter(m => {
      const movieTags = Array.isArray(m.tags) ? m.tags : [];
      // OR: movie shows if it has any active tag
      for (const t of activeTags) {
        if (movieTags.includes(t)) return true;
      }
      return false;
    });
  }
  // ────────────────────────────────────────────────────

  function renderList() {
    const sort = sortSelect.value;
    const filtered = getFilteredMovies();
    const movies = sortMovies(filtered, sort);

    // Update count
    if (activeTags.size > 0) {
      countEl.textContent = `${movies.length} of ${allMovies.length} movie${allMovies.length !== 1 ? 's' : ''} matched`;
    } else {
      countEl.textContent = `${movies.length} movie${movies.length !== 1 ? 's' : ''} logged`;
    }

    // Show/hide empty state
    if (movies.length === 0) {
      grid.classList.add('hidden');
      emptyState.classList.remove('hidden');
      // Customize empty state if filtering
      const emptyTitle = emptyState.querySelector('.empty-title');
      const emptySubtitle = emptyState.querySelector('.empty-subtitle');
      if (activeTags.size > 0 && emptyTitle) {
        emptyTitle.textContent = 'No movies with these tags';
        if (emptySubtitle) emptySubtitle.textContent = `Try removing a tag filter or add tags to your movies`;
      }
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

      // Tags row (only show if movie has tags)
      const movieTags = Array.isArray(movie.tags) ? movie.tags : [];
      const tagsHtml = movieTags.length > 0
        ? `<div class="movie-card-tags">${movieTags.slice(0, 3).map(t => `<span class="tag-link" style="pointer-events:none;font-size:10px;padding:1px 7px">${escapeHtml(t)}</span>`).join('')}${movieTags.length > 3 ? `<span style="font-size:10px;color:var(--text-muted)">+${movieTags.length - 3}</span>` : ''}</div>`
        : '';

      const card = document.createElement('div');
      card.className = 'col-6 col-md-4 col-lg-3';
      card.innerHTML = `
        <a href="view.html?id=${movie.id}" class="movie-card fade-in" style="--delay:${i * 0.05}s">
          <div class="movie-poster">${posterContent}</div>
          <div class="ticket-cut movie-info">
            <div>
              <div class="movie-title">${escapeHtml(movie.title)}</div>
              <div class="movie-year">${escapeHtml(movie.year) || '—'}</div>
              ${tagsHtml}
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
