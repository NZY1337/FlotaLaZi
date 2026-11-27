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
        expect(alertLine({ kind: 'oil', plate: 'NT 08 RGT', kmLeft: 1200, daysLeft: null })).toBe('Schimb ulei — NT 08 RGT: mai sunt 1.200 km');
        expect(alertLine({ kind: 'oil', plate: 'NT 08 RGT', kmLeft: -300, daysLeft: -2 })).toBe('Schimb ulei — NT 08 RGT: depășit cu 300 km, termen depășit cu 2 zile');
        expect(alertLine({ kind: 'oil', plate: 'NT 08 RGT', kmLeft: -12500, daysLeft: null })).toBe('Schimb ulei — NT 08 RGT: depășit cu 12.500 km');
    });

    it('puts what is overdue first, the rest in brackets', () => {
        expect(alertLine({ kind: 'oil', plate: 'NT-99-NZY', kmLeft: 5000, daysLeft: -16 })).toBe('Schimb ulei — NT-99-NZY: termen depășit cu 16 zile (mai sunt 5.000 km)');
        expect(alertLine({ kind: 'oil', plate: 'NT-99-NZY', kmLeft: -200, daysLeft: 10 })).toBe('Schimb ulei — NT-99-NZY: depășit cu 200 km (termen în 10 zile)');
    });

    it('says "1 zi", not "1 zile"', () => {
        expect(alertLine({ kind: 'oil', plate: 'X', kmLeft: null, daysLeft: -1 })).toBe('Schimb ulei — X: termen depășit cu 1 zi');
        expect(alertLine({ kind: 'oil', plate: 'X', kmLeft: null, daysLeft: 1 })).toBe('Schimb ulei — X: termen în 1 zi');
        expect(alertLine({ kind: 'oil', plate: 'X', kmLeft: null, daysLeft: 0 })).toBe('Schimb ulei — X: termen azi');
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
        ], 'https://flotalazi.ro');
        expect(subject).toBe('FlotaLaZi: 2 acte / revizii necesită atenție');
        expect(text).toContain('Bună, Ion,');
        expect(text).toContain('• ITP — NT 08 RGT: expiră în 7 zile (02.12.2026)');
        expect(text).toContain('https://flotalazi.ro/dashboard');
    });
});
