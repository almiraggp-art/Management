
import React, { useState, useEffect, useCallback } from 'react';

// Custom event type for local storage updates
interface LocalStorageEventDetail {
  key: string;
}

export const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    // Get initial value from local storage or use provided initial value
    const readValue = useCallback((): T => {
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key “${key}”:`, error);
            return initialValue;
        }
    }, [initialValue, key]);

    const [storedValue, setStoredValue] = useState<T>(readValue);

    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue = useCallback((value: React.SetStateAction<T>) => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            
            // Save state
            setStoredValue(valueToStore);
            
            // Save to local storage
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
                
                // Dispatch a custom event to notify other hooks
                window.dispatchEvent(new CustomEvent('local-storage-update', { 
                    detail: { key }
                }));
            }
        } catch (error) {
            console.warn(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, storedValue]);

    useEffect(() => {
        const handleStorageChange = (event: StorageEvent | CustomEvent) => {
             // Handle native storage event (cross-tab) or custom event (same-tab)
            if ((event as StorageEvent).key === key || (event as CustomEvent).detail?.key === key) {
                setStoredValue(readValue());
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('local-storage-update', handleStorageChange as EventListener);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('local-storage-update', handleStorageChange as EventListener);
        };
    }, [key, readValue]);

    return [storedValue, setValue];
};
