import { Injectable } from "@nestjs/common";
import nodemailer from 'nodemailer';

const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

@Injectable()
export class NodemailerService {
    private readonly transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USERNAME,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    })

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

        return this.transporter.sendMail({
            from: process.env.GMAIL_USERNAME,
            to,
            subject: 'Bine ai venit în EuroTrack 🚛',
            html,
            text: `Bine ai venit în EuroTrack${name ? `, ${name}` : ''}! Adaugă camioanele și actele, iar noi te anunțăm înainte să expire ceva: ${appUrl}/dashboard`,
        });
    }

    /** Plain-text email that resolves/rejects with the SMTP result (used by reminders). */
    sendText(to: string, subject: string, text: string) {
        return this.transporter.sendMail({ from: process.env.GMAIL_USERNAME, to, subject, text });
    }
}
