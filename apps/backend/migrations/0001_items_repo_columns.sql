CREATE TYPE "public"."item_status" AS ENUM('pending', 'bought');--> statement-breakpoint
ALTER TABLE "grocery_list_items" ADD COLUMN "status" "item_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "grocery_list_items" ADD COLUMN "created_by" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "grocery_list_items" ADD CONSTRAINT "grocery_list_items_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grocery_list_items" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "grocery_list_items" DROP COLUMN "is_completed";
