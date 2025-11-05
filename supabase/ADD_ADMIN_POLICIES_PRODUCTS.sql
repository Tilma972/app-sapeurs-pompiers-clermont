-- ====================================
-- POLICIES SÉCURISÉES POUR PRODUCTS
-- ====================================
-- À exécuter APRÈS avoir vérifié le nom de votre table users
-- 
-- Pour trouver le nom de votre table:
-- 1. Allez dans SQL Editor de Supabase
-- 2. Exécutez: SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%user%';
-- 3. Remplacez "public.users" ci-dessous par le bon nom
-- ====================================

-- Supprimer les policies temporaires
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;

-- Créer les policies sécurisées (admin only)
CREATE POLICY "Only admins can insert products" ON public.products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update products" ON public.products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete products" ON public.products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
