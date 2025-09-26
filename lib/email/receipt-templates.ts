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
  const amount = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(params.amount);
  const rn = params.receiptNumber ? `<p style="margin:8px 0">Numéro de reçu: <b>${params.receiptNumber}</b></p>` : '';
  const typeLine = params.transactionType === 'fiscal'
    ? 'Don fiscal (éligible à 66% de déduction)'
    : 'Soutien (sans déduction)';
  return `
  <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a">
    <h2 style="margin:0 0 12px">Merci pour votre générosité</h2>
    <p style="margin:8px 0">Type: <b>${typeLine}</b></p>
    <p style="margin:8px 0">Montant: <b>${amount}</b></p>
    ${rn}
    <hr style="border:none;height:1px;background:#e2e8f0;margin:16px 0" />
    <p style="margin:8px 0">Amicale des Sapeurs-Pompiers</p>
  </div>`;
}
