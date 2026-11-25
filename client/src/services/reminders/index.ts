import { apiFetch } from '../api';

export type TestRemindersResult = {
    /** The alert lines that were sent (empty when nothing needs attention). */
    alerts: string[];
    email: { sent: boolean; to: string | null; error: string | null };
};

/** Sends the signed-in owner everything that currently needs attention. */
export const sendTestReminders = (token: string) =>
    apiFetch<TestRemindersResult>(token, '/reminders/test', { method: 'POST' });
