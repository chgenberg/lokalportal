import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

const sampleListings = [
  {
    id: "demo-1",
    title: "Nyrenoverad butikslokal vid Stureplan",
    description:
      "Exklusiv butikslokal i absolut bästa läge vid Stureplan. Lokalen har genomgått en totalrenovering under 2025 och erbjuder 145 kvm fördelat på ett öppet försäljningsrum med 6 meter skyltfönster mot Birger Jarlsgatan, ett lager/personalutrymme samt ett modernt pentry. Golv i polerad betong, LED-belysning i tak och nyinstallerad ventilation. Perfekt för mode, inredning, skönhet eller konceptbutik. Hyran inkluderar värme och vatten. Tillträde omgående.",
    city: "Stockholm",
    address: "Birger Jarlsgatan 18",
    type: "rent",
    category: "butik",
    price: 42000,
    size: 145,
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
    featured: true,
    lat: 59.3370,
    lng: 18.0735,
    tags: ["Nyrenoverad", "Centralt läge", "Skyltfönster"],
    contactName: "Helena Lindqvist",
    contactEmail: "helena.lindqvist@sturefast.se",
    contactPhone: "08-545 270 00",
  },
  {
    id: "demo-2",
    title: "Ljust hörnkontor med terrass – Västra Hamnen, Malmö",
    description:
      "Stilrent kontorslandskap på plan 4 i Turning Torso-kvarteret med fri utsikt över Öresund. Lokalen på 310 kvm rymmer ca 30 arbetsplatser i öppen planlösning plus tre inglasade mötesrum, ett tyst rum och ett rymligt kök med sittplatser för 12 personer. Stor terrass på 25 kvm mot söder. Fiber 1 Gbit/s, passagesystem, cykelrum med dusch och 8 parkeringsplatser i garage ingår. Perfekt för tech, konsult eller kreativt bolag som vill sitta i Malmös mest eftertraktade kontorsområde.",
    city: "Malmö",
    address: "Turning Torso Allé 4, plan 4",
    type: "rent",
    category: "kontor",
    price: 68500,
    size: 310,
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    featured: true,
    lat: 55.6133,
    lng: 12.9756,
    tags: ["Fiber", "Klimatanläggning", "Öppen planlösning", "Parkering", "Mötesrum"],
    contactName: "Marcus Ekberg",
    contactEmail: "marcus.ekberg@vastrahamnen-kontor.se",
    contactPhone: "040-630 22 00",
  },
  {
    id: "demo-3",
    title: "Logistiklager med kylanläggning – Hisingen, Göteborg",
    description:
      "Högklassig lagerlokal på 1 850 kvm med 9 meters takhöjd, belägen i Göteborgs bästa logistikläge med direkt anslutning till E6/E45. Byggnaden från 2022 har isolerat golv, LED-belysning med rörelsesensor och en kylanläggning på 400 kvm (2–8 °C) – perfekt för livsmedel, läkemedel eller e-handel med temperaturkänsliga varor. Fyra lastbryggor (varav en med ramp för sidolastning), 1 200 kvm asfalterad manöveryta och 20 P-platser. Kontorsdel på 120 kvm med 4 rum, kök och dusch. Tillgängligt från 1 april 2026.",
    city: "Göteborg",
    address: "Importgatan 24, Hisingen",
    type: "rent",
    category: "lager",
    price: 135000,
    size: 1850,
    imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
    featured: true,
    lat: 57.7310,
    lng: 11.9420,
    tags: ["Lastbrygga", "Parkering", "Hög takhöjd", "Klimatanläggning"],
    contactName: "Johan Bergström",
    contactEmail: "johan.bergstrom@gbglogistik.se",
    contactPhone: "031-380 45 00",
  },
];

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && !process.env.SEED_SECRET?.trim()) {
    return new NextResponse(null, { status: 404 });
  }
  const secret =
    request.headers.get("x-seed-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!process.env.SEED_SECRET || secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Obehörig" }, { status: 401 });
  }

  try {
    let count = 0;
    for (const listing of sampleListings) {
      await prisma.listing.upsert({
        where: { id: listing.id },
        update: listing,
        create: listing,
      });
      count++;
    }

    return NextResponse.json({ message: `Seeded ${count} listings`, count });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json(
      { error: "Kunde inte ladda exempeldata." },
      { status: 500 }
    );
  }
}
