/**
 * Seed script: creates demo seller + buyers with listings, favorites,
 * conversations and messages so the dashboard looks fully populated.
 *
 * Usage:  npx tsx scripts/seed-demo.ts
 * Requires DATABASE_URL in env (or .env file via dotenv).
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PASSWORD = "Demo1234!";

async function main() {
  console.log("Seeding demo data...");

  // ── Cleanup old seed data ──────────────────────────────
  console.log("  Rensar gammal seed-data...");
  const seedEmails = [
    "saljare@offmarket.nu",
    "kopare@offmarket.nu",
    "admin@offmarket.nu",
    "demo-buyer-2@offmarket.nu",
    "demo-buyer-3@offmarket.nu",
    "demo-buyer-4@offmarket.nu",
    "demo-buyer-5@offmarket.nu",
  ];
  const existingUsers = await prisma.user.findMany({ where: { email: { in: seedEmails } }, select: { id: true } });
  const existingIds = existingUsers.map((u) => u.id);
  if (existingIds.length > 0) {
    // Cascade deletes handle messages, conversations, favorites, listings
    await prisma.user.deleteMany({ where: { id: { in: existingIds } } });
    console.log(`  Raderade ${existingIds.length} gamla seed-användare (cascade)`);
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // ── Users ──────────────────────────────────────────────
  const seller = await prisma.user.upsert({
    where: { email: "saljare@offmarket.nu" },
    update: {},
    create: {
      email: "saljare@offmarket.nu",
      name: "Erik Fastigheter AB",
      passwordHash,
      role: "seller",
      isSeller: true,
      phone: "070-123 45 67",
    },
  });
  console.log(`  Seller: ${seller.email} (${seller.id})`);

  const buyer = await prisma.user.upsert({
    where: { email: "kopare@offmarket.nu" },
    update: {},
    create: {
      email: "kopare@offmarket.nu",
      name: "Anna Svensson",
      passwordHash,
      role: "buyer",
      isBuyer: true,
      phone: "073-987 65 43",
    },
  });
  console.log(`  Buyer:   ${buyer.email} (${buyer.id})`);

  const admin = await prisma.user.upsert({
    where: { email: "admin@offmarket.nu" },
    update: {},
    create: {
      email: "admin@offmarket.nu",
      name: "Nordic Fastighetsmäklare AB",
      passwordHash,
      role: "admin",
      isAdmin: true,
      phone: "08-123 45 67",
      companyName: "Nordic Fastighetsmäklare",
    },
  });
  console.log(`  Admin:   ${admin.email} (${admin.id})`);

  // ── Extra dummy buyers (for richer seller stats) ─────────
  const dummyBuyers = [];
  const dummyBuyerData = [
    { email: "demo-buyer-2@offmarket.nu", name: "Johan Lindberg" },
    { email: "demo-buyer-3@offmarket.nu", name: "Maria Eriksson" },
    { email: "demo-buyer-4@offmarket.nu", name: "Karl Nilsson" },
    { email: "demo-buyer-5@offmarket.nu", name: "Sara Johansson" },
  ];
  for (const dt of dummyBuyerData) {
    const u = await prisma.user.upsert({
      where: { email: dt.email },
      update: {},
      create: { email: dt.email, name: dt.name, passwordHash, role: "buyer", isBuyer: true, phone: "" },
    });
    dummyBuyers.push(u);
  }
  console.log(`  Dummy buyers: ${dummyBuyers.length} skapade`);

  // ── Listings (owned by seller) – residential only ───────
  const listingsData = [
    {
      title: "Rymlig villa med trädgård – Södermalm",
      description:
        "Ljus och fräsch villa i hjärtat av Södermalm. Öppen planlösning med 5 rum och kök. Nyrenoverat badrum och kök. Stor trädgård med uteplats. Nära tunnelbana och restauranger.",
      city: "Stockholm",
      address: "Götgatan 42",
      type: "sale",
      category: "villa",
      propertyType: "villa",
      price: 8_500_000,
      size: 180,
      rooms: 5,
      lotSize: 450,
      condition: "renoverat",
      status: "active",
      acceptancePrice: 8_200_000,
      lat: 59.3173,
      lng: 18.0731,
      imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
      tags: ["Nyrenoverad", "Centralt läge", "Trädgård", "Öppen planlösning", "Nära kollektivtrafik"],
      featured: true,
      viewCount: 142,
    },
    {
      title: "Exklusiv lägenhet vid Avenyn – Göteborg",
      description:
        "Stor bostadsrätt med balkong och havsutsikt. 4 rum och kök, öppen planlösning. Nyrenoverad med fiber. Perfekt läge längs Kungsportsavenyn.",
      city: "Göteborg",
      address: "Kungsportsavenyn 18",
      type: "sale",
      category: "lagenhet",
      propertyType: "lagenhet",
      price: 6_200_000,
      size: 120,
      rooms: 4,
      lotSize: undefined,
      condition: "nyskick",
      status: "active",
      acceptancePrice: 5_900_000,
      lat: 57.7009,
      lng: 11.9746,
      imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
      tags: ["Centralt läge", "Balkong", "Havsutsikt", "Nyrenoverad", "Fiber", "Nära centrum"],
      featured: true,
      viewCount: 98,
    },
    {
      title: "Fritidshus med sjötomt – Skåne",
      description:
        "Charmigt fritidshus vid sjön i Fosie. 3 rum, kök och stort altan. Egen brygga och badplats. Tryggt läge med skog runt hörnet.",
      city: "Malmö",
      address: "Sjövägen 7",
      type: "sale",
      category: "fritidshus",
      propertyType: "fritidshus",
      price: 2_800_000,
      size: 85,
      rooms: 3,
      lotSize: 1200,
      condition: "bra_skick",
      status: "active",
      acceptancePrice: 2_650_000,
      lat: 55.565,
      lng: 13.018,
      imageUrl: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800&q=80",
      tags: ["Sjötomt", "Tryggt läge", "Balkong", "Nära centrum"],
      featured: false,
      viewCount: 67,
    },
    {
      title: "Ljus lägenhet i Uppsala Science Park",
      description:
        "Nybyggd lägenhet i Uppsala Science Park. 3 rum och kök, öppen planlösning. Fiber, balkong och cykelgarage. Laddstolpar i garage.",
      city: "Uppsala",
      address: "Dag Hammarskjölds väg 52",
      type: "sale",
      category: "lagenhet",
      propertyType: "lagenhet",
      price: 3_400_000,
      size: 78,
      rooms: 3,
      lotSize: undefined,
      condition: "nyskick",
      status: "active",
      acceptancePrice: 3_200_000,
      lat: 59.8479,
      lng: 17.632,
      imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
      tags: ["Nyrenoverad", "Fiber", "Parkering", "Balkong", "Nära kollektivtrafik"],
      featured: false,
      viewCount: 53,
    },
    {
      title: "Charmig villa vid Möllevångstorget",
      description:
        "Vacker villa med originalkaraktär. 4 rum, kök och vardagsrum med öppen spis. Trädgård med uteplats. Kort väg till centrum.",
      city: "Malmö",
      address: "Möllevångsgatan 3",
      type: "sale",
      category: "villa",
      propertyType: "villa",
      price: 4_900_000,
      size: 145,
      rooms: 4,
      lotSize: 380,
      condition: "renoverat",
      status: "active",
      acceptancePrice: 4_700_000,
      lat: 55.5906,
      lng: 13.006,
      imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      tags: ["Centralt läge", "Trädgård", "Garage", "Nära centrum"],
      featured: false,
      viewCount: 31,
    },
    {
      title: "Fritidshus med pool – Västra Hamnen",
      description:
        "Modernt fritidshus med pool och stort altan. 3 rum, kök och bastu. Sjöutsikt. Perfekt för sommar och helger.",
      city: "Malmö",
      address: "Havsvägen 12",
      type: "sale",
      category: "fritidshus",
      propertyType: "fritidshus",
      price: 3_200_000,
      size: 95,
      rooms: 3,
      lotSize: 800,
      condition: "nyskick",
      status: "active",
      acceptancePrice: 3_000_000,
      lat: 55.6137,
      lng: 12.983,
      imageUrl: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80",
      tags: ["Pool", "Havsutsikt", "Sjötomt", "Nyrenoverad"],
      featured: true,
      viewCount: 89,
    },
    {
      title: "Tomt med bygglov – Stockholm",
      description:
        "Byggklar tomt i eftertraktat område. Bygglov för villa upp till 180 kvm. Nära skola och kollektivtrafik. Tryggt läge.",
      city: "Stockholm",
      address: "Skogsvägen 15",
      type: "sale",
      category: "tomt",
      propertyType: "tomt",
      price: 1_800_000,
      size: 0,
      rooms: undefined,
      lotSize: 950,
      condition: undefined,
      status: "active",
      acceptancePrice: 1_650_000,
      lat: 59.3348,
      lng: 18.0737,
      imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
      tags: ["Tryggt läge", "Nära kollektivtrafik", "Parkering"],
      featured: false,
      viewCount: 45,
    },
    {
      title: "Rymlig villa med garage – Göteborg",
      description:
        "Stor villa med dubbelgarage och trädgård. 6 rum och kök, källare. Öppen planlösning i vardagsrum. Nyrenoverat 2022.",
      city: "Göteborg",
      address: "Villagatan 8",
      type: "sale",
      category: "villa",
      propertyType: "villa",
      price: 7_500_000,
      size: 220,
      rooms: 6,
      lotSize: 600,
      condition: "renoverat",
      status: "active",
      acceptancePrice: 7_200_000,
      lat: 57.7089,
      lng: 11.9746,
      imageUrl: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80",
      tags: ["Garage", "Trädgård", "Nyrenoverad", "Öppen planlösning", "Parkering"],
      featured: true,
      viewCount: 112,
    },
  ];

  const createdListings = [];
  for (const data of listingsData) {
    const { lotSize, rooms, condition, ...rest } = data;
    const listing = await prisma.listing.create({
      data: {
        ...rest,
        lotSize: lotSize ?? null,
        rooms: rooms ?? null,
        condition: condition ?? null,
        ownerId: seller.id,
        contactName: seller.name,
        contactEmail: seller.email,
        contactPhone: seller.phone || "",
      },
    });
    createdListings.push(listing);
    console.log(`  Listing: ${listing.title} (${listing.id})`);
  }

  // Admin listing (mäklare profil)
  const adminListing = await prisma.listing.create({
    data: {
      title: "Exklusiv lägenhet i centrum – Mäklarannons",
      description:
        "Ljus lägenhet i centralt läge med balkong. 3 rum och kök, fiber och parkering. Kontakta Nordic Fastighetsmäklare för visning.",
      city: "Stockholm",
      address: "Stureplan 4",
      type: "sale",
      category: "lagenhet",
      propertyType: "lagenhet",
      price: 5_500_000,
      size: 90,
      rooms: 3,
      lotSize: null,
      condition: "renoverat",
      status: "active",
      acceptancePrice: 5_200_000,
      lat: 59.3348,
      lng: 18.0737,
      imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
      tags: ["Centralt läge", "Fiber", "Balkong", "Nära centrum"],
      featured: true,
      viewCount: 22,
      ownerId: admin.id,
      contactName: admin.name,
      contactEmail: admin.email,
      contactPhone: admin.phone || "",
    },
  });
  createdListings.push(adminListing);
  console.log(`  Admin listing: ${adminListing.title} (${adminListing.id})`);

  // ── Favorites ──────────────────────────────────────────
  // Anna (main buyer) saves 3
  for (const listing of [createdListings[0], createdListings[1], createdListings[4]]) {
    await prisma.favorite.upsert({
      where: { userId_listingId: { userId: buyer.id, listingId: listing.id } },
      update: {},
      create: { userId: buyer.id, listingId: listing.id },
    });
  }

  // Dummy buyers also save listings (gives seller higher favorite counts)
  const dummyFavorites: [number, number][] = [
    [0, 0], [0, 1], [0, 2],       // Johan saves 3
    [1, 0], [1, 3], [1, 5],       // Maria saves 3
    [2, 1], [2, 4],               // Karl saves 2
    [3, 0], [3, 1], [3, 2], [3, 3], // Sara saves 4
  ];
  for (const [bi, li] of dummyFavorites) {
    await prisma.favorite.upsert({
      where: { userId_listingId: { userId: dummyBuyers[bi].id, listingId: createdListings[li].id } },
      update: {},
      create: {
        userId: dummyBuyers[bi].id,
        listingId: createdListings[li].id,
        createdAt: new Date(Date.now() - Math.random() * 7 * 86400 * 1000), // random within last 7 days
      },
    });
  }
  console.log("  Favorites: 3 för Anna + 12 från dummy-buyers");

  // ── Conversations + Messages ───────────────────────────
  // Anna's conversations (main buyer)
  const conv1 = await prisma.conversation.create({
    data: {
      listingId: createdListings[0].id,
      sellerId: seller.id,
      buyerId: buyer.id,
    },
  });

  const messages1 = [
    { senderId: buyer.id, text: "Hej! Jag är intresserad av villan på Södermalm. Finns det möjlighet att boka en visning denna vecka?" },
    { senderId: seller.id, text: "Hej Anna! Absolut, villan är tillgänglig för visning. Passar torsdag kl 14:00 eller fredag kl 10:00?" },
    { senderId: buyer.id, text: "Torsdag kl 14 passar perfekt! Är det okej om jag tar med min partner?" },
    { senderId: seller.id, text: "Självklart! Vi ses på Götgatan 42, torsdag kl 14. Jag möter er i entrén." },
    { senderId: buyer.id, text: "Tack, vi ses då! Har ni förresten fiber inkluderat i fastigheten?" },
    { senderId: seller.id, text: "Ja, 1 Gbit/s fiber finns. Vi har även fiber till alla rum. Trädgården är vårdslöst underhållen." },
  ];

  for (let i = 0; i < messages1.length; i++) {
    await prisma.message.create({
      data: {
        conversationId: conv1.id,
        senderId: messages1[i].senderId,
        text: messages1[i].text,
        read: i < messages1.length - 1,
        createdAt: new Date(Date.now() - (messages1.length - i) * 3600 * 1000),
      },
    });
  }

  await prisma.conversation.update({
    where: { id: conv1.id },
    data: { lastMessageAt: new Date() },
  });

  const conv2 = await prisma.conversation.create({
    data: {
      listingId: createdListings[1].id,
      sellerId: seller.id,
      buyerId: buyer.id,
    },
  });

  const messages2 = [
    { senderId: buyer.id, text: "Hej! Är lägenheten på Avenyn fortfarande tillgänglig? Vi söker ny bostad i Göteborg." },
    { senderId: seller.id, text: "Hej! Ja, den är tillgänglig. Priset är 6 200 000 kr. Vill du komma och titta?" },
    { senderId: buyer.id, text: "Ja gärna! Kan vi boka in nästa vecka? Och finns det möjlighet att förhandla vid seriöst köp?" },
  ];

  for (let i = 0; i < messages2.length; i++) {
    await prisma.message.create({
      data: {
        conversationId: conv2.id,
        senderId: messages2[i].senderId,
        text: messages2[i].text,
        read: i < messages2.length - 1,
        createdAt: new Date(Date.now() - (messages2.length - i) * 7200 * 1000),
      },
    });
  }

  await prisma.conversation.update({
    where: { id: conv2.id },
    data: { lastMessageAt: new Date(Date.now() - 3600 * 1000) },
  });

  console.log("  Anna: 2 konversationer med meddelanden");

  // ── Dummy buyer conversations (for richer seller stats) ──
  const dummyConversations: { buyerIdx: number; listingIdx: number; messages: { fromBuyer: boolean; text: string }[]; hoursAgo: number }[] = [
    {
      buyerIdx: 0, listingIdx: 0,
      hoursAgo: 2,
      messages: [
        { fromBuyer: true, text: "Hej! Vi är ett par med två barn och letar villa. Är villan fortfarande till salu?" },
        { fromBuyer: false, text: "Hej Johan! Ja, den är tillgänglig. Vill du boka en visning?" },
        { fromBuyer: true, text: "Absolut! Passar det imorgon förmiddag?" },
      ],
    },
    {
      buyerIdx: 0, listingIdx: 2,
      hoursAgo: 12,
      messages: [
        { fromBuyer: true, text: "Hej, jag undrar om fritidshuset har egen brygga? Vi älskar att fiska." },
        { fromBuyer: false, text: "Hej! Ja, det finns egen brygga och badplats. Sjön har bra fiskbestånd." },
      ],
    },
    {
      buyerIdx: 1, listingIdx: 1,
      hoursAgo: 5,
      messages: [
        { fromBuyer: true, text: "Hej! Jag är intresserad av lägenheten på Avenyn. Hur stor är balkongen?" },
        { fromBuyer: false, text: "Hej Maria! Balkongen är ca 12 kvm och vetter mot havet. Fantastisk utsikt!" },
        { fromBuyer: true, text: "Låter perfekt! Kan jag komma och titta på fredag?" },
        { fromBuyer: false, text: "Fredag kl 11 funkar bra. Jag mailar dig adressen och portkod." },
      ],
    },
    {
      buyerIdx: 1, listingIdx: 3,
      hoursAgo: 48,
      messages: [
        { fromBuyer: true, text: "Hej! Finns det parkeringsplatser till lägenheten i Uppsala?" },
        { fromBuyer: false, text: "Hej! Ja, det finns 1 parkeringsplats och cykelgarage. Laddstolpar för elbil finns också." },
        { fromBuyer: true, text: "Tack för info! Jag återkommer efter att ha diskuterat med min partner." },
      ],
    },
    {
      buyerIdx: 2, listingIdx: 0,
      hoursAgo: 24,
      messages: [
        { fromBuyer: true, text: "Hej! Är det möjligt att förhandla priset på villan på Södermalm?" },
        { fromBuyer: false, text: "Hej Karl! Vi är öppna för seriösa bud. Vill du boka ett möte för att diskutera?" },
      ],
    },
    {
      buyerIdx: 2, listingIdx: 5,
      hoursAgo: 72,
      messages: [
        { fromBuyer: true, text: "Intresserad av fritidshuset med pool. Finns det möjlighet att se fastigheten i helgen?" },
      ],
    },
    {
      buyerIdx: 3, listingIdx: 1,
      hoursAgo: 8,
      messages: [
        { fromBuyer: true, text: "Hej! Vi planerar att flytta till Göteborg och lägenheten på Avenyn verkar perfekt. Finns avgift?" },
        { fromBuyer: false, text: "Hej Sara! Ja, månadsavgiften är ca 4 200 kr. Det inkluderar värme, vatten och städning av trapphus." },
        { fromBuyer: true, text: "Fantastiskt! Vi vill gärna boka visning så snart som möjligt." },
      ],
    },
    {
      buyerIdx: 3, listingIdx: 4,
      hoursAgo: 36,
      messages: [
        { fromBuyer: true, text: "Hej! Kan man få tillträde till villan vid Möllevången innan sommaren?" },
        { fromBuyer: false, text: "Absolut! Tillträde kan ske vid överenskommelse. Säljaren är flexibel." },
        { fromBuyer: true, text: "Perfekt, vi är intresserade! Kan vi boka visning nästa vecka?" },
        { fromBuyer: false, text: "Det går bra! Jag skickar över tillgängliga tider via mail. Välkommen!" },
      ],
    },
  ];

  for (const dc of dummyConversations) {
    const dBuyer = dummyBuyers[dc.buyerIdx];
    const dListing = createdListings[dc.listingIdx];

    const conv = await prisma.conversation.create({
      data: {
        listingId: dListing.id,
        sellerId: seller.id,
        buyerId: dBuyer.id,
      },
    });

    for (let i = 0; i < dc.messages.length; i++) {
      const msg = dc.messages[i];
      const msgHoursAgo = dc.hoursAgo + (dc.messages.length - 1 - i) * 2; // space messages 2h apart
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderId: msg.fromBuyer ? dBuyer.id : seller.id,
          text: msg.text,
          read: i < dc.messages.length - 1, // last message unread
          createdAt: new Date(Date.now() - msgHoursAgo * 3600 * 1000),
        },
      });
    }

    await prisma.conversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: new Date(Date.now() - dc.hoursAgo * 3600 * 1000) },
    });
  }

  console.log(`  Dummy conversations: ${dummyConversations.length} med meddelanden`);

  // ── Summary ────────────────────────────────────────────
  const totalConvs = 2 + dummyConversations.length;
  const totalFavs = 3 + dummyFavorites.length;
  console.log(`\n✅ Seed klar!`);
  console.log(`   ${createdListings.length} annonser, ${totalConvs} konversationer, ${totalFavs} favoriter`);
  console.log(`   Visningar: ${listingsData.map((l) => l.viewCount).join(", ")}`);
  console.log(`\n  Säljare:  saljare@offmarket.nu / ${PASSWORD}`);
  console.log(`  Köpare:   kopare@offmarket.nu / ${PASSWORD}`);
  console.log(`  Admin:    admin@offmarket.nu / ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
