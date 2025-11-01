'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Heart, CreditCard, Banknote } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';

export function ContactSection() {
  const [titleRef, titleInView] = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  const [formRef, formInView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const [infoRef, infoInView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const mailtoLink = `mailto:contact@amicale-sp-clermont.fr?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Nom: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`)}`;
    window.location.href = mailtoLink;
    
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <section id="contact" className="py-12 md:py-20 bg-white dark:bg-darkBg transition-colors">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={titleRef}
          className="text-center mb-8 md:mb-16"
          variants={fadeInUp}
          initial="hidden"
          animate={titleInView ? "visible" : "hidden"}
        >
          <h2 className="font-montserrat text-2xl md:text-4xl font-bold text-brandBrown dark:text-darkText mb-3 md:mb-4">
            Contact & Dons
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-darkText/80 max-w-2xl mx-auto">
            Une question ? Envie de nous soutenir ? Contactez-nous ou faites un don
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          <motion.div
            ref={formRef}
            className="bg-brandCream dark:bg-darkSurface rounded-lg p-6 md:p-8"
            variants={fadeInUp}
            initial="hidden"
            animate={formInView ? "visible" : "hidden"}
          >
            <h3 className="font-montserrat text-xl md:text-2xl font-bold text-brandBrown dark:text-darkText mb-4 md:mb-6">
              Envoyez-nous un message
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-darkText mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-darkBorder dark:bg-darkBg dark:text-darkText rounded-lg focus:ring-2 focus:ring-brandRed focus:border-transparent transition-all"
                  placeholder="Votre nom"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-darkText mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-darkBorder dark:bg-darkBg dark:text-darkText rounded-lg focus:ring-2 focus:ring-brandRed focus:border-transparent transition-all"
                  placeholder="votre.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-darkText mb-2">
                  Sujet *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-darkBorder dark:bg-darkBg dark:text-darkText rounded-lg focus:ring-2 focus:ring-brandRed focus:border-transparent transition-all"
                  placeholder="Objet de votre message"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-darkText mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-darkBorder dark:bg-darkBg dark:text-darkText rounded-lg focus:ring-2 focus:ring-brandRed focus:border-transparent transition-all resize-none"
                  placeholder="Votre message..."
                />
              </div>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                <Send className="w-5 h-5" />
              </motion.button>
            </form>

            <motion.div
              className="mt-8 pt-8 border-t border-gray-300 dark:border-darkBorder space-y-4"
              variants={staggerContainer}
              initial="hidden"
              animate={formInView ? "visible" : "hidden"}
            >
              <motion.div className="flex items-start gap-3" variants={staggerItem}>
                <MapPin className="w-5 h-5 text-primary dark:text-brandOrange mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-brandBrown dark:text-darkText">Adresse</p>
                  <p className="text-gray-600 dark:text-darkText/80">Caserne des Sapeurs-Pompiers</p>
                  <p className="text-gray-600 dark:text-darkText/80">34800 Clermont-l&apos;Hérault</p>
                </div>
              </motion.div>

              <motion.div className="flex items-start gap-3" variants={staggerItem}>
                <Phone className="w-5 h-5 text-primary dark:text-brandOrange mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-brandBrown dark:text-darkText">Téléphone</p>
                  <p className="text-gray-600 dark:text-darkText/80">04 67 44 99 70</p>
                </div>
              </motion.div>

              <motion.div className="flex items-start gap-3" variants={staggerItem}>
                <Mail className="w-5 h-5 text-primary dark:text-brandOrange mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-brandBrown dark:text-darkText">Email</p>
                  <p className="text-gray-600 dark:text-darkText/80">contact@amicale-sp-clermont.fr</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            ref={infoRef}
            className="space-y-8"
            variants={fadeInUp}
            initial="hidden"
            animate={infoInView ? "visible" : "hidden"}
          >
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

              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h4 className="font-semibold text-lg mb-4">Choisissez votre montant</h4>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <button className="bg-white text-brandTurquoise font-bold py-3 rounded-lg hover:scale-105 transition-transform">
                      20€
                    </button>
                    <button className="bg-white text-brandTurquoise font-bold py-3 rounded-lg hover:scale-105 transition-transform">
                      50€
                    </button>
                    <button className="bg-white text-brandTurquoise font-bold py-3 rounded-lg hover:scale-105 transition-transform">
                      100€
                    </button>
                  </div>
                  <input
                    type="number"
                    placeholder="Montant personnalisé"
                    className="w-full px-4 py-3 rounded-lg text-gray-800 focus:ring-2 focus:ring-white"
                  />
                </div>

                <button className="w-full bg-white text-brandTurquoise font-bold py-4 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Faire un don par carte
                </button>

                <button className="w-full bg-white/20 text-white font-bold py-4 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center gap-2">
                  <Banknote className="w-5 h-5" />
                  Virement bancaire
                </button>
              </div>
            </div>

            <div className="bg-brandCream rounded-lg p-6 border-l-4 border-brandOrange">
              <h4 className="font-montserrat font-bold text-brandBrown mb-3">
                 Avantages fiscaux
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Vos dons sont déductibles à hauteur de 66% de leur montant dans la limite de 20% de votre revenu imposable. 
                Un reçu fiscal vous sera automatiquement envoyé.
              </p>
            </div>

            <div className="bg-brandCream rounded-lg p-6">
              <h4 className="font-montserrat font-bold text-brandBrown mb-4">
                Autres façons de nous aider
              </h4>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-brandRed">•</span>
                  <span>Devenez membre de l&apos;amicale</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brandRed"></span>
                  <span>Participez à nos événements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brandRed"></span>
                  <span>Partagez notre calendrier annuel</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brandRed">•</span>
                  <span>Devenez partenaire de l&apos;amicale</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
