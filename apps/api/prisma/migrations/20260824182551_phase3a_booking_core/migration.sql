-- CreateEnum
CREATE TYPE "service_request_status" AS ENUM ('DRAFT', 'CLARIFYING', 'READY', 'MATCHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "booking_status" AS ENUM ('REQUESTED', 'ACCEPTED', 'ARRIVING', 'ARRIVED', 'IN_PROGRESS', 'EXTRA_APPROVAL_PENDING', 'COMPLETED', 'PAYMENT_PENDING', 'PAID', 'REVIEWED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PROFESSIONAL', 'CANCELLED_BY_ADMIN');

-- CreateEnum
CREATE TYPE "actor_type" AS ENUM ('CUSTOMER', 'PROFESSIONAL', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ticket_type" AS ENUM ('BOOKING_ISSUE', 'PAYMENT_ISSUE', 'QUALITY_COMPLAINT', 'SAFETY_CONCERN', 'ACCOUNT_ISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "ticket_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ticket_status" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_INTERNAL', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "service_requests" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "address_id" UUID,
    "raw_text" TEXT NOT NULL,
    "voice_url" VARCHAR(1024),
    "media" JSONB,
    "ai_category" VARCHAR(120),
    "ai_confidence" DECIMAL(4,3),
    "status" "service_request_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "professional_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "address_id" UUID NOT NULL,
    "request_id" UUID,
    "scheduled_start" TIMESTAMPTZ(3) NOT NULL,
    "scheduled_end" TIMESTAMPTZ(3) NOT NULL,
    "status" "booking_status" NOT NULL DEFAULT 'REQUESTED',
    "estimated_amount" INTEGER NOT NULL,
    "final_amount" INTEGER,
    "platform_fee" INTEGER,
    "notes" VARCHAR(2000),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_status_history" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "status" "booking_status" NOT NULL,
    "actor_type" "actor_type" NOT NULL,
    "actor_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_items" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_price" INTEGER NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extra_work_requests" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "professional_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "evidence_urls" TEXT[],
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "customer_response_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extra_work_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "provider_payment_id" VARCHAR(255),
    "amount" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "status" "payment_status" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" UUID NOT NULL,
    "requester_id" UUID NOT NULL,
    "booking_id" UUID,
    "type" "ticket_type" NOT NULL DEFAULT 'OTHER',
    "priority" "ticket_priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "ticket_status" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "assigned_admin_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "resolved_at" TIMESTAMPTZ(3),

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_requests_customer_id_created_at_idx" ON "service_requests"("customer_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "service_requests_status_created_at_idx" ON "service_requests"("status", "created_at");

-- CreateIndex
CREATE INDEX "bookings_status_scheduled_start_idx" ON "bookings"("status", "scheduled_start");

-- CreateIndex
CREATE INDEX "bookings_customer_id_created_at_idx" ON "bookings"("customer_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "bookings_professional_id_created_at_idx" ON "bookings"("professional_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "bookings_professional_id_status_scheduled_start_idx" ON "bookings"("professional_id", "status", "scheduled_start");

-- CreateIndex
CREATE INDEX "booking_status_history_booking_id_created_at_idx" ON "booking_status_history"("booking_id", "created_at");

-- CreateIndex
CREATE INDEX "booking_items_booking_id_approved_idx" ON "booking_items"("booking_id", "approved");

-- CreateIndex
CREATE INDEX "extra_work_requests_booking_id_status_idx" ON "extra_work_requests"("booking_id", "status");

-- CreateIndex
CREATE INDEX "extra_work_requests_professional_id_created_at_idx" ON "extra_work_requests"("professional_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "payments_booking_id_key" ON "payments"("booking_id");

-- CreateIndex
CREATE INDEX "payments_status_created_at_idx" ON "payments"("status", "created_at");

-- CreateIndex
CREATE INDEX "payments_provider_payment_id_idx" ON "payments"("provider_payment_id");

-- CreateIndex
CREATE INDEX "support_tickets_status_priority_created_at_idx" ON "support_tickets"("status", "priority", "created_at");

-- CreateIndex
CREATE INDEX "support_tickets_requester_id_created_at_idx" ON "support_tickets"("requester_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "support_tickets_assigned_admin_id_status_idx" ON "support_tickets"("assigned_admin_id", "status");

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "user_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "user_addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extra_work_requests" ADD CONSTRAINT "extra_work_requests_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extra_work_requests" ADD CONSTRAINT "extra_work_requests_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
