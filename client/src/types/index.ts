export interface DashboardStats {
  totalUsers: number;
  todayOrders: number;
  stockItems: number;
  todayRevenue: string;
}

export interface KOTFormData {
  customerName: string;
  type: "restaurant" | "bar";
  orderTime: string;
  expectedTime: string;
  items: {
    menuItemId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

export interface MenuItemWithIngredients {
  id: string;
  name: string;
  description?: string;
  price: string;
  category: string;
  isActive: boolean;
  ingredients: {
    id: string;
    quantity: string;
    ingredient: {
      id: string;
      name: string;
      unit: string;
    };
  }[];
}

export interface KOTWithDetails {
  id: string;
  kotNumber: string;
  customerName: string;
  type: "restaurant" | "bar";
  status: "pending" | "processing" | "completed" | "reversed";
  orderTime: Date;
  expectedTime: Date;
  totalAmount: string;
  creator: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  items: {
    id: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    menuItem: {
      id: string;
      name: string;
    };
  }[];
}
