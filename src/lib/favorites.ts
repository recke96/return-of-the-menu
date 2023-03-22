import {createPersistentStore} from "./persistentStore";

const _favorites = createPersistentStore<string[]>("favorites", []);
_favorites.update(value => value ? value : []);

export const favorites = _favorites;