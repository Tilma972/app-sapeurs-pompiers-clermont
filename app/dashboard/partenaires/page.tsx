export default function PartenairesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Partenaires & Avantages</h1>
      <p className="text-muted-foreground">
        Offres locales et avantages — données moquées pour l&apos;instant.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1,2,3].map((i) => (
          <div key={i} className="border border-border rounded-lg p-4 bg-card">
            <div className="font-medium">Partenaire #{i}</div>
            <div className="text-sm text-muted-foreground">Catégorie • Offre</div>
          </div>
        ))}
      </div>
    </div>
  );
}
