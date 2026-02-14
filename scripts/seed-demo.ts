/**
 * Seed script: creates demo landlord + tenants with listings, favorites,
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
    "hyresvard@hittayta.se",
    "hyresgast@hittayta.se",
    "maklare@hittayta.se",
    "demo-tenant-2@hittayta.se",
    "demo-tenant-3@hittayta.se",
    "demo-tenant-4@hittayta.se",
    "demo-tenant-5@hittayta.se",
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
  const landlord = await prisma.user.upsert({
    where: { email: "hyresvard@hittayta.se" },
    update: {},
    create: {
      email: "hyresvard@hittayta.se",
      name: "Erik Fastigheter AB",
      passwordHash,
      role: "landlord",
      phone: "070-123 45 67",
    },
  });
  console.log(`  Landlord: ${landlord.email} (${landlord.id})`);

  const tenant = await prisma.user.upsert({
    where: { email: "hyresgast@hittayta.se" },
    update: {},
    create: {
      email: "hyresgast@hittayta.se",
      name: "Anna Svensson",
      passwordHash,
      role: "tenant",
      phone: "073-987 65 43",
    },
  });
  console.log(`  Tenant:   ${tenant.email} (${tenant.id})`);

  // ── Extra dummy tenants (for richer landlord stats) ────
  const dummyTenants = [];
  const dummyTenantData = [
    { email: "demo-tenant-2@hittayta.se", name: "Johan Lindberg" },
    { email: "demo-tenant-3@hittayta.se", name: "Maria Eriksson" },
    { email: "demo-tenant-4@hittayta.se", name: "Karl Nilsson" },
    { email: "demo-tenant-5@hittayta.se", name: "Sara Johansson" },
  ];
  for (const dt of dummyTenantData) {
    const u = await prisma.user.upsert({
      where: { email: dt.email },
      update: {},
      create: { email: dt.email, name: dt.name, passwordHash, role: "tenant", phone: "" },
    });
    dummyTenants.push(u);
  }
  console.log(`  Dummy tenants: ${dummyTenants.length} skapade`);

  // ── Listings (owned by landlord) ───────────────────────
  const listingsData = [
    {
      title: "Modern kontorslokal – Södermalm",
      description:
        "Ljus och fräsch kontorslokal i hjärtat av Södermalm. Öppen planlösning med plats för 15–20 arbetsplatser. Fiber, kök och mötesrum ingår. Nära tunnelbana och restauranger.",
      city: "Stockholm",
      address: "Götgatan 42",
      type: "rent",
      category: "kontor",
      price: 28000,
      size: 180,
      lat: 59.3173,
      lng: 18.0731,
      imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
      tags: ["Fiber", "Centralt läge", "Nyrenoverad", "Hiss"],
      featured: true,
      viewCount: 142,
    },
    {
      title: "Butik vid Avenyn – Göteborg",
      description:
        "Exklusivt butiksläge längs Kungsportsavenyn. Stort skyltfönster mot gatan, hög takhöjd och lagerytor i källaren. Perfekt för mode, inredning eller café.",
      city: "Göteborg",
      address: "Kungsportsavenyn 18",
      type: "rent",
      category: "butik",
      price: 45000,
      size: 120,
      lat: 57.7009,
      lng: 11.9746,
      imageUrl: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80",
      tags: ["Centralt läge", "Hög takhöjd", "Parkering"],
      featured: true,
      viewCount: 98,
    },
    {
      title: "Lagerlokal med lastbrygga – Malmö",
      description:
        "Stor lagerlokal i Fosie industriområde. 6 meters takhöjd, lastbrygga, portöppning 4x4m. El 3-fas, uppvärmt. Bra kommunikationer nära E6.",
      city: "Malmö",
      address: "Industrigatan 7",
      type: "rent",
      category: "lager",
      price: 18000,
      size: 450,
      lat: 55.565,
      lng: 13.018,
      imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
      tags: ["Lastbrygga", "Parkering", "Hög takhöjd"],
      featured: false,
      viewCount: 67,
    },
    {
      title: "Centralt kontor – Uppsala",
      description:
        "Nybyggt kontor i Uppsala Science Park. Öppet landskap med 10 arbetsplatser, 2 mötesrum, pentry och dusch. Cykelgarage och laddstolpar.",
      city: "Uppsala",
      address: "Dag Hammarskjölds väg 52",
      type: "rent",
      category: "kontor",
      price: 22000,
      size: 140,
      lat: 59.8479,
      lng: 17.632,
      imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80",
      tags: ["Nyrenoverad", "Fiber", "Parkering", "Hiss"],
      featured: false,
      viewCount: 53,
    },
    {
      title: "Pop-up lokal – Möllevångstorget",
      description:
        "Kreativ lokal perfekt för pop-up butik, utställning eller event. Betonggolv, vita väggar, stor skyltyta mot torget. Korttidsuthyrning möjlig.",
      city: "Malmö",
      address: "Möllevångstorget 3",
      type: "rent",
      category: "butik",
      price: 15000,
      size: 65,
      lat: 55.5906,
      lng: 13.006,
      imageUrl: "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800&q=80",
      tags: ["Centralt läge", "Hög takhöjd"],
      featured: false,
      viewCount: 31,
    },
    {
      title: "Verkstad/atelier – Västra Hamnen",
      description:
        "Rå industrilokal i Västra Hamnen, perfekt som verkstad, atelier eller studio. Betonggolv, 5m takhöjd, stora portar. Vatten och el ingår.",
      city: "Malmö",
      address: "Varvsgatan 12",
      type: "sale",
      category: "ovrigt",
      price: 2800000,
      size: 200,
      lat: 55.6137,
      lng: 12.983,
      imageUrl: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&q=80",
      tags: ["Hög takhöjd", "Parkering"],
      featured: true,
      viewCount: 89,
    },
  ];

  const createdListings = [];
  for (const data of listingsData) {
    const listing = await prisma.listing.create({
      data: {
        ...data,
        ownerId: landlord.id,
        contactName: landlord.name,
        contactEmail: landlord.email,
        contactPhone: landlord.phone || "",
      },
    });
    createdListings.push(listing);
    console.log(`  Listing: ${listing.title} (${listing.id})`);
  }

  // Agent listing (mäklare profil)
  const agentListing = await prisma.listing.create({
    data: {
      title: "Kontorslokal i centrum – Mäklarannons",
      description:
        "Ljus kontorslokal i centralt läge. Tillgång till mötesrum, fiber och parkering. Kontakta Nordic Fastighetsmäklare för visning.",
      city: "Stockholm",
      address: "Stureplan 4",
      type: "rent",
      category: "kontor",
      price: 35000,
      size: 90,
      lat: 59.3348,
      lng: 18.0737,
      imageUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80",
      tags: ["Centralt läge", "Fiber", "Mötesrum"],
      featured: true,
      viewCount: 22,
      ownerId: agent.id,
      contactName: agent.name,
      contactEmail: agent.email,
      contactPhone: agent.phone || "",
    },
  });
  createdListings.push(agentListing);
  console.log(`  Agent listing: ${agentListing.title} (${agentListing.id})`);

  // ── Favorites ──────────────────────────────────────────
  // Anna (main tenant) saves 3
  for (const listing of [createdListings[0], createdListings[1], createdListings[4]]) {
    await prisma.favorite.upsert({
      where: { userId_listingId: { userId: tenant.id, listingId: listing.id } },
      update: {},
      create: { userId: tenant.id, listingId: listing.id },
    });
  }

  // Dummy tenants also save listings (gives landlord higher favorite counts)
  const dummyFavorites: [number, number][] = [
    [0, 0], [0, 1], [0, 2],       // Johan saves 3
    [1, 0], [1, 3], [1, 5],       // Maria saves 3
    [2, 1], [2, 4],               // Karl saves 2
    [3, 0], [3, 1], [3, 2], [3, 3], // Sara saves 4
  ];
  for (const [ti, li] of dummyFavorites) {
    await prisma.favorite.upsert({
      where: { userId_listingId: { userId: dummyTenants[ti].id, listingId: createdListings[li].id } },
      update: {},
      create: {
        userId: dummyTenants[ti].id,
        listingId: createdListings[li].id,
        createdAt: new Date(Date.now() - Math.random() * 7 * 86400 * 1000), // random within last 7 days
      },
    });
  }
  console.log("  Favorites: 3 för Anna + 12 från dummy-tenants");

  // ── Conversations + Messages ───────────────────────────
  // Anna's conversations (main tenant)
  const conv1 = await prisma.conversation.create({
    data: {
      listingId: createdListings[0].id,
      landlordId: landlord.id,
      tenantId: tenant.id,
    },
  });

  const messages1 = [
    { senderId: tenant.id, text: "Hej! Jag är intresserad av kontorslokalen på Södermalm. Finns det möjlighet att boka en visning denna vecka?" },
    { senderId: landlord.id, text: "Hej Anna! Absolut, lokalen är ledig för visning. Passar torsdag kl 14:00 eller fredag kl 10:00?" },
    { senderId: tenant.id, text: "Torsdag kl 14 passar perfekt! Är det okej om jag tar med en kollega?" },
    { senderId: landlord.id, text: "Självklart! Vi ses på Götgatan 42, torsdag kl 14. Jag möter er i entrén." },
    { senderId: tenant.id, text: "Tack, vi ses då! Har ni förresten fiber inkluderat i hyran?" },
    { senderId: landlord.id, text: "Ja, 1 Gbit/s fiber ingår. Vi har även gemensamt kök och mötesrum som delas med grannkontoret." },
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
      landlordId: landlord.id,
      tenantId: tenant.id,
    },
  });

  const messages2 = [
    { senderId: tenant.id, text: "Hej! Är butikslokalen på Avenyn fortfarande tillgänglig? Vi driver en klädbutik och söker nytt läge." },
    { senderId: landlord.id, text: "Hej! Ja, den är tillgänglig från 1 april. Hyran är 45 000 kr/mån exkl. moms. Vill du komma och titta?" },
    { senderId: tenant.id, text: "Ja gärna! Kan vi boka in nästa vecka? Och finns det möjlighet att förhandla hyran vid längre avtal?" },
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

  // ── Dummy tenant conversations (for richer landlord stats) ──
  const dummyConversations: { tenantIdx: number; listingIdx: number; messages: { fromTenant: boolean; text: string }[]; hoursAgo: number }[] = [
    {
      tenantIdx: 0, listingIdx: 0,
      hoursAgo: 2,
      messages: [
        { fromTenant: true, text: "Hej! Vi är ett startup med 8 anställda och letar kontor. Är lokalen fortfarande ledig?" },
        { fromTenant: false, text: "Hej Johan! Ja, den är tillgänglig. Vill du boka en visning?" },
        { fromTenant: true, text: "Absolut! Passar det imorgon förmiddag?" },
      ],
    },
    {
      tenantIdx: 0, listingIdx: 2,
      hoursAgo: 12,
      messages: [
        { fromTenant: true, text: "Hej, jag undrar om lagerlokalen har 3-fas el? Vi behöver det för vår verksamhet." },
        { fromTenant: false, text: "Hej! Ja, 3-fas el finns installerat. Lokalen har även uppvärmning och lastbrygga." },
      ],
    },
    {
      tenantIdx: 1, listingIdx: 1,
      hoursAgo: 5,
      messages: [
        { fromTenant: true, text: "Hej! Jag driver en inredningsbutik och är intresserad av lokalen på Avenyn. Hur stort är skyltfönstret?" },
        { fromTenant: false, text: "Hej Maria! Skyltfönstret är ca 6 meter brett och vetter direkt mot Avenyn. Fantastisk exponering!" },
        { fromTenant: true, text: "Låter perfekt! Kan jag komma och titta på fredag?" },
        { fromTenant: false, text: "Fredag kl 11 funkar bra. Jag mailar dig adressen och portkod." },
      ],
    },
    {
      tenantIdx: 1, listingIdx: 3,
      hoursAgo: 48,
      messages: [
        { fromTenant: true, text: "Hej! Finns det parkeringsplatser till kontoret i Uppsala?" },
        { fromTenant: false, text: "Hej! Ja, det finns 5 parkeringsplatser och cykelgarage. Laddstolpar för elbil finns också." },
        { fromTenant: true, text: "Tack för info! Jag återkommer efter att ha diskuterat med min partner." },
      ],
    },
    {
      tenantIdx: 2, listingIdx: 0,
      hoursAgo: 24,
      messages: [
        { fromTenant: true, text: "Hej! Är det möjligt att hyra lokalen på Södermalm för 6 månader istället för 12?" },
        { fromTenant: false, text: "Hej Karl! Vi erbjuder normalt 12-månadersavtal, men vi kan diskutera flexibla lösningar. Vill du boka ett möte?" },
      ],
    },
    {
      tenantIdx: 2, listingIdx: 5,
      hoursAgo: 72,
      messages: [
        { fromTenant: true, text: "Intresserad av verkstadslokalen. Finns det möjlighet att installera ventilation?" },
      ],
    },
    {
      tenantIdx: 3, listingIdx: 1,
      hoursAgo: 8,
      messages: [
        { fromTenant: true, text: "Hej! Vi planerar att öppna ett café och butikslokalen på Avenyn verkar perfekt. Finns det vatten/avlopp för kök?" },
        { fromTenant: false, text: "Hej Sara! Ja, det finns VA-anslutning i lokalen. Det finns även fettavskiljare installerad sedan tidigare." },
        { fromTenant: true, text: "Fantastiskt! Vi vill gärna boka visning så snart som möjligt." },
      ],
    },
    {
      tenantIdx: 3, listingIdx: 4,
      hoursAgo: 36,
      messages: [
        { fromTenant: true, text: "Hej! Kan man hyra pop-up lokalen för bara en månad? Vi vill testa ett koncept." },
        { fromTenant: false, text: "Absolut! Vi erbjuder korttidsuthyrning från 1 månad. Hyran är densamma, 15 000 kr/mån." },
        { fromTenant: true, text: "Perfekt, vi tar den! Kan vi flytta in 1 mars?" },
        { fromTenant: false, text: "Det går bra! Jag skickar över avtalet via mail. Välkommen!" },
      ],
    },
  ];

  for (const dc of dummyConversations) {
    const dTenant = dummyTenants[dc.tenantIdx];
    const dListing = createdListings[dc.listingIdx];

    const conv = await prisma.conversation.create({
      data: {
        listingId: dListing.id,
        landlordId: landlord.id,
        tenantId: dTenant.id,
      },
    });

    for (let i = 0; i < dc.messages.length; i++) {
      const msg = dc.messages[i];
      const msgHoursAgo = dc.hoursAgo + (dc.messages.length - 1 - i) * 2; // space messages 2h apart
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderId: msg.fromTenant ? dTenant.id : landlord.id,
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
  console.log(`\n  Hyresvärd:  hyresvard@hittayta.se / ${PASSWORD}`);
  console.log(`  Hyresgäst:  hyresgast@hittayta.se / ${PASSWORD}`);
  console.log(`  Mäklare:    maklare@hittayta.se / ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
