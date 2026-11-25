import { getSettings, updateSettings, type SettingsInput } from '../services/settings';
import { importLegacyBackup } from '../services/legacyImport';
import { sendTestReminders, type TestRemindersResult } from '../services/reminders';
import { useAuthedMutation, useAuthedQuery } from './useFleetApi';

export const useSettings = () => {
    const { data: settings, isLoading, isError } = useAuthedQuery(['settings'], getSettings);
    const update = useAuthedMutation((token, input: SettingsInput) => updateSettings(token, input), ['settings']);
    return { settings, isLoading, isError, update };
};

export const useLegacyImport = () =>
    useAuthedMutation((token, backup: unknown) => importLegacyBackup(token, backup), [
        'settings', 'vehicles', 'documents', 'transactions', 'transactions-summary', 'dashboard',
    ]);

// Creates in-app notifications too, so the bell refreshes.
export const useTestReminders = () =>
    useAuthedMutation<void, TestRemindersResult>((token) => sendTestReminders(token), ['notifications']);
