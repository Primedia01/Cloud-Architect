/**
 * @file Data access layer for the application.
 * Uses Drizzle ORM with a PostgreSQL (Neon-backed) database to perform
 * all persistence operations. Exports a singleton DatabaseStorage instance
 * that implements the IStorage interface.
 */

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, count, sum, and } from "drizzle-orm";
import * as schema from "@shared/schema";
import {
  type User, type InsertUser,
  type Supplier, type InsertSupplier,
  type Campaign, type InsertCampaign,
  type Booking, type InsertBooking,
  type Document, type InsertDocument,
  type Invoice, type InsertInvoice,
  type Inventory, type InsertInventory,
  users, suppliers, campaigns, bookings, documents, invoices, inventory,
} from "@shared/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

/** Aggregated statistics displayed on the main dashboard. */
export interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalBookings: number;
  totalSpend: string;
  pendingBookings: number;
  completedBookings: number;
}

/**
 * Defines all CRUD operations available for persistent storage.
 * Each entity exposes standard get, create, and update methods;
 * some also support delete or filtered queries.
 */
export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;

  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(data: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, data: Partial<InsertSupplier>): Promise<Supplier | undefined>;

  getCampaigns(): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  createCampaign(data: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, data: Partial<InsertCampaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: string): Promise<boolean>;

  getBookings(): Promise<Booking[]>;
  getBookingsByCampaign(campaignId: string): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  createBooking(data: InsertBooking): Promise<Booking>;
  updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking | undefined>;

  getDocuments(): Promise<Document[]>;
  getDocumentsByCampaign(campaignId: string): Promise<Document[]>;
  getDocumentsByBooking(bookingId: string): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(data: InsertDocument): Promise<Document>;
  updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document | undefined>;

  getInvoices(): Promise<Invoice[]>;
  getInvoicesByCampaign(campaignId: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(data: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, data: Partial<InsertInvoice>): Promise<Invoice | undefined>;

  getDashboardStats(): Promise<DashboardStats>;

  getInventory(): Promise<Inventory[]>;
  getInventoryBySupplier(supplierId: string): Promise<Inventory[]>;
  getInventoryItem(id: string): Promise<Inventory | undefined>;
  createInventoryItem(data: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: string, data: Partial<InsertInventory>): Promise<Inventory | undefined>;
  deleteInventoryItem(id: string): Promise<boolean>;
}

/** PostgreSQL-backed implementation of IStorage using Drizzle ORM queries. */
export class DatabaseStorage implements IStorage {
  // --- User operations ---

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  // --- Supplier operations ---

  async getSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers);
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async createSupplier(data: InsertSupplier): Promise<Supplier> {
    const [created] = await db.insert(suppliers).values(data).returning();
    return created;
  }

  async updateSupplier(id: string, data: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [updated] = await db.update(suppliers).set(data).where(eq(suppliers.id, id)).returning();
    return updated;
  }

  // --- Campaign operations ---

  async getCampaigns(): Promise<Campaign[]> {
    return db.select().from(campaigns);
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async createCampaign(data: InsertCampaign): Promise<Campaign> {
    const [created] = await db.insert(campaigns).values(data).returning();
    return created;
  }

  async updateCampaign(id: string, data: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const [updated] = await db.update(campaigns).set(data).where(eq(campaigns.id, id)).returning();
    return updated;
  }

  async deleteCampaign(id: string): Promise<boolean> {
    const result = await db.delete(campaigns).where(eq(campaigns.id, id)).returning();
    return result.length > 0;
  }

  // --- Booking operations ---

  async getBookings(): Promise<Booking[]> {
    return db.select().from(bookings);
  }

  async getBookingsByCampaign(campaignId: string): Promise<Booking[]> {
    return db.select().from(bookings).where(eq(bookings.campaignId, campaignId));
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async createBooking(data: InsertBooking): Promise<Booking> {
    const [created] = await db.insert(bookings).values(data).returning();
    return created;
  }

  async updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [updated] = await db.update(bookings).set(data).where(eq(bookings.id, id)).returning();
    return updated;
  }

  // --- Document operations ---

  async getDocuments(): Promise<Document[]> {
    return db.select().from(documents);
  }

  async getDocumentsByCampaign(campaignId: string): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.campaignId, campaignId));
  }

  async getDocumentsByBooking(bookingId: string): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.bookingId, bookingId));
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async createDocument(data: InsertDocument): Promise<Document> {
    const [created] = await db.insert(documents).values(data).returning();
    return created;
  }

  async updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document | undefined> {
    const [updated] = await db.update(documents).set(data).where(eq(documents.id, id)).returning();
    return updated;
  }

  // --- Invoice operations ---

  async getInvoices(): Promise<Invoice[]> {
    return db.select().from(invoices);
  }

  async getInvoicesByCampaign(campaignId: string): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.campaignId, campaignId));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async createInvoice(data: InsertInvoice): Promise<Invoice> {
    const [created] = await db.insert(invoices).values(data).returning();
    return created;
  }

  async updateInvoice(id: string, data: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [updated] = await db.update(invoices).set(data).where(eq(invoices.id, id)).returning();
    return updated;
  }

  // --- Inventory operations ---

  async getInventory(): Promise<Inventory[]> {
    return db.select().from(inventory);
  }

  async getInventoryBySupplier(supplierId: string): Promise<Inventory[]> {
    return db.select().from(inventory).where(eq(inventory.supplierId, supplierId));
  }

  async getInventoryItem(id: string): Promise<Inventory | undefined> {
    const [item] = await db.select().from(inventory).where(eq(inventory.id, id));
    return item;
  }

  async createInventoryItem(data: InsertInventory): Promise<Inventory> {
    const [created] = await db.insert(inventory).values(data).returning();
    return created;
  }

  async updateInventoryItem(id: string, data: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const [updated] = await db.update(inventory).set({ ...data, updatedAt: new Date() }).where(eq(inventory.id, id)).returning();
    return updated;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    const result = await db.delete(inventory).where(eq(inventory.id, id)).returning();
    return result.length > 0;
  }

  // --- Dashboard statistics ---

  /**
   * Aggregates key metrics across campaigns and bookings by running
   * individual count/sum queries for total campaigns, active campaigns,
   * total bookings, cumulative spend, pending bookings, and completed bookings.
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const [campaignStats] = await db
      .select({ total: count() })
      .from(campaigns);

    const [activeStats] = await db
      .select({ total: count() })
      .from(campaigns)
      .where(eq(campaigns.status, "in_progress"));

    const [bookingStats] = await db
      .select({ total: count() })
      .from(bookings);

    const [spendStats] = await db
      .select({ total: sum(bookings.cost) })
      .from(bookings);

    const [pendingStats] = await db
      .select({ total: count() })
      .from(bookings)
      .where(eq(bookings.status, "pending"));

    const [completedStats] = await db
      .select({ total: count() })
      .from(bookings)
      .where(eq(bookings.status, "completed"));

    return {
      totalCampaigns: campaignStats.total,
      activeCampaigns: activeStats.total,
      totalBookings: bookingStats.total,
      totalSpend: spendStats.total || "0",
      pendingBookings: pendingStats.total,
      completedBookings: completedStats.total,
    };
  }
}

export const storage = new DatabaseStorage();
