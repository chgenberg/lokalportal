import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

const sampleListings = [
  {
    id: "demo-1",
    title: "Nyrenoverad butikslokal vid Stureplan – 145 m² med skyltfönster",
    description:
      `## Om lokalen

Exklusiv butikslokal i absolut bästa läge vid Stureplan, totalrenoverad under 2025. Lokalen erbjuder 145 kvm fördelat på ett öppet försäljningsrum med 6 meter skyltfönster mot Birger Jarlsgatan, ett lager/personalutrymme samt ett modernt pentry med diskmaskin och kyl.

## Lokalen i detalj

Golv i polerad betong, LED-belysning i tak och nyinstallerad ventilation med individuell temperaturstyrning. Takhöjd 3,8 meter i försäljningsrummet. Toalett med handikappanpassning. Fasaden har nyligen putsats och entrén har automatiska skjutdörrar i glas. Elkapacitet 63A trefas. Lokalen levereras i nyskick med vita väggar och är redo för inflyttning.

## Läge & kommunikationer

Birger Jarlsgatan 18 ligger mitt i Stockholms mest exklusiva shoppingstråk, 50 meter från Stureplan. Östermalmstorgs tunnelbanestation (röda linjen) nås på 2 minuters promenad. Busshållplats Stureplan med linje 1, 2 och 55 ligger precis utanför dörren. Cykelstråk längs Birger Jarlsgatan.

## Område & omgivning

Stureplan är Stockholms mest kända mötesplats med en unik blandning av lyxhandel, restauranger och nöjesliv. Grannarna inkluderar NK, Sturegallerian och Bibliotekstan. Området har hög fotgängartrafik dygnet runt och lockar en köpstark målgrupp. Inom 500 meter finns över 200 butiker och 80 restauranger.

## Sammanfattning

Perfekt för mode, inredning, skönhet eller konceptbutik som vill synas i Stockholms mest prestigefyllda läge. Hyran inkluderar värme och vatten. Tillträde omgående. Kontakta oss för visning.`,
    city: "Stockholm",
    address: "Birger Jarlsgatan 18, Östermalm",
    type: "rent",
    category: "butik",
    price: 42000,
    size: 145,
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
    imageUrls: [
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
      "https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=800&q=80",
      "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&q=80",
    ],
    featured: true,
    lat: 59.337,
    lng: 18.0735,
    tags: ["Nyrenoverad", "Centralt läge", "Skyltfönster", "Hög takhöjd", "Handikappanpassad", "Fiber"],
    contactName: "Helena Lindqvist",
    contactEmail: "helena.lindqvist@sturefast.se",
    contactPhone: "08-545 270 00",
    areaData: {
      nearby: {
        restaurants: 83,
        shops: 214,
        busStops: { count: 6, nearest: "Stureplan (50 m)" },
        trainStations: { count: 2, nearest: "Östermalmstorg T-bana (180 m)" },
        parking: 12,
        schools: 4,
        healthcare: 8,
        gyms: 6,
      },
      demographics: {
        city: "Stockholm",
        population: 984748,
        medianIncome: 398000,
        workingAgePct: 68.2,
        totalBusinesses: 142500,
      },
      priceContext: {
        medianPrice: 310,
        minPrice: 180,
        maxPrice: 520,
        count: 18,
      },
    },
  },
  {
    id: "demo-2",
    title: "Ljust hörnkontor med terrass – Västra Hamnen, Malmö",
    description:
      `## Om lokalen

Stilrent kontorslandskap på plan 4 i Turning Torso-kvarteret med fri utsikt över Öresund. Lokalen på 310 kvm rymmer ca 30 arbetsplatser i öppen planlösning plus tre inglasade mötesrum, ett tyst rum och ett rymligt kök med sittplatser för 12 personer.

## Lokalen i detalj

Stor terrass på 25 kvm mot söder med utemöbler. Fiber 1 Gbit/s, passagesystem med tagg, cykelrum med 20 platser och dusch. 8 parkeringsplatser i garage ingår i hyran. Takhöjd 2,9 meter, ljuddämpande undertak, golvvärme och individuell klimatstyrning per zon. Kontorsbelysning med dagsljussensor. Toaletter på varje plan. Hiss och trappa.

## Läge & kommunikationer

Västra Hamnen är Malmös mest moderna stadsdel med gångavstånd till Malmö Central (15 min) och Triangeln station (12 min). Busslinje 2 stannar 100 meter från entrén med avgångar var 5:e minut. Öresundsbron och E6 nås på 10 minuter med bil. Köpenhamns flygplats ligger 35 minuter bort.

## Område & omgivning

Området präglas av arkitektur i världsklass, havsbrisen och en ung, kreativ atmosfär. Restauranger, kaféer och lunchställen i överflöd. Ribersborgs badplats på promenadavstånd. Grannföretag inkluderar tech-startups, arkitektkontor och konsultbolag. Malmö Live och Malmö Högskola ligger inom 2 km.

## Sammanfattning

Perfekt för tech, konsult eller kreativt bolag som vill sitta i Malmös mest eftertraktade kontorsområde med utsikt, terrass och modern infrastruktur. Tillgängligt från 1 mars 2026.`,
    city: "Malmö",
    address: "Turning Torso Allé 4, plan 4",
    type: "rent",
    category: "kontor",
    price: 68500,
    size: 310,
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    imageUrls: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80",
      "https://images.unsplash.com/photo-1564069114553-7215e1ff1890?w=800&q=80",
    ],
    featured: true,
    lat: 55.6133,
    lng: 12.9756,
    tags: ["Fiber", "Klimatanläggning", "Öppen planlösning", "Parkering", "Mötesrum", "Terrass", "Hiss"],
    contactName: "Marcus Ekberg",
    contactEmail: "marcus.ekberg@vastrahamnen-kontor.se",
    contactPhone: "040-630 22 00",
    areaData: {
      nearby: {
        restaurants: 42,
        shops: 35,
        busStops: { count: 4, nearest: "Västra Hamnen (100 m)" },
        trainStations: { count: 1, nearest: "Malmö Central (1.2 km)" },
        parking: 8,
        schools: 3,
        healthcare: 5,
        gyms: 4,
      },
      demographics: {
        city: "Malmö",
        population: 357377,
        medianIncome: 312000,
        workingAgePct: 65.8,
        totalBusinesses: 38200,
      },
      priceContext: {
        medianPrice: 225,
        minPrice: 140,
        maxPrice: 380,
        count: 14,
      },
    },
  },
  {
    id: "demo-3",
    title: "Logistiklager med kylanläggning – 1 850 m² på Hisingen",
    description:
      `## Om lokalen

Högklassig lagerlokal på 1 850 kvm med 9 meters takhöjd, belägen i Göteborgs bästa logistikläge med direkt anslutning till E6/E45. Byggnaden från 2022 har isolerat golv, LED-belysning med rörelsesensor och en kylanläggning på 400 kvm (2–8 °C).

## Lokalen i detalj

Perfekt för livsmedel, läkemedel eller e-handel med temperaturkänsliga varor. Fyra lastbryggor (varav en med ramp för sidolastning), 1 200 kvm asfalterad manöveryta och 20 P-platser. Sprinklersystem, brandlarm och inbrottslarm med kameraövervakning. Kontorsdel på 120 kvm med 4 rum, kök, dusch och WC. Trefas el 125A. Uppvärmning via fjärrvärme.

## Läge & kommunikationer

Importgatan 24 på Hisingen ligger strategiskt vid E6/E45-korset med snabb access till Göteborgs hamn (10 min), Landvetter flygplats (30 min) och hela Västsverige. Busslinje 16 stannar 200 meter från fastigheten. Lastbilstrafik tillåten dygnet runt.

## Område & omgivning

Hisingen är Göteborgs logistiknav med Volvo, SKF och en rad tredjepartslogistiker som grannar. Området har god tillgång till arbetskraft och servicefunktioner. Restauranger och lunchställen inom 5 minuters bilresa. Bensinstationer och verkstäder i direkt anslutning.

## Sammanfattning

Ideal för e-handelsföretag, grossister eller logistikoperatörer som behöver modern lageryta med kylmöjligheter i Göteborgs bästa logistikläge. Tillgängligt från 1 april 2026.`,
    city: "Göteborg",
    address: "Importgatan 24, Hisingen",
    type: "rent",
    category: "lager",
    price: 135000,
    size: 1850,
    imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
    imageUrls: [
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
      "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80",
      "https://images.unsplash.com/photo-1565891741441-64926e441838?w=800&q=80",
    ],
    featured: true,
    lat: 57.731,
    lng: 11.942,
    tags: ["Lastbrygga", "Parkering", "Hög takhöjd", "Klimatanläggning", "Sprinkler", "Larm", "Kyl"],
    contactName: "Johan Bergström",
    contactEmail: "johan.bergstrom@gbglogistik.se",
    contactPhone: "031-380 45 00",
    areaData: {
      nearby: {
        restaurants: 8,
        shops: 5,
        busStops: { count: 2, nearest: "Importgatan (200 m)" },
        trainStations: { count: 0, nearest: "" },
        parking: 20,
        schools: 1,
        healthcare: 2,
        gyms: 1,
      },
      demographics: {
        city: "Göteborg",
        population: 604829,
        medianIncome: 348000,
        workingAgePct: 66.4,
        totalBusinesses: 68400,
      },
      priceContext: {
        medianPrice: 75,
        minPrice: 45,
        maxPrice: 120,
        count: 22,
      },
    },
  },
  {
    id: "demo-4",
    title: "Modern kontorslokal – Södermalm, Stockholm",
    description:
      `## Om lokalen

Ljus och fräsch kontorslokal i hjärtat av Södermalm. Öppen planlösning med plats för 15–20 arbetsplatser på 180 kvm. Lokalen ligger på plan 3 i en kulturmärkt fastighet från 1920-talet med bevarade originaldetaljer som stuckaturer och breda plankgolv.

## Lokalen i detalj

Fiber 1 Gbit/s, kök med fullständig utrustning inklusive espressomaskin, diskmaskin och mikrovågsugn. Två mötesrum (6 resp. 10 platser) med whiteboard och skärm. Tyst rum för samtal. Nyinstallerad ventilation och klimatanläggning. Toaletter på plan. Hiss finns i fastigheten.

## Läge & kommunikationer

Götgatan 42 ligger centralt på Södermalm med Medborgarplatsen T-bana (gröna linjen) på 3 minuters promenad. Bussar mot Slussen, Hornstull och Globen stannar utanför. Citybanan (pendeltåg) nås via Stockholms Södra station på 8 minuters promenad.

## Område & omgivning

Södermalm är Stockholms mest levande stadsdel med ett överflöd av restauranger, kaféer, barer och butiker. SoFo-kvarteren med sin kreativa energi ligger runt hörnet. Perfekt för företag som vill attrahera talang med ett inspirerande läge. Nytorget, Vitabergsparken och Fotografiska ligger alla inom gångavstånd.

## Sammanfattning

Idealisk för kreativa byråer, startups eller konsultbolag som söker karaktärsfull kontorsyta i Stockholms mest eftertraktade stadsdel. Tillträde 1 mars 2026.`,
    city: "Stockholm",
    address: "Götgatan 42, Södermalm",
    type: "rent",
    category: "kontor",
    price: 38500,
    size: 180,
    imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80",
    imageUrls: [
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
      "https://images.unsplash.com/photo-1564069114553-7215e1ff1890?w=800&q=80",
    ],
    featured: false,
    lat: 59.3145,
    lng: 18.0730,
    tags: ["Fiber", "Centralt läge", "Nyrenoverad", "Hiss", "Mötesrum", "Öppen planlösning"],
    contactName: "Erik Fastigheter AB",
    contactEmail: "hyresvard@hittayta.se",
    contactPhone: "070-123 45 67",
    areaData: {
      nearby: {
        restaurants: 67,
        shops: 89,
        busStops: { count: 5, nearest: "Medborgarplatsen (150 m)" },
        trainStations: { count: 2, nearest: "Medborgarplatsen T-bana (200 m)" },
        parking: 6,
        schools: 7,
        healthcare: 9,
        gyms: 8,
      },
      demographics: {
        city: "Stockholm",
        population: 984748,
        medianIncome: 398000,
        workingAgePct: 68.2,
        totalBusinesses: 142500,
      },
      priceContext: {
        medianPrice: 245,
        minPrice: 160,
        maxPrice: 420,
        count: 24,
      },
    },
  },
  {
    id: "demo-5",
    title: "Restauranglokal med uteservering – Avenyn, Göteborg",
    description:
      `## Om lokalen

Fullt utrustad restauranglokal på 220 kvm i gatuplan längs Kungsportsavenyn, Göteborgs paradgata. Lokalen har plats för 80 sittande gäster inomhus och 40 på den inglasade uteserveringen mot avenyn. Senast använd som italiensk restaurang med mycket gott renommé.

## Lokalen i detalj

Professionellt storkök med industrispis, ugn, kylrum (8 kvm), frysrum (4 kvm), diskmaskin och ventilation dimensionerad för restaurangdrift. Bardisk i massiv ek med 12 barsittplatser. Gästtoaletter (2 st + handikapp). Personalutrymme med omklädningsrum och dusch. Fettavskiljare installerad. Lokalen säljs med all fast inredning.

## Läge & kommunikationer

Kungsportsavenyn 22 är Göteborgs mest kända adress med hundratusentals förbipasserande varje vecka. Spårvagnshållplats Valand ligger 50 meter bort med linje 2, 3, 4, 7 och 10. Korsvägen med pendeltåg och Flygbussarna nås på 5 minuters promenad.

## Område & omgivning

Avenyn är Göteborgs nöjes- och kulturcentrum med Göteborgs konstmuseum, Stadsteatern och Liseberg i närheten. Området har Göteborgs högsta fotgängartrafik och ett brett utbud av hotell, barer och nattklubbar. Perfekt för restaurang, bar eller café som vill nå maximal exponering.

## Sammanfattning

En sällsynt möjlighet att ta över en nyckelfärdig restauranglokal i Göteborgs allra bästa läge. Uteserveringstillstånd medföljer. Tillträde efter överenskommelse.`,
    city: "Göteborg",
    address: "Kungsportsavenyn 22",
    type: "rent",
    category: "restaurang",
    price: 55000,
    size: 220,
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    imageUrls: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
    ],
    featured: true,
    lat: 57.6978,
    lng: 11.9792,
    tags: ["Storkök", "Uteservering", "Centralt läge", "Handikappanpassad", "Kylrum", "Bardisk"],
    contactName: "Anna Johansson",
    contactEmail: "anna.johansson@gbgfastigheter.se",
    contactPhone: "031-711 22 33",
    areaData: {
      nearby: {
        restaurants: 95,
        shops: 120,
        busStops: { count: 3, nearest: "Valand (50 m)" },
        trainStations: { count: 1, nearest: "Korsvägen (500 m)" },
        parking: 10,
        schools: 2,
        healthcare: 6,
        gyms: 5,
      },
      demographics: {
        city: "Göteborg",
        population: 604829,
        medianIncome: 348000,
        workingAgePct: 66.4,
        totalBusinesses: 68400,
      },
      priceContext: {
        medianPrice: 260,
        minPrice: 150,
        maxPrice: 450,
        count: 11,
      },
    },
  },
  {
    id: "demo-6",
    title: "Verkstadslokal med kontor – Solna, Stockholm",
    description:
      `## Om lokalen

Praktisk verkstads- och produktionslokal på 480 kvm i Solna Business Park. Lokalen är uppdelad i en verkstadsdel (360 kvm) med 5,5 meters takhöjd och portöppning 4x4 meter, samt en kontorsdel (120 kvm) med 4 rum, reception och pentry.

## Lokalen i detalj

Verkstadsdelen har betonggolv med golvbrunn, trefas el 200A, tryckluft, traversbana (2 ton) och god ventilation. Två portar varav en med elektrisk drift. Kontorsdelen har parkettgolv, fiber, klimatanläggning och eget WC med dusch. 15 parkeringsplatser på egen tomt varav 3 med motorvärmare.

## Läge & kommunikationer

Solna Business Park ligger strategiskt vid E4/E18-korset med snabb access till hela Stockholmsregionen. Tunnelbana (blå linjen, Solna Centrum) på 800 meters avstånd. Pendeltåg Solna station 1,2 km. Arlanda flygplats nås på 25 minuter.

## Område & omgivning

Solna Business Park är ett etablerat företagsområde med blandning av industri, kontor och service. ICA Maxi, Bauhaus och flera restauranger finns i direkt anslutning. Mall of Scandinavia och Friends Arena ligger 3 km bort.

## Sammanfattning

Perfekt för hantverksföretag, bilverkstad, produktion eller lättindustri som behöver kombinerad verkstads- och kontorsyta med bra kommunikationer och parkering.`,
    city: "Solna",
    address: "Dalvägen 12, Solna Business Park",
    type: "rent",
    category: "verkstad",
    price: 48000,
    size: 480,
    imageUrl: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&q=80",
    imageUrls: [
      "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&q=80",
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80",
    ],
    featured: false,
    lat: 59.3600,
    lng: 18.0000,
    tags: ["Hög takhöjd", "Parkering", "Trefas el", "Traversbana", "Port", "Fiber"],
    contactName: "Per Nilsson",
    contactEmail: "per.nilsson@solnafastigheter.se",
    contactPhone: "08-730 55 00",
    areaData: {
      nearby: {
        restaurants: 15,
        shops: 22,
        busStops: { count: 3, nearest: "Solna Business Park (100 m)" },
        trainStations: { count: 1, nearest: "Solna Centrum T-bana (800 m)" },
        parking: 15,
        schools: 2,
        healthcare: 3,
        gyms: 2,
      },
      demographics: {
        city: "Solna",
        population: 87356,
        medianIncome: 382000,
        workingAgePct: 69.1,
        totalBusinesses: 18200,
      },
      priceContext: {
        medianPrice: 105,
        minPrice: 65,
        maxPrice: 180,
        count: 9,
      },
    },
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
