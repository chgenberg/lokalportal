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
  imageUrls?: string[]; // Up to 10 images; when present, takes precedence
  videoUrl?: string | null;
  floorPlanImageUrl?: string | null;
  areaData?: { nearby?: NearbyData; priceContext?: PriceContext | null; demographics?: DemographicsData | null; walkability?: WalkabilityData | null; areaContext?: AreaContext | null } | null;
  featured: boolean;
  createdAt: string;
  lat: number;
  lng: number;
  tags: string[];
  ownerId?: string;
  owner?: { role: string; logoUrl?: string | null; companyName?: string | null; name: string };
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
  role: "landlord" | "tenant" | "agent";
  phone?: string;
  logoUrl?: string | null;
  companyName?: string | null;
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

/** Get all images for a listing (imageUrls takes precedence over imageUrl) */
export function getListingImages(listing: { imageUrl?: string; imageUrls?: string[] }): string[] {
  const urls = listing.imageUrls;
  if (urls && urls.length > 0) return urls.filter((u) => u?.trim());
  const single = listing.imageUrl?.trim();
  return single ? [single] : [];
}

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
  landlord: "Hyresvärd / säljare",
  tenant: "Hyresgäst / köpare",
  agent: "Mäklare",
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
  "Nära kollektivtrafik",
  "Gångavstånd till restauranger",
  "Tryggt läge",
  "Nära centrum",
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
  busStops: { count: number; nearest?: string; nearestDistance?: number };
  trainStations: { count: number; nearest?: string; nearestDistance?: number };
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

/** Demographics from SCB + BRÅ */
export interface DemographicsData {
  population: number;
  city: string;
  /** Median income in tkr/year (sammanräknad förvärvsinkomst) */
  medianIncome?: number;
  /** Percentage of population aged 20–64 */
  workingAgePercent?: number;
  /** Total registered businesses in the municipality */
  totalBusinesses?: number;
  /** Reported crimes per 100 000 inhabitants (BRÅ) */
  crimeRate?: number;
}

/** Walkability & bikeability scores calculated from OSM data */
export interface WalkabilityData {
  /** 0-100 walkability score */
  walkScore: number;
  /** 0-100 bikeability score */
  bikeScore: number;
  /** Human-readable label: "Utmärkt", "Mycket bra", "Bra", "Godkänt", "Bilberoende" */
  walkLabel: string;
  bikeLabel: string;
  /** Number of cycleways found within radius */
  cycleways: number;
  /** Number of footways/pedestrian paths found within radius */
  footways: number;
}

/** Wikipedia area context */
export interface AreaContext {
  /** Short summary of the area/district from Wikipedia (max ~300 chars) */
  summary: string;
  /** Wikipedia article title */
  title: string;
  /** Full URL to the Wikipedia article */
  url: string;
}
