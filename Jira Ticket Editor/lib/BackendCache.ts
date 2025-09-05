import { open } from 'lmdb';

/**
 * This provides the application with access to a simple persistant storage
 * object.
 */
export const db = open<string, string>({
  path: './mydata',
  compression: false
});