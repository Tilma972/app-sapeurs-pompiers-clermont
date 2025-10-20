"use client";

import { motion } from "framer-motion";
import { PremiumIcon } from "@/components/landing/premium-icon";
import { Star, Heart } from "lucide-react";
import { UnifiedCard } from "@/components/landing/unified-card";

const testimonials = [
  {
    name: "Marie L.",
    location: "Clermont l'Hérault",
    message: "Un grand merci à l'amicale pour son soutien lors de l'accident de mon mari. Votre solidarité nous a beaucoup aidés.",
    rating: 5,
    type: "famille"
  },
  {
    name: "Jean-Pierre M.",
    location: "Ville voisine",
    message: "Les actions de prévention organisées par l'amicale sont remarquables. Elles nous sensibilisent aux gestes qui sauvent.",
    rating: 5,
    type: "citoyen"
  },
  {
    name: "Sophie D.",
    location: "Clermont l'Hérault",
    message: "L'organisation des événements associatifs crée une vraie cohésion dans notre communauté. Bravo pour cette initiative !",
    rating: 5,
    type: "citoyen"
  }
];

export function TestimonialsSection() {
  return (
    <section id="temoignages" className="py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-2">
            <PremiumIcon icon={Heart} variant="gradient" size="md" className="icon-heart" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Témoignages</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ce que disent nos membres et la communauté
          </p>
        </motion.div>

        {/* Grille cohérente avec les autres sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <UnifiedCard
              key={index}
              variant="testimonial"
              title={testimonial.name}
              subtitle={testimonial.location}
              description={testimonial.message}
              badge={testimonial.type === 'famille' ? 'Famille' : 'Citoyen'}
              className="h-full"
            >
              <div className="flex items-center gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current text-amber-400" />
                ))}
              </div>
            </UnifiedCard>
          ))}
        </div>
      </div>
    </section>
  );
}


