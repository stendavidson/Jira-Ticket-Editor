import AtlassianUser from "@/interfaces/AtlassianUserInterface";
import noThrowRequest from "./nothrow_request";

export default async function getUser(authToken: string): Promise<AtlassianUser | null> {
  
  let user: AtlassianUser | null = null;

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

  if(data?.status.toString().startsWith("2")){
    user = await data?.json();
  }

  return user;
}