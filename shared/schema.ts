import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "restaurant_cashier", 
  "store_keeper",
  "authorising_officer",
  "barman"
]);

export const kotTypeEnum = pgEnum("kot_type", ["restaurant", "bar"]);
export const kotStatusEnum = pgEnum("kot_status", ["pending", "processing", "completed", "reversed"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "approved", "rejected"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default("restaurant_cashier"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ingredients table
export const ingredients = pgTable("ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  unit: varchar("unit").notNull(), // kg, g, l, ml, pieces, etc.
  currentStock: decimal("current_stock", { precision: 10, scale: 3 }).notNull().default("0"),
  minimumThreshold: decimal("minimum_threshold", { precision: 10, scale: 3 }).notNull().default("0"),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Menu items table
export const menuItems = pgTable("menu_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category").notNull(), // restaurant, bar
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Menu item ingredients mapping
export const menuItemIngredients = pgTable("menu_item_ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  menuItemId: varchar("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
  ingredientId: varchar("ingredient_id").notNull().references(() => ingredients.id, { onDelete: "cascade" }),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// KOTs (Kitchen Order Tickets)
export const kots = pgTable("kots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  kotNumber: varchar("kot_number").notNull().unique(),
  customerName: varchar("customer_name").notNull(),
  type: kotTypeEnum("type").notNull(),
  status: kotStatusEnum("status").notNull().default("pending"),
  orderTime: timestamp("order_time").notNull(),
  expectedTime: timestamp("expected_time").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  processedById: varchar("processed_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// KOT items
export const kotItems = pgTable("kot_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  kotId: varchar("kot_id").notNull().references(() => kots.id, { onDelete: "cascade" }),
  menuItemId: varchar("menu_item_id").notNull().references(() => menuItems.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stock additions
export const stockAdditions = pgTable("stock_additions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ingredientId: varchar("ingredient_id").notNull().references(() => ingredients.id),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
  addedById: varchar("added_by_id").notNull().references(() => users.id),
  approvedById: varchar("approved_by_id").references(() => users.id),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order reversals
export const orderReversals = pgTable("order_reversals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  kotId: varchar("kot_id").notNull().references(() => kots.id),
  reason: text("reason").notNull(),
  requestedById: varchar("requested_by_id").notNull().references(() => users.id),
  approvedById: varchar("approved_by_id").references(() => users.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Billing
export const bills = pgTable("bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billNumber: varchar("bill_number").notNull().unique(),
  kotId: varchar("kot_id").notNull().references(() => kots.id),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method"),
  isPaid: boolean("is_paid").notNull().default(false),
  generatedById: varchar("generated_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdKots: many(kots, { relationName: "kotCreator" }),
  processedKots: many(kots, { relationName: "kotProcessor" }),
  stockAdditions: many(stockAdditions, { relationName: "stockAdder" }),
  approvedStockAdditions: many(stockAdditions, { relationName: "stockApprover" }),
  reversalRequests: many(orderReversals, { relationName: "reversalRequester" }),
  approvedReversals: many(orderReversals, { relationName: "reversalApprover" }),
  generatedBills: many(bills),
}));

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  menuItemIngredients: many(menuItemIngredients),
  stockAdditions: many(stockAdditions),
}));

export const menuItemsRelations = relations(menuItems, ({ many }) => ({
  ingredients: many(menuItemIngredients),
  kotItems: many(kotItems),
}));

export const menuItemIngredientsRelations = relations(menuItemIngredients, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [menuItemIngredients.menuItemId],
    references: [menuItems.id],
  }),
  ingredient: one(ingredients, {
    fields: [menuItemIngredients.ingredientId],
    references: [ingredients.id],
  }),
}));

export const kotsRelations = relations(kots, ({ one, many }) => ({
  creator: one(users, {
    fields: [kots.createdById],
    references: [users.id],
    relationName: "kotCreator",
  }),
  processor: one(users, {
    fields: [kots.processedById],
    references: [users.id],
    relationName: "kotProcessor",
  }),
  items: many(kotItems),
  reversals: many(orderReversals),
  bills: many(bills),
}));

export const kotItemsRelations = relations(kotItems, ({ one }) => ({
  kot: one(kots, {
    fields: [kotItems.kotId],
    references: [kots.id],
  }),
  menuItem: one(menuItems, {
    fields: [kotItems.menuItemId],
    references: [menuItems.id],
  }),
}));

export const stockAdditionsRelations = relations(stockAdditions, ({ one }) => ({
  ingredient: one(ingredients, {
    fields: [stockAdditions.ingredientId],
    references: [ingredients.id],
  }),
  addedBy: one(users, {
    fields: [stockAdditions.addedById],
    references: [users.id],
    relationName: "stockAdder",
  }),
  approvedBy: one(users, {
    fields: [stockAdditions.approvedById],
    references: [users.id],
    relationName: "stockApprover",
  }),
}));

export const orderReversalsRelations = relations(orderReversals, ({ one }) => ({
  kot: one(kots, {
    fields: [orderReversals.kotId],
    references: [kots.id],
  }),
  requestedBy: one(users, {
    fields: [orderReversals.requestedById],
    references: [users.id],
    relationName: "reversalRequester",
  }),
  approvedBy: one(users, {
    fields: [orderReversals.approvedById],
    references: [users.id],
    relationName: "reversalApprover",
  }),
}));

export const billsRelations = relations(bills, ({ one }) => ({
  kot: one(kots, {
    fields: [bills.kotId],
    references: [kots.id],
  }),
  generatedBy: one(users, {
    fields: [bills.generatedById],
    references: [users.id],
  }),
}));

// Insert schemas
export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
});

export const insertIngredientSchema = createInsertSchema(ingredients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMenuItemIngredientSchema = createInsertSchema(menuItemIngredients).omit({
  id: true,
  createdAt: true,
});

export const insertKotSchema = createInsertSchema(kots).omit({
  id: true,
  kotNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKotItemSchema = createInsertSchema(kotItems).omit({
  id: true,
  createdAt: true,
});

export const insertStockAdditionSchema = createInsertSchema(stockAdditions).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderReversalSchema = createInsertSchema(orderReversals).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBillSchema = createInsertSchema(bills).omit({
  id: true,
  billNumber: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type Ingredient = typeof ingredients.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItemIngredient = z.infer<typeof insertMenuItemIngredientSchema>;
export type MenuItemIngredient = typeof menuItemIngredients.$inferSelect;
export type InsertKot = z.infer<typeof insertKotSchema>;
export type Kot = typeof kots.$inferSelect;
export type InsertKotItem = z.infer<typeof insertKotItemSchema>;
export type KotItem = typeof kotItems.$inferSelect;
export type InsertStockAddition = z.infer<typeof insertStockAdditionSchema>;
export type StockAddition = typeof stockAdditions.$inferSelect;
export type InsertOrderReversal = z.infer<typeof insertOrderReversalSchema>;
export type OrderReversal = typeof orderReversals.$inferSelect;
export type InsertBill = z.infer<typeof insertBillSchema>;
export type Bill = typeof bills.$inferSelect;
