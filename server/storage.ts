import {
  users,
  ingredients,
  menuItems,
  menuItemIngredients,
  kots,
  kotItems,
  stockAdditions,
  orderReversals,
  bills,
  type User,
  type UpsertUser,
  type Ingredient,
  type InsertIngredient,
  type MenuItem,
  type InsertMenuItem,
  type MenuItemIngredient,
  type InsertMenuItemIngredient,
  type Kot,
  type InsertKot,
  type KotItem,
  type InsertKotItem,
  type StockAddition,
  type InsertStockAddition,
  type OrderReversal,
  type InsertOrderReversal,
  type Bill,
  type InsertBill,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Test accounts operations
  createTestAccounts(): Promise<void>;
  
  // Ingredient operations
  getIngredients(): Promise<Ingredient[]>;
  getIngredient(id: string): Promise<Ingredient | undefined>;
  createIngredient(ingredient: InsertIngredient): Promise<Ingredient>;
  updateIngredientStock(id: string, quantity: string): Promise<Ingredient>;
  getLowStockIngredients(): Promise<Ingredient[]>;
  
  // Menu operations
  getMenuItems(category?: string): Promise<(MenuItem & { ingredients: (MenuItemIngredient & { ingredient: Ingredient })[] })[]>;
  getMenuItem(id: string): Promise<(MenuItem & { ingredients: (MenuItemIngredient & { ingredient: Ingredient })[] }) | undefined>;
  createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem>;
  addMenuItemIngredient(menuItemIngredient: InsertMenuItemIngredient): Promise<MenuItemIngredient>;
  
  // KOT operations
  getKots(filters?: { status?: string; type?: string; limit?: number }): Promise<(Kot & { creator: User; items: (KotItem & { menuItem: MenuItem })[] })[]>;
  getKot(id: string): Promise<(Kot & { creator: User; items: (KotItem & { menuItem: MenuItem })[] }) | undefined>;
  createKot(kot: InsertKot, items: InsertKotItem[]): Promise<Kot>;
  updateKotStatus(id: string, status: string, processedById?: string): Promise<Kot>;
  generateKotNumber(type: "restaurant" | "bar"): Promise<string>;
  
  // Stock operations
  getStockAdditions(status?: string): Promise<(StockAddition & { ingredient: Ingredient; addedBy: User; approvedBy?: User })[]>;
  createStockAddition(stockAddition: InsertStockAddition): Promise<StockAddition>;
  approveStockAddition(id: string, approvedById: string): Promise<StockAddition>;
  rejectStockAddition(id: string, approvedById: string, reason: string): Promise<StockAddition>;
  
  // Reversal operations
  getOrderReversals(status?: string): Promise<(OrderReversal & { kot: Kot; requestedBy: User; approvedBy?: User })[]>;
  createOrderReversal(reversal: InsertOrderReversal): Promise<OrderReversal>;
  approveOrderReversal(id: string, approvedById: string): Promise<OrderReversal>;
  rejectOrderReversal(id: string, approvedById: string): Promise<OrderReversal>;
  
  // Bill operations
  getBills(filters?: { kotId?: string; isPaid?: boolean }): Promise<(Bill & { kot: Kot; generatedBy: User })[]>;
  createBill(bill: InsertBill): Promise<Bill>;
  generateBillNumber(): Promise<string>;
  
  // Dashboard statistics
  getDashboardStats(): Promise<{
    totalUsers: number;
    todayOrders: number;
    stockItems: number;
    todayRevenue: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createTestAccounts(): Promise<void> {
    const testUsers = [
      { id: "admin-test", email: "admin@restaurant.com", firstName: "John", lastName: "Admin", role: "admin" as const },
      { id: "cashier-test", email: "cashier@restaurant.com", firstName: "Jane", lastName: "Cashier", role: "restaurant_cashier" as const },
      { id: "storekeeper-test", email: "storekeeper@restaurant.com", firstName: "Bob", lastName: "Store", role: "store_keeper" as const },
      { id: "officer-test", email: "officer@restaurant.com", firstName: "Alice", lastName: "Officer", role: "authorising_officer" as const },
      { id: "barman-test", email: "barman@restaurant.com", firstName: "Mike", lastName: "Bar", role: "barman" as const },
    ];

    for (const user of testUsers) {
      await db.insert(users).values(user).onConflictDoNothing();
    }

    // Create sample ingredients
    const testIngredients = [
      { name: "Rice", unit: "kg", currentStock: "50.000", minimumThreshold: "10.000", costPerUnit: "60.00" },
      { name: "Chicken", unit: "kg", currentStock: "15.000", minimumThreshold: "20.000", costPerUnit: "250.00" },
      { name: "Carrot", unit: "kg", currentStock: "8.000", minimumThreshold: "5.000", costPerUnit: "80.00" },
      { name: "Onion", unit: "kg", currentStock: "25.000", minimumThreshold: "10.000", costPerUnit: "40.00" },
      { name: "Whiskey", unit: "l", currentStock: "10.000", minimumThreshold: "5.000", costPerUnit: "2500.00" },
    ];

    for (const ingredient of testIngredients) {
      await db.insert(ingredients).values(ingredient).onConflictDoNothing();
    }
  }

  // Ingredient operations
  async getIngredients(): Promise<Ingredient[]> {
    return await db.select().from(ingredients).orderBy(ingredients.name);
  }

  async getIngredient(id: string): Promise<Ingredient | undefined> {
    const [ingredient] = await db.select().from(ingredients).where(eq(ingredients.id, id));
    return ingredient;
  }

  async createIngredient(ingredient: InsertIngredient): Promise<Ingredient> {
    const [newIngredient] = await db.insert(ingredients).values(ingredient).returning();
    return newIngredient;
  }

  async updateIngredientStock(id: string, quantity: string): Promise<Ingredient> {
    const [ingredient] = await db
      .update(ingredients)
      .set({ 
        currentStock: quantity,
        updatedAt: new Date() 
      })
      .where(eq(ingredients.id, id))
      .returning();
    return ingredient;
  }

  async getLowStockIngredients(): Promise<Ingredient[]> {
    return await db
      .select()
      .from(ingredients)
      .where(sql`${ingredients.currentStock} <= ${ingredients.minimumThreshold}`)
      .orderBy(ingredients.name);
  }

  // Menu operations
  async getMenuItems(category?: string): Promise<(MenuItem & { ingredients: (MenuItemIngredient & { ingredient: Ingredient })[] })[]> {
    const query = db
      .select()
      .from(menuItems)
      .leftJoin(menuItemIngredients, eq(menuItems.id, menuItemIngredients.menuItemId))
      .leftJoin(ingredients, eq(menuItemIngredients.ingredientId, ingredients.id))
      .where(category ? eq(menuItems.category, category) : undefined)
      .orderBy(menuItems.name);

    const results = await query;
    
    const menuMap = new Map<string, MenuItem & { ingredients: (MenuItemIngredient & { ingredient: Ingredient })[] }>();
    
    for (const result of results) {
      const menuItem = result.menu_items;
      if (!menuMap.has(menuItem.id)) {
        menuMap.set(menuItem.id, { ...menuItem, ingredients: [] });
      }
      
      if (result.menu_item_ingredients && result.ingredients) {
        menuMap.get(menuItem.id)!.ingredients.push({
          ...result.menu_item_ingredients,
          ingredient: result.ingredients
        });
      }
    }
    
    return Array.from(menuMap.values());
  }

  async getMenuItem(id: string): Promise<(MenuItem & { ingredients: (MenuItemIngredient & { ingredient: Ingredient })[] }) | undefined> {
    const results = await db
      .select()
      .from(menuItems)
      .leftJoin(menuItemIngredients, eq(menuItems.id, menuItemIngredients.menuItemId))
      .leftJoin(ingredients, eq(menuItemIngredients.ingredientId, ingredients.id))
      .where(eq(menuItems.id, id));

    if (results.length === 0) return undefined;

    const menuItem = results[0].menu_items;
    const menuWithIngredients = { ...menuItem, ingredients: [] as (MenuItemIngredient & { ingredient: Ingredient })[] };

    for (const result of results) {
      if (result.menu_item_ingredients && result.ingredients) {
        menuWithIngredients.ingredients.push({
          ...result.menu_item_ingredients,
          ingredient: result.ingredients
        });
      }
    }

    return menuWithIngredients;
  }

  async createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem> {
    const [newMenuItem] = await db.insert(menuItems).values(menuItem).returning();
    return newMenuItem;
  }

  async addMenuItemIngredient(menuItemIngredient: InsertMenuItemIngredient): Promise<MenuItemIngredient> {
    const [newLink] = await db.insert(menuItemIngredients).values(menuItemIngredient).returning();
    return newLink;
  }

  // KOT operations
  async getKots(filters?: { status?: string; type?: string; limit?: number }): Promise<(Kot & { creator: User; items: (KotItem & { menuItem: MenuItem })[] })[]> {
    let query = db
      .select()
      .from(kots)
      .leftJoin(users, eq(kots.createdById, users.id))
      .leftJoin(kotItems, eq(kots.id, kotItems.kotId))
      .leftJoin(menuItems, eq(kotItems.menuItemId, menuItems.id));

    const conditions = [];
    if (filters?.status) conditions.push(eq(kots.status, filters.status as any));
    if (filters?.type) conditions.push(eq(kots.type, filters.type as any));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(kots.createdAt));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const results = await query;
    
    const kotMap = new Map<string, Kot & { creator: User; items: (KotItem & { menuItem: MenuItem })[] }>();
    
    for (const result of results) {
      const kot = result.kots;
      if (!kotMap.has(kot.id)) {
        kotMap.set(kot.id, { 
          ...kot, 
          creator: result.users!, 
          items: [] 
        });
      }
      
      if (result.kot_items && result.menu_items) {
        kotMap.get(kot.id)!.items.push({
          ...result.kot_items,
          menuItem: result.menu_items
        });
      }
    }
    
    return Array.from(kotMap.values());
  }

  async getKot(id: string): Promise<(Kot & { creator: User; items: (KotItem & { menuItem: MenuItem })[] }) | undefined> {
    const results = await db
      .select()
      .from(kots)
      .leftJoin(users, eq(kots.createdById, users.id))
      .leftJoin(kotItems, eq(kots.id, kotItems.kotId))
      .leftJoin(menuItems, eq(kotItems.menuItemId, menuItems.id))
      .where(eq(kots.id, id));

    if (results.length === 0) return undefined;

    const kot = results[0].kots;
    const kotWithDetails = { 
      ...kot, 
      creator: results[0].users!, 
      items: [] as (KotItem & { menuItem: MenuItem })[] 
    };

    for (const result of results) {
      if (result.kot_items && result.menu_items) {
        kotWithDetails.items.push({
          ...result.kot_items,
          menuItem: result.menu_items
        });
      }
    }

    return kotWithDetails;
  }

  async createKot(kot: InsertKot, items: InsertKotItem[]): Promise<Kot> {
    const kotNumber = await this.generateKotNumber(kot.type);
    
    const [newKot] = await db.insert(kots).values({
      ...kot,
      kotNumber
    }).returning();

    for (const item of items) {
      await db.insert(kotItems).values({
        ...item,
        kotId: newKot.id
      });
    }

    return newKot;
  }

  async updateKotStatus(id: string, status: string, processedById?: string): Promise<Kot> {
    const [kot] = await db
      .update(kots)
      .set({ 
        status: status as any,
        processedById,
        updatedAt: new Date() 
      })
      .where(eq(kots.id, id))
      .returning();
    return kot;
  }

  async generateKotNumber(type: "restaurant" | "bar"): Promise<string> {
    const prefix = type === "restaurant" ? "REST" : "BAR";
    const lastKot = await db
      .select({ kotNumber: kots.kotNumber })
      .from(kots)
      .where(eq(kots.type, type))
      .orderBy(desc(kots.createdAt))
      .limit(1);

    let nextNumber = 1;
    if (lastKot.length > 0 && lastKot[0].kotNumber) {
      const lastNumber = parseInt(lastKot[0].kotNumber.split('-')[1]) || 0;
      nextNumber = lastNumber + 1;
    }

    return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
  }

  // Stock operations
  async getStockAdditions(status?: string): Promise<(StockAddition & { ingredient: Ingredient; addedBy: User; approvedBy?: User })[]> {
    let query = db
      .select()
      .from(stockAdditions)
      .leftJoin(ingredients, eq(stockAdditions.ingredientId, ingredients.id))
      .leftJoin(users, eq(stockAdditions.addedById, users.id));

    if (status) {
      query = query.where(eq(stockAdditions.status, status as any));
    }

    const results = await query.orderBy(desc(stockAdditions.createdAt));
    
    return results.map(result => ({
      ...result.stock_additions,
      ingredient: result.ingredients!,
      addedBy: result.users!,
    }));
  }

  async createStockAddition(stockAddition: InsertStockAddition): Promise<StockAddition> {
    const [newAddition] = await db.insert(stockAdditions).values(stockAddition).returning();
    return newAddition;
  }

  async approveStockAddition(id: string, approvedById: string): Promise<StockAddition> {
    const [addition] = await db
      .update(stockAdditions)
      .set({ 
        status: "approved",
        approvedById,
        updatedAt: new Date() 
      })
      .where(eq(stockAdditions.id, id))
      .returning();

    // Update ingredient stock
    const currentStock = await db
      .select({ currentStock: ingredients.currentStock })
      .from(ingredients)
      .where(eq(ingredients.id, addition.ingredientId));

    if (currentStock.length > 0) {
      const newStock = (parseFloat(currentStock[0].currentStock) + parseFloat(addition.quantity)).toString();
      await this.updateIngredientStock(addition.ingredientId, newStock);
    }

    return addition;
  }

  async rejectStockAddition(id: string, approvedById: string, reason: string): Promise<StockAddition> {
    const [addition] = await db
      .update(stockAdditions)
      .set({ 
        status: "rejected",
        approvedById,
        reason,
        updatedAt: new Date() 
      })
      .where(eq(stockAdditions.id, id))
      .returning();
    return addition;
  }

  // Reversal operations
  async getOrderReversals(status?: string): Promise<(OrderReversal & { kot: Kot; requestedBy: User; approvedBy?: User })[]> {
    let query = db
      .select()
      .from(orderReversals)
      .leftJoin(kots, eq(orderReversals.kotId, kots.id))
      .leftJoin(users, eq(orderReversals.requestedById, users.id));

    if (status) {
      query = query.where(eq(orderReversals.status, status as any));
    }

    const results = await query.orderBy(desc(orderReversals.createdAt));
    
    return results.map(result => ({
      ...result.order_reversals,
      kot: result.kots!,
      requestedBy: result.users!,
    }));
  }

  async createOrderReversal(reversal: InsertOrderReversal): Promise<OrderReversal> {
    const [newReversal] = await db.insert(orderReversals).values(reversal).returning();
    return newReversal;
  }

  async approveOrderReversal(id: string, approvedById: string): Promise<OrderReversal> {
    const [reversal] = await db
      .update(orderReversals)
      .set({ 
        status: "approved",
        approvedById,
        updatedAt: new Date() 
      })
      .where(eq(orderReversals.id, id))
      .returning();

    // Update KOT status to reversed
    await this.updateKotStatus(reversal.kotId, "reversed");

    return reversal;
  }

  async rejectOrderReversal(id: string, approvedById: string): Promise<OrderReversal> {
    const [reversal] = await db
      .update(orderReversals)
      .set({ 
        status: "rejected",
        approvedById,
        updatedAt: new Date() 
      })
      .where(eq(orderReversals.id, id))
      .returning();
    return reversal;
  }

  // Bill operations
  async getBills(filters?: { kotId?: string; isPaid?: boolean }): Promise<(Bill & { kot: Kot; generatedBy: User })[]> {
    let query = db
      .select()
      .from(bills)
      .leftJoin(kots, eq(bills.kotId, kots.id))
      .leftJoin(users, eq(bills.generatedById, users.id));

    const conditions = [];
    if (filters?.kotId) conditions.push(eq(bills.kotId, filters.kotId));
    if (filters?.isPaid !== undefined) conditions.push(eq(bills.isPaid, filters.isPaid));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(bills.createdAt));
    
    return results.map(result => ({
      ...result.bills,
      kot: result.kots!,
      generatedBy: result.users!,
    }));
  }

  async createBill(bill: InsertBill): Promise<Bill> {
    const billNumber = await this.generateBillNumber();
    
    const [newBill] = await db.insert(bills).values({
      ...bill,
      billNumber
    }).returning();
    return newBill;
  }

  async generateBillNumber(): Promise<string> {
    const lastBill = await db
      .select({ billNumber: bills.billNumber })
      .from(bills)
      .orderBy(desc(bills.createdAt))
      .limit(1);

    let nextNumber = 1;
    if (lastBill.length > 0 && lastBill[0].billNumber) {
      const lastNumber = parseInt(lastBill[0].billNumber.split('-')[1]) || 0;
      nextNumber = lastNumber + 1;
    }

    return `BILL-${nextNumber.toString().padStart(4, '0')}`;
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<{
    totalUsers: number;
    todayOrders: number;
    stockItems: number;
    todayRevenue: string;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
    
    const [todayOrders] = await db
      .select({ count: sql<number>`count(*)` })
      .from(kots)
      .where(and(
        gte(kots.createdAt, today),
        lte(kots.createdAt, tomorrow)
      ));

    const [stockItems] = await db.select({ count: sql<number>`count(*)` }).from(ingredients);

    const [todayRevenue] = await db
      .select({ total: sql<string>`COALESCE(SUM(${bills.finalAmount}), 0)` })
      .from(bills)
      .where(and(
        gte(bills.createdAt, today),
        lte(bills.createdAt, tomorrow)
      ));

    return {
      totalUsers: totalUsers?.count || 0,
      todayOrders: todayOrders?.count || 0,
      stockItems: stockItems?.count || 0,
      todayRevenue: todayRevenue?.total || "0",
    };
  }
}

export const storage = new DatabaseStorage();
