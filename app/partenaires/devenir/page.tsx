"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Building2, CalendarDays, Handshake, Mail, Phone, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { PrimaryCta } from "@/components/landing/primary-cta";

export default function DevenirPartenairePage() {
  const router = useRouter();
  return (
    <main className="py-12">
      {/* Bouton retour */}
      <div className="container max-w-6xl mx-auto px-4 mb-3">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" /> Retour à l&apos;accueil
          </Link>
        </Button>
      </div>
      {/* Hero */}
      <section className="container max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-10 relative"
        >
          <div className="absolute left-0 -top-2 md:-top-4">
            <div className="relative w-24 h-24 md:w-40 md:h-40">
              <Image
                src="https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/logo/logo_amicale.svg"
                alt="Logo Amicale des Sapeurs-Pompiers"
                fill
                sizes="160px"
                className="object-contain"
                priority
              />
            </div>
          </div>
          <Badge variant="outline" className="mb-3">Partenariats</Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Devenir partenaire de l&apos;Amicale</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Renforcez votre présence locale tout en soutenant nos actions solidaires.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <PrimaryCta href="#devis"><span className="inline-flex items-center"><Mail className="mr-2 h-5 w-5" /> Demander un devis</span></PrimaryCta>
            <PrimaryCta href="tel:+33467449970" variant="outline"><span className="inline-flex items-center"><Phone className="mr-2 h-5 w-5" /> 04 67 44 99 70</span></PrimaryCta>
          </div>
        </motion.div>
      </section>

      {/* Bénéfices */}
      <section className="container max-w-6xl mx-auto px-4">
        {/* Bandeau métriques */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-6 rounded-xl border bg-background/60 backdrop-blur px-4 py-5"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { v: "5 000+", l: "Calendriers" },
              { v: "20 000", l: "Habitants touchés*" },
              { v: "365", l: "Jours visibles" },
              { v: "~2¢", l: "Coût / contact*" },
            ].map((m) => (
              <div key={m.v} className="rounded-lg border p-3">
                <div className="text-2xl font-bold text-primary">{m.v}</div>
                <div className="text-xs text-muted-foreground mt-1">{m.l}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground text-center">*Estimations locales. Coût par contact calculé sur format 6×4 cm.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10"
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
      <section id="devis" className="container max-w-3xl mx-auto px-4 mt-10 mb-12 md:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Demander un devis</h2>
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
                window.location.href = `mailto:contact@amicale-sp-clermont.fr?subject=${subject}&body=${body}`;
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
                En envoyant ce formulaire, vous acceptez que vos données soient utilisées pour vous recontacter. Aucune donnée n'est stockée sur notre site.
              </p>
            </form>
          </Card>
        </motion.div>
      </section>

      {/* Formats sans prix */}
      <section className="container max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Formats proposés</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "6×4 cm", desc: "Logo + coordonnées. Format standard et efficace." },
              { title: "6×8 cm", desc: "Plus d'espace pour visuel ou détails de l'offre." },
              { title: "12×4 cm", desc: "Bandeau horizontal pour forte présence." },
            ].map((f) => (
              <Card key={f.title} className="p-6 flex flex-col">
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground mb-4">{f.desc}</p>
                <div className="mt-auto text-sm text-muted-foreground">Tarifs sur demande</div>
              </Card>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Process */}
      <section className="container max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          viewport={{ once: true }}
          className="mt-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Comment ça marche ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { n: 1, t: "Choisissez", d: "Sélectionnez le format et la période." },
              { n: 2, t: "Validez", d: "Envoyez votre visuel, on prépare le BAT." },
              { n: 3, t: "Imprimez", d: "Intégration puis impression du calendrier." },
              { n: 4, t: "Distribuez", d: "5 000+ foyers dès décembre." },
            ].map((s) => (
              <Card key={s.n} className="p-6 text-center">
                <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                  {s.n}
                </div>
                <h3 className="font-semibold mb-1">{s.t}</h3>
                <p className="text-sm text-muted-foreground">{s.d}</p>
              </Card>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA final */}
      <section className="container max-w-6xl mx-auto px-4 mt-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Prêt à démarrer ?</h2>
          <p className="text-muted-foreground mb-5">Contactez-nous pour recevoir une proposition personnalisée.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="mailto:contact@amicale-sp-clermont.fr">
                <Mail className="mr-2 h-5 w-5" /> Demander un devis
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="tel:+33467449970">
                <Phone className="mr-2 h-5 w-5" /> 04 67 44 99 70
              </a>
            </Button>
          </div>
        </motion.div>
      </section>
    </main>
  );
}


