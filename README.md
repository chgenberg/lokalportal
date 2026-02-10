# Hittayta.se

Sveriges ledande marknadsplats för kommersiella lokaler. Hitta butiker, kontor, lager och andra lokaler till salu eller uthyrning.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL med Prisma ORM
- **Auth:** NextAuth (Credentials, e-post/lösenord)
- **E-post:** Resend (kontaktformulär)
- **Kartor:** Leaflet / react-leaflet
- **Deployment:** Docker (standalone output)

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

Valfritt: `SEED_SECRET`, `RESEND_API_KEY`, `CONTACT_EMAIL_TO`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL`.

## Seed-data

För att fylla databasen med exempelannonser (kräver `SEED_SECRET` i produktion):

```bash
curl -X POST -H "Authorization: Bearer DIN_SEED_SECRET" http://localhost:3000/api/seed
# eller: -H "x-seed-secret: DIN_SEED_SECRET"
```

## Projektstruktur

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # NextAuth + registrering
│   │   ├── contact/       # Kontaktformulär (Resend)
│   │   ├── favorites/     # Favoriter
│   │   ├── listings/      # Annonser (GET, create, [id] GET/PUT/DELETE)
│   │   ├── messages/      # Konversationer och meddelanden
│   │   ├── seed/          # Seed exempeldata
│   │   ├── stats/         # Statistik för startsida
│   │   └── upload/        # Filuppladdning (bilder, dokument)
│   ├── annonser/          # Lista annonser, sök, filter
│   ├── annonser/[id]/     # Annonsdetalj
│   ├── dashboard/         # Mina annonser, favoriter, meddelanden
│   ├── karta/             # Kartvy
│   ├── kategorier/        # Kategorier
│   ├── kontakt/           # Kontaktformulär
│   ├── logga-in/          # Inloggning
│   ├── registrera/        # Registrering
│   ├── villkor/           # Villkor, integritet, cookies, om oss
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx           # Startsida
├── components/            # Delade UI-komponenter
├── lib/
│   ├── auth.ts            # NextAuth-konfiguration
│   ├── db.ts              # Prisma-klient (lazy proxy)
│   ├── types.ts           # TypeScript-typer
│   └── useDebounce.ts
├── generated/prisma/      # Prisma Client (genererad)
└── middleware.ts          # Skydd av /dashboard, redirect auth-sidor
```

## Funktioner

- Sök och filter (stad, typ, kategori, pris, storlek, taggar)
- Kartvy med Leaflet
- Inloggning/registrering (hyresvärd/hyresgäst)
- Skapa, redigera och ta bort egna annonser (hyresvärd)
- Favoriter
- Meddelanden mellan hyresgäst och hyresvärd (med filuppladdning)
- Kontaktformulär med e-post via Resend
- Responsiv design med mörkt navy-tema

## Deployment (Docker)

Projektet inkluderar en `Dockerfile` för standalone-build. Säkerställ att `DATABASE_URL` och `NEXTAUTH_SECRET` är satta i miljön. Katalogen `uploads` skapas automatiskt för uppladdade filer.
