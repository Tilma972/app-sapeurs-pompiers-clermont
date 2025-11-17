"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Building2, CalendarDays, Handshake, Mail, Phone, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function DevenirPartenairePage() {
  return (
    <div className="py-8">
      {/* Bouton retour */}
      <div className="container max-w-6xl mx-auto px-4 mb-6">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" /> Retour à l&apos;accueil
          </Link>
        </Button>
      </div>

      {/* Hero simplifié */}
      <section className="container max-w-6xl mx-auto px-4 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Devenir partenaire</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Renforcez votre visibilité locale tout en soutenant nos actions solidaires.
            Votre publicité sur 5 000+ calendriers distribués dans la région.
          </p>
          <Button size="lg" asChild>
            <a href="#devis" className="gap-2">
              <Mail className="h-5 w-5" /> Demander un devis
            </a>
          </Button>
        </motion.div>
      </section>

      {/* Bénéfices */}
      <section className="container max-w-6xl mx-auto px-4 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {[
            {
              title: "Ancrage local puissant",
              desc: "Votre message chez 5 000+ foyers de Clermont-l'Hérault et alentours.",
              icon: Building2,
            },
            {
              title: "Visibilité durable",
              desc: "Présence toute l'année (calendrier), vue quotidiennement.",
              icon: CalendarDays,
            },
            {
              title: "Image solidaire",
              desc: "Associez votre entreprise aux valeurs de proximité et d'entraide.",
              icon: Handshake,
            },
            {
              title: "Soutien concret",
              desc: "Votre participation finance nos actions sociales et associatives.",
              icon: Check,
            },
          ].map((b, i) => (
            <Card key={i} className="p-6">
              <div className="flex items-start gap-3">
                <b.icon className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">{b.title}</h3>
                  <p className="text-muted-foreground">{b.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </motion.div>
      </section>

      {/* Formulaire de demande */}
      <section id="devis" className="container max-w-3xl mx-auto px-4 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Demander un devis</h2>
          <Card className="p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const data = new FormData(form);
                const selectedFormats = Array.from(
                  (form.querySelectorAll('input[name="formats"]:checked') as unknown as HTMLInputElement[]) || []
                ).map((el) => el.value).join(', ');

                const selectedMonths = Array.from(
                  (form.querySelectorAll('input[name="months"]:checked') as unknown as HTMLInputElement[]) || []
                ).map((el) => el.value).join(', ');

                const payload = {
                  company: data.get("company"),
                  contact: data.get("contact"),
                  email: data.get("email"),
                  phone: data.get("phone"),
                  formats: selectedFormats,
                  months: selectedMonths,
                  message: data.get("message"),
                } as Record<string, FormDataEntryValue | null>;
                const subject = encodeURIComponent("Demande devis partenariat");
                const body = encodeURIComponent(
                  `Entreprise: ${payload.company}\nContact: ${payload.contact}\nEmail: ${payload.email}\nTéléphone: ${payload.phone}\nFormats souhaités: ${payload.formats}\nMois de parution: ${payload.months}\nMessage:\n${payload.message}`
                );
                window.location.href = `mailto:contact@pompiers34800.com?subject=${subject}&body=${body}`;
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <Label htmlFor="company">Entreprise</Label>
                <Input id="company" name="company" placeholder="Nom de l'entreprise" required />
              </div>
              <div>
                <Label htmlFor="contact">Interlocuteur</Label>
                <Input id="contact" name="contact" placeholder="Nom et prénom" required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="nom@domaine.fr" required />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" name="phone" placeholder="04 67 44 99 70" />
              </div>
              <div className="md:col-span-2">
                <Label>Formats souhaités</Label>
                <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                  {[
                    { id: "f64", label: "6×4 cm" },
                    { id: "f68", label: "6×8 cm" },
                    { id: "f124", label: "12×4 cm" },
                  ].map((f) => (
                    <label key={f.id} className="flex items-center gap-2">
                      <Checkbox id={f.id} name="formats" value={f.label} />
                      <span>{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>Mois de parution envisagés</Label>
                <div className="mt-2 grid grid-cols-4 gap-2 text-sm">
                  {["JAN","FEV","MAR","AVR","MAI","JUN","JUL","AOU","SEP","OCT","NOV","DEC"].map((m) => (
                    <label key={m} className="flex items-center gap-2">
                      <Checkbox id={`m-${m}`} name="months" value={m} />
                      <span>{m}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" placeholder="Votre projet, budget indicatif, questions..." rows={5} />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3">
                <Button type="submit">
                  <Mail className="mr-2 h-5 w-5" /> Envoyer la demande
                </Button>
                <Button variant="outline" asChild>
                  <a href="tel:+33467449970"><Phone className="mr-2 h-5 w-5" /> 04 67 44 99 70</a>
                </Button>
              </div>
              <p className="md:col-span-2 mt-3 text-xs text-muted-foreground">
                En envoyant ce formulaire, vous acceptez que vos données soient utilisées pour vous recontacter. Aucune donnée n&apos;est stockée sur notre site.
              </p>
            </form>
          </Card>
        </motion.div>
      </section>

      {/* En pratique - Formats & Process fusionnés */}
      <section className="container max-w-6xl mx-auto px-4 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">En pratique</h2>
          <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            Choisissez votre format, envoyez votre visuel et touchez des milliers de foyers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { title: "6×4 cm", desc: "Format standard. Logo + coordonnées essentielles." },
              { title: "6×8 cm", desc: "Double hauteur. Plus d'espace pour votre message." },
              { title: "12×4 cm", desc: "Bandeau horizontal. Maximum de visibilité." },
            ].map((f) => (
              <Card key={f.title} className="p-6 text-center">
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            {[
              { n: "1", t: "Choisissez" },
              { n: "2", t: "Envoyez" },
              { n: "3", t: "Validez" },
              { n: "4", t: "Distribuez" },
            ].map((s) => (
              <div key={s.n} className="flex flex-col items-center">
                <div className="mb-2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                  {s.n}
                </div>
                <span className="text-muted-foreground">{s.t}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA final simplifié */}
      <section className="container max-w-6xl mx-auto px-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-4">Une question ? Contactez-nous</p>
          <Button variant="outline" asChild>
            <a href="tel:+33467449970" className="gap-2">
              <Phone className="h-5 w-5" /> 04 67 44 99 70
            </a>
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
