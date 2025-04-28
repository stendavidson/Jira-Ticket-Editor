
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
