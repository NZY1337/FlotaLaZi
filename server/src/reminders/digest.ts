// Builds the reminder texts. Pure, so the wording is testable.

export type DocumentAlert = { kind: 'document'; type: string; subject: string; expiresOn: string; daysLeft: number };
export type OilAlert = { kind: 'oil'; plate: string; kmLeft: number | null; daysLeft: number | null };
export type Alert = DocumentAlert | OilAlert;

const roDate = (ymd: string) => ymd.split('-').reverse().join('.');

function whenText(daysLeft: number): string {
    if (daysLeft < 0) return `a expirat (${-daysLeft} ${-daysLeft === 1 ? 'zi' : 'zile'})`;
    if (daysLeft === 0) return 'expiră azi';
    if (daysLeft === 1) return 'expiră mâine';
    return `expiră în ${daysLeft} zile`;
}

export function alertLine(a: Alert): string {
    if (a.kind === 'document') {
        return `${a.type} — ${a.subject}: ${whenText(a.daysLeft)} (${roDate(a.expiresOn)})`;
    }
    const parts: string[] = [];
    if (a.kmLeft != null) parts.push(a.kmLeft <= 0 ? `depășit cu ${-a.kmLeft} km` : `mai sunt ${a.kmLeft} km`);
    if (a.daysLeft != null) parts.push(a.daysLeft < 0 ? `termen depășit cu ${-a.daysLeft} zile` : `termen în ${a.daysLeft} zile`);
    return `Schimb ulei — ${a.plate}: ${parts.join(', ')}`;
}

export function notificationType(a: Alert): 'warning' | 'error' {
    const overdue = a.kind === 'document' ? a.daysLeft <= 0 : (a.kmLeft ?? 1) <= 0 || (a.daysLeft ?? 0) < 0;
    return overdue ? 'error' : 'warning';
}

export function emailDigest(name: string, alerts: Alert[], appUrl: string): { subject: string; text: string } {
    const subject = alerts.length === 1
        ? `FlotaLaZi: ${alertLine(alerts[0])}`
        : `FlotaLaZi: ${alerts.length} acte / revizii necesită atenție`;
    const text = [
        `Bună${name ? `, ${name}` : ''},`,
        '',
        'Următoarele necesită atenția ta:',
        '',
        ...alerts.map((a) => `• ${alertLine(a)}`),
        '',
        `Vezi detalii: ${appUrl}/dashboard`,
        '',
        '— FlotaLaZi',
    ].join('\n');
    return { subject, text };
}
