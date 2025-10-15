"use client";

import { motion } from "framer-motion";
import { PremiumIcon } from "@/components/landing/premium-icon";
import { Quote, Star, Heart } from "lucide-react";

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
  },
  {
    name: "Famille R.",
    location: "Région",
    message: "L'amicale a été d'un soutien précieux pendant les moments difficiles. Nous ne les remercions jamais assez.",
    rating: 5,
    type: "famille"
  }
];

export function TestimonialsSection() {
  return (
    <section id="temoignages" className="py-20 bg-gradient-to-br from-slate-100 via-red-50 to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-6">
            <PremiumIcon
              icon={Heart}
              variant="gradient"
              size="lg"
              className="icon-heart"
            />
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Témoignages & Remerciements
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Les messages de reconnaissance de nos concitoyens et des familles que nous accompagnons
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass-card p-8 relative"
            >
              {/* Quote icon */}
              <div className="absolute top-6 right-6">
                <PremiumIcon
                  icon={Quote}
                  variant="minimal"
                  size="sm"
                  className="text-primary/30"
                />
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current text-amber-400" />
                ))}
              </div>

              {/* Message */}
              <blockquote className="text-muted-foreground leading-relaxed mb-6 italic">
                &ldquo;{testimonial.message}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  testimonial.type === 'famille' 
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                }`}>
                  {testimonial.type === 'famille' ? 'Famille' : 'Citoyen'}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Votre témoignage nous touche
            </h3>
            <p className="text-muted-foreground mb-6">
              Chaque message de reconnaissance nous motive à continuer notre mission
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Laisser un témoignage
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


