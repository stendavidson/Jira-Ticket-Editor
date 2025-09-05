const crypto = require("crypto");


/**
 * This function symmetrically encrypts input data.
 * 
 * @param text The text being encrypted
 * 
 * @param password The encryption key
 * 
 * @returns The encrypted data
 */
export function encrypt(text: string, password: string) {

  // Derive a key from password using a salt
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 32);

  const iv = crypto.randomBytes(12); // GCM recommends 12-byte IV
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Return everything needed for decryption
  return Buffer.concat([salt, iv, tag, encrypted]).toString("base64");
}

/**
 * This function symmetrically decrypts input data.
 * 
 * @param data The data being decrypted
 * 
 * @param password The encryption key
 * 
 * @returns The decrypted data
 */
export function decrypt(data: string, password: string) {

  const stringData = Buffer.from(data, "base64");

  const salt = stringData.subarray(0, 16);
  const iv = stringData.subarray(16, 28);
  const tag = stringData.subarray(28, 44);
  const encrypted = stringData.subarray(44);

  const key = crypto.scryptSync(password, salt, 32);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return decrypted.toString("utf8");
}



/**
 * This function hashes an input message using a secret key.
 * 
 * @param key The signing key
 * 
 * @param message The message to hash.
 * 
 * @returns The hashed data
 */
export async function generateHMAC(key: string, message: string) {

  const encoder = new TextEncoder();
  const keyBuffer = encoder.encode(key);
  const messageBuffer = encoder.encode(message);

  // Import the key for HMAC
  const cryptoKey = await crypto.subtle.importKey(
      'raw',                  // The format of the key (raw byte array)
      keyBuffer,              // The key data
      { name: 'HMAC', hash: 'SHA-512' }, // HMAC with SHA-256
      false,                  // The key is not extractable
      ['sign']                // The key will be used for signing
  );

  // Create the HMAC signature
  const signature = await crypto.subtle.sign(
      'HMAC',                 // The algorithm
      cryptoKey,              // The imported key
      messageBuffer           // The message to hash
  );

  // Convert the ArrayBuffer result to a hexadecimal string
  const hashArray = new Uint8Array(signature);
  const hashHex = Array.from(hashArray).map(byte => byte.toString(16).padStart(2, '0')).join('');

  return hashHex;
}


/**
 * This function generates a random string
 * 
 * @param length The length of the string to generate.
 * 
 * @returns A random alphanumeric string.
 */
export function generateRandomData(length: number) {
  // Create a new Uint8Array to hold the random bytes
  const randomBytes = new Uint8Array(length);

  // Fill the array with cryptographically secure random values
  crypto.getRandomValues(randomBytes);

  // Convert the random bytes into a hexadecimal string
  const secretKey = Array.from(randomBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');

  return secretKey;  // Return the generated secret key as a hex string
}
