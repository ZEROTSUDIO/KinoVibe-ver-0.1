// KinoVibe v0.2 — Landing Page Controller

document.addEventListener('DOMContentLoaded', async () => {
  // ─── 1. Auth Status & Dynamic CTAs ──────────────────
  try {
    const user = await Auth.getUser();
    if (user) {
      updateUIForAuthenticatedUser(user);
    }
  } catch (err) {
    console.warn('Could not check auth status on landing page:', err);
  }

  function updateUIForAuthenticatedUser(user) {
    // Top Navigation actions
    const navActions = document.getElementById('landing-nav-actions');
    if (navActions) {
      navActions.innerHTML = `
        <span class="nav-user-email" style="font-size:13px;color:var(--text-secondary);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(user.email)}">
          ${escapeHtml(user.email)}
        </span>
        <a href="library.html" class="btn-nav-primary">Open Library →</a>
        <button id="landing-signout-btn" class="nav-signout-btn" style="padding:6px 12px;font-size:13px">Sign Out</button>
      `;

      document.getElementById('landing-signout-btn')?.addEventListener('click', async () => {
        await Auth.signOut();
        window.location.reload();
      });
    }

    // Hero CTA Buttons
    const heroPrimaryCta = document.getElementById('hero-primary-cta');
    if (heroPrimaryCta) {
      heroPrimaryCta.href = 'library.html';
      heroPrimaryCta.innerHTML = 'Go to Your Library <span>→</span>';
    }

    const heroSecondaryCta = document.getElementById('hero-secondary-cta');
    if (heroSecondaryCta) {
      heroSecondaryCta.href = 'add.html';
      heroSecondaryCta.textContent = '+ Add New Movie';
    }

    // Conversion Banner CTAs
    const conversionPrimaryCta = document.getElementById('conversion-primary-cta');
    if (conversionPrimaryCta) {
      conversionPrimaryCta.href = 'library.html';
      conversionPrimaryCta.textContent = 'Go to Your Library →';
    }

    const conversionSecondaryCta = document.getElementById('conversion-secondary-cta');
    if (conversionSecondaryCta) {
      conversionSecondaryCta.style.display = 'none';
    }
  }

  // ─── 2. Mobile Menu Toggle ─────────────────────────
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('landing-nav-menu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const isOpen = navMenu.classList.contains('open');
      mobileToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when clicking a link
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    });
  }

  // ─── 3. Screenshot Showcase Tabs ───────────────────
  const screenshotData = {
    library: {
      address: 'kinovibe.app/library',
      badge: 'Library View',
      title: 'Personal Movie Library & Smart Tag Filters',
      desc: 'Browse your entire collection with ticket rating badges, sort by Newest, Rating, or Title, and multi-filter with AND tags.',
      imageSrc: 'screenshots/library.png',
      wireframeId: 'wf-library'
    },
    review: {
      address: 'kinovibe.app/view?id=blade-runner-2049',
      badge: 'Scoring View',
      title: 'Nuanced 4-Metric Rating & Bias Breakdown',
      desc: 'Fine-tune Story, Visuals, Action, and Fun sliders (0–10). Attach custom biases (+/- modifiers) that reflect your personal tastes.',
      imageSrc: 'screenshots/review.png',
      wireframeId: 'wf-review'
    },
    tiers: {
      address: 'kinovibe.app/tiers',
      badge: 'Tier Ranking',
      title: 'Automatic S-to-F Tier List',
      desc: 'Zero manual sorting needed. Every movie you score is automatically organized into S, A, B, C, D, E, or F tiers with poster and title toggles.',
      imageSrc: 'screenshots/tiers.png',
      wireframeId: 'wf-tiers'
    },
    matrix: {
      address: 'kinovibe.app/matrix',
      badge: 'Vibe Matrix',
      title: '2D Quality vs. Entertainment Scatter Matrix',
      desc: 'Plot films on a 2-axis scatter chart to uncover hidden gems, masterworks, popcorn flicks, and guilty pleasures.',
      imageSrc: 'screenshots/matrix.png',
      wireframeId: 'wf-matrix'
    }
  };

  const tabButtons = document.querySelectorAll('.screenshot-tab-btn');
  const addressEl = document.getElementById('mockup-address');
  const badgeEl = document.getElementById('mockup-badge');
  const captionTitleEl = document.getElementById('caption-title');
  const captionDescEl = document.getElementById('caption-desc');
  const mockupImage = document.getElementById('mockup-image');
  const wireframes = document.querySelectorAll('.screenshot-wireframe');

  function selectScreenshotTab(tabKey) {
    const data = screenshotData[tabKey];
    if (!data) return;

    // Update active tab buttons
    tabButtons.forEach(btn => {
      const isTarget = btn.dataset.tab === tabKey;
      btn.classList.toggle('active', isTarget);
      btn.setAttribute('aria-selected', isTarget);
    });

    // Update titlebar & captions
    if (addressEl) addressEl.textContent = data.address;
    if (badgeEl) badgeEl.textContent = data.badge;
    if (captionTitleEl) captionTitleEl.textContent = data.title;
    if (captionDescEl) captionDescEl.textContent = data.desc;

    // Hide all wireframe fallbacks first
    wireframes.forEach(wf => {
      wf.style.display = 'none';
    });

    // Handle Image vs Wireframe Fallback
    if (mockupImage) {
      // Test if user-provided image exists
      const testImg = new Image();
      testImg.src = data.imageSrc;

      testImg.onload = () => {
        // Screenshot exists! Display actual screenshot
        mockupImage.src = data.imageSrc;
        mockupImage.alt = data.title;
        mockupImage.style.display = 'block';
      };

      testImg.onerror = () => {
        // No screenshot uploaded yet — gracefully display tailored wireframe placeholder
        mockupImage.style.display = 'none';
        const targetWf = document.getElementById(data.wireframeId);
        if (targetWf) {
          targetWf.style.display = 'flex';
        }
      };
    }
  }

  // Attach tab click listeners
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      selectScreenshotTab(btn.dataset.tab);
    });
  });

  // Initialize with Library tab
  selectScreenshotTab('library');
});
