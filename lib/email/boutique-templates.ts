/**
 * Templates d'emails pour la boutique
 * Inspiré de Shopify - Design moderne et professionnel
 */

export type OrderItem = {
  name: string
  quantity: number
  unitPrice: number
  totalPrice?: number
  imageUrl?: string
}

export type BoutiqueEmailParams = {
  customerName?: string | null
  customerEmail: string
  orderNumber?: string | null  // ID de transaction ou numéro de commande
  items: OrderItem[]
  subtotal: number
  total: number
  orderDate?: Date
}

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)

/**
 * Sujet de l'email de confirmation de commande
 */
export function buildBoutiqueSubject(params: BoutiqueEmailParams): string {
  const orderRef = params.orderNumber ? ` #${params.orderNumber.slice(0, 8).toUpperCase()}` : ''
  return `Confirmation de votre commande${orderRef} - Amicale SP Clermont`
}

/**
 * Version texte de l'email (fallback)
 */
export function buildBoutiqueText(params: BoutiqueEmailParams): string {
  const itemsList = params.items
    .map(item => `- ${item.name} x${item.quantity} : ${formatCurrency(item.totalPrice || item.unitPrice * item.quantity)}`)
    .join('\n')

  return `
CONFIRMATION DE COMMANDE
${params.orderNumber ? `Commande #${params.orderNumber.slice(0, 8).toUpperCase()}` : ''}
${formatDate(params.orderDate || new Date())}

Bonjour ${params.customerName || 'Cher client'},

Merci pour votre commande auprès de l'Amicale des Sapeurs-Pompiers de Clermont-l'Hérault !

RÉCAPITULATIF DE VOTRE COMMANDE :
${itemsList}

TOTAL : ${formatCurrency(params.total)}

PROCHAINES ÉTAPES :
1. Notre équipe va préparer votre commande
2. Nous vous contacterons pour organiser le retrait ou la livraison
3. Vous recevrez un email quand votre commande sera prête

BESOIN D'AIDE ?
Répondez simplement à cet email ou contactez-nous :
- Email : contact@pompiers34800.com
- Tél : 04 67 96 XX XX

Merci pour votre soutien !

L'équipe de l'Amicale des Sapeurs-Pompiers
Caserne des Sapeurs-Pompiers
34800 Clermont-l'Hérault
`.trim()
}

/**
 * Version HTML de l'email - Style Shopify moderne
 */
export function buildBoutiqueHtml(params: BoutiqueEmailParams): string {
  const orderRef = params.orderNumber ? params.orderNumber.slice(0, 8).toUpperCase() : ''
  const orderDate = formatDate(params.orderDate || new Date())
  
  // Générer les lignes du tableau des articles
  const itemsRows = params.items.map(item => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
        <div style="display: flex; align-items: center;">
          ${item.imageUrl ? `
            <img src="${item.imageUrl}" alt="${item.name}" 
                 style="width: 64px; height: 64px; object-fit: cover; border-radius: 8px; margin-right: 16px;" />
          ` : `
            <div style="width: 64px; height: 64px; background: #f3f4f6; border-radius: 8px; margin-right: 16px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 24px;">📦</span>
            </div>
          `}
          <div>
            <p style="margin: 0; font-weight: 600; color: #111827;">${item.name}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">Quantité : ${item.quantity}</p>
          </div>
        </div>
      </td>
      <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb; text-align: right; vertical-align: top;">
        <p style="margin: 0; font-weight: 600; color: #111827;">${formatCurrency(item.totalPrice || item.unitPrice * item.quantity)}</p>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">${formatCurrency(item.unitPrice)} / unité</p>
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de commande</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header avec logo -->
    <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
      <div style="background: white; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 32px;">🚒</span>
      </div>
      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">Commande confirmée !</h1>
      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
        ${orderRef ? `Commande #${orderRef}` : 'Merci pour votre achat'}
      </p>
    </div>

    <!-- Corps principal -->
    <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      
      <!-- Message de bienvenue -->
      <p style="font-size: 16px; color: #374151; margin: 0 0 24px 0;">
        Bonjour <strong>${params.customerName || 'Cher client'}</strong>,
      </p>
      <p style="font-size: 16px; color: #374151; margin: 0 0 32px 0;">
        Merci pour votre commande ! Nous avons bien reçu votre paiement et notre équipe va 
        préparer vos articles dans les plus brefs délais.
      </p>

      <!-- Informations commande -->
      <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 32px;">
        <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
          <div>
            <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Date de commande</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #111827; font-weight: 500;">${orderDate}</p>
          </div>
          ${orderRef ? `
          <div>
            <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">N° de commande</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #111827; font-weight: 500;">#${orderRef}</p>
          </div>
          ` : ''}
          <div>
            <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Email</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #111827; font-weight: 500;">${params.customerEmail}</p>
          </div>
        </div>
      </div>

      <!-- Tableau des articles -->
      <h2 style="font-size: 18px; color: #111827; margin: 0 0 16px 0; font-weight: 600;">
        📦 Récapitulatif de votre commande
      </h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- Total -->
      <div style="margin-top: 24px; padding-top: 16px; border-top: 2px solid #111827;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 18px; font-weight: 700; color: #111827;">Total</span>
          <span style="font-size: 24px; font-weight: 700; color: #dc2626;">${formatCurrency(params.total)}</span>
        </div>
      </div>

      <!-- Prochaines étapes -->
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; padding: 24px; margin: 32px 0;">
        <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #92400e; font-weight: 600;">
          📋 Prochaines étapes
        </h3>
        <ol style="margin: 0; padding-left: 20px; color: #92400e;">
          <li style="margin-bottom: 8px;">Notre équipe va préparer votre commande</li>
          <li style="margin-bottom: 8px;">Nous vous contacterons pour organiser le retrait ou la livraison</li>
          <li style="margin-bottom: 0;">Vous recevrez un email quand votre commande sera prête</li>
        </ol>
      </div>

      <!-- Bouton suivi (optionnel) -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://pompiers34800.com'}/boutique" 
           style="display: inline-block; background: #dc2626; color: white; padding: 14px 28px; 
                  text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
          Retourner à la boutique
        </a>
      </div>

      <!-- Contact -->
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
          <strong>Besoin d'aide ?</strong>
        </p>
        <p style="margin: 0; font-size: 14px; color: #6b7280;">
          Répondez à cet email ou contactez-nous au <strong>04 67 96 XX XX</strong>
        </p>
      </div>

      <!-- Footer -->
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="margin: 0; font-size: 13px; color: #9ca3af;">
          <strong>Amicale des Sapeurs-Pompiers de Clermont-l'Hérault</strong><br>
          Association loi 1901 • Caserne des Sapeurs-Pompiers<br>
          34800 Clermont-l'Hérault
        </p>
        <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
          Merci pour votre soutien aux sapeurs-pompiers ! 🙏
        </p>
      </div>

    </div>
  </div>
</body>
</html>
  `.trim()
}
