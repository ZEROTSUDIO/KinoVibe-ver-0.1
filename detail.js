document.addEventListener('DOMContentLoaded', async () => {
  // Require login — redirect if not authenticated
  const user = await Auth.getUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  await Auth.initNav();

  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { window.location.href = 'index.html'; return; }
  
  const movie = await MovieStore.getById(id);
  if (!movie) { window.location.href = 'index.html'; return; }

  // Set page title
  document.title = `${movie.title} — KinoVibe`;

  // Calculate scores
  const scores = calcScores(movie.storyScore, movie.visualScore, movie.actionScore, movie.funScore, movie.biases || []);
  const level = getScoreLevel(scores.final);

  // Poster
  const posterEl = document.getElementById('detail-poster');
  const fallbackEl = document.getElementById('poster-fallback');
  if (movie.posterUrl) {
    const img = document.createElement('img');
    img.src = movie.posterUrl;
    img.alt = movie.title;
    img.onerror = () => { img.style.display = 'none'; fallbackEl.style.display = 'flex'; };
    posterEl.insertBefore(img, fallbackEl);
    fallbackEl.style.display = 'none';
  } else {
    fallbackEl.textContent = (movie.title || '?')[0];
  }

  // Backdrop Hero
  const backdropContainer = document.getElementById('backdrop-container');
  if (movie.backdropUrl && backdropContainer) {
    backdropContainer.innerHTML = `
      <div class="movie-backdrop-hero" style="background-image: url('${movie.backdropUrl}')">
        <div class="movie-backdrop-overlay"></div>
      </div>
    `;
  }

  // Title, year, runtime, genres
  document.getElementById('detail-title').textContent = movie.title;
  let yearStr = movie.year || '—';
  if (movie.runtime) {
    const hrs = Math.floor(movie.runtime / 60);
    const mins = movie.runtime % 60;
    const runtimeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    yearStr += ` · ${runtimeStr}`;
  }
  document.getElementById('detail-year').textContent = yearStr;

  const genresEl = document.getElementById('detail-genres');
  if (genresEl && Array.isArray(movie.genres) && movie.genres.length > 0) {
    genresEl.innerHTML = movie.genres.map(g => `<span class="badge bg-secondary opacity-75">${escapeHtml(g)}</span>`).join('');
  }

  // Overview / Synopsis
  const overviewSection = document.getElementById('overview-section');
  const overviewText = document.getElementById('overview-text');
  if (movie.overview && overviewSection && overviewText) {
    overviewText.textContent = movie.overview;
    overviewSection.classList.remove('hidden');
  }

  // Final score
  const finalEl = document.getElementById('detail-final-score');
  finalEl.textContent = formatScore(scores.final);
  finalEl.classList.add('score-' + level);

  // Stat grid
  document.getElementById('stat-story').textContent = movie.storyScore;
  document.getElementById('stat-visuals').textContent = movie.visualScore;
  document.getElementById('stat-action').textContent = movie.actionScore;
  document.getElementById('stat-fun').textContent = movie.funScore;

  // Score summary
  document.getElementById('base-score').textContent = formatScore(scores.base);
  const biasEl = document.getElementById('total-bias');
  const biasPrefix = scores.totalBias >= 0 ? '+' : '';
  biasEl.textContent = biasPrefix + scores.totalBias;
  if (scores.totalBias > 0) biasEl.style.color = 'var(--score-high)';
  else if (scores.totalBias < 0) biasEl.style.color = 'var(--score-low)';

  // Bias pills
  const biasSection = document.getElementById('bias-section');
  const pillsContainer = document.getElementById('bias-pills');
  const biases = movie.biases || [];
  if (biases.length === 0) {
    biasSection.classList.add('hidden');
  } else {
    biases.forEach(b => {
      const pill = document.createElement('span');
      const rawVal = typeof b === 'object' && b !== null ? b.amount : b;
      let amt;
      if (typeof rawVal === 'number') {
        amt = isNaN(rawVal) ? 0 : rawVal;
      } else {
        const clean = String(rawVal || '').trim().replace(/\s+/g, '').replace(',', '.');
        amt = parseFloat(clean);
        if (isNaN(amt)) amt = 0;
      }
      const isPos = amt > 0;
      pill.className = `bias-pill ${isPos ? 'positive' : 'negative'}`;
      pill.innerHTML = `<span class="pill-amount">${isPos ? '+' : ''}${amt}</span> ${escapeHtml(b.reason)}`;
      pillsContainer.appendChild(pill);
    });
  }

  // Review text
  const reviewSection = document.getElementById('review-section');
  if (movie.reviewText) {
    document.getElementById('review-text').textContent = movie.reviewText;
  } else {
    reviewSection.classList.add('hidden');
  }

  // Edit button
  document.getElementById('edit-btn').href = `edit.html?id=${movie.id}`;

  // Delete flow
  const deleteModal = document.getElementById('delete-modal');
  document.getElementById('delete-movie-title').textContent = `"${movie.title}" will be permanently removed.`;
  
  document.getElementById('delete-btn').addEventListener('click', () => {
    deleteModal.classList.add('active');
  });
  
  document.getElementById('cancel-delete').addEventListener('click', () => {
    deleteModal.classList.remove('active');
  });
  
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) deleteModal.classList.remove('active');
  });
  
  document.getElementById('confirm-delete').addEventListener('click', async () => {
    const confirmBtn = document.getElementById('confirm-delete');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Deleting...';
    try {
      await MovieStore.remove(movie.id);
      window.location.href = 'index.html';
    } catch (err) {
      alert('Failed to delete review: ' + (err.message || err));
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Delete permanently';
    }
  });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
});
