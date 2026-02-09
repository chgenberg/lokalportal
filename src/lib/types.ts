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
}

export const categoryLabels: Record<string, string> = {
  butik: "Butik",
  kontor: "Kontor",
  lager: "Lager",
  ovrigt: "Övrigt",
};

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
