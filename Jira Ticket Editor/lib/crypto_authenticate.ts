import { generateHMAC } from "./keyed_hash";

/**
 * This function validates the state value
 * 
 * @param userNonce The user nonce as stored in the cookie
 * 
 * @param state The url param value containing the Oauth 2.0 state
 * 
 * @param secret The secret key
 */
export async function validateState(userNonce: string, state: string,  secret: string){

  const hashed_state: string  = await generateHMAC(secret, state);

  return hashed_state === userNonce;
}