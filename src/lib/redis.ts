import Redis from "ioredis";

const getRedisClient = () => {
  const url = process.env.REDIS_URL || "redis://localhost:6379";

  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    lazyConnect: true,
  });

  client.on("error", (err) => {
    console.error("Redis connection error:", err.message);
  });

  return client;
};

// Singleton pattern for Redis client
let redisClient: Redis | null = null;

export const getRedis = () => {
  if (!redisClient) {
    redisClient = getRedisClient();
  }
  return redisClient;
};

// Types
export interface Listing {
  id: string;
  title: string;
  description: string;
  city: string;
  address: string;
  type: "sale" | "rent";
  category: "butik" | "kontor" | "lager" | "ovrigt";
  price: number;
  size: number;
  imageUrl: string;
  featured: boolean;
  createdAt: string;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface ListingFilter {
  city?: string;
  type?: string;
  category?: string;
  search?: string;
  featured?: boolean;
}

// Helper functions
export const getAllListings = async (): Promise<Listing[]> => {
  const redis = getRedis();
  try {
    await redis.connect().catch(() => {});
    const keys = await redis.keys("listing:*");
    if (keys.length === 0) return [];

    const pipeline = redis.pipeline();
    keys.forEach((key) => pipeline.get(key));
    const results = await pipeline.exec();

    if (!results) return [];

    return results
      .map(([err, val]) => {
        if (err || !val) return null;
        try {
          return JSON.parse(val as string) as Listing;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as Listing[];
  } catch {
    console.error("Redis not available, using sample data");
    return getSampleListings();
  }
};

export const getFilteredListings = async (
  filters: ListingFilter
): Promise<Listing[]> => {
  let listings = await getAllListings();

  if (filters.city) {
    listings = listings.filter(
      (l) => l.city.toLowerCase() === filters.city!.toLowerCase()
    );
  }
  if (filters.type) {
    listings = listings.filter((l) => l.type === filters.type);
  }
  if (filters.category) {
    listings = listings.filter((l) => l.category === filters.category);
  }
  if (filters.featured) {
    listings = listings.filter((l) => l.featured);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    listings = listings.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
    );
  }

  return listings.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const saveListing = async (listing: Listing): Promise<void> => {
  const redis = getRedis();
  try {
    await redis.connect().catch(() => {});
    await redis.set(`listing:${listing.id}`, JSON.stringify(listing));
  } catch {
    console.error("Could not save listing to Redis");
  }
};

// Sample data when Redis is not available
export const getSampleListings = (): Listing[] => [
  {
    id: "1",
    title: "Modern butikslokal i centrala Stockholm",
    description:
      "Ljus och fräsch butikslokal med stora skyltfönster mot gågatan. Perfekt för retail eller showroom. Nyligen renoverad med moderna installationer.",
    city: "Stockholm",
    address: "Drottninggatan 45",
    type: "rent",
    category: "butik",
    price: 25000,
    size: 120,
    imageUrl: "/images/butik-1.jpg",
    featured: true,
    createdAt: "2026-02-01T10:00:00Z",
    contact: { name: "Anna Svensson", email: "anna@example.com", phone: "070-123 45 67" },
  },
  {
    id: "2",
    title: "Kontorslokal med havsutsikt i Göteborg",
    description:
      "Representativt kontor i Göteborgs mest attraktiva läge. Öppen planlösning med möjlighet till egna rum. Fiber och klimatanläggning ingår.",
    city: "Göteborg",
    address: "Packhusplatsen 8",
    type: "rent",
    category: "kontor",
    price: 35000,
    size: 200,
    imageUrl: "/images/kontor-1.jpg",
    featured: true,
    createdAt: "2026-02-03T14:00:00Z",
    contact: { name: "Erik Johansson", email: "erik@example.com", phone: "070-234 56 78" },
  },
  {
    id: "3",
    title: "Lagerlokal nära E4 i Malmö",
    description:
      "Stort lager med lastbrygga och gott om plats för pallställ. Bra logistikläge nära E4:an och Öresundsbron. El och vatten ingår.",
    city: "Malmö",
    address: "Industrigatan 12",
    type: "rent",
    category: "lager",
    price: 15000,
    size: 500,
    imageUrl: "/images/lager-1.jpg",
    featured: true,
    createdAt: "2026-02-05T09:00:00Z",
    contact: { name: "Maria Nilsson", email: "maria@example.com", phone: "070-345 67 89" },
  },
  {
    id: "4",
    title: "Butikslokal till salu i Uppsala",
    description:
      "Etablerad butikslokal i Uppsala centrum. Stabil hyreshistorik och bra läge invid stora torget. Perfekt investering.",
    city: "Uppsala",
    address: "Svartbäcksgatan 22",
    type: "sale",
    category: "butik",
    price: 3500000,
    size: 95,
    imageUrl: "/images/butik-2.jpg",
    featured: true,
    createdAt: "2026-02-06T11:00:00Z",
    contact: { name: "Karl Berg", email: "karl@example.com", phone: "070-456 78 90" },
  },
  {
    id: "5",
    title: "Modernt kontor i Linköping",
    description:
      "Nyrenoverat kontor i Mjärdevi Science Park. Perfekt för tech-bolag. Gemensamma ytor, mötesrum och parkering ingår.",
    city: "Linköping",
    address: "Teknikringen 7",
    type: "rent",
    category: "kontor",
    price: 18000,
    size: 150,
    imageUrl: "/images/kontor-2.jpg",
    featured: false,
    createdAt: "2026-02-07T08:00:00Z",
    contact: { name: "Lisa Ek", email: "lisa@example.com", phone: "070-567 89 01" },
  },
  {
    id: "6",
    title: "Stort lager till salu i Västerås",
    description:
      "Fristående lagerbyggnad med kontosdel. Stort markområde med asfalterad uppställningsyta. Tre portar med lastbrygga.",
    city: "Västerås",
    address: "Saltängsvägen 3",
    type: "sale",
    category: "lager",
    price: 8500000,
    size: 1200,
    imageUrl: "/images/lager-2.jpg",
    featured: false,
    createdAt: "2026-01-28T15:00:00Z",
    contact: { name: "Anders Holm", email: "anders@example.com", phone: "070-678 90 12" },
  },
  {
    id: "7",
    title: "Ateljé/studio i Södermalm",
    description:
      "Kreativ lokal i hjärtat av Södermalm. Högt i tak, stora fönster och industriell känsla. Passar som ateljé, studio eller pop-up.",
    city: "Stockholm",
    address: "Hornsgatan 82",
    type: "rent",
    category: "ovrigt",
    price: 12000,
    size: 80,
    imageUrl: "/images/ovrigt-1.jpg",
    featured: true,
    createdAt: "2026-02-08T12:00:00Z",
    contact: { name: "Sara Lund", email: "sara@example.com", phone: "070-789 01 23" },
  },
  {
    id: "8",
    title: "Kontorshotell i Lund",
    description:
      "Flexibla kontorsplatser i centrala Lund. Nära tågstation och universitet. Reception, fiber och kaffe ingår.",
    city: "Lund",
    address: "Kyrkogatan 15",
    type: "rent",
    category: "kontor",
    price: 8500,
    size: 45,
    imageUrl: "/images/kontor-3.jpg",
    featured: false,
    createdAt: "2026-02-02T16:00:00Z",
    contact: { name: "Patrik Olsson", email: "patrik@example.com", phone: "070-890 12 34" },
  },
];
