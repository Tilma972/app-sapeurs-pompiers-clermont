#!/bin/bash

# Script de test du webhook n8n pour génération PDF reçus fiscaux
# Usage: ./test-webhook.sh <webhook-url>
# Exemple: ./test-webhook.sh https://n8n.domain.com/webhook/abc-123-xyz

set -e

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL du webhook (à passer en argument)
WEBHOOK_URL="${1}"

if [ -z "$WEBHOOK_URL" ]; then
  echo -e "${RED}❌ Erreur: URL webhook manquante${NC}"
  echo "Usage: $0 <webhook-url>"
  echo "Exemple: $0 https://n8n.domain.com/webhook/abc-123-xyz"
  exit 1
fi

echo -e "${YELLOW}🧪 Test du webhook n8n pour génération PDF reçu fiscal${NC}"
echo "URL: $WEBHOOK_URL"
echo ""

# Payload JSON de test
PAYLOAD=$(cat <<EOF
{
  "event": "receipt.generate",
  "transaction_id": "01234567-89ab-cdef-0123-456789abcdef",
  "receipt_number": "2025-TEST-001",
  "amount": 50,
  "payment_method": "card",
  "calendar_accepted": false,
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
  "donor": {
    "email": "test.webhook@example.com",
    "name": "Test Webhook",
    "first_name": "Test",
    "last_name": "Webhook",
    "address": "12 Rue du Test",
    "zip": "63000",
    "city": "Clermont-Ferrand"
  },
  "receipt_url": "https://test.com/recu/2025-TEST-001",
  "user_id": "98765432-10fe-dcba-9876-543210fedcba",
  "tournee_id": "abcd1234-5678-90ef-ghij-klmnopqrstuv"
}
EOF
)

echo -e "${YELLOW}📤 Envoi du payload...${NC}"
echo ""

# Envoi avec curl et capture de la réponse
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Séparer le body et le status code
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

echo -e "${YELLOW}📥 Réponse reçue:${NC}"
echo "Status Code: $HTTP_CODE"
echo ""
echo "Body:"
echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
echo ""

# Vérifier le status code
if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✅ SUCCESS: Webhook appelé avec succès${NC}"
  echo ""
  echo -e "${YELLOW}🔍 Prochaines vérifications:${NC}"
  echo "1. Ouvrir n8n → Executions → Vérifier dernière exécution"
  echo "2. Ouvrir Minio → Bucket 'receipts' → Chercher '2025-TEST-001.pdf'"
  echo "3. Vérifier logs Coolify si besoin"
  exit 0
elif [ "$HTTP_CODE" -eq 404 ]; then
  echo -e "${RED}❌ ERREUR 404: Webhook introuvable${NC}"
  echo "Vérifications:"
  echo "1. L'URL est-elle correcte ?"
  echo "2. Le workflow est-il ACTIF dans n8n ?"
  echo "3. URL de test vs URL de production ?"
  exit 1
elif [ "$HTTP_CODE" -eq 500 ]; then
  echo -e "${RED}❌ ERREUR 500: Erreur serveur n8n${NC}"
  echo "Vérifications:"
  echo "1. Ouvrir n8n → Executions → Voir l'erreur"
  echo "2. Vérifier logs Coolify → n8n"
  echo "3. Vérifier que Gotenberg/Minio sont accessibles"
  exit 1
else
  echo -e "${RED}❌ ERREUR HTTP $HTTP_CODE${NC}"
  echo "Vérifier les logs n8n et Coolify"
  exit 1
fi
