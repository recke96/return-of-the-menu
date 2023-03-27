import type {Updater, Writable} from "svelte/store";
import {get, writable} from "svelte/store";

export function createPersistentStore<T>(key: string, initialValue: T): Writable<T> {
    const internal = writable(initialValue, set => {
        const json = localStorage.getItem(key);
        set(JSON.parse(json));

        const onStorageHandler = (evt: StorageEvent): void => {
            if (evt.key === key) {
                set(JSON.parse(evt.newValue));
            }
        };

        window.addEventListener("storage", onStorageHandler);
        return () => window.removeEventListener("storage", onStorageHandler);
    });

    return {
        set(value: T) {
            localStorage.setItem(key, JSON.stringify(value));
            internal.set(value);
        },
        update(updater: Updater<T>) {
            const value = updater(get(internal));

            localStorage.setItem(key, JSON.stringify(value));
            internal.set(value);
        },
        subscribe: internal.subscribe
    }
}