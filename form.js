document.addEventListener('DOMContentLoaded', async () => {
  // Require login — redirect if not authenticated
  const user = await Auth.getUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  await Auth.initNav();

  const form = document.getElementById('movie-form');
  const mode = form.dataset.mode; // 'add' or 'edit'
  
  // Elements
  const titleInput = document.getElementById('title');
  const yearInput = document.getElementById('year');
  const posterInput = document.getElementById('poster-url');
  const reviewInput = document.getElementById('review-text');
  const storySlider = document.getElementById('story-score');
  const visualsSlider = document.getElementById('visuals-score');
  const actionSlider = document.getElementById('action-score');
  const funSlider = document.getElementById('fun-score');
  const biasContainer = document.getElementById('bias-container');
  const addBiasBtn = document.getElementById('add-bias-btn');
  const scoreFinalEl = document.getElementById('score-final');
  const scoreBreakdownEl = document.getElementById('score-breakdown');
  
  // TMDB Elements
  const tmdbSearchInput = document.getElementById('tmdb-search');
  const tmdbResultsEl = document.getElementById('tmdb-results');
  const tmdbKeyBtn = document.getElementById('tmdb-key-btn');
  const tmdbIdInput = document.getElementById('tmdb-id');
  const backdropUrlInput = document.getElementById('backdrop-url');
  const overviewInput = document.getElementById('overview');
  const genresInput = document.getElementById('genres');
  const runtimeInput = document.getElementById('runtime');

  // Tag Elements
  const tagInputArea = document.getElementById('tag-input-area');
  const tagInputField = document.getElementById('tag-input-field');
  const tagSuggestions = document.getElementById('tag-suggestions');

  const sliders = [
    { slider: storySlider, valEl: document.getElementById('story-val') },
    { slider: visualsSlider, valEl: document.getElementById('visuals-val') },
    { slider: actionSlider, valEl: document.getElementById('action-val') },
    { slider: funSlider, valEl: document.getElementById('fun-val') },
  ];

  // ─── Tag chip state ───────────────────────────────────
  let currentTags = [];
  let allExistingTags = []; // pool from all user movies for autocomplete

  // Load existing tags pool for autocomplete (non-blocking)
  try {
    const allMovies = await MovieStore.getAll();
    allExistingTags = MovieStore.getAllTags(allMovies);
  } catch (e) {
    allExistingTags = [];
  }

  function renderTagChips() {
    // Remove existing chips (leave the input field & suggestions in place)
    tagInputArea.querySelectorAll('.tag-chip').forEach(c => c.remove());
    currentTags.forEach(tag => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.innerHTML = `${escapeHtml(tag)}<button type="button" class="tag-chip-remove" data-tag="${escapeHtml(tag)}" aria-label="Remove ${escapeHtml(tag)}">×</button>`;
      tagInputArea.insertBefore(chip, tagInputField);
    });
  }

  function addTag(raw) {
    const tag = raw.trim().toLowerCase().replace(/,/g, '').replace(/\s+/g, '-');
    if (!tag || currentTags.includes(tag)) return;
    currentTags.push(tag);
    renderTagChips();
  }

  function removeTag(tag) {
    currentTags = currentTags.filter(t => t !== tag);
    renderTagChips();
  }

  function getTags() {
    return [...currentTags];
  }

  if (tagInputArea) {
    // Chip remove delegation
    tagInputArea.addEventListener('click', (e) => {
      const btn = e.target.closest('.tag-chip-remove');
      if (btn) { e.stopPropagation(); removeTag(btn.dataset.tag); }
    });

    // Click anywhere in the area focuses the text input
    tagInputArea.addEventListener('click', () => tagInputField && tagInputField.focus());
  }

  if (tagInputField) {
    // Enter or comma commits a tag
    tagInputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = tagInputField.value.trim();
        if (val) { addTag(val); tagInputField.value = ''; hideSuggestions(); }
      } else if (e.key === ',') {
        e.preventDefault();
        const val = tagInputField.value.trim();
        if (val) { addTag(val); tagInputField.value = ''; hideSuggestions(); }
      } else if (e.key === 'Backspace' && tagInputField.value === '' && currentTags.length > 0) {
        removeTag(currentTags[currentTags.length - 1]);
      }
    });

    // Autocomplete suggestions
    tagInputField.addEventListener('input', () => {
      const query = tagInputField.value.trim().toLowerCase();
      if (!query) { hideSuggestions(); return; }
      const matches = allExistingTags.filter(t => t.startsWith(query) && !currentTags.includes(t));
      if (matches.length === 0) { hideSuggestions(); return; }
      tagSuggestions.innerHTML = matches.slice(0, 8).map(t =>
        `<div class="tag-suggestion-item" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</div>`
      ).join('');
      tagSuggestions.classList.remove('hidden');
    });
  }

  if (tagSuggestions) {
    tagSuggestions.addEventListener('click', (e) => {
      const item = e.target.closest('.tag-suggestion-item');
      if (item) {
        addTag(item.dataset.tag);
        tagInputField.value = '';
        hideSuggestions();
        tagInputField.focus();
      }
    });
  }

  function hideSuggestions() {
    if (!tagSuggestions) return;
    tagSuggestions.classList.add('hidden');
    tagSuggestions.innerHTML = '';
  }

  document.addEventListener('click', (e) => {
    if (tagInputArea && !tagInputArea.contains(e.target)) hideSuggestions();
  });
  // ─────────────────────────────────────────────────────

  // If edit mode, load existing movie
  if (mode === 'edit') {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) { window.location.href = 'library.html'; return; }
    const movie = await MovieStore.getById(id);
    if (!movie) { window.location.href = 'library.html'; return; }
    
    document.getElementById('movie-id').value = movie.id;
    titleInput.value = movie.title;
    yearInput.value = movie.year || '';
    posterInput.value = movie.posterUrl || '';
    reviewInput.value = movie.reviewText || '';
    storySlider.value = movie.storyScore;
    visualsSlider.value = movie.visualScore;
    actionSlider.value = movie.actionScore;
    funSlider.value = movie.funScore;
    
    if (tmdbIdInput) tmdbIdInput.value = movie.tmdbId || '';
    if (backdropUrlInput) backdropUrlInput.value = movie.backdropUrl || '';
    if (overviewInput) overviewInput.value = movie.overview || '';
    if (genresInput) genresInput.value = JSON.stringify(movie.genres || []);
    if (runtimeInput) runtimeInput.value = movie.runtime || '';

    // Set subtitle
    const subtitle = document.getElementById('edit-subtitle');
    if (subtitle) subtitle.textContent = `${movie.title} (${movie.year || '—'})`;
    
    // Set cancel links to view.html?id=...
    document.querySelectorAll('a.btn-secondary').forEach(a => {
      a.href = `view.html?id=${movie.id}`;
    });
    
    // Load existing biases
    (movie.biases || []).forEach(b => addBiasRow(b.amount, b.reason));

    // Load existing tags
    (movie.tags || []).forEach(t => addTag(t));
  }

  // TMDB API Key settings button — hidden if no longer needed, kept for legacy HTML
  if (tmdbKeyBtn) {
    tmdbKeyBtn.style.display = 'none'; // API key is hardcoded, no user config needed
  }

  // TMDB Live Search
  if (tmdbSearchInput && tmdbResultsEl) {
    let debounceTimer;
    tmdbSearchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value;
      if (!query || query.trim().length < 2) {
        tmdbResultsEl.style.display = 'none';
        tmdbResultsEl.innerHTML = '';
        return;
      }

      debounceTimer = setTimeout(async () => {
        const results = await TMDBService.searchMovies(query);
        renderTMDBResults(results);
      }, 300);
    });

    // Close search dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!tmdbSearchInput.contains(e.target) && !tmdbResultsEl.contains(e.target)) {
        tmdbResultsEl.style.display = 'none';
      }
    });
  }

  function renderTMDBResults(results) {
    if (!results || results.length === 0) {
      tmdbResultsEl.innerHTML = '<div class="p-3 text-muted text-center">No movies found on TMDB</div>';
      tmdbResultsEl.style.display = 'block';
      return;
    }

    tmdbResultsEl.innerHTML = results.slice(0, 7).map(movie => {
      const year = movie.release_date ? movie.release_date.substring(0, 4) : 'N/A';
      const poster = TMDBService.getPosterUrl(movie.poster_path, 'w92') || 'https://via.placeholder.com/36x54?text=No+Poster';
      return `
        <div class="tmdb-item" data-tmdb-id="${movie.id}">
          <img src="${poster}" alt="${movie.title}" class="tmdb-item-poster">
          <div class="tmdb-item-info">
            <div class="tmdb-item-title">${movie.title}</div>
            <div class="tmdb-item-meta">${year} ${movie.vote_average ? '· ★ ' + movie.vote_average.toFixed(1) : ''}</div>
          </div>
        </div>
      `;
    }).join('');

    tmdbResultsEl.style.display = 'block';

    // Add click event for each item
    tmdbResultsEl.querySelectorAll('.tmdb-item').forEach(item => {
      item.addEventListener('click', async () => {
        const tmdbId = item.dataset.tmdbId;
        const details = await TMDBService.getMovieDetails(tmdbId);
        if (details) {
          selectTMDBMovie(details);
        }
        tmdbResultsEl.style.display = 'none';
      });
    });
  }

  function selectTMDBMovie(movie) {
    titleInput.value = movie.title || '';
    if (movie.release_date) {
      yearInput.value = parseInt(movie.release_date.substring(0, 4)) || '';
    }
    if (movie.poster_path) {
      posterInput.value = TMDBService.getPosterUrl(movie.poster_path, 'w500');
    }
    
    if (tmdbIdInput) tmdbIdInput.value = movie.id;
    if (backdropUrlInput) backdropUrlInput.value = TMDBService.getBackdropUrl(movie.backdrop_path, 'w1280');
    if (overviewInput) overviewInput.value = movie.overview || '';
    if (genresInput) genresInput.value = JSON.stringify((movie.genres || []).map(g => g.name));
    if (runtimeInput) runtimeInput.value = movie.runtime || '';

    if (tmdbSearchInput) tmdbSearchInput.value = `${movie.title} (${movie.release_date ? movie.release_date.substring(0,4) : ''})`;
    updateScore();
  }

  // Initialize sliders
  sliders.forEach(({ slider, valEl }) => {
    valEl.textContent = slider.value;
    updateSliderFill(slider);
    slider.addEventListener('input', () => {
      valEl.textContent = slider.value;
      updateSliderFill(slider);
      updateScore();
    });
  });

  function updateSliderFill(slider) {
    const pct = (slider.value / slider.max) * 100;
    slider.style.setProperty('--fill', pct + '%');
  }

  // Bias management
  function parseBiasAmount(val) {
    if (val === null || val === undefined) return NaN;
    if (typeof val === 'number') return isNaN(val) ? NaN : val;
    const str = String(val).trim().replace(/\s+/g, '').replace(',', '.');
    if (!str) return NaN;
    const parsed = parseFloat(str);
    return isNaN(parsed) ? NaN : parsed;
  }

  addBiasBtn.addEventListener('click', () => addBiasRow(0, ''));

  function addBiasRow(amount = 0, reason = '') {
    const row = document.createElement('div');
    row.className = 'bias-row fade-in';
    const numAmt = parseBiasAmount(amount);
    const amtStr = !isNaN(numAmt) ? (numAmt > 0 ? `+${numAmt}` : numAmt === 0 ? '' : `${numAmt}`) : '';
    const colorClass = !isNaN(numAmt) && numAmt > 0 ? 'positive' : !isNaN(numAmt) && numAmt < 0 ? 'negative' : '';
    row.innerHTML = `
      <input type="text" class="bias-amount form-input ${colorClass}" value="${amtStr}" placeholder="±0">
      <input type="text" class="bias-reason form-input" value="${escapeHtml(reason)}" placeholder="Reason for bias">
      <button type="button" class="bias-remove">×</button>
    `;
    biasContainer.appendChild(row);

    // Amount input: update color class on change
    const amtInput = row.querySelector('.bias-amount');
    amtInput.addEventListener('input', () => {
      const val = parseBiasAmount(amtInput.value);
      amtInput.classList.remove('positive', 'negative');
      if (!isNaN(val)) {
        if (val > 0) amtInput.classList.add('positive');
        else if (val < 0) amtInput.classList.add('negative');
      }
      updateScore();
    });

    // Format nicely on blur (e.g. .5 -> +0.5, -0.5 -> -0.5)
    amtInput.addEventListener('blur', () => {
      const val = parseBiasAmount(amtInput.value);
      if (!isNaN(val) && amtInput.value.trim() !== '') {
        amtInput.value = val > 0 ? `+${val}` : `${val}`;
      }
    });

    // Remove button
    row.querySelector('.bias-remove').addEventListener('click', () => {
      row.remove();
      updateScore();
    });

    updateScore();
  }

  // Gather biases from DOM
  function getBiases() {
    const rows = biasContainer.querySelectorAll('.bias-row');
    const biases = [];
    rows.forEach(row => {
      const amtStr = row.querySelector('.bias-amount').value;
      const reason = row.querySelector('.bias-reason').value.trim();
      const amount = parseBiasAmount(amtStr);
      if (!isNaN(amount)) {
        biases.push({ amount, reason });
      }
    });
    return biases;
  }

  function updateScore() {
    const biases = getBiases();
    const scores = calcScores(
      parseFloat(storySlider.value),
      parseFloat(visualsSlider.value),
      parseFloat(actionSlider.value),
      parseFloat(funSlider.value),
      biases
    );
    
    const biasPrefix = scores.totalBias >= 0 ? '+' : '';
    scoreBreakdownEl.innerHTML = `Base ${formatScore(scores.base)} &nbsp;·&nbsp; Bias ${biasPrefix}${scores.totalBias} &nbsp;=&nbsp; Final`;
    scoreFinalEl.textContent = formatScore(scores.final);
    
    // Update score color
    const level = getScoreLevel(scores.final);
    scoreFinalEl.className = 'score-big score-' + level;
  }

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = titleInput.value.trim();
    if (!title) { titleInput.focus(); return; }
    
    const yearVal = yearInput.value.trim();
    const year = yearVal ? parseInt(yearVal) : null;
    
    let parsedGenres = [];
    try {
      if (genresInput && genresInput.value) {
        parsedGenres = JSON.parse(genresInput.value);
      }
    } catch (err) {}

    const movieData = {
      title,
      year,
      posterUrl: posterInput.value.trim(),
      backdropUrl: backdropUrlInput ? backdropUrlInput.value.trim() : '',
      overview: overviewInput ? overviewInput.value.trim() : '',
      genres: parsedGenres,
      runtime: runtimeInput && runtimeInput.value ? parseInt(runtimeInput.value) : null,
      tmdbId: tmdbIdInput && tmdbIdInput.value ? parseInt(tmdbIdInput.value) : null,
      reviewText: reviewInput.value.trim(),
      storyScore: parseFloat(storySlider.value),
      visualScore: parseFloat(visualsSlider.value),
      actionScore: parseFloat(actionSlider.value),
      funScore: parseFloat(funSlider.value),
      biases: getBiases(),
      tags: getTags()
    };
    
    if (mode === 'edit') {
      movieData.id = document.getElementById('movie-id').value;
    }
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
      const saved = await MovieStore.save(movieData);
      window.location.href = `view.html?id=${saved.id}`;
    } catch (err) {
      alert('Error saving review: ' + (err.message || err));
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // Initial score calc
  updateScore();
  // Initialize slider fills
  sliders.forEach(({ slider }) => updateSliderFill(slider));
});
