import { relations } from "drizzle-orm/relations";
import { prices, subscriptions, users, customers, products, usersInAuth, folders, files, workspaces, collaborators } from "./schema";

export const subscriptionsRelations = relations(subscriptions, ({one}) => ({
	price: one(prices, {
		fields: [subscriptions.priceId],
		references: [prices.id]
	}),
	user: one(users, {
		fields: [subscriptions.userId],
		references: [users.id]
	}),
}));

export const pricesRelations = relations(prices, ({one, many}) => ({
	subscriptions: many(subscriptions),
	product: one(products, {
		fields: [prices.productId],
		references: [products.id]
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	subscriptions: many(subscriptions),
	customers: many(customers),
	usersInAuths: many(usersInAuth),
	user: one(users, {
		fields: [users.id],
		references: [users.id],
		relationName: "users_id_users_id"
	}),
	users: many(users, {
		relationName: "users_id_users_id"
	}),
	collaborators: many(collaborators),
}));

export const customersRelations = relations(customers, ({one}) => ({
	user: one(users, {
		fields: [customers.id],
		references: [users.id]
	}),
}));

export const productsRelations = relations(products, ({many}) => ({
	prices: many(prices),
}));

export const usersInAuthRelations = relations(usersInAuth, ({one}) => ({
	user: one(users, {
		fields: [usersInAuth.id],
		references: [users.id]
	}),
}));

export const filesRelations = relations(files, ({one}) => ({
	folder: one(folders, {
		fields: [files.folderId],
		references: [folders.id]
	}),
	workspace: one(workspaces, {
		fields: [files.workspaceId],
		references: [workspaces.id]
	}),
}));

export const foldersRelations = relations(folders, ({one, many}) => ({
	files: many(files),
	workspace: one(workspaces, {
		fields: [folders.workspaceId],
		references: [workspaces.id]
	}),
}));

export const workspacesRelations = relations(workspaces, ({many}) => ({
	files: many(files),
	folders: many(folders),
	collaborators: many(collaborators),
}));

export const collaboratorsRelations = relations(collaborators, ({one}) => ({
	user: one(users, {
		fields: [collaborators.userId],
		references: [users.id]
	}),
	workspace: one(workspaces, {
		fields: [collaborators.workspaceId],
		references: [workspaces.id]
	}),
}));