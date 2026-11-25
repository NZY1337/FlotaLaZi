import { alertLine, emailDigest, notificationType } from './digest';

describe('reminder digest', () => {
    it('words document alerts in Romanian', () => {
        const base = { kind: 'document' as const, type: 'ITP', subject: 'NT 08 RGT', expiresOn: '2026-12-02' };
        expect(alertLine({ ...base, daysLeft: 7 })).toBe('ITP — NT 08 RGT: expiră în 7 zile (02.12.2026)');
        expect(alertLine({ ...base, daysLeft: 1 })).toBe('ITP — NT 08 RGT: expiră mâine (02.12.2026)');
        expect(alertLine({ ...base, daysLeft: 0 })).toBe('ITP — NT 08 RGT: expiră azi (02.12.2026)');
        expect(alertLine({ ...base, daysLeft: -1 })).toBe('ITP — NT 08 RGT: a expirat (1 zi) (02.12.2026)');
    });

    it('words oil alerts', () => {
        expect(alertLine({ kind: 'oil', plate: 'NT 08 RGT', kmLeft: 1200, daysLeft: null })).toBe('Schimb ulei — NT 08 RGT: mai sunt 1200 km');
        expect(alertLine({ kind: 'oil', plate: 'NT 08 RGT', kmLeft: -300, daysLeft: -2 })).toBe('Schimb ulei — NT 08 RGT: depășit cu 300 km, termen depășit cu 2 zile');
    });

    it('marks overdue items as errors', () => {
        expect(notificationType({ kind: 'document', type: 'RCA', subject: 'X', expiresOn: '2026-01-01', daysLeft: 0 })).toBe('error');
        expect(notificationType({ kind: 'document', type: 'RCA', subject: 'X', expiresOn: '2026-01-01', daysLeft: 5 })).toBe('warning');
        expect(notificationType({ kind: 'oil', plate: 'X', kmLeft: 100, daysLeft: null })).toBe('warning');
    });

    it('builds one email for several alerts', () => {
        const { subject, text } = emailDigest('Ion', [
            { kind: 'document', type: 'ITP', subject: 'NT 08 RGT', expiresOn: '2026-12-02', daysLeft: 7 },
            { kind: 'oil', plate: 'NT 09 ABC', kmLeft: 900, daysLeft: null },
        ], 'https://app.eurotrack.ro');
        expect(subject).toBe('EuroTrack: 2 acte / revizii necesită atenție');
        expect(text).toContain('Bună, Ion,');
        expect(text).toContain('• ITP — NT 08 RGT: expiră în 7 zile (02.12.2026)');
        expect(text).toContain('https://app.eurotrack.ro/dashboard');
    });
});
