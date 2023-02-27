export type CacheItem<T = unknown> = {
    data: T;
    expiresAt: number;
}

export function setCacheItem<T = unknown>(key: string, item: CacheItem<T>): void {
    sessionStorage.setItem(key, JSON.stringify(item));
}

export function getCacheItem<T = unknown>(key: string): T | null {
    const itemJSON = sessionStorage.getItem(key);
    if (!itemJSON){
        return null;
    }

    const item = JSON.parse(itemJSON);
    if (Date.now() > item.expiresAt) {
        sessionStorage.removeItem(key);
        return null;
    }

    return item.data;
}