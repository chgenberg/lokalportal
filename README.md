# Offmarket.nu

Sveriges marknadsplats för off-market bostäder. Hitta villor, lägenheter, fritidshus och tomter till salu – innan de når den öppna marknaden.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL med Prisma ORM
- **Auth:** NextAuth (Credentials, e-post/lösenord, BankID-stub)
- **Betalning:** Stripe (annonsprenumeration + premium)
- **E-post:** Resend (kontaktformulär)
- **AI:** OpenAI (annonsgenerering, chatbot, rådgivare)
- **Kartor:** Leaflet / react-leaflet
- **Deployment:** Docker (standalone output), Railway

## Förutsättningar

- Node.js 20+
- PostgreSQL-databas

## Installation

```bash
# Installera beroenden
npm install

# Kopiera miljövariabler
cp .env.example .env.local
# Redigera .env.local med DATABASE_URL, NEXTAUTH_SECRET m.m.

# Generera Prisma-klient och kör migrationer
npx prisma generate
npx prisma migrate deploy
# eller för utveckling: npx prisma migrate dev

# Starta utvecklingsserver
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000) i webbläsaren.

## Miljövariabler

Se `.env.example`. Obligatoriskt:

- `DATABASE_URL` – PostgreSQL-anslutningssträng
- `NEXTAUTH_SECRET` – hemlighet för NextAuth (krävs i produktion)

Valfritt: `SEED_SECRET`, `RESEND_API_KEY`, `CONTACT_EMAIL_TO`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL`, `OPENAI_API_KEY` (för AI-genererade annonser), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `TRUST_PROXY="true"` (nödvändigt bakom reverse proxy för korrekt IP-baserad rate limiting).

## Seed-data

För att fylla databasen med exempelannonser (kräver `SEED_SECRET` i produktion):

```bash
curl -X POST -H "Authorization: Bearer DIN_SEED_SECRET" http://localhost:3000/api/seed
```

## Funktioner

- Off-market bostäder: villor, lägenheter, fritidshus, tomter
- AI-genererade annonser med bilder, planritningar och områdesdata
- Sök och filter (stad, kategori, pris, storlek, rum)
- Kartvy med Leaflet
- Inloggning/registrering (köpare/säljare)
- Köparprofiler med matchning mot annonser
- Budget-gate och visningsbokning
- Meddelanden mellan köpare och säljare
- BankID-verifiering (stub)
- Stripe-betalningar (annonsprenumeration + premium)
- Admin-panel
- Kontaktformulär med e-post via Resend
- Responsiv design med mörkt navy-tema

## Deployment (Docker)

Projektet inkluderar en `Dockerfile` för standalone-build. Säkerställ att `DATABASE_URL` och `NEXTAUTH_SECRET` är satta i miljön.
