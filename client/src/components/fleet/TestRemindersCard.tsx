import { ActionButton, Card, ErrorText } from './ui';
import { useTestReminders } from '../../hooks/useSettings';

export default function TestRemindersCard() {
    const test = useTestReminders();
    const result = test.data;

    return (
        <Card title="🔔 Testează alertele">
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Îți trimitem acum, pe email și la clopoțel, tot ce e expirat sau expiră în curând — exact cum arată alerta de dimineață.
                Alertele zilnice de la 8:00 nu sunt afectate.
            </p>
            <ActionButton onClick={() => test.mutate()} disabled={test.isPending}>
                {test.isPending ? 'Se trimite…' : 'Trimite-mi alertele acum'}
            </ActionButton>

            <div className="mt-4 flex flex-col gap-2">
                <ErrorText error={test.error} />
                {result && result.alerts.length === 0 && (
                    <p className="rounded-lg bg-success-50 px-3 py-2 text-sm text-success-700 dark:bg-success-500/15 dark:text-success-500">
                        ✅ Nimic nu necesită atenție acum, așa că nu am trimis nimic.
                    </p>
                )}
                {result && result.alerts.length > 0 && (
                    <>
                        <ul className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-white/5 dark:text-gray-300">
                            {result.alerts.map((line) => <li key={line} className="py-0.5">• {line}</li>)}
                        </ul>
                        {result.email.sent && (
                            <p className="text-sm text-success-600 dark:text-success-500">✓ Email trimis la {result.email.to}. Verifică și folderul Spam.</p>
                        )}
                        {result.email.error && (
                            <ErrorText error={new Error(`Emailul nu a putut fi trimis: ${result.email.error}. Verifică GMAIL_USERNAME și GMAIL_APP_PASSWORD în server/.env.`)} />
                        )}
                        {!result.email.sent && !result.email.error && (
                            <p className="text-sm text-gray-500">Contul tău nu are o adresă de email, așa că alertele au mers doar la clopoțel.</p>
                        )}
                    </>
                )}
            </div>
        </Card>
    );
}
