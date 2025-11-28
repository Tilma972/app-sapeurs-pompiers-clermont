import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend-client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validation des champs
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email invalide" },
        { status: 400 }
      );
    }

    // Limitation de la longueur des champs
    if (name.length > 100 || email.length > 100 || subject.length > 200 || message.length > 2000) {
      return NextResponse.json(
        { error: "Un ou plusieurs champs dépassent la longueur maximale autorisée" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Insertion dans la base de données
    const { data, error } = await supabase
      .from("contact_messages")
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de l'insertion du message de contact:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi du message" },
        { status: 500 }
      );
    }

    // Envoi de l'email de notification aux admins
    let adminEmail = process.env.CONTACT_EMAIL || process.env.RESEND_FROM || "contact@pompiers34800.com";
    adminEmail = adminEmail.trim();

    console.log("Tentative d'envoi d'email de contact à:", adminEmail);

    await sendEmail({
      to: adminEmail,
      subject: `[Contact] ${subject}`,
      html: `
        <h2>Nouveau message de contact</h2>
        <p><strong>De:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p>
        <p><strong>Sujet:</strong> ${subject}</p>
        <hr />
        <h3>Message:</h3>
        <p style="white-space: pre-wrap;">${message}</p>
      `,
      replyTo: email
    });

    return NextResponse.json(
      {
        success: true,
        message: "Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.",
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur dans l'API contact:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'envoi du message" },
      { status: 500 }
    );
  }
}
