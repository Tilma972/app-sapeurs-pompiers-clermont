-- Migration: Module Vie Associative
-- Exécuter ce script dans Supabase SQL Editor

-- Enums
CREATE TYPE "EventType" AS ENUM ('AG', 'SAINTE_BARBE', 'REPAS_GARDE', 'SPORT', 'AUTRE');
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PLANNED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ParticipationStatus" AS ENUM ('PRESENT', 'ABSENT', 'ASTREINTE');
CREATE TYPE "PotStatus" AS ENUM ('ACTIVE', 'CLOSED', 'COMPLETED');
CREATE TYPE "ContributionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE "MaterialCondition" AS ENUM ('NEW', 'GOOD', 'USED', 'DAMAGED', 'BROKEN');
CREATE TYPE "LoanStatus" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'RETURNED', 'OVERDUE');

-- Table: associative_events
CREATE TABLE "associative_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "type" "EventType" NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'PLANNED',
    "maxParticipants" INTEGER,
    "organizerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "associative_events_pkey" PRIMARY KEY ("id")
);

-- Table: associative_event_participants
CREATE TABLE "associative_event_participants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventId" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ParticipationStatus" NOT NULL,
    "guests" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "associative_event_participants_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "associative_event_participants_eventId_userId_key" UNIQUE ("eventId", "userId")
);

-- Table: associative_money_pots
CREATE TABLE "associative_money_pots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetAmount" DECIMAL(10,2),
    "eventId" UUID,
    "status" "PotStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "associative_money_pots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "associative_money_pots_eventId_key" UNIQUE ("eventId")
);

-- Table: associative_contributions
CREATE TABLE "associative_contributions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "moneyPotId" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "message" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "stripePaymentId" TEXT,
    "status" "ContributionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "associative_contributions_pkey" PRIMARY KEY ("id")
);

-- Table: associative_materials
CREATE TABLE "associative_materials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "inventoryNumber" TEXT,
    "condition" "MaterialCondition" NOT NULL,
    "photoUrl" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "associative_materials_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "associative_materials_inventoryNumber_key" UNIQUE ("inventoryNumber")
);

-- Table: associative_loans
CREATE TABLE "associative_loans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "materialId" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "associative_loans_pkey" PRIMARY KEY ("id")
);

-- Table: associative_polls
CREATE TABLE "associative_polls" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "eventId" UUID,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "associative_polls_pkey" PRIMARY KEY ("id")
);

-- Table: associative_poll_votes
CREATE TABLE "associative_poll_votes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pollId" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "associative_poll_votes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "associative_poll_votes_pollId_userId_key" UNIQUE ("pollId", "userId")
);

-- Foreign Keys
ALTER TABLE "associative_event_participants" ADD CONSTRAINT "associative_event_participants_eventId_fkey" 
    FOREIGN KEY ("eventId") REFERENCES "associative_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "associative_money_pots" ADD CONSTRAINT "associative_money_pots_eventId_fkey" 
    FOREIGN KEY ("eventId") REFERENCES "associative_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "associative_contributions" ADD CONSTRAINT "associative_contributions_moneyPotId_fkey" 
    FOREIGN KEY ("moneyPotId") REFERENCES "associative_money_pots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "associative_loans" ADD CONSTRAINT "associative_loans_materialId_fkey" 
    FOREIGN KEY ("materialId") REFERENCES "associative_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "associative_polls" ADD CONSTRAINT "associative_polls_eventId_fkey" 
    FOREIGN KEY ("eventId") REFERENCES "associative_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "associative_poll_votes" ADD CONSTRAINT "associative_poll_votes_pollId_fkey" 
    FOREIGN KEY ("pollId") REFERENCES "associative_polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes pour performance
CREATE INDEX "associative_events_organizerId_idx" ON "associative_events"("organizerId");
CREATE INDEX "associative_events_date_idx" ON "associative_events"("date");
CREATE INDEX "associative_event_participants_userId_idx" ON "associative_event_participants"("userId");
CREATE INDEX "associative_contributions_userId_idx" ON "associative_contributions"("userId");
CREATE INDEX "associative_loans_userId_idx" ON "associative_loans"("userId");
CREATE INDEX "associative_poll_votes_userId_idx" ON "associative_poll_votes"("userId");

-- Trigger pour updatedAt automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_associative_events_updated_at BEFORE UPDATE ON "associative_events" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_associative_event_participants_updated_at BEFORE UPDATE ON "associative_event_participants" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_associative_money_pots_updated_at BEFORE UPDATE ON "associative_money_pots" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_associative_contributions_updated_at BEFORE UPDATE ON "associative_contributions" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_associative_materials_updated_at BEFORE UPDATE ON "associative_materials" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_associative_loans_updated_at BEFORE UPDATE ON "associative_loans" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security) pour toutes les tables
ALTER TABLE "associative_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "associative_event_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "associative_money_pots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "associative_contributions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "associative_materials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "associative_loans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "associative_polls" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "associative_poll_votes" ENABLE ROW LEVEL SECURITY;

-- Politiques RLS basiques (lecture pour utilisateurs authentifiés)
-- Tu pourras les personnaliser selon tes besoins

CREATE POLICY "Authenticated users can view events" ON "associative_events"
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view participants" ON "associative_event_participants"
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view money pots" ON "associative_money_pots"
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view contributions" ON "associative_contributions"
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view materials" ON "associative_materials"
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view loans" ON "associative_loans"
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view polls" ON "associative_polls"
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view poll votes" ON "associative_poll_votes"
    FOR SELECT USING (auth.role() = 'authenticated');
