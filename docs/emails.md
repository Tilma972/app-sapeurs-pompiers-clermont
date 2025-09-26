# Emails (Resend)

Pour activer l'envoi de mails (reçus), définissez les variables d'environnement suivantes :

- RESEND_API_KEY — Clé API Resend
- RESEND_FROM — Adresse expéditeur (doit être validée chez Resend)
- RESEND_FROM_NAME — Nom d'expéditeur affiché (ex: "Amicale SP Clermont l’Hérault")
- RESEND_REPLY_TO — Adresse de réponse (optionnelle)

Si RESEND_API_KEY est absent, l'envoi est ignoré (log WARN) et l'UI affiche un message adéquat lors d'un renvoi.

Le champ From envoyé à Resend est construit sous la forme: "<Nom> <adresse>", par exemple:

Amicale SP Clermont l’Hérault <no-reply@pompiers34800.com>
