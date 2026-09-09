# 🎬 Movie Review App — KinoVibe Plan & Architecture (v0.2)

> **Personal & Community Cinematic Movie Review & Tier Ranking Platform**  
> Rate films on 4 core criteria, apply personal bias modifiers, plot movies onto a 2D Vibe Matrix, and auto-rank collections into S-to-F tiers with live TMDB integration and Tailwind CSS styling.

---

## 🎯 Product Vision & Goals

**KinoVibe** is built for movie enthusiasts who want more nuance than a single 5-star rating, while keeping the review flow fast, visual, and personal.

- **Fast Logging**: Complete an in-depth review with metadata, scores, and personal biases in under 90 seconds.
- **Dimensional Scoring**: Separate craft (Story & Visuals) from pure enjoyment (Action & Fun), with personal bias adjustments that don't warp base scores.
- **Visual Categorization**: Instant automated tier list ranking (S, A, B, C, D, F) and 2D Quality vs. Entertainment coordinate plotting.
- **Secure Cloud Sync**: Seamless auth and cloud sync via Supabase PostgreSQL, protected by Row Level Security (RLS).

---

## 🛠️ Modern Tech Stack (v0.2)

| Layer | Technology | Details |
|---|---|---|
| **Frontend Framework** | Vanilla ES Modules | Zero heavy UI framework runtime; high performance and instant responsiveness |
| **Build & Dev Tooling** | Vite 6 | Lightning-fast HMR, multi-page HTML bundling, and dev API proxying |
| **Styling & Design System** | Tailwind CSS 3.4 + PostCSS | Custom `kino-*` cinematic dark palette, glow shadows, and responsive layouts (Bootstrap replaced) |
| **Backend & Database** | Supabase (PostgreSQL 15) | Real-time database, JWT user authentication, database triggers, and Row Level Security |
| **External Movie Metadata**| TMDB API via Serverless Proxy | Secure server-side TMDB API proxy (`/api/tmdb/search`, `/api/tmdb/details`) hiding API keys |
| **Deployment & Hosting** | Vercel / Netlify / Static Host | Multi-page build output in `dist/` with serverless Edge endpoints |

---

## 📐 Scoring Formula & Mechanics

### 1. The 4 Fixed Criteria (0.0 – 10.0 each)

| Criterion | Dimension | Focus Areas |
|---|---|---|
| **Story** | Craft (Quality) | Plot coherence, pacing, writing, character arcs, emotional resonance |
| **Visuals** | Craft (Quality) | Cinematography, color grading, VFX/practical effects, production design, direction |
| **Action** | Entertainment (Fun) | Choreography, stunt work, set piece execution, tension, thrill |
| **Fun** | Entertainment (Fun) | Overall engagement, humor, replay value, enjoyment factor |

### 2. The Personal Bias System
Subjective biases allow reviewers to honor guilty pleasures or dock overhyped films without manipulating the objective craft ratings:
- Bias entries consist of a signed decimal number (`amount`) and an explanation (`reason`), e.g., `+1.0 Nostalgia factor`, `-0.5 Glaring plot hole`.
- Users can click **Quick Presets**:
  - `+1 Soundtrack` · `+1 Great Ending` · `+1 Plot Twist` · `+2 Pure Cinema`
  - `-1 Slow Pacing` · `-1 Weak Dialogue` · `-2 Plot Holes`
- **Total Bias**:
  $$\text{Total Bias} = \sum \text{amount}$$

### 3. Score Calculations
$$\text{Base Score} = \frac{\text{Story} + \text{Visuals} + \text{Action} + \text{Fun}}{4}$$

$$\text{Final Score} = \frac{\text{Story} + \text{Visuals} + \text{Action} + \text{Fun} + \text{Total Bias}}{4}$$

*Scores are clamped between 0.0 and 10.0 and formatted to 1 decimal place.*

---

## 🧭 Visual Categorization Engines

### 1. Automated S-to-F Tier List (`tiers.html`)
Movies are auto-ranked into tiers based on their final score:

| Tier | Score Range | Theme & Gradient |
|:---:|:---:|---|
| **S** | 9.0 – 10.0 | Gold Amber (`linear-gradient(#fbbf24, #d97706)`) |
| **A** | 8.0 – 8.9 | Royal Purple (`linear-gradient(#c084fc, #7c3aed)`) |
| **B** | 7.0 – 7.9 | Electric Blue (`linear-gradient(#60a5fa, #2563eb)`) |
| **C** | 5.5 – 6.9 | Emerald Green (`linear-gradient(#34d399, #059669)`) |
| **D** | 4.0 – 5.4 | Vivid Orange (`linear-gradient(#fb923c, #ea580c)`) |
| **F** | 0.0 – 3.9 | Crimson Red (`linear-gradient(#f87171, #dc2626)`) |

*Includes a toggle for **Poster View** vs. **Title Badges View**.*

### 2. The 2D Vibe Matrix (`matrix.html`)
Plots movies onto an interactive Cartesian coordinate plane:
- **X-Axis (Craft Quality)**: $\text{Craft} = \frac{\text{Story} + \text{Visuals}}{2}$
- **Y-Axis (Entertainment)**: $\text{Entertainment} = \frac{\text{Action} + \text{Fun}}{2}$

