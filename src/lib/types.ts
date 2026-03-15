export interface PrivacyLevel {
  addressVisibility: "area" | "street" | "full";
  showFloorPlan: boolean;
  maxPublicImages: number;
  documentsAfterContact: boolean;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  city: string;
  address: string;
  type: "sale";
  category: string;
  propertyType: string; // "villa" | "lagenhet" | "fritidshus" | "tomt"
  price: number;
  size: number;
  rooms?: number | null;
  lotSize?: number | null;
  condition?: string | null;
  energyClass?: string | null;
  yearBuilt?: number | null;
  monthlyFee?: number | null;
  acceptancePrice?: number | null;
  status: string; // "draft" | "active" | "paused" | "sold" | "removed"
  ownershipVerified?: boolean;
  privacyLevel?: PrivacyLevel | null;
  imageUrl: string;
  imageUrls?: string[];
  videoUrl?: string | null;
  floorPlanImageUrl?: string | null;
  floorPlanDescription?: string | null;
  areaData?: { nearby?: NearbyData; priceContext?: PriceContext | null; demographics?: DemographicsData | null; areaContext?: AreaContext | null } | null;
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

export type UserRole = "buyer" | "seller" | "admin" | "partner";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  isBuyer: boolean;
  isSeller: boolean;
  isAdmin: boolean;
  phone?: string;
  logoUrl?: string | null;
  companyName?: string | null;
  bankIdVerified?: boolean;
  subscriptionTier?: "free" | "premium";
  createdAt: string;
}

export interface Conversation {
  id: string;
  listingId: string;
  sellerId: string;
  buyerId: string;
  budgetMatched?: boolean;
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

export interface BuyerProfile {
  id: string;
  userId: string;
  name: string;
  active: boolean;
  areas: string[];
  propertyTypes: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  minSize?: number | null;
  maxSize?: number | null;
  minRooms?: number | null;
  maxRooms?: number | null;
  minLotSize?: number | null;
  maxLotSize?: number | null;
  condition: string[];
  features: string[];
  notifyEmail: boolean;
  notifyPush: boolean;
  createdAt: string;
  updatedAt: string;
}

export const categoryLabels: Record<string, string> = {
  villa: "Villa",
  lagenhet: "Lägenhet",
  fritidshus: "Fritidshus",
  tomt: "Tomt",
};

export const allCategories = Object.keys(categoryLabels);

export const propertyTypeLabels: Record<string, string> = {
  villa: "Villa",
  lagenhet: "Lägenhet",
  fritidshus: "Fritidshus",
  tomt: "Tomt",
};

export const allPropertyTypes = Object.keys(propertyTypeLabels);

export const conditionLabels: Record<string, string> = {
  nyskick: "Nyskick",
  renoverat: "Renoverat",
  bra_skick: "Bra skick",
  renoveringsbehov: "Renoveringsbehov",
};

export const allConditions = Object.keys(conditionLabels);

export const featureLabels: Record<string, string> = {
  pool: "Pool",
  sjotomt: "Sjötomt",
  garage: "Garage",
  balkong: "Balkong",
  trädgård: "Trädgård",
  havsutsikt: "Havsutsikt",
  öppen_spis: "Öppen spis",
  bastu: "Bastu",
  parkering: "Parkering",
  fiber: "Fiber",
};

export const allFeatures = Object.keys(featureLabels);

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
};

export const statusLabels: Record<string, string> = {
  draft: "Utkast",
  active: "Aktiv",
  paused: "Pausad",
  sold: "Såld",
  removed: "Borttagen",
};

export const roleLabels: Record<string, string> = {
  seller: "Säljare",
  buyer: "Köpare",
  admin: "Administratör",
  partner: "Servicepartner",
};

export const availableTags = [
  "Nyrenoverad",
  "Centralt läge",
  "Parkering",
  "Fiber",
  "Öppen planlösning",
  "Nära kollektivtrafik",
  "Tryggt läge",
  "Nära centrum",
  "Sjötomt",
  "Havsutsikt",
  "Balkong",
  "Trädgård",
  "Garage",
  "Pool",
] as const;

export interface SearchFilters {
  city: string;
  type: string;
  category: string;
  propertyType?: string;
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

/** Wikipedia area context */
export interface AreaContext {
  /** Short summary of the area/district from Wikipedia (max ~300 chars) */
  summary: string;
  /** Wikipedia article title */
  title: string;
  /** Full URL to the Wikipedia article */
  url: string;
}
