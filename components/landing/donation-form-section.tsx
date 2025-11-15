'use client';

import { useState } from 'react';
import { Heart, CreditCard, Loader2 } from 'lucide-react';
import { createLandingDonation } from '@/app/actions/donations/create-landing-donation';

const PRESET_AMOUNTS = [20, 50, 100];

export function DonationFormSection() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorName, setDonorName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalAmount = selectedAmount || parseFloat(customAmount) || 0;

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    setError(null);
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (finalAmount <= 0) {
      setError('Veuillez sélectionner un montant');
      return;
    }

    if (finalAmount > 10000) {
      setError('Le montant maximum est de 10 000€');
      return;
    }

    if (!donorEmail.trim()) {
      setError('Veuillez renseigner votre email pour recevoir le reçu fiscal');
      return;
    }

    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(donorEmail.trim())) {
      setError('Format d\'email invalide');
      return;
    }

    setIsLoading(true);

    try {
      const result = await createLandingDonation({
        amount: finalAmount,
        donorEmail: donorEmail.trim(),
        donorName: donorName.trim() || undefined,
      });

      if ('error' in result && result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if ('url' in result && result.url) {
        // Redirection vers Stripe Checkout
        window.location.href = result.url;
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-brandTurquoise text-white rounded-lg p-6 md:p-8">
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <Heart className="w-6 h-6 md:w-8 md:h-8" />
        <h3 className="font-montserrat text-xl md:text-2xl font-bold">
          Soutenez-nous
        </h3>
      </div>

      <p className="text-white/90 mb-6 md:mb-8 leading-relaxed text-sm md:text-base">
        Votre don nous aide à maintenir nos activités, organiser des événements et soutenir nos membres.
        Chaque contribution compte et fait la différence.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h4 className="font-semibold text-lg mb-4">Choisissez votre montant</h4>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {PRESET_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handlePresetClick(amount)}
                className={`font-bold py-3 rounded-lg transition-all ${
                  selectedAmount === amount
                    ? 'bg-brandOrange text-white scale-105 shadow-lg'
                    : 'bg-white text-brandTurquoise hover:scale-105'
                }`}
              >
                {amount}€
              </button>
            ))}
          </div>

          <input
            type="number"
            min="1"
            max="10000"
            step="0.01"
            placeholder="Montant personnalisé"
            value={customAmount}
            onChange={(e) => handleCustomAmountChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg text-gray-800 focus:ring-2 focus:ring-white focus:outline-none"
          />
        </div>

        <div className="space-y-3">
          <input
            type="email"
            required
            placeholder="Votre email *"
            value={donorEmail}
            onChange={(e) => setDonorEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg text-gray-800 focus:ring-2 focus:ring-white focus:outline-none"
          />

          <input
            type="text"
            placeholder="Votre nom (optionnel)"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg text-gray-800 focus:ring-2 focus:ring-white focus:outline-none"
          />
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-300 text-white px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || finalAmount <= 0 || !donorEmail.trim()}
          className="w-full bg-white text-brandTurquoise font-bold py-4 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Redirection vers le paiement...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Faire un don par carte{finalAmount > 0 ? ` (${finalAmount.toFixed(2)}€)` : ''}
            </>
          )}
        </button>

        <p className="text-xs text-white/70 text-center">
          Paiement sécurisé par Stripe • Un reçu fiscal vous sera envoyé par email
        </p>
      </form>
    </div>
  );
}
