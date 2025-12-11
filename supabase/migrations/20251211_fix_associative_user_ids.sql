-- Migration: Fix associative tables to use UUID for user references and add foreign keys
-- This migration assumes tables already exist but need schema corrections

-- 1. Alter organizerId in associative_events from text to uuid
ALTER TABLE "public"."associative_events" 
  ALTER COLUMN "organizerId" TYPE uuid USING "organizerId"::uuid;

-- 2. Alter userId in associative_event_participants from text to uuid
ALTER TABLE "public"."associative_event_participants" 
  ALTER COLUMN "userId" TYPE uuid USING "userId"::uuid;

-- 3. Alter userId in associative_contributions from text to uuid
ALTER TABLE "public"."associative_contributions" 
  ALTER COLUMN "userId" TYPE uuid USING "userId"::uuid;

-- 4. Alter userId in associative_loans from text to uuid
ALTER TABLE "public"."associative_loans" 
  ALTER COLUMN "userId" TYPE uuid USING "userId"::uuid;

-- 5. Alter userId in associative_poll_votes from text to uuid
ALTER TABLE "public"."associative_poll_votes" 
  ALTER COLUMN "userId" TYPE uuid USING "userId"::uuid;

-- 6. Add foreign keys to profiles table (safely)
DO $$ BEGIN
    ALTER TABLE "public"."associative_events" 
      ADD CONSTRAINT "associative_events_organizerId_fkey" 
      FOREIGN KEY ("organizerId") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."associative_event_participants" 
      ADD CONSTRAINT "associative_event_participants_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."associative_contributions" 
      ADD CONSTRAINT "associative_contributions_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."associative_loans" 
      ADD CONSTRAINT "associative_loans_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."associative_poll_votes" 
      ADD CONSTRAINT "associative_poll_votes_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 7. Add RLS policies (safely)
DO $$ BEGIN
    CREATE POLICY "Events are viewable by everyone" 
      ON "public"."associative_events" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Events are insertable by authenticated" 
      ON "public"."associative_events" FOR INSERT 
      WITH CHECK (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Events are updatable by organizer" 
      ON "public"."associative_events" FOR UPDATE 
      USING (auth.uid() = "organizerId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Participants viewable by everyone" 
      ON "public"."associative_event_participants" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Participants insertable by self" 
      ON "public"."associative_event_participants" FOR INSERT 
      WITH CHECK (auth.uid() = "userId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Participants updatable by self" 
      ON "public"."associative_event_participants" FOR UPDATE 
      USING (auth.uid() = "userId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Money pots viewable by everyone" 
      ON "public"."associative_money_pots" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Contributions viewable by everyone" 
      ON "public"."associative_contributions" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Contributions insertable by authenticated" 
      ON "public"."associative_contributions" FOR INSERT 
      WITH CHECK (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Contributions updatable by self or admin" 
      ON "public"."associative_contributions" FOR UPDATE 
      USING (auth.uid() = "userId" OR auth.role() = 'service_role');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Materials viewable by everyone" 
      ON "public"."associative_materials" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Loans viewable by authenticated" 
      ON "public"."associative_loans" FOR SELECT 
      USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Loans insertable by authenticated" 
      ON "public"."associative_loans" FOR INSERT 
      WITH CHECK (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Loans updatable by self" 
      ON "public"."associative_loans" FOR UPDATE 
      USING (auth.uid() = "userId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Polls viewable by everyone" 
      ON "public"."associative_polls" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Poll votes viewable by everyone" 
      ON "public"."associative_poll_votes" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Poll votes insertable by self" 
      ON "public"."associative_poll_votes" FOR INSERT 
      WITH CHECK (auth.uid() = "userId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Poll votes updatable by self" 
      ON "public"."associative_poll_votes" FOR UPDATE 
      USING (auth.uid() = "userId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
