import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const habits = sqliteTable('habits', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  completeDays: text('complete_days', { mode: 'json' }).$type<string[]>().notNull().default([]),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  habitView: integer('habit_view', { mode: 'boolean' }).notNull().default(false),
});

export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  login: text('login').notNull().unique(),
  name: text('name'),
  bio: text('bio'),
  avatarUrl: text('avatar_url').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  userView: integer('user_view', { mode: 'boolean' }).notNull().default(false),
});

export const karlWaitlist = sqliteTable('karl_waitlist', {
  id: integer('id').primaryKey(),
  encryptedProfile: text('encrypted_profile').notNull(), // Encrypted JSON of complete profile
  plz: text('plz').notNull(), // Store PLZ separately for analytics (unencrypted)
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull().default('pending'), // pending, contacted, closed
  notes: text('notes'), // For Karl team to add notes
});
