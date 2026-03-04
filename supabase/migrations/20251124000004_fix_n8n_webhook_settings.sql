-- Migration: Fix n8n webhook settings table conflict
-- Date: 2025-11-24
-- Description: Create separate n8n_settings table to avoid conflict with app_settings

-- 1. Create dedicated table for n8n webhook configuration
CREATE TABLE IF NOT EXISTS public.n8n_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.n8n_settings IS 'Configuration settings for n8n webhook integration';
COMMENT ON COLUMN public.n8n_settings.key IS 'Setting key (e.g., webhook_url)';
COMMENT ON COLUMN public.n8n_settings.value IS 'Setting value';

-- 2. Update get_n8n_webhook_url() to use n8n_settings instead of app_settings
CREATE OR REPLACE FUNCTION get_n8n_webhook_url()
RETURNS TEXT AS $$
DECLARE
  webhook_url TEXT;
BEGIN
  SELECT value INTO webhook_url
  FROM n8n_settings
  WHERE key = 'n8n_webhook_url';

  RETURN webhook_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update set_n8n_webhook_url() to use n8n_settings instead of app_settings
CREATE OR REPLACE FUNCTION set_n8n_webhook_url(url TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Insert or update the URL in n8n_settings
  INSERT INTO n8n_settings (key, value, updated_at)
  VALUES ('n8n_webhook_url', url, NOW())
  ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, updated_at = NOW();

  RETURN 'URL webhook n8n configurée avec succès: ' || url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_n8n_webhook_url() IS 'Récupère l''URL du webhook n8n depuis n8n_settings';
COMMENT ON FUNCTION set_n8n_webhook_url(TEXT) IS 'Configure l''URL du webhook n8n dans n8n_settings';
