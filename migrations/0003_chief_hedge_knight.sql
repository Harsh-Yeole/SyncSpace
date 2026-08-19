DROP TABLE "customers" CASCADE;--> statement-breakpoint
DROP POLICY "Allow public read-only access." ON "prices" CASCADE;--> statement-breakpoint
DROP TABLE "prices" CASCADE;--> statement-breakpoint
DROP POLICY "Allow public read-only access." ON "products" CASCADE;--> statement-breakpoint
DROP TABLE "products" CASCADE;--> statement-breakpoint
DROP POLICY "Everyone Can view own user data." ON "users" CASCADE;--> statement-breakpoint
DROP POLICY "Can update own user data." ON "users" CASCADE;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
DROP TABLE "users_in_auth" CASCADE;--> statement-breakpoint
DROP TYPE "public"."pricing_plan_interval";--> statement-breakpoint
DROP TYPE "public"."pricing_type";--> statement-breakpoint
DROP TYPE "public"."subscription_status";