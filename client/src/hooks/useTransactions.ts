import {
    createTransaction, deleteTransaction, getSummary, getTransactions, updateTransaction,
    type TransactionFilters, type TransactionInput,
} from '../services/transactions';
import { useAuthedMutation, useAuthedQuery } from './useFleetApi';

const AFFECTED = ['transactions', 'transactions-summary', 'dashboard'];

export const useTransactions = (filters: TransactionFilters = {}) => {
    const { data: transactions = [], isLoading, isError } = useAuthedQuery(['transactions', filters], (token) => getTransactions(token, filters));
    return { transactions, isLoading, isError };
};

export const useTransactionSummary = (filters: Omit<TransactionFilters, 'type'> = {}) => {
    const { data: summary, isLoading, isError } = useAuthedQuery(['transactions-summary', filters], (token) => getSummary(token, filters));
    return { summary, isLoading, isError };
};

export const useTransactionMutations = () => ({
    create: useAuthedMutation((token, input: TransactionInput) => createTransaction(token, input), AFFECTED),
    update: useAuthedMutation((token, { id, input }: { id: string; input: TransactionInput }) => updateTransaction(token, id, input), AFFECTED),
    remove: useAuthedMutation((token, id: string) => deleteTransaction(token, id), AFFECTED),
});
