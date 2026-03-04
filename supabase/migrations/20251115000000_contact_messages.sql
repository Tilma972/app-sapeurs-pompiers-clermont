-- Table pour stocker les messages de contact
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read BOOLEAN DEFAULT false,
  replied BOOLEAN DEFAULT false
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON contact_messages(read);

-- RLS (Row Level Security)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Politique : Seuls les admins peuvent lire les messages
CREATE POLICY "Admins can read contact messages"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Politique : Seuls les admins peuvent mettre à jour (marquer comme lu/répondu)
CREATE POLICY "Admins can update contact messages"
  ON contact_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Politique : Tout le monde peut insérer (soumettre un message de contact)
CREATE POLICY "Anyone can submit contact messages"
  ON contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Commentaires
COMMENT ON TABLE contact_messages IS 'Messages de contact soumis via le formulaire de la landing page';
COMMENT ON COLUMN contact_messages.name IS 'Nom complet de l''expéditeur';
COMMENT ON COLUMN contact_messages.email IS 'Email de contact de l''expéditeur';
COMMENT ON COLUMN contact_messages.subject IS 'Sujet du message';
COMMENT ON COLUMN contact_messages.message IS 'Contenu du message';
COMMENT ON COLUMN contact_messages.read IS 'Indique si le message a été lu par un administrateur';
COMMENT ON COLUMN contact_messages.replied IS 'Indique si une réponse a été envoyée';
