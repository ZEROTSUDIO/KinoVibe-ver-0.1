// KinoVibe Admin Page Controller
import { AuthService } from '../services/auth.service.js';
import { AdminService } from '../services/admin.service.js';
import { escapeHtml, Toast, showConfirmModal } from '../utils/ui.js';
import { formatScore, getScoreLevel } from '../utils/scoring.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Enforce admin permission
  const hasAccess = await AuthService.requireAdmin();
  if (!hasAccess) return;

  await AuthService.initNav();

  const loadingEl = document.getElementById('admin-loading');
  const contentEl = document.getElementById('admin-content');
  const errorEl = document.getElementById('admin-error');
  const errorMsgEl = document.getElementById('admin-error-msg');
  const refreshBtn = document.getElementById('admin-refresh-btn');

  const tabModBtn = document.getElementById('tab-moderation-btn');
  const tabUsersBtn = document.getElementById('tab-users-btn');
  const sectionMod = document.getElementById('section-moderation');
  const sectionUsers = document.getElementById('section-users');

  const modTbody = document.getElementById('moderation-tbody');
  const usersTbody = document.getElementById('users-tbody');

  // Tab switching
  tabModBtn?.addEventListener('click', () => {
    tabModBtn.className = 'btn-primary';
    tabUsersBtn.className = 'btn-secondary';
    sectionMod.classList.remove('hidden');
    sectionUsers.classList.add('hidden');
  });

  tabUsersBtn?.addEventListener('click', () => {
    tabUsersBtn.className = 'btn-primary';
    tabModBtn.className = 'btn-secondary';
    sectionUsers.classList.remove('hidden');
    sectionMod.classList.add('hidden');
  });

  refreshBtn?.addEventListener('click', () => loadDashboard());

  async function loadDashboard() {
    loadingEl.classList.remove('hidden');
    contentEl.classList.add('hidden');
    errorEl.classList.add('hidden');

    try {
      const [stats, users, moderationList] = await Promise.all([
        AdminService.getDashboardStats(),
        AdminService.getUsers(),
        AdminService.getModerationList({ limit: 50 })
      ]);

      renderStats(stats);
      renderUsers(users);
      renderModeration(moderationList);

      loadingEl.classList.add('hidden');
      contentEl.classList.remove('hidden');
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
      loadingEl.classList.add('hidden');
      errorMsgEl.textContent = err.message || 'Could not query admin data.';
      errorEl.classList.remove('hidden');
    }
  }

  function renderStats(stats) {
    document.getElementById('stat-total-users').textContent = stats.totalUsers;
    document.getElementById('stat-total-movies').textContent = stats.totalMovies;
    document.getElementById('stat-public-ratio').textContent = `${stats.publicMovies} public / ${stats.privateMovies} private`;
    document.getElementById('stat-avg-score').textContent = formatScore(stats.avgScore);

    const distBars = document.getElementById('tier-dist-bars');
    if (distBars && stats.tierCounts) {
      distBars.innerHTML = Object.entries(stats.tierCounts).map(([tier, count]) => {
        const pct = stats.totalMovies > 0 ? Math.round((count / stats.totalMovies) * 100) : 0;
        return `
          <div style="flex:1;min-width:70px;background:rgba(255,255,255,0.04);padding:8px 12px;border-radius:8px;border:1px solid var(--border-color);text-align:center">
            <span style="font-weight:700;font-size:14px">${tier} Tier</span>
            <div style="font-size:18px;font-weight:800;color:var(--text-primary);margin:4px 0">${count}</div>
            <div style="font-size:11px;color:var(--text-muted)">${pct}%</div>
          </div>
        `;
      }).join('');
    }
  }

  function renderUsers(users) {
    if (!usersTbody) return;
    if (users.length === 0) {
      usersTbody.innerHTML = `<tr><td colspan="4" class="text-center p-4 text-muted">No users found.</td></tr>`;
      return;
    }

    usersTbody.innerHTML = users.map(u => {
      const date = u.created_at ? new Date(u.created_at).toLocaleDateString() : '—';
      const roleBadge = u.is_admin
        ? `<span class="badge" style="background:#b91c1c;color:#fff;">ADMIN</span>`
        : `<span class="badge" style="background:rgba(255,255,255,0.1);color:var(--text-secondary)">USER</span>`;
      return `
        <tr style="border-bottom:1px solid var(--border-color)">
          <td style="padding:12px 16px;"><strong>${escapeHtml(u.email)}</strong></td>
          <td>${escapeHtml(u.display_name || '—')}</td>
          <td>${roleBadge}</td>
          <td class="text-muted" style="font-size:13px">${date}</td>
        </tr>
      `;
    }).join('');
  }

  function renderModeration(movies) {
    if (!modTbody) return;
    if (movies.length === 0) {
      modTbody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-muted">No reviews recorded on the platform.</td></tr>`;
      return;
    }

    modTbody.innerHTML = movies.map(m => {
      const date = m.created_at ? new Date(m.created_at).toLocaleDateString() : '—';
      const score = formatScore(m.final_score || 0);
      const level = getScoreLevel(Number(score));
      const poster = m.poster_url || 'https://via.placeholder.com/36x54?text=?';
      const isPublic = m.is_public !== false;

      return `
        <tr style="border-bottom:1px solid var(--border-color);vertical-align:middle;">
          <td style="padding:10px 16px;width:50px;">
            <img src="${poster}" alt="${escapeHtml(m.title)}" style="width:36px;height:54px;object-fit:cover;border-radius:4px;border:1px solid var(--border-color)">
          </td>
          <td>
            <a href="view.html?id=${m.id}" style="color:var(--text-primary);font-weight:600;text-decoration:none;" hover-underline>
              ${escapeHtml(m.title)}
            </a>
            <div class="text-muted" style="font-size:12px">${m.year || '—'}</div>
          </td>
          <td>
            <span class="score-badge score-${level}" style="font-size:13px;padding:3px 8px;border-radius:6px;">${score}</span>
          </td>
          <td>
            <span class="badge ${isPublic ? 'bg-success' : 'bg-secondary'} opacity-75">
              ${isPublic ? 'Public' : 'Private'}
            </span>
          </td>
          <td class="text-muted" style="font-size:13px">${date}</td>
          <td style="text-align:right;padding-right:16px;">
            <button class="btn-toggle-vis btn-secondary btn-sm me-2" data-id="${m.id}" data-public="${isPublic}" style="font-size:12px;padding:4px 10px">
              ${isPublic ? 'Hide / Private' : 'Make Public'}
            </button>
            <button class="btn-mod-delete btn-danger btn-sm" data-id="${m.id}" data-title="${escapeHtml(m.title)}" style="font-size:12px;padding:4px 10px;background:#dc2626;border:none;border-radius:4px;color:#fff;">
              Delete
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach moderation handlers
    modTbody.querySelectorAll('.btn-toggle-vis').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const currentPub = btn.dataset.public === 'true';
        btn.disabled = true;
        try {
          await AdminService.toggleVisibility(id, !currentPub);
          await loadDashboard();
        } catch (err) {
          Toast.error('Failed to change visibility: ' + err.message);
          btn.disabled = false;
        }
      });
    });

    modTbody.querySelectorAll('.btn-mod-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const title = btn.dataset.title;
        const confirmed = await showConfirmModal({
          title: `Delete "${title}"?`,
          message: 'As an administrator, deleting this review permanently removes it from the database for all users.',
          confirmText: 'Delete Permanently',
          danger: true
        });

        if (confirmed) {
          btn.disabled = true;
          try {
            await AdminService.deleteMovie(id);
            await loadDashboard();
          } catch (err) {
            Toast.error('Failed to delete review: ' + err.message);
            btn.disabled = false;
          }
        }
      });
    });
  }

  // Initial load
  loadDashboard();
});