```
                  High Entertainment (Y ≥ 5)
                            ▲
       Guilty Pleasures     │        Peak Cinema
     (Low Craft, High Fun)  │    (High Craft, High Fun)
                            │
 Low Craft ─────────────────┼────────────────── High Craft (X ≥ 5)
 (X < 5)                    │
       Duds & Skips         │     Slow Burns & Prestige
      (Low Craft, Low Fun)  │     (High Craft, Low Fun)
                            ▼
                  Low Entertainment (Y < 5)
```

---

## 🗺️ Application Pages & Modules Map

```
KinoVibe/
├── index.html            # Landing Page (Hero, Showcase, Formula breakdown, Auth CTAs)
├── library.html          # Movie Library (Search, Filter by tag, Sort, Skeleton loaders)
├── add.html              # Add Movie Review (TMDB live search, Preview card, Sliders, Bias presets)
├── edit.html             # Edit Movie Review (Pre-filled review data, TMDB switcher)
├── view.html             # Detail View (Backdrop hero, Criteria progress meters, Bias breakdown)
├── tiers.html            # Tier List (S to F automated tier groupings, Posters/Titles toggle)
├── matrix.html           # 2D Vibe Matrix (Interactive coordinate board, Quadrant filters)
├── login.html            # Auth Portal (Sign In & Sign Up tabs, Supabase JWT session)
├── admin.html            # Admin & Moderation Portal (Platform statistics, User directory, Moderation table)
│
├── src/
│   ├── services/         # Modular business logic
│   │   ├── auth.service.js    # Session handling, JWT, user roles
│   │   ├── movie.service.js   # Supabase CRUD operations & local caching
│   │   ├── admin.service.js   # Moderation queries, platform metrics
│   │   ├── tmdb.service.js    # TMDB metadata retrieval and image sizing
│   │   └── api.service.js     # Serverless TMDB API proxy client
│   ├── utils/
│   │   ├── scoring.js         # Base, Bias, Final score math algorithms
│   │   └── ui.js              # Toast notifications, HTML escaping, modals
│   └── pages/
│       └── admin.js           # Admin portal controller logic
│
├── api/                  # Serverless proxy endpoints (Vercel / Vite proxy)
│   ├── tmdb/
│   │   ├── search.js          # Search proxy hiding TMDB_API_KEY
│   │   └── details.js         # Detailed film metadata proxy
│   └── health.js              # Health & version diagnostic endpoint
│
├── style.css             # Main stylesheet (Tailwind directives + custom components)
├── tailwind.config.js    # Theme tokens (kino & score palettes, animations, shadows)
├── postcss.config.js     # PostCSS configuration for Tailwind & Autoprefixer
└── vite.config.js        # Multi-page Rollup bundler & local dev server TMDB proxy
```

---

## 🗄️ Database Schema & Security (Supabase)

### `movies` Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → `auth.users`, CASCADE)
- `title` (TEXT, Required)
- `year` (INT)
- `poster_url` (TEXT)
- `backdrop_url` (TEXT)
- `overview` (TEXT)
- `genres` (JSONB)
- `runtime` (INT)
- `tmdb_id` (BIGINT)
- `review_text` (TEXT)
- `story_score` (NUMERIC 3,1)
- `visual_score` (NUMERIC 3,1)
- `action_score` (NUMERIC 3,1)
- `fun_score` (NUMERIC 3,1)
- `base_score` (NUMERIC 3,1, Generated or trigger-maintained)
- `final_score` (NUMERIC 3,1, Generated or trigger-maintained)
- `biases` (JSONB array: `[{"amount": 1, "reason": "Soundtrack"}]`)
- `tags` (TEXT array: `["rewatchable", "sci-fi"]`)
- `is_public` (BOOLEAN, default `true`)
- `created_at` / `updated_at` (TIMESTAMPTZ)

### `profiles` Table
- `id` (UUID, Primary Key → `auth.users`)
- `display_name` (TEXT)
- `is_admin` (BOOLEAN, default `false`)
- `created_at` (TIMESTAMPTZ)

### Security Policies (Row Level Security)
1. **Public Read**: Anyone can read public reviews (`is_public = true`).
2. **Owner Write**: Authenticated users can insert, update, or delete only their own movies (`auth.uid() = user_id`).
3. **Admin Moderation**: Users with `profiles.is_admin = true` have access to moderate/delete flagged content across all users.

---

## 🚀 Future Roadmap

### v0.3 — Social & Profiles
- [ ] Public user profile pages (`/u/:username`)
- [ ] Shareable Tier List and Matrix image export (HTML canvas to PNG)
- [ ] Community reviews feed and like/comment interactions
- [ ] Letterboxd CSV import and export tool

### v0.4 — Advanced Analytics & Customization
- [ ] Custom criteria profiles (e.g. *Horror Mode*: Gore, Tension, Lore, Fun)
- [ ] Director & Actor career matrices (e.g., Nolan filmography quadrant)
- [ ] Yearly wrap-up stats and charts
- [ ] PWA offline support with background Supabase sync

---

## 🎯 Success Metrics
- Average time to log and rank a film: **< 90 seconds**
- Zero client-side exposure of third-party API credentials
- Multi-device responsive experience with dedicated bottom navigation on mobile
- 100% test passing rate on production Vite builds
