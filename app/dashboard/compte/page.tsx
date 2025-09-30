export default function ComptePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Mon Compte SP</h1>
      <p className="text-muted-foreground">
        Portefeuille, demandes de paiement, et historique — données moquées pour l&apos;instant.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="text-sm text-muted-foreground">Solde</div>
          <div className="text-2xl font-semibold">€ 0</div>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="text-sm text-muted-foreground">Demandes en cours</div>
          <div className="text-2xl font-semibold">0</div>
        </div>
      </div>
    </div>
  );
}
