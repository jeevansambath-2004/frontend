import { useState, useCallback } from 'react';

/**
 * Custom hook for managing modal state
 */
export const useModal = (initialState = false) => {
    const [isOpen, setIsOpen] = useState(initialState);
    const [data, setData] = useState(null);

    const open = useCallback((modalData = null) => {
        setData(modalData);
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        setData(null);
    }, []);

    const toggle = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    return { isOpen, data, open, close, toggle };
};

export default useModal;
