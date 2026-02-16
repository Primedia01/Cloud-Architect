import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import {
  insertUserSchema,
  insertSupplierSchema,
  insertCampaignSchema,
  insertBookingSchema,
  insertDocumentSchema,
  insertInvoiceSchema,
  insertInventorySchema,
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const userId = req.headers["user-id"] as string;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users", async (_req: Request, res: Response) => {
    try {
      const allUsers = await storage.getUsers();
      return res.json(allUsers);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const user = await storage.createUser(data);
      return res.status(201).json(user);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await storage.updateUser(req.params.id as string, req.body);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/suppliers", async (_req: Request, res: Response) => {
    try {
      const allSuppliers = await storage.getSuppliers();
      return res.json(allSuppliers);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/suppliers", async (req: Request, res: Response) => {
    try {
      const data = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(data);
      return res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/suppliers/:id", async (req: Request, res: Response) => {
    try {
      const supplier = await storage.updateSupplier(req.params.id as string, req.body);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      return res.json(supplier);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/campaigns", async (_req: Request, res: Response) => {
    try {
      const allCampaigns = await storage.getCampaigns();
      return res.json(allCampaigns);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/campaigns/:id", async (req: Request, res: Response) => {
    try {
      const campaign = await storage.getCampaign(req.params.id as string);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      return res.json(campaign);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/campaigns", async (req: Request, res: Response) => {
    try {
      const data = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(data);
      return res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/campaigns/:id", async (req: Request, res: Response) => {
    try {
      const campaign = await storage.updateCampaign(req.params.id as string, req.body);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      return res.json(campaign);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/campaigns/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteCampaign(req.params.id as string);
      if (!deleted) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/bookings", async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.query;
      if (campaignId) {
        const filtered = await storage.getBookingsByCampaign(campaignId as string);
        return res.json(filtered);
      }
      const allBookings = await storage.getBookings();
      return res.json(allBookings);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/bookings/:id", async (req: Request, res: Response) => {
    try {
      const booking = await storage.getBooking(req.params.id as string);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      return res.json(booking);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/bookings", async (req: Request, res: Response) => {
    try {
      const data = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(data);
      return res.status(201).json(booking);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/bookings/:id", async (req: Request, res: Response) => {
    try {
      const booking = await storage.updateBooking(req.params.id as string, req.body);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      return res.json(booking);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/documents", async (req: Request, res: Response) => {
    try {
      const { campaignId, bookingId } = req.query;
      if (campaignId) {
        const filtered = await storage.getDocumentsByCampaign(campaignId as string);
        return res.json(filtered);
      }
      if (bookingId) {
        const filtered = await storage.getDocumentsByBooking(bookingId as string);
        return res.json(filtered);
      }
      const allDocuments = await storage.getDocuments();
      return res.json(allDocuments);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/documents", async (req: Request, res: Response) => {
    try {
      const data = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(data);
      return res.status(201).json(document);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/invoices", async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.query;
      if (campaignId) {
        const filtered = await storage.getInvoicesByCampaign(campaignId as string);
        return res.json(filtered);
      }
      const allInvoices = await storage.getInvoices();
      return res.json(allInvoices);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/invoices", async (req: Request, res: Response) => {
    try {
      const data = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(data);
      return res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/invoices/:id", async (req: Request, res: Response) => {
    try {
      const invoice = await storage.updateInvoice(req.params.id as string, req.body);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      return res.json(invoice);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/inventory", async (req: Request, res: Response) => {
    try {
      const { supplierId, region, status, screenType } = req.query;
      let items = await storage.getInventory();
      if (supplierId) {
        items = items.filter(i => i.supplierId === supplierId);
      }
      if (region) {
        items = items.filter(i => i.region === region);
      }
      if (status) {
        items = items.filter(i => i.status === status);
      }
      if (screenType) {
        items = items.filter(i => i.screenType === screenType);
      }
      return res.json(items);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/inventory/:id", async (req: Request, res: Response) => {
    try {
      const item = await storage.getInventoryItem(req.params.id as string);
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      return res.json(item);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/inventory", async (req: Request, res: Response) => {
    try {
      const data = insertInventorySchema.parse(req.body);
      const item = await storage.createInventoryItem(data);
      return res.status(201).json(item);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/inventory/:id", async (req: Request, res: Response) => {
    try {
      const item = await storage.updateInventoryItem(req.params.id as string, req.body);
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      return res.json(item);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/inventory/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteInventoryItem(req.params.id as string);
      if (!deleted) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/seed", async (_req: Request, res: Response) => {
    try {
      const existing = await storage.getUserByUsername("admin");
      const existingInventory = await storage.getInventory();
      if (existing && existingInventory.length > 0) {
        return res.json({ message: "Seed data already exists" });
      }

      let admin = existing;
      if (!existing) {
        admin = await storage.createUser({
          username: "admin",
          password: "admin123",
          fullName: "System Administrator",
          email: "admin@gov.za",
          role: "department_admin",
          active: true,
        });

        await storage.createUser({
          username: "planner",
          password: "planner123",
          fullName: "Jane Mokoena",
          email: "jane.mokoena@gov.za",
          role: "campaign_planner",
          active: true,
        });

        await storage.createUser({
          username: "finance",
          password: "finance123",
          fullName: "Thabo Nkosi",
          email: "thabo.nkosi@gov.za",
          role: "finance_officer",
          active: true,
        });

        await storage.createUser({
          username: "supplier",
          password: "supplier123",
          fullName: "Supplier Manager",
          email: "manager@supplier.co.za",
          role: "supplier_admin",
          active: true,
        });

        await storage.createUser({
          username: "auditor",
          password: "auditor123",
          fullName: "Audit Officer",
          email: "audit@gov.za",
          role: "auditor",
          active: true,
        });
      }

      let supplier1, supplier2;
      if (!existing) {
        supplier1 = await storage.createSupplier({
          name: "JCDecaux South Africa",
          contactPerson: "Sarah van der Merwe",
          email: "sarah@jcdecaux.co.za",
          phone: "+27 11 555 0001",
          address: "Johannesburg, Gauteng",
          active: true,
        });

        supplier2 = await storage.createSupplier({
          name: "Primedia Outdoor",
          contactPerson: "David Pillay",
          email: "david@primedia.co.za",
          phone: "+27 21 555 0002",
          address: "Cape Town, Western Cape",
          active: true,
        });

        const campaign1 = await storage.createCampaign({
          name: "Public Health Awareness Q1",
          description: "National health awareness campaign targeting urban areas",
          status: "in_progress",
          budget: "450000.00",
          startDate: new Date("2026-01-15"),
          endDate: new Date("2026-03-31"),
          region: "Gauteng",
          targetReach: 500000,
          createdBy: admin!.id,
        });

        const campaign2 = await storage.createCampaign({
          name: "Road Safety Campaign",
          description: "Easter road safety awareness billboards",
          status: "draft",
          budget: "280000.00",
          startDate: new Date("2026-04-01"),
          endDate: new Date("2026-04-30"),
          region: "Western Cape",
          targetReach: 300000,
          createdBy: admin!.id,
        });

        await storage.createBooking({
          campaignId: campaign1.id,
          supplierId: supplier1.id,
          siteDescription: "N1 Highway Billboard - Midrand",
          location: "Midrand, Gauteng",
          mediaType: "Billboard",
          cost: "85000.00",
          status: "approved",
          startDate: new Date("2026-01-15"),
          endDate: new Date("2026-03-31"),
        });

        await storage.createBooking({
          campaignId: campaign1.id,
          supplierId: supplier2.id,
          siteDescription: "Sandton City Digital Screen",
          location: "Sandton, Gauteng",
          mediaType: "Digital",
          cost: "120000.00",
          status: "in_progress",
          startDate: new Date("2026-02-01"),
          endDate: new Date("2026-03-31"),
        });

        await storage.createBooking({
          campaignId: campaign2.id,
          supplierId: supplier2.id,
          siteDescription: "N2 Cape Town Airport Approach",
          location: "Cape Town, Western Cape",
          mediaType: "Billboard",
          cost: "95000.00",
          status: "pending",
          startDate: new Date("2026-04-01"),
          endDate: new Date("2026-04-30"),
        });

        await storage.createInvoice({
          campaignId: campaign1.id,
          supplierId: supplier1.id,
          invoiceNumber: "INV-2026-001",
          amount: "85000.00",
          status: "paid",
          issuedAt: new Date("2026-01-20"),
          dueDate: new Date("2026-02-20"),
        });

        await storage.createInvoice({
          campaignId: campaign1.id,
          supplierId: supplier2.id,
          invoiceNumber: "INV-2026-002",
          amount: "120000.00",
          status: "sent",
          issuedAt: new Date("2026-02-05"),
          dueDate: new Date("2026-03-05"),
        });
      } else {
        const allSuppliers = await storage.getSuppliers();
        supplier1 = allSuppliers[0];
        supplier2 = allSuppliers[1] || allSuppliers[0];
      }

      await storage.createInventoryItem({
        supplierId: supplier1.id,
        screenName: "N1 Midrand Billboard A",
        screenType: "Billboard",
        location: "N1 Highway, Midrand",
        region: "Gauteng",
        gpsLatitude: "-25.9892",
        gpsLongitude: "28.1267",
        dimensions: "6m x 3m",
        facing: "North-facing",
        dailyRate: "3500.00",
        weeklyRate: "20000.00",
        monthlyRate: "75000.00",
        status: "available",
        illuminated: true,
        digital: false,
        trafficCount: 45000,
        active: true,
      });

      await storage.createInventoryItem({
        supplierId: supplier1.id,
        screenName: "Sandton Digital Tower",
        screenType: "Digital Screen",
        location: "Sandton City, Rivonia Rd",
        region: "Gauteng",
        gpsLatitude: "-26.1076",
        gpsLongitude: "28.0567",
        dimensions: "4m x 6m",
        resolution: "1920x1080",
        facing: "East-facing",
        dailyRate: "5500.00",
        weeklyRate: "32000.00",
        monthlyRate: "120000.00",
        status: "booked",
        illuminated: true,
        digital: true,
        trafficCount: 80000,
        active: true,
      });

      await storage.createInventoryItem({
        supplierId: supplier1.id,
        screenName: "OR Tambo Airport Approach",
        screenType: "Mega Billboard",
        location: "R21 Highway, OR Tambo",
        region: "Gauteng",
        gpsLatitude: "-26.1367",
        gpsLongitude: "28.2311",
        dimensions: "12m x 4m",
        facing: "South-facing",
        dailyRate: "8000.00",
        weeklyRate: "48000.00",
        monthlyRate: "180000.00",
        status: "available",
        illuminated: true,
        digital: false,
        trafficCount: 120000,
        active: true,
      });

      await storage.createInventoryItem({
        supplierId: supplier2.id,
        screenName: "V&A Waterfront Digital",
        screenType: "Digital Screen",
        location: "V&A Waterfront, Cape Town",
        region: "Western Cape",
        gpsLatitude: "-33.9036",
        gpsLongitude: "18.4208",
        dimensions: "3m x 5m",
        resolution: "3840x2160",
        facing: "West-facing",
        dailyRate: "6000.00",
        weeklyRate: "35000.00",
        monthlyRate: "130000.00",
        status: "available",
        illuminated: true,
        digital: true,
        trafficCount: 95000,
        active: true,
      });

      await storage.createInventoryItem({
        supplierId: supplier2.id,
        screenName: "N2 Airport Approach CPT",
        screenType: "Billboard",
        location: "N2 Highway, Cape Town Airport",
        region: "Western Cape",
        gpsLatitude: "-33.9648",
        gpsLongitude: "18.6017",
        dimensions: "6m x 3m",
        facing: "North-facing",
        dailyRate: "4000.00",
        weeklyRate: "22000.00",
        monthlyRate: "82000.00",
        status: "maintenance",
        illuminated: true,
        digital: false,
        trafficCount: 55000,
        notes: "Scheduled maintenance until March 2026",
        active: true,
      });

      await storage.createInventoryItem({
        supplierId: supplier2.id,
        screenName: "Durban Beachfront LED",
        screenType: "LED Wall",
        location: "Golden Mile, Durban Beachfront",
        region: "KwaZulu-Natal",
        gpsLatitude: "-29.8587",
        gpsLongitude: "31.0218",
        dimensions: "8m x 4m",
        resolution: "3840x2160",
        facing: "East-facing",
        dailyRate: "7000.00",
        weeklyRate: "40000.00",
        monthlyRate: "150000.00",
        status: "available",
        illuminated: true,
        digital: true,
        trafficCount: 70000,
        active: true,
      });

      await storage.createInventoryItem({
        supplierId: supplier1.id,
        screenName: "Pretoria CBD Bus Shelter",
        screenType: "Street Furniture",
        location: "Church Street, Pretoria CBD",
        region: "Gauteng",
        gpsLatitude: "-25.7479",
        gpsLongitude: "28.1893",
        dimensions: "1.8m x 1.2m",
        facing: "Both sides",
        dailyRate: "800.00",
        weeklyRate: "4500.00",
        monthlyRate: "15000.00",
        status: "available",
        illuminated: false,
        digital: false,
        trafficCount: 25000,
        active: true,
      });

      await storage.createInventoryItem({
        supplierId: supplier2.id,
        screenName: "Menlyn Mall Digital",
        screenType: "Digital Screen",
        location: "Menlyn Park Shopping Centre",
        region: "Gauteng",
        gpsLatitude: "-25.7833",
        gpsLongitude: "28.2778",
        dimensions: "2m x 3m",
        resolution: "1920x1080",
        facing: "Indoor",
        dailyRate: "3000.00",
        weeklyRate: "17000.00",
        monthlyRate: "60000.00",
        status: "reserved",
        illuminated: true,
        digital: true,
        trafficCount: 40000,
        active: true,
      });

      return res.status(201).json({ message: "Seed data created successfully" });
    } catch (error) {
      console.error("Seed error:", error);
      return res.status(500).json({ message: "Failed to seed data" });
    }
  });

  app.get("/api/dashboard/stats", async (_req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      return res.json(stats);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
