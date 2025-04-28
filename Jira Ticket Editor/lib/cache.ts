import { open } from 'lmdb';

export const db = open<string, string>({
  path: './mydata',
  compression: true, // optional, but helps reduce file size
});