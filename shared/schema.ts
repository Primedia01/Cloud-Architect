import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", [
  "department_admin",
  "campaign_planner",
  "finance_officer",
  "supplier_admin",
  "supplier_user",
  "auditor",
]);

export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "pending_approval",
  "approved",
  "in_progress",
  "completed",
  "cancelled",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "approved",
  "rejected",
  "in_progress",
  "completed",
]);

export const documentTypeEnum = pgEnum("document_type", [
  "artwork",
  "proof_of_flighting",
  "compliance_sbd",
  "compliance_cso",
  "invoice",
  "other",
]);

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

export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contactPerson: text("contact_person").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  active: boolean("active").notNull().default(true),
});

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

export const inventoryStatusEnum = pgEnum("inventory_status", [
  "available",
  "booked",
  "maintenance",
  "reserved",
]);

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

export const insertInventorySchema = createInsertSchema(inventory).omit({ id: true, updatedAt: true });
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true });
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, uploadedAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });

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
