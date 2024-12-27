
import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: varchar('name').notNull().unique(),
    age: integer().notNull(),
    email: varchar('email').notNull().unique(),
    passwordHash: varchar('password_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow()
});

// Templates table
export const templates = pgTable('templates', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: varchar('name').notNull(),
    description: varchar('description'),
    bucketUrl: varchar('bucket_url'), // URL for the JSON file in the bucket
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// Assignments table
export const assignments = pgTable('assignments', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    title: varchar('title').notNull(),
    description: varchar('description').notNull(),
    templateId: integer('template_id').references(() => templates.id),
    bucketUrl: varchar('bucket_url'), // URL for the JSON file in the bucket
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// Assignment attempts table
export const assignmentAttempts = pgTable('assignment_attempts', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    assignmentId: integer('assignment_id').notNull().references(() => assignments.id),
    userId: integer('user_id').notNull().references(() => users.id),
    status: varchar('status').notNull(), // e.g., 'submitted', 'graded'
    score: integer('score'),
    feedback: varchar('feedback'),
    bucketUrl: varchar('bucket_url'), // URL for the JSON file in the bucket
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    assignmentAttempts: many(assignmentAttempts),
}));

export const templatesRelations = relations(templates, ({ many }) => ({
    assignments: many(assignments),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
    template: one(templates, {
        fields: [assignments.templateId],
        references: [templates.id],
    }),
    attempts: many(assignmentAttempts),
}));

export const assignmentAttemptsRelations = relations(assignmentAttempts, ({ one }) => ({
    assignment: one(assignments, {
        fields: [assignmentAttempts.assignmentId],
        references: [assignments.id],
    }),
    user: one(users, {
        fields: [assignmentAttempts.userId],
        references: [users.id],
    }),
}));

