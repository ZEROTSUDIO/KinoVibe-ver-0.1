// KinoVibe UI Components & Helper Module

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Toast Notification Manager
 */
class ToastManager {
  constructor() {
    this.container = null;
  }

  _ensureContainer() {
    if (!this.container || !document.body.contains(this.container)) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      this.container.setAttribute('aria-live', 'polite');
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'info', duration = 4000) {
    this._ensureContainer();

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type} fade-in`;
    
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ'}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
      <button type="button" class="toast-close" aria-label="Close notification">&times;</button>
    `;

    this.container.appendChild(toast);

    let timer = setTimeout(() => this._dismiss(toast), duration);

    toast.querySelector('.toast-close').addEventListener('click', () => {
      clearTimeout(timer);
      this._dismiss(toast);
    });

    // Pause on hover
    toast.addEventListener('mouseenter', () => clearTimeout(timer));
    toast.addEventListener('mouseleave', () => {
      timer = setTimeout(() => this._dismiss(toast), 2000);
    });

    return toast;
  }

  _dismiss(toast) {
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    });
  }

  success(msg, duration) { return this.show(msg, 'success', duration); }
  error(msg, duration) { return this.show(msg, 'error', duration || 6000); }
  warning(msg, duration) { return this.show(msg, 'warning', duration); }
  info(msg, duration) { return this.show(msg, 'info', duration); }
}

export const Toast = new ToastManager();

/**
 * Confirmation Modal Helper
 */
export function showConfirmModal({
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false
}) {
  return new Promise((resolve) => {
    let modal = document.getElementById('kinovibe-confirm-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'kinovibe-confirm-modal';
      modal.className = 'confirm-modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="confirm-modal-dialog">
        <h3 class="confirm-modal-title">${escapeHtml(title)}</h3>
        <p class="confirm-modal-text">${escapeHtml(message)}</p>
        <div class="confirm-modal-actions">
          <button type="button" class="btn-modal-cancel">${escapeHtml(cancelText)}</button>
          <button type="button" class="${danger ? 'btn-modal-danger' : 'btn-modal-confirm'}">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    modal.classList.add('active');

    const cleanUp = (result) => {
      modal.classList.remove('active');
      resolve(result);
    };

    modal.querySelector('.btn-modal-cancel').onclick = () => cleanUp(false);
    modal.querySelector(danger ? '.btn-modal-danger' : '.btn-modal-confirm').onclick = () => cleanUp(true);
    modal.onclick = (e) => {
      if (e.target === modal) cleanUp(false);
    };
  });
}

/**
 * Skeleton Screen Generators
 */
export const Skeleton = {
  renderGrid(container, count = 8) {
    if (!container) return;
    container.innerHTML = Array.from({ length: count }).map(() => `
      <div class="col-6 col-md-4 col-lg-3">
        <div class="skeleton-card">
          <div class="skeleton-poster skeleton-shimmer"></div>
          <div class="skeleton-body">
            <div class="skeleton-title skeleton-shimmer"></div>
            <div class="skeleton-meta skeleton-shimmer"></div>
          </div>
        </div>
      </div>
    `).join('');
    container.classList.remove('hidden');
  }
};
