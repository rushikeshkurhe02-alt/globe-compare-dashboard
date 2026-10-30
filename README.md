# Atlas Compare — Public Data Explorer & Side-by-Side Comparison

**Atlas Compare** is an advanced, production-grade public data explorer that allows users to explore every country in the world, compare 2–3 nations side by side using live data from the **World Bank Open Data API** and the **Open Countries Dataset**, discover their personalized best-fit country with weighted multi-criteria ranking, save favorite comparisons to Firebase, and generate analytical executive summaries with **Google Gemini**.

Designed with the precision, typographic rhythm, and data density of tools like Linear, Vercel, and Stripe.

---

## Features

### 1. Global Nation Explorer (`/`)
- Browse 250+ countries with live demographic and geographic data directly from the World Bank API, the Open Countries dataset, and FlagCDN.
- Dynamic computed hero stats: total countries, distinct regions, and global world population with smooth count-up animations.
- Instant debounced search (300ms) matching common & official names, capital cities, and 3-letter ISO codes (`cca3`).
- Keyboard shortcuts: `/` to focus search, `Esc` to close modal/drawer sheets.
- Filtering by continental region (Africa, Americas, Asia, Europe, Oceania, Antarctic) with horizontal snap scroll.
- Multi-criteria sorting: Name (A–Z / Z–A), Population (High–Low / Low–High), Land Area (Large–Small).
- Grid & List view modes, synced to URL query parameters (`?q=...&region=...&sort=...`).
- Infinite scroll with IntersectionObserver (24 items per batch) and smooth Back to Top button.
- Country Detail Slide-Over Sheet (Right sheet on desktop, bottom sheet on mobile with drag handle): currencies, official languages, timezones, driving side, landlocked status, and clickable bordering countries.

### 2. Side-by-Side Comparison Engine (`/compare?c=IND,USA,JPN`)
- Compare up to 3 nations simultaneously with consistent color tokens:
  - Country 1: `#6366F1` (Indigo)
  - Country 2: `#22D3EE` (Cyan)
  - Country 3: `#F59E0B` (Amber)
- Bento Key Stats row highlighting the winner with a "Highest" trophy badge.
- **Multi-Indicator Radar Chart**: 0–100 relative normalized polygon visualization covering GDP per Capita, Population, Adult Literacy, Life Expectancy, and Internet Penetration.
- **Historical Trend Chart (2000–2024)**: Interactive Recharts time-series with smooth monotonic splines, metric segmented switcher, and hover inspect tooltips.
- **Comprehensive Attribute Table**: Sticky first column, clean category groupings, and automatic green highlight badges on the winning metrics per row.
- **Save Comparison Button**: Save the current benchmark to your personal Firestore collection with an inline name input.
- **Command-Palette Country Modal**: Quickly search and add nations when fewer than 3 are selected.
- **Copy Share Link**: Instant URL clipboard sharing with animated success feedback.

### 3. Firebase Authentication & Saved Comparisons (`/saved`)
- **Google Sign-In**: Authenticate seamlessly via Firebase Google Auth provider (`signInWithPopup`).
- **User Navigation**: Dynamic user avatar in the navbar with dropdown options for "Saved comparisons" and "Sign out", including flicker-free avatar skeletons during initial auth resolution.
- **Saved Comparisons Vault (`/saved`)**:
  - Overlapping flag avatar stack showing compared nations.
  - Custom comparison title and relative timestamps (e.g. "2 days ago", "Just now").
  - "Open" action restoring the exact `/compare?c=...` configuration.
  - Instant optimistic deletion with confirmation flow.
  - Protected route prompting unauthenticated visitors to sign in with Google.

### 4. AI Insights Powered by Gemini (`/compare`)
- Real-time macroeconomic synthesis using the official `@google/genai` TypeScript SDK and the `gemini-3.8-flash` model.
- Analyzes existing fetched country data (GDP, longevity, internet access, literacy, population, area) via an Express backend endpoint (`/api/insights`).
- Strict JSON structured output with executive summary, per-country strengths and watch-outs, and an analytical verdict.
- On-demand generation with in-memory caching per unique combination of country codes to protect user quota.

