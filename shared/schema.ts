import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const { spawn } = require("child_process");

const ps = spawn("powershell.exe", ["-NoLogo", "-NoProfile", "-File", "path/to/script.ps1"]);

ps.stdout.on("data", (data) => {
  console.log(`Output: ${data}`);
});

ps.stderr.on("data", (data) => {
  console.error(`Error: ${data}`);
});

ps.on("exit", (code) => {
  console.log(`PowerShell script exited with code ${code}`);
});

const { exec } = require('child_process');

exec('powershell.exe -Command "Get-Process | ConvertTo-Json"', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  try {
    const jsonOutput = JSON.parse(stdout);
    console.log(jsonOutput);
  } catch (parseError) {
    console.error(`JSON Parse Error: ${parseError.message}`);
  }
});


export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  roblosecurityToken: text("roblosecurity_token"), // Optional, encrypted
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const instances = pgTable("instances", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  name: text("name").notNull(),
  status: text("status").notNull().default("stopped"), // stopped, starting, running, stopping, error
  processId: integer("process_id"),
  port: integer("port"),
  gameId: text("game_id"),
  config: text("config"), // JSON string for instance-specific config
  lastStarted: timestamp("last_started"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  instanceId: integer("instance_id").references(() => instances.id),
  level: text("level").notNull(), // info, warning, error
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
});

export const insertInstanceSchema = createInsertSchema(instances).omit({
  id: true,
  createdAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Instance = typeof instances.$inferSelect;
export type InsertInstance = z.infer<typeof insertInstanceSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

// Extended types for API responses
export type InstanceWithAccount = Instance & {
  account: Account | null;
};

export type AccountWithInstances = Account & {
  instances: Instance[];
};
