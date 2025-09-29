import { createLogger } from "@/lib/log";

const log = createLogger('email/resend');

type SendEmailInput = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string; // Optional override like "Name <email@domain>"
  replyTo?: string; // Optional reply-to address
};

function getEnv() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM || 'no-reply@example.com';
  const fromName = process.env.RESEND_FROM_NAME || 'Amicale des Sapeurs-Pompiers';
  const replyTo = process.env.RESEND_REPLY_TO || process.env.RESEND_FROM || undefined;
  // Compose a proper RFC5322 mailbox: "Display Name <email@domain>"
  const defaultFrom = `${fromName} <${fromEmail}>`;
  return { apiKey, defaultFrom, replyTo };
}

export async function sendEmail(input: SendEmailInput) {
  const { apiKey, defaultFrom, replyTo } = getEnv();
  if (!apiKey) {
    log.warn('RESEND_API_KEY manquant, envoi email ignoré', { to: input.to, subject: input.subject });
    return { success: false, skipped: true as const };
  }

  const payload: Record<string, unknown> = {
    from: input.from || defaultFrom,
    to: [input.to],
    subject: input.subject,
    html: input.html,
    text: input.text,
  };

  const effectiveReplyTo = input.replyTo || replyTo;
  if (effectiveReplyTo) {
    // Per Resend API, use reply_to field
    payload.reply_to = effectiveReplyTo;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      log.error('Echec envoi email Resend', { status: res.status, body: err });
      return { success: false };
    }

    const data = await res.json().catch(() => ({}));
    log.info('Email envoyé via Resend', { id: data?.id, to: input.to });
    return { success: true, id: data?.id };
  } catch (e) {
    log.error('Exception envoi Resend', { message: (e as Error)?.message });
    return { success: false };
  }
}
