import { Injectable, Logger } from "@nestjs/common";
import nodemailer from 'nodemailer';

const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

type Mail = { to: string; subject: string; text: string; html?: string };

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
// Resend's shared test sender: works without a verified domain, but only
// delivers to the Resend account owner's own address. Set MAIL_FROM to an
// address on your verified domain (e.g. "EuroTrack <alerte@eurotrack.ro>").
const RESEND_TEST_FROM = 'EuroTrack <onboarding@resend.dev>';

/**
 * Sends email through one of two transports, picked from the environment:
 * - RESEND_API_KEY set → Resend's HTTPS API (production: Railway blocks
 *   outbound SMTP below the Pro plan);
 * - otherwise → Gmail SMTP with GMAIL_USERNAME / GMAIL_APP_PASSWORD (local dev).
 * (The class keeps its historical name; it is the app's only mail sender.)
 */
@Injectable()
export class NodemailerService {
    private readonly logger = new Logger(NodemailerService.name);
    private readonly smtp = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USERNAME,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    })

    private async send(mail: Mail): Promise<void> {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            await this.smtp.sendMail({ from: process.env.GMAIL_USERNAME, ...mail });
            return;
        }
        const response = await fetch(RESEND_ENDPOINT, {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: process.env.MAIL_FROM || RESEND_TEST_FROM, ...mail }),
            signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) {
            let detail = `HTTP ${response.status}`;
            try {
                const body = await response.json();
                detail = body?.message ?? detail;
            } catch { /* not JSON */ }
            throw new Error(`Resend: ${detail}`);
        }
    }

    sendWelcomeEmail(to: string, name: string) {
        const appUrl = process.env.APP_URL || 'http://localhost:5173';
        const safeName = escapeHtml(name || '');
        const html = `
            <!DOCTYPE html>
            <html lang="ro">
            <body style="font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; line-height: 1.6;">
                <div style="max-width: 560px; margin: 0 auto; padding: 24px;">
                    <h1 style="font-size: 22px; margin: 0 0 16px;">🚛 Bine ai venit în EuroTrack${safeName ? `, ${safeName}` : ''}!</h1>
                    <p>EuroTrack îți ține evidența actelor (ITP, RCA, rovinietă, tahograf, copie conformă),
                    a schimburilor de ulei și a profitului pe fiecare camion.</p>
                    <p>Primii pași:</p>
                    <ol>
                        <li>Adaugă camioanele și remorcile.</li>
                        <li>Trece datele de expirare ale actelor.</li>
                        <li>Gata — te anunțăm noi pe email înainte să expire ceva.</li>
                    </ol>
                    <p><a href="${appUrl}/dashboard" style="display: inline-block; background: #465fff; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none;">Deschide EuroTrack</a></p>
                    <p style="color: #6b7280; font-size: 13px;">— Echipa EuroTrack</p>
                </div>
            </body>
            </html>
        `;

        return this.send({
            to,
            subject: 'Bine ai venit în EuroTrack 🚛',
            html,
            text: `Bine ai venit în EuroTrack${name ? `, ${name}` : ''}! Adaugă camioanele și actele, iar noi te anunțăm înainte să expire ceva: ${appUrl}/dashboard`,
        });
    }

    /** Plain-text email that resolves/rejects with the delivery result (used by reminders). */
    sendText(to: string, subject: string, text: string) {
        return this.send({ to, subject, text });
    }
}