### 5. "Best Country for Me" Match Scorer (`/match`)
- Find your best-fit country with 5 interactive sliders (0–100):
  - **Economy**: GDP per capita (`NY.GDP.PCAP.CD`)
  - **Health**: Life expectancy at birth (`SP.DYN.LE00.IN`)
  - **Education**: Adult literacy rate (`SE.ADT.LITR.ZS`)
  - **Connectivity**: Internet users (% of population) (`IT.NET.USER.ZS`)
  - **Population Scale**: Total population size (`SP.POP.TOTL`)
- One-click presets: **Balanced**, **Career focused**, **Quality of life**.
- Min-max normalization across all world nations joined against World Bank and Open Countries indicators.
- Live-updating Top 10 rankings with animated score bars and layout transition animations.
- Large `#1 Best Match` hero spotlight card with indicator breakdown.
- Mobile bottom sheet controls for quick thumb adjustments.

---

## Firestore Database Structure & Security Rules

### Data Model
Documents are stored in a private subcollection per authenticated user:

```
users/{uid}/comparisons/{id}
```

Fields:
- `name` (string, 1–100 chars): User-defined title
- `countries` (array of strings, size 2–3): ISO 3-letter country codes (`cca3`)
- `createdAt` (serverTimestamp): Timestamp set at document creation

### Security Rules
Only the authenticated owner can read, write, or delete their own saved comparison documents. Public or cross-user access is strictly denied.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Default Deny All
    match /{document=**} {
      allow read, write: if false;
    }

    function isValidId(id) {
      return id is string && id.size() > 0 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$');
    }

    function incoming() {
      return request.resource.data;
    }

    function existing() {
      return resource.data;
    }

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isValidComparison(data) {
      return data.keys().hasAll(['name', 'countries', 'createdAt'])
        && data.keys().hasOnly(['name', 'countries', 'createdAt'])
        && data.name is string
        && data.name.size() >= 1
        && data.name.size() <= 100
        && data.countries is list
        && data.countries.size() >= 2
        && data.countries.size() <= 3
        && data.countries[0] is string
        && data.countries[0].size() <= 3;
    }

    // Only the authenticated user can read or write their own comparisons
    match /users/{userId}/comparisons/{comparisonId} {
      allow read: if isOwner(userId) && isValidId(userId);
      allow delete: if isOwner(userId) && isValidId(userId) && isValidId(comparisonId);
      allow create: if isOwner(userId)
        && isValidId(userId)
        && isValidId(comparisonId)
        && isValidComparison(incoming())
        && incoming().createdAt == request.time;
      allow update: if isOwner(userId)
        && isValidId(userId)
        && isValidId(comparisonId)
        && isValidComparison(incoming())
        && incoming().createdAt == existing().createdAt
        && incoming().diff(existing()).affectedKeys().hasOnly(['name']);
    }
  }
}
```

---

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React 19 & TypeScript** | Component architecture, strict type definitions, hooks |
| **Firebase Auth & Firestore** | Google OAuth sign-in and persistent user cloud comparisons |
| **Vite 8 & Express** | Full-stack server with Vite middlewares and Gemini API route |
| **@google/genai** | Official Google GenAI SDK for Gemini 3.8 Flash model |
| **Tailwind CSS v4** | Design tokens, `@custom-variant dark`, utility styling |
| **TanStack React Query v5** | Server-state caching and optimistic mutation management |
| **React Router v6** | Declarative routing with code-splitting (`React.lazy`) |
| **Zustand** | Global comparison selection state and theme management |
| **Recharts** | Interactive Radar and Multi-line Trend visualizers |
| **motion (Framer Motion)** | Spring physics, slide-overs, and layout transitions |
| **Lucide React** | Clean, accessible iconography (strictly zero emojis) |

---

## Getting Started

### Installation

```bash
npm install
```

### Development Server

Start the full-stack server on port 3000:

```bash
npm run dev
```

### Production Build & Linting

```bash
npm run lint
npm run build
npm start
```
