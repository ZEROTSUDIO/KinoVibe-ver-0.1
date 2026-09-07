# 🎬 KinoVibe (v0.1)

> **Personal Cinematic Movie Review & Tier Ranking Platform**  
> Rate films across 4 core criteria, apply personal biases, link live metadata via TMDB, and sync your collection securely to the cloud with Supabase.

---

## 🌟 Overview

**KinoVibe** is a lightweight, responsive movie review app designed for film enthusiasts who want more nuance than a simple star rating. Rate movies on **Story**, **Visuals**, **Action**, and **Fun**, adjust for personal quirks with a flexible **Bias System**, and watch your personal library automatically rank into an **S-to-F Tier List**.

---

## ✨ Features

- **🔐 Multi-User Authentication**:
  - Secure registration and login powered by **Supabase Auth**.
  - Protected routes ensure each user manages their own personal collection.
  - User session display and one-click Sign Out in the navigation bar.

- **🎬 TMDB Auto-Search & Metadata**:
  - Integrated with **The Movie Database (TMDB) API**.
  - Live search suggestions with poster previews and release dates.
  - 1-click auto-fill for title, release year, poster art, high-resolution backdrops, synopsis, genres, and runtime.

- **⚖️ 4-Criteria Scoring Formula**:
  - Independent 0–10 sliders for:
    - **Story** (narrative, writing, pacing, emotional impact)
    - **Visuals** (cinematography, VFX, art direction, color grading)
    - **Action** (stunts, choreography, intensity, set pieces)
    - **Fun** (entertainment value, rewatchability, pacing)
  - **Base Score Formula**:
    ```text
    Base Score = (Story + Visuals + Action + Fun) / 4
    ```

- **🎯 Personal Bias Modifiers**:
  - Add custom positive or negative adjustments (e.g., `+1.0 Childhood Nostalgia`, `-0.5 Plot Hole`).
  - **Final Score Formula** (clamped between 0.0 and 10.0):
    ```text
    Final Score = clamp(0, 10, (Story + Visuals + Action + Fun + Total Biases) / 4)
    ```

- **🏆 Automatic Tier List**:
  - Automatically groups all your reviews into tiers based on final score:
    - **S Tier**: ≥ 9.0 *(Masterpiece)*
    - **A Tier**: 8.0 – 8.9 *(Great)*
    - **B Tier**: 7.0 – 7.9 *(Good)*
    - **C Tier**: 6.0 – 6.9 *(Decent)*
    - **D Tier**: 5.0 – 5.9 *(Mediocre)*
    - **E Tier**: 4.0 – 4.9 *(Poor)*
    - **F Tier**: < 4.0 *(Skip)*

- **☁️ Supabase Cloud Sync & Security**:
  - Cloud PostgreSQL storage with **Row Level Security (RLS)** — users can only access their own records.
  - Safe local fallback to keep your interface fast and reliable.

- **🎨 Dark Cinematic UI**:
  - Responsive poster card grid with ticket-cut rating badges.
  - Movie detail page featuring full-bleed backdrop headers, synopsis, score breakdowns, and bias badges.
  - Smooth loading states and empty state screens.

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 (Custom Dark Theme + Utility classes), ES6+ JavaScript.
- **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL + Supabase Auth).
- **External API**: [The Movie Database (TMDB) API v3](https://www.themoviedb.org/documentation/api).
- **Deployment**: [Vercel](https://vercel.com/) (`vercel.json` with clean URL routing).

---

## 📁 Project Structure

```text
KinoVibe/
├── index.html       # Movie library grid view with search & sorting
├── add.html         # Add movie form with TMDB autocomplete
├── edit.html        # Edit movie form
├── view.html        # Movie details with backdrop, score breakdown, and synopsis
├── tiers.html       # S-to-F automated tier list
├── login.html       # Authentication (Sign In & Sign Up tabs)
├── app.js           # Supabase client, Auth helper, and MovieStore CRUD
├── library.js       # Library page controller (fetch, sort, render cards)
├── form.js          # Form handler (sliders, TMDB autocomplete, bias rows)
├── detail.js        # Movie detail page controller (delete modal, hero backdrop)
├── tiers.js         # Tier list generation and grouping
├── tmdb.js          # TMDB API wrapper module
├── style.css        # Core stylesheet (dark mode, layout, components, animations)
├── vercel.json      # Vercel deployment configuration
└── README.md        # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- A modern web browser (Chrome, Edge, Firefox, Safari).
- A free account on [Supabase](https://supabase.com/) (for cloud sync & authentication).
- A free [TMDB API Key](https://www.themoviedb.org/settings/api).

### 2. Supabase Setup
1. Create a new project in your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** tab and run the following script:

```sql
-- Create the movies table
CREATE TABLE IF NOT EXISTS movies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT '',
  year integer,
  poster_url text DEFAULT '',
  backdrop_url text DEFAULT '',
  overview text DEFAULT '',
  genres jsonb DEFAULT '[]'::jsonb,
  runtime integer,
  tmdb_id integer,
  review_text text DEFAULT '',
  story_score numeric DEFAULT 5,
  visual_score numeric DEFAULT 5,
  action_score numeric DEFAULT 5,
  fun_score numeric DEFAULT 5,
  biases jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- Set up Row Level Security Policies
CREATE POLICY "Users can view their own movies" ON movies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own movies" ON movies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own movies" ON movies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own movies" ON movies
  FOR DELETE USING (auth.uid() = user_id);
```

3. Copy your **Project URL** and **anon public key** from **Project Settings → API**.
4. In `app.js`, verify the configuration constants:
   ```javascript
   const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
   const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';
   ```

### 3. TMDB Configuration
In `tmdb.js`, ensure your TMDB v3 API key is configured:
```javascript
const TMDB_API_KEY = 'YOUR_TMDB_API_KEY';
```

### 4. Running Locally
Because modern browsers enforce CORS restrictions on external API requests from `file:///` URLs, run KinoVibe using any local development server:

- **VS Code**: Install the **Live Server** extension, right-click `index.html`, and select **Open with Live Server**.
- **Python**:
  ```bash
  python -m http.server 3000
  ```
- **Node / npx**:
  ```bash
  npx serve .
  ```
Navigate to `http://localhost:3000` in your browser.

---

## 🌐 Deploying to Vercel

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "KinoVibe v0.1 release"
   git push origin main
   ```
2. Log in to [Vercel](https://vercel.com) and click **Add New → Project**.
3. Select your GitHub repository (`KinoVibe-ver-0.1`).
4. Keep the default settings (Framework Preset: *Other*) and click **Deploy**.
5. Your app is live with SSL and automatic deployments on every `git push`!

---

## 📋 Release Notes — v0.1

- **Initial Core Release**:
  - Complete 4-criteria rating system + personal bias calculator.
  - Supabase authentication & PostgreSQL cloud database integration.
  - Row Level Security (RLS) multi-tenant protection.
  - Live TMDB search with auto-populating posters, backdrops, genres, and metadata.
  - Automated S–F tier list generation.
  - Custom dark cinematic theme with ticket-cut score badges.
  - Production-ready Vercel configuration.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
