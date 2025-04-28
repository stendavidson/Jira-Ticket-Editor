import Access from "../interfaces/AccessInterface";


/**
 * This function validates that the authentication is valid
 * 
 * @param authToken The authentication token from the cookie
 * 
 * @returns A boolean confirming that the user is logged in.
 */
export async function validate(authToken: string): Promise<boolean> {

  // Validate the user's credentials
  try{

    const response = await fetch("https://api.atlassian.com/ex/jira/68e39a30-a1b8-4b14-8d88-6363789cef33/rest/api/3/myself",
      {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        }
      }
    )

    return response.status == 200;

  }catch(error){

    return false;

  }  
}


/**
 * This function validates that the authentication is valid
 * 
 * @param authCode The authentication code
 * 
 * @returns A boolean confirming that the user is logged in.
 */
export async function getAccessToken(authCode: string, redirect_uri: string): Promise<Access | null> {

  // Validate the user's credentials
  try{

    const response = await fetch("https://auth.atlassian.com/oauth/token",
      {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "grant_type": "authorization_code",
          "client_id": process.env.CLIENT_ID ? process.env.CLIENT_ID : "",
          "client_secret": process.env.CLIENT_SECRET ? process.env.CLIENT_SECRET : "",
          "code": authCode,
          "redirect_uri": redirect_uri
        })
      }
    );

    if(response.status === 200){

      const access: Access = await response.json();

      return access;

    }else{
      
      return null;

    }

  }catch(error){

    return null;

  }  
}


/**
 * This function refreshes the access token using the refresh token
 * 
 * @param refreshToken The refresh token
 * 
 * @returns A boolean confirming that the user is logged in.
 */
export async function refreshAccessToken(refreshToken: string): Promise<Access | null> {

  // Validate the user's credentials
  try{

    const response = await fetch("https://auth.atlassian.com/oauth/token",
      {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "grant_type": "refresh_token",
          "client_id": process.env.CLIENT_ID ? process.env.CLIENT_ID : "",
          "client_secret": process.env.CLIENT_SECRET ? process.env.CLIENT_SECRET : "",
          "refresh_token": refreshToken
        })
      }
    );

    if(response.status === 200){

      const access: Access = await response.json();
      return access;

    }else{
      
      return null;

    }

  }catch(error){

    return null;

  }  
}
