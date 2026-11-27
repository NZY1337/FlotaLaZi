// Builds the reminder texts. Pure, so the wording is testable.

export type DocumentAlert = { kind: 'document'; type: string; subject: string; expiresOn: string; daysLeft: number };
export type OilAlert = { kind: 'oil'; plate: string; kmLeft: number | null; daysLeft: number | null };
export type Alert = DocumentAlert | OilAlert;

const roDate = (ymd: string) => ymd.split('-').reverse().join('.');

/** Numbers as the app shows them: 5000 → "5.000". */
const roNumber = (n: number) => n.toLocaleString('ro-RO');

/** 1 → "1 zi", 16 → "16 zile". */
const dayCount = (n: number) => (n === 1 ? '1 zi' : `${roNumber(n)} zile`);

function whenText(daysLeft: number): string {
    if (daysLeft < 0) return `a expirat (${dayCount(-daysLeft)})`;
    if (daysLeft === 0) return 'expiră azi';
    if (daysLeft === 1) return 'expiră mâine';
    return `expiră în ${dayCount(daysLeft)}`;
}

export function alertLine(a: Alert): string {
    if (a.kind === 'document') {
        return `${a.type} — ${a.subject}: ${whenText(a.daysLeft)} (${roDate(a.expiresOn)})`;
    }
    // What is overdue comes first; what is still fine follows in brackets, so
    // "mai sunt 5.000 km" doesn't read as if the oil change could wait.
    const overdue: string[] = [];
    const pending: string[] = [];
    if (a.kmLeft != null) {
        if (a.kmLeft <= 0) overdue.push(`depășit cu ${roNumber(-a.kmLeft)} km`);
        else pending.push(`mai sunt ${roNumber(a.kmLeft)} km`);
    }
    if (a.daysLeft != null) {
        if (a.daysLeft < 0) overdue.push(`termen depășit cu ${dayCount(-a.daysLeft)}`);
        else if (a.daysLeft === 0) pending.push('termen azi');
        else pending.push(`termen în ${dayCount(a.daysLeft)}`);
    }
    const text = overdue.length && pending.length
        ? `${overdue.join(', ')} (${pending.join(', ')})`
        : [...overdue, ...pending].join(', ');
    return `Schimb ulei — ${a.plate}: ${text}`;
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
