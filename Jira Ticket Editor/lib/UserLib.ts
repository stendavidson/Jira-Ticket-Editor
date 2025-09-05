import UserInterface from "@/interfaces/UserInterface";
import noThrowRequest from "./NoExceptRequestLib";


/**
 * This function requests the current user information.
 * 
 * @param authToken The authentication token for a given user.
 * 
 * @returns The user data
 */
export default async function getUser(authToken: string): Promise<UserInterface | null> {

  // Headers
  const headers = {
    'Authorization': `Bearer ${authToken}`
  }

  // User request
  const data = await noThrowRequest(
    "https://api.atlassian.com/ex/jira/68e39a30-a1b8-4b14-8d88-6363789cef33/rest/api/3/myself",
    {
      method: "GET",
      headers: headers
    }
  );

  // Process response
  let user: UserInterface | null = null;

  if(data?.status.toString().startsWith("2")){
    user = (await data?.json()) as UserInterface;
  }

  return user;
}