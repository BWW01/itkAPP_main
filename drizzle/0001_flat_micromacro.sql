CREATE TABLE "PushSubscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "PushSubscriptions" ADD CONSTRAINT "PushSubscriptions_userId_LdapInfo_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."LdapInfo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "endpoint_idx" ON "PushSubscriptions" USING btree ("endpoint");