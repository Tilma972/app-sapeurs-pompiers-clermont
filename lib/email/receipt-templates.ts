export type ReceiptEmailParams = {
  supporterName?: string | null;
  amount: number;
  receiptNumber?: string | null;
  transactionType: 'fiscal' | 'soutien';
};

export function buildSubject(params: ReceiptEmailParams) {
  const typeLabel = params.transactionType === 'fiscal' ? 'Reçu fiscal' : 'Reçu de soutien';
  const who = params.supporterName ? ` • ${params.supporterName}` : '';
  return `${typeLabel}${who}`;
}

export function buildText(params: ReceiptEmailParams) {
  const amount = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(params.amount);
  const rn = params.receiptNumber ? `Numéro de reçu: ${params.receiptNumber}\n` : '';
  const typeLine = params.transactionType === 'fiscal'
    ? 'Type: Don fiscal (éligible à 66% de déduction)'
    : 'Type: Soutien (sans déduction)';
  return [
    'Merci pour votre générosité.\n',
    `${typeLine}`,
    `Montant: ${amount}`,
    rn,
    '\nAmicale des Sapeurs-Pompiers',
  ].join('\n');
}

export function buildHtml(params: ReceiptEmailParams) {
  const amountFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(params.amount)
  const deduction = Math.round(params.amount * 0.66)
  const deductionFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(deduction)
  const receiptUrl = params.receiptNumber
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/recu/${params.receiptNumber}`
    : null

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🎉 Merci pour votre générosité !</h1>
      </div>

      <div style="background: white; padding: 40px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          Bonjour <strong>${params.supporterName || 'Généreux donateur'}</strong>,
        </p>

        <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
          Nous vous remercions chaleureusement pour votre don de <strong style="color: #667eea; font-size: 20px;">${amountFmt}</strong> à l'Amicale des Sapeurs-Pompiers de Clermont-l'Hérault.
        </p>

        ${params.transactionType === 'fiscal' ? `
        <!-- Avantage fiscal -->
        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left: 4px solid #22c55e; padding: 20px; margin: 30px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #166534; font-weight: bold;">
            💰 REÇU FISCAL
          </p>
          <p style="margin: 10px 0 0 0; font-size: 18px; color: #15803d; font-weight: bold;">
            Déduction d'impôt : ${deductionFmt}
          </p>
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #15803d;">
            (66% de votre don, conformément à l'article 200 du CGI)
          </p>
        </div>` : ''}

        ${receiptUrl ? `
          <!-- Bouton reçu -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${receiptUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              📄 Télécharger mon reçu fiscal
            </a>
            <p style="margin: 12px 0 0 0; font-size: 13px; color: #6b7280;">
              Conservez ce reçu pour votre déclaration d'impôts
            </p>
          </div>
        ` : ''}

        <!-- Info pratique -->
        <div style="background: #f9fafb; padding: 16px; margin: 30px 0; border-radius: 4px; border: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 14px; color: #374151;">
            <strong>📌 Bon à savoir</strong><br>
            Ce reçu fiscal est valable pour votre déclaration d'impôts ${new Date().getFullYear() + 1}. 
            Vous pouvez le télécharger et l'imprimer à tout moment depuis le lien ci-dessus.
          </p>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 13px; margin: 0;">
            <strong>Amicale des Sapeurs-Pompiers de Clermont-l'Hérault</strong><br>
            Association loi 1901<br>
            Caserne des Sapeurs-Pompiers, 34800 Clermont-l'Hérault
          </p>
        </div>
      </div>
    </div>
  `
}
