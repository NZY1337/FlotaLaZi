import { getSettings, updateSettings, type SettingsInput } from '../services/settings';
import { importLegacyBackup } from '../services/legacyImport';
import { sendTestReminders, type TestRemindersResult } from '../services/reminders';
import { useAuthedMutation, useAuthedQuery } from './useFleetApi';

export const useSettings = () => {
    const { data: settings, isLoading, isError } = useAuthedQuery(['settings'], getSettings);
    const update = useAuthedMutation((token, input: SettingsInput) => updateSettings(token, input), ['settings']);
    return { settings, isLoading, isError, update };
};

/** Firm or personal account; null until the owner has chosen (behaves as a firm). */
export const useAccountType = () => {
    const { settings } = useSettings();
    const accountType = settings?.accountType ?? null;
    return { accountType, personal: accountType === 'PERSONAL', loaded: !!settings };
};

// /masina sends people to /signup?tip=personal; the choice waits in this
// browser until the first dashboard after sign-up applies it.
const PENDING_TYPE_KEY = 'flotalazi.accountType';
export const rememberPersonalSignup = () => {
    try { localStorage.setItem(PENDING_TYPE_KEY, 'PERSONAL'); } catch { /* private mode: they'll be asked instead */ }
};
export const takePendingAccountType = (): 'PERSONAL' | null => {
    try {
        const v = localStorage.getItem(PENDING_TYPE_KEY);
        localStorage.removeItem(PENDING_TYPE_KEY);
        return v === 'PERSONAL' ? 'PERSONAL' : null;
    } catch { return null; }
};

export const useLegacyImport = () =>
    useAuthedMutation((token, backup: unknown) => importLegacyBackup(token, backup), [
        'settings', 'vehicles', 'documents', 'transactions', 'transactions-summary', 'dashboard',
    ]);

// Creates in-app notifications too, so the bell refreshes.
export const useTestReminders = () =>
    useAuthedMutation<void, TestRemindersResult>((token) => sendTestReminders(token), ['notifications']);
