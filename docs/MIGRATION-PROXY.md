# Migration: middleware.ts → proxy.ts (Next.js 16)

## Bakgrund

Next.js 16 har deprekerat `middleware.ts` och bytt namn till `proxy.ts`. Bygget visar varningen:

```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
```

## Vad som ändras

| Före | Efter |
|------|-------|
| `src/middleware.ts` | `src/proxy.ts` |
| `export async function middleware(...)` | `export async function proxy(...)` |

**Övrigt är oförändrat:** `NextRequest`, `NextResponse`, `config.matcher` fungerar som tidigare.

## Nuvarande logik (middleware.ts)

- Skyddar `/dashboard/*` – redirect till `/logga-in` om ej inloggad
- Redirect inloggade användare från `/logga-in` och `/registrera` till `/dashboard`
- Använder `getToken` från `next-auth/jwt`

## Migrationssteg

### Steg 1: Kör codemod (rekommenderat)

```bash
npx @next/codemod@canary middleware-to-proxy .
```

Detta gör automatiskt:
1. Byter namn på `middleware.ts` → `proxy.ts`
2. Byter namn på funktionen `middleware` → `proxy`

### Steg 2: Verifiera

- Kör `npm run build` – varningen ska vara borta
- Testa flöden:
  - Oinloggad besökare till `/dashboard` → redirect till `/logga-in`
  - Inloggad användare till `/logga-in` → redirect till `/dashboard`
  - Inloggad användare till `/registrera` → redirect till `/dashboard`

### Steg 3: Uppdatera referenser (om några)

Sök efter `middleware` i koden – det bör inte finnas externa referenser till filen.

## Alternativ: Server Layout Guards

Next.js rekommenderar att flytta autentisering från Proxy till **Server Layout Guards** i layout-filer. Detta är en större refaktor men ger bättre säkerhet och prestanda.

**Exempel för dashboard:**

```tsx
// src/app/dashboard/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/logga-in?callback=/dashboard");
  }
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
```

**Fördelar med Layout Guards:**
- Auth sker i render-context, inte i nätverkskant
- Minskad risk för sårbarheter (t.ex. CVE-2025-29927)
- Enklare att felsöka

**Om du vill migrera till Layout Guards:** Ta bort auth-logiken ur proxy och lägg den i `dashboard/layout.tsx` samt i auth-sidornas layout eller page.

## Rekommendation

**Fas 1 (snabb):** Kör codemod – löser varningen med minimal risk.

**Fas 2 (valfri):** Planera flytt av auth till Layout Guards för långsiktig säkerhet.
