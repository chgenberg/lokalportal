export interface Listing {
  id: string;
  title: string;
  description: string;
  city: string;
  address: string;
  type: "sale" | "rent";
  category: string; // comma-separated: "butik", "kontor", "lager", "restaurang", "verkstad", "showroom", "popup", "atelje", "gym", "ovrigt"
  price: number;
  size: number;
  imageUrl: string;
  featured: boolean;
  createdAt: string;
  lat: number;
  lng: number;
  tags: string[];
  ownerId?: string;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: "landlord" | "tenant";
  phone?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  listingId: string;
  landlordId: string;
  tenantId: string;
  createdAt: string;
  lastMessageAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  read: boolean;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileMimeType?: string | null;
}

export const categoryLabels: Record<string, string> = {
  butik: "Butik",
  kontor: "Kontor",
  lager: "Lager",
  restaurang: "Restaurang/Café",
  verkstad: "Verkstad/Industri",
  showroom: "Showroom",
  popup: "Pop-up",
  atelje: "Ateljé/Studio",
  gym: "Gym/Träningslokal",
  ovrigt: "Övrigt",
};

export const allCategories = Object.keys(categoryLabels);

/** Convert comma-separated category string to array */
export function parseCategories(cat: string): string[] {
  if (!cat) return [];
  return cat.split(",").map((c) => c.trim()).filter(Boolean);
}

/** Format categories for display */
export function formatCategories(cat: string): string {
  return parseCategories(cat)
    .map((c) => categoryLabels[c] ?? c)
    .join(", ");
}

export const typeLabels: Record<string, string> = {
  sale: "Till salu",
  rent: "Uthyres",
};

export const roleLabels: Record<string, string> = {
  landlord: "Hyresvärd",
  tenant: "Hyresgäst",
};

export const availableTags = [
  "Nyrenoverad",
  "Centralt läge",
  "Hög takhöjd",
  "Parkering",
  "Fiber",
  "Klimatanläggning",
  "Lastbrygga",
  "Skyltfönster",
  "Öppen planlösning",
  "Mötesrum",
] as const;

export interface SearchFilters {
  city: string;
  type: string;
  category: string;
}

/** Structured nearby amenities from Overpass API */
export interface NearbyData {
  restaurants: number;
  shops: number;
  gyms: number;
  busStops: { count: number; nearest?: string };
  trainStations: { count: number; nearest?: string };
  parking: number;
  schools: number;
  healthcare: number;
}

/** Price context from comparable listings in same area */
export interface PriceContext {
  medianPrice: number;
  count: number;
  minPrice: number;
  maxPrice: number;
}

/** Demographics from SCB */
export interface DemographicsData {
  population: number;
  city: string;
}
