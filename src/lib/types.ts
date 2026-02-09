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

export interface SearchFilters {
  city: string;
  type: string;
  category: string;
}
