/**
 * Seed script: creates demo landlord + tenant with listings, favorites,
 * conversations and messages so the dashboard looks populated.
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
      imageUrl:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
      tags: ["Fiber", "Centralt läge", "Nyrenoverad", "Hiss"],
      featured: true,
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
      imageUrl:
        "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80",
      tags: ["Centralt läge", "Hög takhöjd", "Parkering"],
      featured: true,
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
      lat: 55.5650,
      lng: 13.0180,
      imageUrl:
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
      tags: ["Lastbrygga", "Parkering", "Hög takhöjd"],
      featured: false,
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
      lng: 17.6320,
      imageUrl:
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80",
      tags: ["Nyrenoverad", "Fiber", "Parkering", "Hiss"],
      featured: false,
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
      lng: 13.0060,
      imageUrl:
        "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800&q=80",
      tags: ["Centralt läge", "Hög takhöjd"],
      featured: false,
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
      lng: 12.9830,
      imageUrl:
        "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&q=80",
      tags: ["Hög takhöjd", "Parkering"],
      featured: true,
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

  // ── Favorites (tenant saves a few) ────────────────────
  for (const listing of [createdListings[0], createdListings[1], createdListings[4]]) {
    await prisma.favorite.upsert({
      where: { userId_listingId: { userId: tenant.id, listingId: listing.id } },
      update: {},
      create: { userId: tenant.id, listingId: listing.id },
    });
  }
  console.log("  Favorites: 3 sparade för hyresgäst");

  // ── Conversations + Messages ──────────────────────────
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
        read: i < messages1.length - 1, // last message unread
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

  console.log("  Conversations: 2 med meddelanden");

  console.log("\n✅ Seed klar!");
  console.log(`\n  Hyresvärd:  hyresvard@hittayta.se / ${PASSWORD}`);
  console.log(`  Hyresgäst:  hyresgast@hittayta.se / ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
