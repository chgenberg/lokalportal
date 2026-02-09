# Lokalportal

Sveriges smartaste marknadsplats för kommersiella lokaler. Hitta butiker, kontor, lager och andra lokaler till salu eller uthyrning.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend:** Next.js API Routes
- **Database:** Redis (via ioredis)
- **Deployment:** Railway + GitHub
- **Auth:** BankID (placeholder)

## Getting Started

### Prerequisites

- Node.js 20+
- Redis (optional - app works with sample data without Redis)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local .env.local
# Edit .env.local with your Redis URL

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Seed Data

To populate Redis with sample listings:

```bash
curl -X POST http://localhost:3000/api/seed
```

## Deployment on Railway

1. Push your code to GitHub
2. Create a new project on [Railway](https://railway.app)
3. Add a Redis service
4. Connect your GitHub repository
5. Railway will automatically detect the Dockerfile and deploy
6. The `REDIS_URL` environment variable is automatically set by Railway when you add Redis

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── listings/    # Listings API
│   │   └── seed/        # Seed sample data
│   ├── annonser/        # All listings page
│   ├── annonspaket/     # Pricing packages
│   ├── kategorier/      # Categories page
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx         # Homepage
├── components/
│   ├── CategoriesSection.tsx
│   ├── CTASection.tsx
│   ├── FeaturedListings.tsx
│   ├── FeaturesSection.tsx
│   ├── Footer.tsx
│   ├── Header.tsx
│   ├── HeroSearch.tsx
│   └── ListingCard.tsx
└── lib/
    ├── redis.ts         # Redis client & helpers
    └── types.ts         # TypeScript types
```

## Features

- City autocomplete search (suggests Swedish cities after 3 characters)
- Filter by type (Till salu / Uthyres) and category (Butik / Kontor / Lager / Övrigt)
- Responsive, minimalist design with dark navy theme
- Interactive pricing page with monthly/yearly toggle
- BankID login placeholder for verified advertisers
- Redis-backed data with graceful fallback to sample data
