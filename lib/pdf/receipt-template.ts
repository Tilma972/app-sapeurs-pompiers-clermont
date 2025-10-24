export type ReceiptTemplateData = {
  receiptNumber: string
  donorName?: string | null
  amount: number
  calendarGiven?: boolean
  issuedAt?: string
}

export function buildReceiptHtml(data: ReceiptTemplateData) {
  const amountFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(data.amount)
  const issued = data.issuedAt ? new Date(data.issuedAt) : new Date()
  const issuedFmt = issued.toLocaleDateString('fr-FR')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charSet="utf-8" />
  <title>Reçu fiscal ${data.receiptNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; }
    .card { max-width: 720px; margin: 24px auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 20px; font-weight: 700; }
    .muted { color: #6b7280; }
    .section { margin-top: 16px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 6px 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">Reçu fiscal</div>
      <div class="muted">N° ${data.receiptNumber}</div>
    </div>
    <div class="section">
      <table>
        <tr><td><strong>Donateur</strong></td><td>${data.donorName || '—'}</td></tr>
        <tr><td><strong>Montant</strong></td><td>${amountFmt}</td></tr>
        <tr><td><strong>Date</strong></td><td>${issuedFmt}</td></tr>
        <tr><td><strong>Calendrier remis</strong></td><td>${data.calendarGiven ? 'Oui' : 'Non'}</td></tr>
      </table>
    </div>
    <div class="section muted" style="font-size: 12px;">
      Conforme à l'article 200 du CGI (déduction 66%).
    </div>
  </div>
</body>
</html>`
}
