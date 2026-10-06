import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

export function useSessionValue(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      try {
        return window.sessionStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );
}