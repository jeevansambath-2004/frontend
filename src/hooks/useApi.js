import { useState, useCallback } from 'react';

/**
 * Custom hook for handling API requests with loading and error states
 */
export const useApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const execute = useCallback(async (apiCall) => {
        try {
            setLoading(true);
            setError(null);
            const result = await apiCall();
            return result;
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return { loading, error, execute, clearError };
};

export default useApi;
