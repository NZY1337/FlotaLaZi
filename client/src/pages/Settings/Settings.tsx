import { useEffect, useState, type ChangeEvent } from 'react';
import PageMeta from '../../components/common/PageMeta';
import Alert from '../../components/ui/alert/Alert';
import { ActionButton, Card, ErrorText, PageHeader, TextField } from '../../components/fleet/ui';
import { useLegacyImport, useSettings } from '../../hooks/useSettings';
import type { ImportResult } from '../../services/legacyImport';

export default function Settings() {
    const { settings, isError, update } = useSettings();
    const importBackup = useLegacyImport();
    const [form, setForm] = useState({ eurRate: '', oilAlertKm: '', docAlertDays: '', emailAlerts: true });
    const [saved, setSaved] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);

    useEffect(() => {
        if (settings) {
            setForm({
                eurRate: String(settings.eurRate),
                oilAlertKm: String(settings.oilAlertKm),
                docAlertDays: String(settings.docAlertDays),
                emailAlerts: settings.emailAlerts,
            });
        }
    }, [settings]);

    const save = () => {
        setSaved(false);
        update.mutate({
            eurRate: Number(form.eurRate.replace(',', '.')),
            oilAlertKm: Number(form.oilAlertKm),
            docAlertDays: Number(form.docAlertDays),
            emailAlerts: form.emailAlerts,
        }, { onSuccess: () => setSaved(true) });
    };

    const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        setFileError(null);
        setResult(null);
        if (!file) return;
        let backup: unknown;
        try {
            backup = JSON.parse(await file.text());
        } catch {
            setFileError('Fișierul nu este un backup JSON valid.');
            return;
        }
        importBackup.mutate(backup, { onSuccess: setResult });
    };

    return (
        <>
            <PageMeta title="Setări - EuroTrack" description="Curs valutar, alerte și import date." />
            <PageHeader title="Setări" subtitle="Curs valutar, alerte și importul datelor din aplicația veche." />

            {isError && <Alert variant="error" title="Eroare" message="Nu am putut încărca setările." />}

            <div className="grid gap-4 lg:grid-cols-2">
                <Card title="⚙️ Setări generale">
                    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
                        <TextField label="Curs valutar (1 EUR = ? RON)" type="number" step="0.0001" min={0.0001} value={form.eurRate} required
                            onChange={(v) => setForm((f) => ({ ...f, eurRate: v }))}
                            hint="Folosit pentru tranzacțiile noi. Cele vechi își păstrează cursul din ziua înregistrării." />
                        <TextField label="Alertă schimb ulei (cu câți km înainte)" type="number" step="500" min={0} value={form.oilAlertKm} required
                            onChange={(v) => setForm((f) => ({ ...f, oilAlertKm: v }))} />
                        <TextField label="Alertă acte implicită (cu câte zile înainte)" type="number" min={1} max={365} value={form.docAlertDays} required
                            onChange={(v) => setForm((f) => ({ ...f, docAlertDays: v }))} />
                        <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                            <input type="checkbox" checked={form.emailAlerts} className="h-4 w-4 accent-brand-500"
                                onChange={(e) => setForm((f) => ({ ...f, emailAlerts: e.target.checked }))} />
                            Trimite-mi alertele zilnice pe email
                        </label>
                        <p className="text-xs text-gray-500">
                            Alertele vin la 8:00 cu {form.docAlertDays || 30}, 7 și 1 zi înainte de expirare, în ziua expirării și a doua zi.
                            Alertele pe WhatsApp vin în curând.
                        </p>
                        <ErrorText error={update.error} />
                        {saved && <p className="text-sm text-success-600">✓ Setări salvate.</p>}
                        <ActionButton type="submit" disabled={update.isPending}>{update.isPending ? 'Se salvează…' : '💾 Salvează setările'}</ActionButton>
                    </form>
                </Card>

                <Card title="⬆️ Import din aplicația veche (Flota Mea)">
                    <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                        În aplicația veche: <strong>Backup &amp; Setări → Salvează Backup (.json)</strong>. Apoi încarcă fișierul aici.
                        Importul se face o singură dată, într-un cont fără vehicule sau tranzacții.
                    </p>
                    <label className={`inline-flex cursor-pointer items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs ${importBackup.isPending ? 'bg-brand-300' : 'bg-brand-500 hover:bg-brand-600'}`}>
                        {importBackup.isPending ? 'Se importă…' : 'Alege fișierul .json'}
                        <input type="file" accept=".json,application/json" className="sr-only" onChange={onFile} disabled={importBackup.isPending} />
                    </label>
                    <div className="mt-4 flex flex-col gap-2">
                        {fileError && <ErrorText error={new Error(fileError)} />}
                        <ErrorText error={importBackup.error} />
                        {result && (
                            <p className="rounded-lg bg-success-50 px-3 py-2 text-sm text-success-700 dark:bg-success-500/15 dark:text-success-500">
                                ✓ Importat: {result.vehicles} vehicule, {result.documents} acte, {result.transactions} tranzacții.
                                {result.skipped > 0 && ` ${result.skipped} înregistrări invalide au fost sărite.`}
                            </p>
                        )}
                    </div>
                </Card>
            </div>
        </>
    );
}
