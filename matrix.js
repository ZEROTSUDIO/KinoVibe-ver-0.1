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
  const matrixWrapperEl = document.getElementById('matrix-wrapper');
  const emptyStateEl = document.getElementById('empty-state');
  const matrixCountEl = document.getElementById('matrix-count');
  const plotAreaEl = document.getElementById('matrix-plot-area');
  const matrixBoardEl = document.getElementById('matrix-board');
  const tooltipEl = document.getElementById('matrix-tooltip');
  const searchInputEl = document.getElementById('matrix-search');
  const filterBtns = document.querySelectorAll('.matrix-filter-btn');
  const btnPosters = document.getElementById('toggle-matrix-posters');
  const btnDots = document.getElementById('toggle-matrix-dots');

  let currentView = localStorage.getItem('kinovibe_matrix_view') || 'posters';
  let activeQuadrant = 'all';
  let searchTerm = '';

  // Show spinner
  if (loadingStateEl) {
    loadingStateEl.classList.remove('hidden');
    loadingStateEl.style.display = 'flex';
  }
  matrixWrapperEl.classList.add('hidden');
  emptyStateEl.classList.add('hidden');

  let rawMovies = [];
  try {
    rawMovies = await MovieStore.getAll();
  } catch (err) {
    console.error('Failed to load movies for matrix:', err);
    rawMovies = [];
  } finally {
    if (loadingStateEl) {
      loadingStateEl.classList.add('hidden');
      loadingStateEl.style.display = 'none';
    }
  }

  if (rawMovies.length === 0) {
    emptyStateEl.classList.remove('hidden');
    matrixWrapperEl.classList.add('hidden');
    matrixCountEl.textContent = '0 movies plotted';
    return;
  }

  matrixCountEl.textContent = `${rawMovies.length} movie${rawMovies.length !== 1 ? 's' : ''} plotted`;
  emptyStateEl.classList.add('hidden');
  matrixWrapperEl.classList.remove('hidden');

  // Process movie coordinates & quadrants
  const coordMap = new Map();

  const movies = rawMovies.map(movie => {
    const story = Number(movie.storyScore) || 0;
    const visuals = Number(movie.visualScore) || 0;
    const action = Number(movie.actionScore) || 0;
    const fun = Number(movie.funScore) || 0;

    // Horizontal: Quality = avg(Story + Visuals)
    const quality = Math.round(((story + visuals) / 2) * 10) / 10;

    // Vertical: Entertainment = avg(Action + Fun)
    const entertainment = Math.round(((action + fun) / 2) * 10) / 10;

    const scores = calcScores(story, visuals, action, fun, movie.biases || []);
    const finalScore = Number(scores.final);

    // 4 Quadrants
    let quadrant = 'duds';
    let quadrantLabel = 'Duds & Skips';
    if (quality >= 5 && entertainment >= 5) {
      quadrant = 'peak';
      quadrantLabel = 'Peak Cinema';
    } else if (quality < 5 && entertainment >= 5) {
      quadrant = 'guilty';
      quadrantLabel = 'Guilty Pleasures';
    } else if (quality >= 5 && entertainment < 5) {
      quadrant = 'slow';
      quadrantLabel = 'Slow Burns & Prestige';
    } else {
      quadrant = 'duds';
      quadrantLabel = 'Duds & Skips';
    }

    const key = `${quality.toFixed(1)}_${entertainment.toFixed(1)}`;
    const coordIndex = coordMap.get(key) || 0;
    coordMap.set(key, coordIndex + 1);

    return {
      ...movie,
      quality,
      entertainment,
      story,
      visuals,
      action,
      fun,
      finalScore,
      quadrant,
      quadrantLabel,
      coordIndex
    };
  });

  // Calculate percentage positions with jitter for overlapping coordinates
  const INSET = 6; // % margin inside board
  const USABLE = 100 - (INSET * 2);

  function renderPins() {
    plotAreaEl.className = `matrix-plot-area mode-${currentView}`;
    plotAreaEl.innerHTML = '';

    movies.forEach(movie => {
      // Deterministic slight offset for identical coordinates
      let offsetX = 0;
      let offsetY = 0;
      if (movie.coordIndex > 0) {
        const angle = (movie.coordIndex * 137.5) * (Math.PI / 180);
        const radius = Math.min(2.5, movie.coordIndex * 0.9);
        offsetX = Math.cos(angle) * radius;
        offsetY = Math.sin(angle) * radius;
      }

      let posX = INSET + (movie.quality / 10) * USABLE + offsetX;
      let posY = INSET + (movie.entertainment / 10) * USABLE + offsetY;

      // Keep within bounds
      posX = Math.max(3, Math.min(97, posX));
      posY = Math.max(3, Math.min(97, posY));

      const pin = document.createElement('a');
      pin.href = `view.html?id=${movie.id}`;
      pin.className = `matrix-pin q-${movie.quadrant}`;
      pin.dataset.id = movie.id;
      pin.dataset.quadrant = movie.quadrant;
      pin.dataset.title = (movie.title || '').toLowerCase();
      pin.style.left = `${posX.toFixed(2)}%`;
      pin.style.bottom = `${posY.toFixed(2)}%`;

      const level = typeof getScoreLevel === 'function' ? getScoreLevel(movie.finalScore) : '';
      const formattedScore = typeof formatScore === 'function' ? formatScore(movie.finalScore) : movie.finalScore;

      if (currentView === 'posters') {
        const posterContent = movie.posterUrl
          ? `<img src="${escapeHtml(movie.posterUrl)}" alt="${escapeHtml(movie.title)}" class="matrix-pin-poster-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="matrix-pin-fallback" style="display:none">${escapeHtml((movie.title || '?')[0])}</div>`
          : `<div class="matrix-pin-fallback">${escapeHtml((movie.title || '?')[0])}</div>`;

        pin.innerHTML = `
          <div class="matrix-pin-poster">
            ${posterContent}
            <div class="matrix-pin-score ${level}">${formattedScore}</div>
          </div>
        `;
      } else {
        pin.innerHTML = `
          <div class="matrix-pin-dot">
            <span class="matrix-dot-inner"></span>
            <span class="matrix-dot-badge">${formattedScore}</span>
          </div>
        `;
      }

      // Hover / Tooltip logic
      pin.addEventListener('mouseenter', (e) => showTooltip(movie, pin));
      pin.addEventListener('mouseleave', hideTooltip);
      pin.addEventListener('focus', (e) => showTooltip(movie, pin));
      pin.addEventListener('blur', hideTooltip);

      plotAreaEl.appendChild(pin);
    });

    applyFilters();
  }

  function showTooltip(movie, pinEl) {
    if (!tooltipEl || !matrixBoardEl) return;

    const formattedScore = typeof formatScore === 'function' ? formatScore(movie.finalScore) : movie.finalScore;
    const level = typeof getScoreLevel === 'function' ? getScoreLevel(movie.finalScore) : '';

    const posterThumb = movie.posterUrl
      ? `<img src="${escapeHtml(movie.posterUrl)}" alt="${escapeHtml(movie.title)}" class="tooltip-poster" onerror="this.style.display='none'">`
      : '';

    tooltipEl.innerHTML = `
      <div class="tooltip-content">
        ${posterThumb}
        <div class="tooltip-details">
          <div class="tooltip-header">
            <div class="tooltip-title">${escapeHtml(movie.title)}</div>
            <div class="tooltip-year">${escapeHtml(movie.year) || '—'}</div>
          </div>
          <div class="tooltip-badge q-${movie.quadrant}">${escapeHtml(movie.quadrantLabel)}</div>
          <div class="tooltip-stats">
            <div class="stat-row">
              <span class="stat-lbl">Quality (Story + Visuals):</span>
              <strong class="stat-val">${movie.quality.toFixed(1)}</strong>
            </div>
            <div class="stat-breakdown">Story ${movie.story} · Visuals ${movie.visuals}</div>
            <div class="stat-row">
              <span class="stat-lbl">Entertainment (Action + Fun):</span>
              <strong class="stat-val">${movie.entertainment.toFixed(1)}</strong>
            </div>
            <div class="stat-breakdown">Action ${movie.action} · Fun ${movie.fun}</div>
            <div class="stat-row final-row">
              <span class="stat-lbl">Overall Score:</span>
              <strong class="stat-val ${level}">${formattedScore}</strong>
            </div>
          </div>
        </div>
      </div>
    `;

    tooltipEl.classList.remove('hidden');

    // Position tooltip near the pin
    const boardRect = matrixBoardEl.getBoundingClientRect();
    const pinRect = pinEl.getBoundingClientRect();

    let left = pinRect.left - boardRect.left + (pinRect.width / 2);
    let top = pinRect.top - boardRect.top;

    // If too close to right edge, shift left
    const tooltipWidth = 260;
    if (left + (tooltipWidth / 2) > boardRect.width - 15) {
      left = boardRect.width - tooltipWidth - 15;
    } else if (left - (tooltipWidth / 2) < 15) {
      left = 15;
    } else {
      left = left - (tooltipWidth / 2);
    }

    // If too close to top edge, show below pin
    if (top < 160) {
      top = top + pinRect.height + 10;
    } else {
      top = top - 180;
    }

    tooltipEl.style.left = `${Math.max(10, left)}px`;
    tooltipEl.style.top = `${Math.max(10, top)}px`;
  }

  function hideTooltip() {
    if (tooltipEl) tooltipEl.classList.add('hidden');
  }

  function applyFilters() {
    const pins = plotAreaEl.querySelectorAll('.matrix-pin');
    pins.forEach(pin => {
      const matchQuadrant = activeQuadrant === 'all' || pin.dataset.quadrant === activeQuadrant;
      const matchSearch = !searchTerm || pin.dataset.title.includes(searchTerm);

      if (!matchQuadrant) {
        pin.classList.add('dimmed');
        pin.classList.remove('highlighted');
      } else if (matchSearch) {
        pin.classList.remove('dimmed');
        if (searchTerm) {
          pin.classList.add('highlighted');
        } else {
          pin.classList.remove('highlighted');
        }
      } else {
        pin.classList.add('dimmed');
        pin.classList.remove('highlighted');
      }
    });
  }

  // Event Listeners for Filters & Modes
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeQuadrant = btn.dataset.quadrant;
      applyFilters();
    });
  });

  if (searchInputEl) {
    searchInputEl.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim().toLowerCase();
      applyFilters();
    });
  }

  function setView(mode) {
    currentView = mode;
    localStorage.setItem('kinovibe_matrix_view', mode);

    if (btnPosters) btnPosters.classList.toggle('active', mode === 'posters');
    if (btnDots) btnDots.classList.toggle('active', mode === 'dots');

    renderPins();
  }

  if (btnPosters) {
    btnPosters.addEventListener('click', () => setView('posters'));
  }
  if (btnDots) {
    btnDots.addEventListener('click', () => setView('dots'));
  }

  setView(currentView);
});
