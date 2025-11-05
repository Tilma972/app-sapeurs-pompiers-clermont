export default function MerciPage() {
  return (
    <div className="max-w-xl mx-auto py-16 px-4 text-center">
      <h1 className="text-2xl font-bold">Merci pour votre soutien 🙏</h1>
      <p className="text-muted-foreground mt-2">Votre paiement a été pris en compte.</p>
      <div className="mt-6">
        <a href="/dashboard/ma-tournee" className="text-blue-600 underline">Retour à ma tournée</a>
      </div>
    </div>
  )
}
