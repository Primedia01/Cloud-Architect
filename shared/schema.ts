/**
 * @file Database schema for the Government Out-of-Home (OOH) Booking System.
 *
 * Defines all PostgreSQL tables, enums, insert schemas, and TypeScript types
 * used across the application. Built with Drizzle ORM and validated with Zod
 * via drizzle-zod.
 */

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/** Defines the set of roles a user can hold within the system. */
export const userRoleEnum = pgEnum("user_role", [
  "department_admin",
  "campaign_planner",
  "finance_officer",
  "supplier_admin",
  "supplier_user",
  "auditor",
]);

/** Represents the lifecycle states of an advertising campaign. */
export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "pending_approval",
  "approved",
  "in_progress",
  "completed",
  "cancelled",
]);

/** Represents the approval and progress states of an individual booking. */
export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "approved",
  "rejected",
  "in_progress",
  "completed",
]);

/** Categorises documents uploaded to the system (artwork, proofs, compliance, invoices). */
export const documentTypeEnum = pgEnum("document_type", [
  "artwork",
  "proof_of_flighting",
  "compliance_sbd",
  "compliance_cso",
  "invoice",
  "other",
]);

/**
 * System users including government staff and supplier personnel.
 * Each user is assigned a role and may optionally be linked to a supplier.
 */
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: userRoleEnum("role").notNull().default("campaign_planner"),
  supplierId: varchar("supplier_id"),
  active: boolean("active").notNull().default(true),
});

/**
 * OOH media suppliers who own and manage advertising inventory.
 * Referenced by users (supplier staff), bookings, invoices, and inventory.
 */
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contactPerson: text("contact_person").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  active: boolean("active").notNull().default(true),
});

/**
 * Advertising campaigns created by government departments.
 * A campaign groups one or more bookings and tracks budget, timeline, and region.
 * Related to bookings, documents, and invoices via campaignId.
 */
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: campaignStatusEnum("status").notNull().default("draft"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  region: text("region"),
  targetReach: integer("target_reach"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Individual site bookings within a campaign, placed with a specific supplier.
 * Links a campaign to a supplier's OOH site and tracks cost, schedule, and status.
 */
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull(),
  supplierId: varchar("supplier_id").notNull(),
  siteDescription: text("site_description").notNull(),
  location: text("location"),
  mediaType: text("media_type"),
  cost: decimal("cost", { precision: 12, scale: 2 }),
  status: bookingStatusEnum("status").notNull().default("pending"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Documents attached to campaigns or bookings, such as artwork files,
 * proof-of-flighting photos, compliance records, and invoices.
 * Optionally stores GPS coordinates for geotagged evidence.
 */
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id"),
  bookingId: varchar("booking_id"),
  type: documentTypeEnum("type").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type"),
  status: text("status").notNull().default("uploaded"),
  gpsLatitude: text("gps_latitude"),
  gpsLongitude: text("gps_longitude"),
  capturedAt: timestamp("captured_at"),
  uploadedBy: varchar("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

/**
 * Financial invoices raised against campaigns, optionally linked to a supplier.
 * Tracks amounts, payment status, issue dates, and due dates.
 */
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull(),
  supplierId: varchar("supplier_id"),
  invoiceNumber: text("invoice_number").notNull().unique(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("draft"),
  issuedAt: timestamp("issued_at"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Represents the availability states of an inventory item (OOH screen or site). */
export const inventoryStatusEnum = pgEnum("inventory_status", [
  "available",
  "booked",
  "maintenance",
  "reserved",
]);

/**
 * Supplier-owned OOH advertising inventory (screens and sites).
 * Stores physical attributes, location data, pricing tiers, and availability.
 * Referenced by bookings when a site is reserved for a campaign.
 */
export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull(),
  screenName: text("screen_name").notNull(),
  screenType: text("screen_type").notNull(),
  location: text("location").notNull(),
  region: text("region").notNull(),
  gpsLatitude: text("gps_latitude"),
  gpsLongitude: text("gps_longitude"),
  dimensions: text("dimensions"),
  resolution: text("resolution"),
  facing: text("facing"),
  dailyRate: decimal("daily_rate", { precision: 10, scale: 2 }).notNull(),
  weeklyRate: decimal("weekly_rate", { precision: 10, scale: 2 }),
  monthlyRate: decimal("monthly_rate", { precision: 12, scale: 2 }),
  status: inventoryStatusEnum("status").notNull().default("available"),
  availableFrom: timestamp("available_from"),
  availableTo: timestamp("available_to"),
  illuminated: boolean("illuminated").notNull().default(false),
  digital: boolean("digital").notNull().default(false),
  trafficCount: integer("traffic_count"),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Insert schema and types for the inventory table (excludes auto-generated id and updatedAt). */
export const insertInventorySchema = createInsertSchema(inventory).omit({ id: true, updatedAt: true });
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;

/** Insert schemas for all remaining tables (excludes auto-generated fields). */
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true });
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, uploadedAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });

/** Insert and select types for each table, used throughout the application. */
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
