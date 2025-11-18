import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Mentions Légales | Amicale des Sapeurs-Pompiers de Clermont-l\'Hérault',
  description: 'Mentions légales et informations sur l\'éditeur du site de l\'Amicale des Sapeurs-Pompiers de Clermont-l\'Hérault',
  robots: { index: false, follow: false }, // Pas d'indexation des pages légales
};

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-darkBg py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bouton retour */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l&apos;accueil</span>
        </Link>

        {/* Contenu */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold text-brandBrown dark:text-darkText mb-8">
            Mentions Légales
          </h1>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-brandBrown dark:text-darkText mb-4">
              1. Éditeur du site
            </h2>
            <p className="text-brandBrown/80 dark:text-darkText/90 leading-relaxed">
              Le site <strong>pompiers34800.com</strong> est édité par :
            </p>
            <p className="text-brandBrown/80 dark:text-darkText/90 leading-relaxed">
              <strong>Amicale des Sapeurs-Pompiers de Clermont-l&apos;Hérault</strong><br />
              Association loi 1901<br />
              Siège social : Caserne des Sapeurs-Pompiers, 15 Rue du Sauvignon, 34800 Clermont-l&apos;Hérault<br />
              Email : <a href="mailto:contact@pompiers34800.com" className="text-primary hover:underline">contact@pompiers34800.com</a><br />
              Téléphone : <a href="tel:+33467449970" className="text-primary hover:underline">04 67 44 99 70</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-brandBrown dark:text-darkText mb-4">
              2. Directeur de la publication
            </h2>
            <p className="text-brandBrown/80 dark:text-darkText/90 leading-relaxed">
              Le directeur de la publication est le Président de l&apos;Amicale des Sapeurs-Pompiers de Clermont-l&apos;Hérault.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-brandBrown dark:text-darkText mb-4">
              3. Hébergement du site
            </h2>
            <p className="text-brandBrown/80 dark:text-darkText/90 leading-relaxed">
              Le site est hébergé par :<br />
              <strong>Vercel Inc.</strong><br />
              340 S Lemon Ave #4133, Walnut, CA 91789, USA<br />
              Site web : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://vercel.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-brandBrown dark:text-darkText mb-4">
              4. Propriété intellectuelle
            </h2>
            <p className="text-brandBrown/80 dark:text-darkText/90 leading-relaxed">
              L&apos;ensemble des contenus présents sur ce site (textes, images, logos, vidéos) est la propriété exclusive de l&apos;Amicale des Sapeurs-Pompiers de Clermont-l&apos;Hérault, sauf mention contraire.
            </p>
            <p className="text-brandBrown/80 dark:text-darkText/90 leading-relaxed">
              Toute reproduction, distribution, modification, adaptation, retransmission ou publication de ces éléments est strictement interdite sans l&apos;accord écrit préalable de l&apos;Amicale.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-brandBrown dark:text-darkText mb-4">
              5. Protection des données personnelles (RGPD)
            </h2>
            <p className="text-brandBrown/80 dark:text-darkText/90 leading-relaxed">
              Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez d&apos;un droit d&apos;accès, de rectification, de suppression et de portabilité de vos données personnelles.
            </p>
            <p className="text-brandBrown/80 dark:text-darkText/90 leading-relaxed">
              Pour exercer ces droits, vous pouvez nous contacter à l&apos;adresse : <a href="mailto:contact@pompiers34800.com" className="text-primary hover:underline">contact@pompiers34800.com</a>
            </p>
            <p className="text-brandBrown/80 dark:text-darkText/90 leading-relaxed">
              Les données collectées via le formulaire de contact sont utilisées uniquement pour répondre à vos demandes et ne sont jamais partagées avec des tiers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-brandBrown dark:text-darkText mb-4">
              6. Cookies
            </h2>
            <p className="text-brandBrown/80 dark:text-darkText/90 leading-relaxed">
              Ce site utilise des cookies techniques nécessaires au bon fonctionnement du site (préférence de thème clair/sombre).
            </p>
            <p className="text-brandBrown/80 dark:text-darkText/90 leading-relaxed">
              Aucun cookie de suivi ou de publicité n&apos;est utilisé. Vous pouvez désactiver les cookies via les paramètres de votre navigateur.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-brandBrown dark:text-darkText mb-4">
              7. Limitation de responsabilité
            </h2>
            <p className="text-brandBrown/80 dark:text-darkText/90 leading-relaxed">
              L&apos;Amicale des Sapeurs-Pompiers de Clermont-l&apos;Hérault s&apos;efforce d&apos;assurer l&apos;exactitude des informations diffusées sur ce site, mais ne peut garantir l&apos;exhaustivité, la précision ou l&apos;actualité des contenus.
            </p>
            <p className="text-brandBrown/80 dark:text-darkText/90 leading-relaxed">
              L&apos;Amicale ne pourra être tenue responsable des dommages directs ou indirects résultant de l&apos;utilisation de ce site.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-brandBrown dark:text-darkText mb-4">
              8. Droit applicable
            </h2>
            <p className="text-brandBrown/80 dark:text-darkText/90 leading-relaxed">
              Les présentes mentions légales sont régies par le droit français. Tout litige relatif à l&apos;utilisation de ce site sera soumis à la compétence exclusive des tribunaux français.
            </p>
          </section>

          <p className="text-sm text-muted-foreground mt-12">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}
