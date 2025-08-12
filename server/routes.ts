import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertIngredientSchema,
  insertMenuItemSchema,
  insertMenuItemIngredientSchema,
  insertKotSchema,
  insertKotItemSchema,
  insertStockAdditionSchema,
  insertOrderReversalSchema,
  insertBillSchema 
} from "@shared/schema";

// Role-based permission middleware
const hasRole = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    const demoUser = (req as any).session?.demoUser;
    const userId = demoUser ? demoUser.claims.sub : req.user?.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // For development, we'll check user role from database
    // In production, this would be in the JWT token
    storage.getUser(userId).then(user => {
      if (!user || !allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      req.userRole = user.role;
      next();
    }).catch(() => {
      res.status(500).json({ message: "Error checking permissions" });
    });
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize test accounts on startup
  await storage.createTestAccounts();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const demoUser = (req as any).session?.demoUser;
      let userId;
      
      if (demoUser) {
        userId = demoUser.claims.sub;
      } else {
        userId = req.user.claims.sub;
      }
      
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Test accounts endpoint
  app.get('/api/test-accounts', isAuthenticated, async (req, res) => {
    try {
      const testAccounts = [
        { id: "admin-test", email: "admin@restaurant.com", firstName: "John", lastName: "Admin", role: "admin" },
        { id: "cashier-test", email: "cashier@restaurant.com", firstName: "Jane", lastName: "Cashier", role: "restaurant_cashier" },
        { id: "storekeeper-test", email: "storekeeper@restaurant.com", firstName: "Bob", lastName: "Store", role: "store_keeper" },
        { id: "officer-test", email: "officer@restaurant.com", firstName: "Alice", lastName: "Officer", role: "authorising_officer" },
        { id: "barman-test", email: "barman@restaurant.com", firstName: "Mike", lastName: "Bar", role: "barman" },
      ];
      res.json(testAccounts);
    } catch (error) {
      console.error("Error fetching test accounts:", error);
      res.status(500).json({ message: "Failed to fetch test accounts" });
    }
  });

  // Switch test account endpoint
  app.post('/api/auth/switch-test-account', isAuthenticated, async (req: any, res) => {
    try {
      const { testAccountId } = req.body;
      const testUser = await storage.getUser(testAccountId);
      
      if (!testUser) {
        return res.status(404).json({ message: "Test account not found" });
      }

      // Update the session with the test user
      req.user.claims.sub = testAccountId;
      req.user.claims.email = testUser.email;
      req.user.claims.first_name = testUser.firstName;
      req.user.claims.last_name = testUser.lastName;
      
      res.json({ message: "Switched to test account", user: testUser });
    } catch (error) {
      console.error("Error switching test account:", error);
      res.status(500).json({ message: "Failed to switch test account" });
    }
  });

  // Demo login endpoint for testing (bypasses OAuth for demonstration)
  app.post('/api/auth/demo-login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Demo credentials for testing
      const demoCredentials = {
        'admin': { password: 'admin123', userId: 'admin-test' },
        'cashier': { password: 'cashier123', userId: 'cashier-test' },
        'storekeeper': { password: 'store123', userId: 'storekeeper-test' },
        'officer': { password: 'officer123', userId: 'officer-test' },
        'barman': { password: 'bar123', userId: 'barman-test' },
      };

      const credential = demoCredentials[username as keyof typeof demoCredentials];
      if (!credential || credential.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const testUser = await storage.getUser(credential.userId);
      if (!testUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create a demo session (for testing only)
      const demoSession = {
        claims: {
          sub: testUser.id,
          email: testUser.email,
          first_name: testUser.firstName,
          last_name: testUser.lastName,
        },
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };

      // Store in session
      (req as any).session.demoUser = demoSession;
      
      res.json({ message: "Demo login successful", user: testUser });
    } catch (error) {
      console.error("Error in demo login:", error);
      res.status(500).json({ message: "Demo login failed" });
    }
  });

  // Demo logout endpoint
  app.post('/api/auth/demo-logout', async (req, res) => {
    try {
      (req as any).session.demoUser = null;
      res.json({ message: "Demo logout successful" });
    } catch (error) {
      console.error("Error in demo logout:", error);
      res.status(500).json({ message: "Demo logout failed" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Ingredients routes
  app.get('/api/ingredients', isAuthenticated, async (req, res) => {
    try {
      const ingredients = await storage.getIngredients();
      res.json(ingredients);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
      res.status(500).json({ message: "Failed to fetch ingredients" });
    }
  });

  app.post('/api/ingredients', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const ingredientData = insertIngredientSchema.parse(req.body);
      const ingredient = await storage.createIngredient(ingredientData);
      res.json(ingredient);
    } catch (error) {
      console.error("Error creating ingredient:", error);
      res.status(400).json({ message: "Failed to create ingredient" });
    }
  });

  app.get('/api/ingredients/low-stock', isAuthenticated, hasRole(['admin', 'authorising_officer', 'store_keeper']), async (req, res) => {
    try {
      const ingredients = await storage.getLowStockIngredients();
      res.json(ingredients);
    } catch (error) {
      console.error("Error fetching low stock ingredients:", error);
      res.status(500).json({ message: "Failed to fetch low stock ingredients" });
    }
  });

  // Menu routes
  app.get('/api/menu-items', isAuthenticated, async (req, res) => {
    try {
      const category = req.query.category as string;
      const menuItems = await storage.getMenuItems(category);
      res.json(menuItems);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  app.post('/api/menu-items', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const menuItemData = insertMenuItemSchema.parse(req.body);
      const menuItem = await storage.createMenuItem(menuItemData);
      res.json(menuItem);
    } catch (error) {
      console.error("Error creating menu item:", error);
      res.status(400).json({ message: "Failed to create menu item" });
    }
  });

  app.post('/api/menu-items/:id/ingredients', isAuthenticated, hasRole(['admin']), async (req, res) => {
    try {
      const ingredientData = insertMenuItemIngredientSchema.parse({
        ...req.body,
        menuItemId: req.params.id
      });
      const ingredient = await storage.addMenuItemIngredient(ingredientData);
      res.json(ingredient);
    } catch (error) {
      console.error("Error adding menu item ingredient:", error);
      res.status(400).json({ message: "Failed to add menu item ingredient" });
    }
  });

  // KOT routes
  app.get('/api/kots', isAuthenticated, async (req, res) => {
    try {
      const { status, type, limit } = req.query;
      const filters: any = {};
      if (status) filters.status = status;
      if (type) filters.type = type;
      if (limit) filters.limit = parseInt(limit as string);
      
      const kots = await storage.getKots(filters);
      res.json(kots);
    } catch (error) {
      console.error("Error fetching KOTs:", error);
      res.status(500).json({ message: "Failed to fetch KOTs" });
    }
  });

  app.post('/api/kots', isAuthenticated, hasRole(['restaurant_cashier', 'barman']), async (req: any, res) => {
    try {
      const { kot, items } = req.body;
      const kotData = insertKotSchema.parse({
        ...kot,
        createdById: req.user.claims.sub
      });
      
      const kotItems = items.map((item: any) => insertKotItemSchema.parse(item));
      const newKot = await storage.createKot(kotData, kotItems);
      res.json(newKot);
    } catch (error) {
      console.error("Error creating KOT:", error);
      res.status(400).json({ message: "Failed to create KOT" });
    }
  });

  app.patch('/api/kots/:id/status', isAuthenticated, hasRole(['store_keeper', 'authorising_officer']), async (req: any, res) => {
    try {
      const { status } = req.body;
      const kot = await storage.updateKotStatus(req.params.id, status, req.user.claims.sub);
      res.json(kot);
    } catch (error) {
      console.error("Error updating KOT status:", error);
      res.status(400).json({ message: "Failed to update KOT status" });
    }
  });

  // Stock addition routes
  app.get('/api/stock-additions', isAuthenticated, hasRole(['store_keeper', 'authorising_officer']), async (req, res) => {
    try {
      const status = req.query.status as string;
      const stockAdditions = await storage.getStockAdditions(status);
      res.json(stockAdditions);
    } catch (error) {
      console.error("Error fetching stock additions:", error);
      res.status(500).json({ message: "Failed to fetch stock additions" });
    }
  });

  app.post('/api/stock-additions', isAuthenticated, hasRole(['store_keeper']), async (req: any, res) => {
    try {
      const stockAdditionData = insertStockAdditionSchema.parse({
        ...req.body,
        addedById: req.user.claims.sub
      });
      const stockAddition = await storage.createStockAddition(stockAdditionData);
      res.json(stockAddition);
    } catch (error) {
      console.error("Error creating stock addition:", error);
      res.status(400).json({ message: "Failed to create stock addition" });
    }
  });

  app.patch('/api/stock-additions/:id/approve', isAuthenticated, hasRole(['authorising_officer']), async (req: any, res) => {
    try {
      const stockAddition = await storage.approveStockAddition(req.params.id, req.user.claims.sub);
      res.json(stockAddition);
    } catch (error) {
      console.error("Error approving stock addition:", error);
      res.status(400).json({ message: "Failed to approve stock addition" });
    }
  });

  app.patch('/api/stock-additions/:id/reject', isAuthenticated, hasRole(['authorising_officer']), async (req: any, res) => {
    try {
      const { reason } = req.body;
      const stockAddition = await storage.rejectStockAddition(req.params.id, req.user.claims.sub, reason);
      res.json(stockAddition);
    } catch (error) {
      console.error("Error rejecting stock addition:", error);
      res.status(400).json({ message: "Failed to reject stock addition" });
    }
  });

  // Order reversal routes
  app.get('/api/order-reversals', isAuthenticated, hasRole(['authorising_officer']), async (req, res) => {
    try {
      const status = req.query.status as string;
      const reversals = await storage.getOrderReversals(status);
      res.json(reversals);
    } catch (error) {
      console.error("Error fetching order reversals:", error);
      res.status(500).json({ message: "Failed to fetch order reversals" });
    }
  });

  app.post('/api/order-reversals', isAuthenticated, hasRole(['restaurant_cashier', 'barman', 'store_keeper']), async (req: any, res) => {
    try {
      const reversalData = insertOrderReversalSchema.parse({
        ...req.body,
        requestedById: req.user.claims.sub
      });
      const reversal = await storage.createOrderReversal(reversalData);
      res.json(reversal);
    } catch (error) {
      console.error("Error creating order reversal:", error);
      res.status(400).json({ message: "Failed to create order reversal" });
    }
  });

  app.patch('/api/order-reversals/:id/approve', isAuthenticated, hasRole(['authorising_officer']), async (req: any, res) => {
    try {
      const reversal = await storage.approveOrderReversal(req.params.id, req.user.claims.sub);
      res.json(reversal);
    } catch (error) {
      console.error("Error approving order reversal:", error);
      res.status(400).json({ message: "Failed to approve order reversal" });
    }
  });

  app.patch('/api/order-reversals/:id/reject', isAuthenticated, hasRole(['authorising_officer']), async (req: any, res) => {
    try {
      const reversal = await storage.rejectOrderReversal(req.params.id, req.user.claims.sub);
      res.json(reversal);
    } catch (error) {
      console.error("Error rejecting order reversal:", error);
      res.status(400).json({ message: "Failed to reject order reversal" });
    }
  });

  // Bill routes
  app.get('/api/bills', isAuthenticated, async (req, res) => {
    try {
      const { kotId, isPaid } = req.query;
      const filters: any = {};
      if (kotId) filters.kotId = kotId as string;
      if (isPaid !== undefined) filters.isPaid = isPaid === 'true';
      
      const bills = await storage.getBills(filters);
      res.json(bills);
    } catch (error) {
      console.error("Error fetching bills:", error);
      res.status(500).json({ message: "Failed to fetch bills" });
    }
  });

  app.post('/api/bills', isAuthenticated, hasRole(['restaurant_cashier', 'barman']), async (req: any, res) => {
    try {
      const billData = insertBillSchema.parse({
        ...req.body,
        generatedById: req.user.claims.sub
      });
      const bill = await storage.createBill(billData);
      res.json(bill);
    } catch (error) {
      console.error("Error creating bill:", error);
      res.status(400).json({ message: "Failed to create bill" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
