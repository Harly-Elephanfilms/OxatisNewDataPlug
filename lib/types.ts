export interface StockItem {
  oxatisId: string;
  itemSKU: string;
  name: string;
  qtyInStock: number;
  dateOfAvailability?: string;
}

export interface CsvStockItem {
  ref: string;
  ean?: string;
  title: string;
  type?: string;
  regr?: string;
  stock: number;
  autresStocks?: number;
}

export interface ComparisonItem {
  itemSKU: string;
  name: string;
  oxatisId?: string;
  currentStock: number;
  newStock: number;
  difference: number;
  dateOfAvailability?: string;
  isPreorder: boolean;
  status: "unchanged" | "increased" | "decreased" | "new" | "missing" | "preorder";
}

export interface OxatisCredentials {
  appId: string;
  token: string;
}

export interface Article {
  oxatisId: string;
  itemSKU: string;
  title: string;
  link: string;
  price: string;
  priceHT: string;
  salePrice: string;
  description: string;
  condition: string;
  ean: string;
  brand: string;
  imageUrl: string;
  category: string;
  productType: string;
  quantity: number;
  availability: string;
  shippingWeight: string;
  visible: boolean;
  cost: string;
  categories: string[];
  metaTitle: string;
  metaDescription: string;
}

export interface CategoryNode {
  oxId: string;
  name: string;
  parentOxId: string;
  children: CategoryNode[];
}
