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
