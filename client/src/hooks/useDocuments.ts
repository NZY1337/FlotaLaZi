import { createDocument, deleteDocument, getDocuments, updateDocument, type DocumentInput } from '../services/documents';
import { useAuthedMutation, useAuthedQuery } from './useFleetApi';

const AFFECTED = ['documents', 'dashboard'];

export const useDocuments = () => {
    const { data: documents = [], isLoading, isError } = useAuthedQuery(['documents'], getDocuments);
    const create = useAuthedMutation((token, input: DocumentInput) => createDocument(token, input), AFFECTED);
    const update = useAuthedMutation((token, { id, input }: { id: string; input: DocumentInput }) => updateDocument(token, id, input), AFFECTED);
    const remove = useAuthedMutation((token, id: string) => deleteDocument(token, id), AFFECTED);
    return { documents, isLoading, isError, create, update, remove };
};
