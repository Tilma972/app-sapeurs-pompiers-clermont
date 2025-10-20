"use client";

import { PremiumIcon } from "@/components/landing/premium-icon";
import { Star, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
// If carousel is not installed yet, we will add it via shadcn. For now, keep a simple horizontal scroll as a fallback.
// import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

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
    <section id="temoignages" className="py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <PremiumIcon icon={Heart} variant="gradient" size="md" className="icon-heart" />
          </div>
          <h2 className="text-2xl font-bold">Témoignages</h2>
        </div>

        {/* Fallback simple horizontal scroll carousel */}
        <div className="overflow-x-auto hide-scrollbar">
          <div className="flex gap-4 snap-x snap-mandatory">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="min-w-[85%] md:min-w-[40%] p-4 snap-center">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current text-amber-400" />
                  ))}
                </div>
                <blockquote className="text-sm text-muted-foreground italic mb-4">“{testimonial.message}”</blockquote>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    testimonial.type === 'famille'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                  }`}>
                    {testimonial.type === 'famille' ? 'Famille' : 'Citoyen'}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


