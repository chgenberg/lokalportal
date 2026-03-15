import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

const sampleListings = [
  {
    id: "demo-1",
    title: "Exklusiv lägenhet vid Stureplan – 145 m² med balkong",
    description:
      `## Om bostaden

Exklusiv lägenhet i absolut bästa läge vid Stureplan, totalrenoverad under 2025. Bostaden erbjuder 145 kvm fördelat på ett öppet vardagsrum med panoramafönster mot Birger Jarlsgatan, tre sovrum samt ett modernt kök med alla vitvaror.

## Bostaden i detalj

Golv i ek, LED-belysning och nyinstallerad ventilation med individuell temperaturstyrning. Takhöjd 3,2 meter i vardagsrummet. Badrum med golvvärme och handdukstork. Fasaden har nyligen putsats. Balkong mot innergård. Bostaden levereras i nyskick och är redo för inflyttning.

## Läge & kommunikationer

Birger Jarlsgatan 18 ligger mitt i Stockholms mest exklusiva område, 50 meter från Stureplan. Östermalmstorgs tunnelbanestation (röda linjen) nås på 2 minuters promenad. Busshållplats Stureplan med linje 1, 2 och 55 ligger precis utanför dörren.

## Område & omgivning

Stureplan är Stockholms mest kända mötesplats med en unik blandning av shopping, restauranger och nöjesliv. Grannarna inkluderar NK, Sturegallerian och Bibliotekstan. Området har en köpstark demografisk profil. Inom 500 meter finns över 200 butiker och 80 restauranger.

## Sammanfattning

Perfekt för den som söker en exklusiv bostad i Stockholms mest prestigefyllda läge. Tillträde omgående. Kontakta oss för visning.`,
    city: "Stockholm",
    address: "Birger Jarlsgatan 18, Östermalm",
    type: "sale",
    category: "lagenhet",
    price: 8500000,
    size: 145,
    imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    imageUrls: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
      "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80",
    ],
    featured: true,
    lat: 59.337,
    lng: 18.0735,
    tags: ["Nyrenoverad", "Centralt läge", "Balkong", "Hög takhöjd", "Fiber", "Öppen planlösning"],
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
    title: "Ljus hörnlägenhet med terrass – Västra Hamnen, Malmö",
    description:
      `## Om bostaden

Stilren lägenhet på plan 4 i Turning Torso-kvarteret med fri utsikt över Öresund. Bostaden på 120 kvm har öppen planlösning med vardagsrum, kök, tre sovrum och två badrum. Stor terrass på 25 kvm mot söder.

## Bostaden i detalj

Stor terrass mot söder med utemöbler. Fiber 1 Gbit/s, golvvärme i hela bostaden och individuell klimatstyrning. Takhöjd 2,9 meter, ljuddämpande undertak. Parkering i garage ingår. Hiss och trappa.

## Läge & kommunikationer

Västra Hamnen är Malmös mest moderna stadsdel med gångavstånd till Malmö Central (15 min) och Triangeln station (12 min). Busslinje 2 stannar 100 meter bort med avgångar var 5:e minut. Öresundsbron och E6 nås på 10 minuter med bil.

## Område & omgivning

Området präglas av arkitektur i världsklass, havsbrisen och en ung atmosfär. Restauranger, kaféer och butiker i överflöd. Ribersborgs badplats på promenadavstånd. Malmö Live och Malmö Högskola ligger inom 2 km.

## Sammanfattning

Perfekt för den som söker en modern bostad med utsikt och terrass i Malmös mest eftertraktade bostadsområde.`,
    city: "Malmö",
    address: "Turning Torso Allé 4, plan 4",
    type: "sale",
    category: "lagenhet",
    price: 4950000,
    size: 120,
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    imageUrls: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
      "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
    ],
    featured: true,
    lat: 55.6133,
    lng: 12.9756,
    tags: ["Fiber", "Klimatanläggning", "Öppen planlösning", "Parkering", "Balkong", "Ljusinsläpp"],
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
    title: "Rymlig villa med trädgård – Hisingen, Göteborg",
    description:
      `## Om bostaden

Välskött villa på 185 kvm med stor trädgård, belägen i ett lugnt villaområde på Hisingen med goda kommunikationer och nära till natur. Huset från 2018 har moderna ytskikt, bergvärme och garage.

## Bostaden i detalj

Fem rum och kök fördelat på två plan. Öppen planlösning på nedervåning med vardagsrum, kök och matplats. Tre sovrum och badrum på övervåning. Golvvärme i hela huset. Garage för två bilar. Stor trädgårdstomt på 820 kvm med altan och uteplats i söderläge.

## Läge & kommunikationer

Villaområdet ligger nära E6/E45 med snabb access till Göteborgs centrum (15 min). Busslinje 16 stannar 200 meter från huset. Skolor och förskola inom gångavstånd.

## Område & omgivning

Lugnt och barnvänligt villaområde med nära till naturen. Mataffärer och restauranger inom 5 minuters bilresa. Nära till friluftsområden och vandringsleder.

## Sammanfattning

Perfekt familjebostad med modern standard och stor trädgård i ett lugnt och trivsamt område.`,
    city: "Göteborg",
    address: "Björkvägen 12, Hisingen",
    type: "sale",
    category: "villa",
    price: 5200000,
    size: 185,
    imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    imageUrls: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      "https://images.unsplash.com/photo-1600566753376-12c8ab7c5a38?w=800&q=80",
    ],
    featured: true,
    lat: 57.731,
    lng: 11.942,
    tags: ["Trädgård", "Parkering", "Nära kollektivtrafik", "Ljusinsläpp", "Fiber"],
    contactName: "Johan Bergström",
    contactEmail: "johan.bergstrom@gbgbostad.se",
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
    title: "Karaktärsfull lägenhet – Södermalm, Stockholm",
    description:
      `## Om bostaden

Ljus och fräsch lägenhet i hjärtat av Södermalm. Öppen planlösning på 95 kvm i en kulturmärkt fastighet från 1920-talet med bevarade originaldetaljer som stuckaturer och breda plankgolv.

## Bostaden i detalj

Tre rum och kök. Fiber 1 Gbit/s, kök med fullständig utrustning inklusive diskmaskin. Nyinstallerad ventilation och klimatanläggning. Badrum med kakel och golvvärme. Hiss finns i fastigheten. Balkong mot innergård.

## Läge & kommunikationer

Götgatan 42 ligger centralt på Södermalm med Medborgarplatsen T-bana (gröna linjen) på 3 minuters promenad. Bussar mot Slussen, Hornstull och Globen stannar utanför. Citybanan nås via Stockholms Södra station på 8 minuters promenad.

## Område & omgivning

Södermalm är Stockholms mest levande stadsdel med ett överflöd av restauranger, kaféer, barer och butiker. SoFo-kvarteren ligger runt hörnet. Nytorget, Vitabergsparken och Fotografiska ligger alla inom gångavstånd.

## Sammanfattning

Perfekt för den som söker en karaktärsfull bostad i Stockholms mest eftertraktade stadsdel.`,
    city: "Stockholm",
    address: "Götgatan 42, Södermalm",
    type: "sale",
    category: "lagenhet",
    price: 4750000,
    size: 95,
    imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    imageUrls: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    ],
    featured: false,
    lat: 59.3145,
    lng: 18.0730,
    tags: ["Fiber", "Centralt läge", "Nyrenoverad", "Balkong", "Öppen planlösning", "Ljusinsläpp"],
    contactName: "Erik Fastigheter AB",
    contactEmail: "kontakt@offmarket.nu",
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
    title: "Fritidshus vid havet – Styrsö, Göteborg",
    description:
      `## Om bostaden

Charmigt fritidshus på 85 kvm beläget på Styrsö i Göteborgs södra skärgård. Huset ligger på en höjd med fri utsikt över havet och har en stor tomt på 1200 kvm med trädgård och altan i söderläge.

## Bostaden i detalj

Tre rum och kök med öppen planlösning. Nylagt trägolv, modernt kök med alla vitvaror. Två sovrum, ett badrum med dusch. Vedeldad kamin i vardagsrummet. Stor altan med havsutsikt. Carport och förråd.

## Läge & kommunikationer

Styrsö nås med Styrsöbåten från Saltholmen (30 min). Saltholmen nås med spårvagn linje 11 från Göteborgs centrum. Mataffär och café finns på ön.

## Område & omgivning

Styrsö är en av Göteborgs skärgårdsöar med lugn och avskild atmosfär. Badplatser, vandringsleder och båtliv. Perfekt för den som söker en reträttplats nära staden.

## Sammanfattning

En unik möjlighet att äga ett fritidshus med havsutsikt i Göteborgs skärgård.`,
    city: "Göteborg",
    address: "Strandvägen 8, Styrsö",
    type: "sale",
    category: "fritidshus",
    price: 3200000,
    size: 85,
    imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80",
    imageUrls: [
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80",
      "https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800&q=80",
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80",
    ],
    featured: true,
    lat: 57.6978,
    lng: 11.9792,
    tags: ["Trädgård", "Ljusinsläpp", "Nära kollektivtrafik"],
    contactName: "Anna Johansson",
    contactEmail: "anna.johansson@gbgbostad.se",
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
    title: "Tomt med bygglov – Solna, Stockholm",
    description:
      `## Om tomten

Attraktiv villatomt på 950 kvm i Solna med beviljat bygglov för enfamiljsvilla. Tomten ligger i ett etablerat villaområde med goda kommunikationer och nära service.

## Tomten i detalj

Plan tomt med söderläge. Kommunalt vatten och avlopp framdraget till tomtgräns. El och fiber anslutet. Bygglov beviljat för villa upp till 200 kvm i två plan. Inga servitut eller belastningar.

## Läge & kommunikationer

Tomten ligger strategiskt nära E4/E18 med snabb access till hela Stockholmsregionen. Tunnelbana (blå linjen, Solna Centrum) på 800 meters avstånd. Pendeltåg Solna station 1,2 km. Arlanda flygplats nås på 25 minuter.

## Område & omgivning

Etablerat villaområde med blandning av villor och radhus. ICA Maxi, skolor och flera restauranger finns i närheten. Mall of Scandinavia och Friends Arena ligger 3 km bort.

## Sammanfattning

Perfekt för den som vill bygga sin drömvilla i ett attraktivt läge med goda kommunikationer och nära till service.`,
    city: "Solna",
    address: "Dalvägen 12, Solna",
    type: "sale",
    category: "tomt",
    price: 3800000,
    size: 950,
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
    imageUrls: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
      "https://images.unsplash.com/photo-1595877244574-e90ce41ce089?w=800&q=80",
    ],
    featured: false,
    lat: 59.3600,
    lng: 18.0000,
    tags: ["Parkering", "Fiber", "Nära kollektivtrafik", "Tryggt läge"],
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
