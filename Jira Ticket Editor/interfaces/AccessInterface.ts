
export interface OAuth2AccessInterface {
  access_token: string,
  expires_in: number,
  token_type: string,
  refresh_token: string,  
  scope: string
}


export interface BasicAuthAccessInterface {
  emailAddress: string,
  access_token: string
}