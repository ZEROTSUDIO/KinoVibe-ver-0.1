# 🎬 Movie Review App — KinoVibe Prototype v0.1

## Goal
Personal web app to review movies using **4 fixed criteria + personal bias**.
Flow: **Add → Review → Score → Calculate → View**

## Tech Stack
- Backend: PHP (no Laravel yet)
- Database: MySQL/MariaDB
- Frontend: HTML + Bootstrap 5 + vanilla JS
- Server: XAMPP / local PHP server
- No external movie API

## Data Model

**movies**: id, title, year, poster(optional), review_text, story_score, visual_score, action_score, fun_score, created_at, updated_at

**biases**: id, movie_id, reason, amount (can be negative), created_at
*(One movie → many biases)*

## Review Criteria (0–10 each)
| Criterion | Meaning |
|---|---|
| Story | Plot, writing, narrative |
| Visuals | Cinematography, CGI, design |
| Action | Quality/execution of action |
| Fun | Overall enjoyment |

## Bias System
Multiple +/- entries per movie (e.g. `+3 Amazing fight`, `-1 Weak dialogue`). Total bias = `SUM(amount)`.

## Score Calculation
- **Base** = (Story + Visuals + Action + Fun) / 4
- **Final** = (Story + Visuals + Action + Fun + Total Bias) / 4
- Bias is *not* a 5th criterion

Example: Story 3, Visuals 6, Action 9, Fun 8, Bias +4 → Base 6.5, Final 7.5

## Pages
- **`/`** — Library: poster, title, year, final score; view/edit/delete/add; sort by newest/highest/lowest/title
- **`/movie/add`** — Title, year, poster, review, 4 sliders, bias list, live calculated score, save
- **`/movie/{id}`** — Full detail: scores, base/bias breakdown, bias list, written review; edit/delete
- **`/movie/{id}/edit`** — Same as add, pre-filled

## UI Requirements
- 0–10 sliders for scores, updating live
- Add/remove multiple bias entries; final score auto-updates

## Validation
- Required: title, all 4 scores
- Scores: 0–10 | Year: valid | Bias: +/- number
- Review text & poster optional

## Out of Scope (v0.1)
TMDB/API, auth, user accounts, custom criteria, genres, review profiles, tier lists, rankings, auto-tiers, drag & drop, recommendations, statistics, social features

## Future Roadmap
v0.1 Basic reviews → v0.2 TMDB integration → v0.3 Custom review profiles → v0.4 Rankings/tier lists → v0.5 Statistics

## Success Criteria
Review a movie in ~2 minutes, see the score instantly, browse past reviews comfortably — then build further.
