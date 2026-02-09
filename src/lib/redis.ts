import Redis from "ioredis";
import type { Listing, User, Conversation, Message } from "@/lib/types";

const getRedisClient = (): Redis => {
  const url = process.env.REDIS_URL || "redis://localhost:6379";

  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    lazyConnect: true,
    enableReadyCheck: true,
    connectTimeout: 10000,
  });

  client.on("error", (err) => {
    console.error("Redis connection error:", err.message);
  });

  client.on("reconnecting", () => {
    console.warn("Redis reconnecting...");
  });

  client.on("connect", () => {
    console.info("Redis connected");
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

export type ListingSort = "date" | "price_asc" | "price_desc" | "size";

export interface ListingFilter {
  city?: string;
  type?: string;
  category?: string;
  search?: string;
  featured?: boolean;
  sort?: ListingSort;
  priceMin?: number;
  priceMax?: number;
  sizeMin?: number;
  sizeMax?: number;
  tags?: string[];
}

// ─── Listings ────────────────────────────────────────────────────────

export const getAllListings = async (): Promise<Listing[]> => {
  const redis = getRedis();
  try {
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
  if (filters.priceMin != null) {
    listings = listings.filter((l) => l.price >= filters.priceMin!);
  }
  if (filters.priceMax != null) {
    listings = listings.filter((l) => l.price <= filters.priceMax!);
  }
  if (filters.sizeMin != null) {
    listings = listings.filter((l) => l.size >= filters.sizeMin!);
  }
  if (filters.sizeMax != null) {
    listings = listings.filter((l) => l.size <= filters.sizeMax!);
  }
  if (filters.tags && filters.tags.length > 0) {
    listings = listings.filter((l) =>
      filters.tags!.every((t) => l.tags?.includes(t))
    );
  }

  const sort = filters.sort ?? "date";
  if (sort === "date") {
    listings.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } else if (sort === "price_asc") {
    listings.sort((a, b) => a.price - b.price);
  } else if (sort === "price_desc") {
    listings.sort((a, b) => b.price - a.price);
  } else if (sort === "size") {
    listings.sort((a, b) => b.size - a.size);
  }

  return listings;
};

export interface ListingStats {
  totalListings: number;
  totalCities: number;
  byCategory: Record<string, number>;
}

export const getListingStats = async (): Promise<ListingStats> => {
  const listings = await getAllListings();
  const cities = new Set(listings.map((l) => l.city));
  const byCategory: Record<string, number> = {
    butik: 0,
    kontor: 0,
    lager: 0,
    ovrigt: 0,
  };
  listings.forEach((l) => {
    byCategory[l.category] = (byCategory[l.category] ?? 0) + 1;
  });
  return {
    totalListings: listings.length,
    totalCities: cities.size,
    byCategory,
  };
};

export const getListingById = async (
  id: string
): Promise<Listing | null> => {
  const redis = getRedis();
  try {
    const val = await redis.get(`listing:${id}`);
    if (val) {
      return JSON.parse(val) as Listing;
    }
    const all = await getAllListings();
    return all.find((l) => l.id === id) ?? null;
  } catch {
    const all = getSampleListings();
    return all.find((l) => l.id === id) ?? null;
  }
};

export const saveListing = async (listing: Listing): Promise<void> => {
  const redis = getRedis();
  try {
    await redis.set(`listing:${listing.id}`, JSON.stringify(listing));
  } catch (err) {
    console.error(
      "Could not save listing to Redis:",
      err instanceof Error ? err.message : err
    );
  }
};

// ─── Users ───────────────────────────────────────────────────────────

export const getUserById = async (id: string): Promise<User | null> => {
  const redis = getRedis();
  try {
    const val = await redis.get(`user:${id}`);
    if (!val) return null;
    return JSON.parse(val) as User;
  } catch {
    return null;
  }
};

export const getUserByEmail = async (
  email: string
): Promise<User | null> => {
  const redis = getRedis();
  try {
    const userId = await redis.get(`user:email:${email.toLowerCase()}`);
    if (!userId) return null;
    return getUserById(userId);
  } catch {
    return null;
  }
};

export const saveUser = async (user: User): Promise<void> => {
  const redis = getRedis();
  const pipeline = redis.pipeline();
  pipeline.set(`user:${user.id}`, JSON.stringify(user));
  pipeline.set(`user:email:${user.email.toLowerCase()}`, user.id);
  await pipeline.exec();
};

// ─── Conversations ───────────────────────────────────────────────────

export const getConversationById = async (
  id: string
): Promise<Conversation | null> => {
  const redis = getRedis();
  try {
    const val = await redis.get(`conversation:${id}`);
    if (!val) return null;
    return JSON.parse(val) as Conversation;
  } catch {
    return null;
  }
};

export const getConversationsForUser = async (
  userId: string
): Promise<Conversation[]> => {
  const redis = getRedis();
  try {
    const ids = await redis.smembers(`conversations:user:${userId}`);
    if (ids.length === 0) return [];
    const pipeline = redis.pipeline();
    ids.forEach((id) => pipeline.get(`conversation:${id}`));
    const results = await pipeline.exec();
    if (!results) return [];
    const convos = results
      .map(([err, val]) => {
        if (err || !val) return null;
        try {
          return JSON.parse(val as string) as Conversation;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as Conversation[];
    convos.sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
    );
    return convos;
  } catch {
    return [];
  }
};

export const saveConversation = async (
  conversation: Conversation
): Promise<void> => {
  const redis = getRedis();
  const pipeline = redis.pipeline();
  pipeline.set(
    `conversation:${conversation.id}`,
    JSON.stringify(conversation)
  );
  pipeline.sadd(
    `conversations:user:${conversation.landlordId}`,
    conversation.id
  );
  pipeline.sadd(
    `conversations:user:${conversation.tenantId}`,
    conversation.id
  );
  await pipeline.exec();
};

export const findExistingConversation = async (
  listingId: string,
  tenantId: string
): Promise<Conversation | null> => {
  const convos = await getConversationsForUser(tenantId);
  return convos.find(
    (c) => c.listingId === listingId && c.tenantId === tenantId
  ) ?? null;
};

// ─── Messages ────────────────────────────────────────────────────────

export const getMessages = async (
  conversationId: string
): Promise<Message[]> => {
  const redis = getRedis();
  try {
    const raw = await redis.lrange(
      `messages:${conversationId}`,
      0,
      -1
    );
    return raw.map((r) => JSON.parse(r) as Message);
  } catch {
    return [];
  }
};

export const addMessage = async (message: Message): Promise<void> => {
  const redis = getRedis();
  const pipeline = redis.pipeline();
  pipeline.rpush(
    `messages:${message.conversationId}`,
    JSON.stringify(message)
  );
  // Update lastMessageAt
  const convo = await getConversationById(message.conversationId);
  if (convo) {
    convo.lastMessageAt = message.createdAt;
    pipeline.set(
      `conversation:${convo.id}`,
      JSON.stringify(convo)
    );
  }
  await pipeline.exec();
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  const convos = await getConversationsForUser(userId);
  let count = 0;
  for (const convo of convos) {
    const messages = await getMessages(convo.id);
    count += messages.filter(
      (m) => m.senderId !== userId && !m.read
    ).length;
  }
  return count;
};

export const markMessagesAsRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  const redis = getRedis();
  const messages = await getMessages(conversationId);
  const updated = messages.map((m) =>
    m.senderId !== userId && !m.read ? { ...m, read: true } : m
  );
  const pipeline = redis.pipeline();
  pipeline.del(`messages:${conversationId}`);
  updated.forEach((m) =>
    pipeline.rpush(`messages:${conversationId}`, JSON.stringify(m))
  );
  await pipeline.exec();
};

// ─── Favorites ───────────────────────────────────────────────────────

export const getFavorites = async (userId: string): Promise<string[]> => {
  const redis = getRedis();
  try {
    return await redis.smembers(`favorites:${userId}`);
  } catch {
    return [];
  }
};

export const addFavorite = async (
  userId: string,
  listingId: string
): Promise<void> => {
  const redis = getRedis();
  await redis.sadd(`favorites:${userId}`, listingId);
};

export const removeFavorite = async (
  userId: string,
  listingId: string
): Promise<void> => {
  const redis = getRedis();
  await redis.srem(`favorites:${userId}`, listingId);
};

export const isFavorite = async (
  userId: string,
  listingId: string
): Promise<boolean> => {
  const redis = getRedis();
  try {
    return (await redis.sismember(`favorites:${userId}`, listingId)) === 1;
  } catch {
    return false;
  }
};

// ─── Sample Data ─────────────────────────────────────────────────────

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
    lat: 59.3326,
    lng: 18.0649,
    tags: ["Nyrenoverad", "Centralt läge", "Skyltfönster"],
    contact: {
      name: "Anna Svensson",
      email: "kontakt@drottninggatan-fastigheter.se",
      phone: "08-123 45 00",
    },
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
    lat: 57.7089,
    lng: 11.9746,
    tags: ["Fiber", "Klimatanläggning", "Öppen planlösning"],
    contact: {
      name: "Erik Johansson",
      email: "erik.johansson@packhuskontor.se",
      phone: "031-456 78 00",
    },
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
    lat: 55.5903,
    lng: 13.0201,
    tags: ["Lastbrygga", "Parkering"],
    contact: {
      name: "Maria Nilsson",
      email: "lager@industrilogistik.se",
      phone: "040-789 01 00",
    },
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
    lat: 59.8586,
    lng: 17.6389,
    tags: ["Centralt läge", "Skyltfönster"],
    contact: {
      name: "Karl Berg",
      email: "karl.berg@uppsalafastigheter.se",
      phone: "018-234 56 00",
    },
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
    lat: 58.3938,
    lng: 15.5753,
    tags: ["Nyrenoverad", "Parkering", "Mötesrum", "Fiber"],
    contact: {
      name: "Lisa Ek",
      email: "kontakt@mjardevi-kontor.se",
      phone: "013-567 89 00",
    },
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
    lat: 59.6099,
    lng: 16.5448,
    tags: ["Lastbrygga", "Parkering", "Hög takhöjd"],
    contact: {
      name: "Anders Holm",
      email: "anders.holm@vasteraslager.se",
      phone: "021-890 12 00",
    },
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
    lat: 59.3182,
    lng: 18.0544,
    tags: ["Hög takhöjd", "Centralt läge"],
    contact: {
      name: "Sara Lund",
      email: "sara@hornsgatan-atelje.se",
      phone: "08-345 67 00",
    },
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
    lat: 55.7047,
    lng: 13.1910,
    tags: ["Fiber", "Centralt läge", "Klimatanläggning"],
    contact: {
      name: "Patrik Olsson",
      email: "patrik@lundkontorshotell.se",
      phone: "046-678 90 00",
    },
  },
];
