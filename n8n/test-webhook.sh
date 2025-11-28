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
  "transaction_id": "a1c8adf9-8e88-4b3f-be54-f60169d0480f",
  "receipt_number": "REC-TEST-CB-1237",
  "amount": 50.00,
  "payment_method": "card",
  "created_at": "2025-11-26T10:49:00.626Z",
  "donor": {
    "email": "test.cb@example.com",
    "first_name": "Alice",
    "last_name": "Durand",
    "address": "1 Place de la Mairie",
    "zip": "34800",
    "city": "Clermont-l'Hérault"
  }
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
