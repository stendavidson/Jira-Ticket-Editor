'use client'

import { useEffect } from "react";
import request from "../../lib/nothrow_request";
import Bool from "../../interfaces/BoolInterface";


export default function Reflector(){
  
  useEffect(() => {

    // Search params
    const requestParams = (new URL(window.location.href)).searchParams;
    const stateCode: string | null = requestParams.get("state");
    const authCode: string | null = requestParams.get("code");

    const saveCredentials = async () => {

      // Request URL
      const requestURL = new URL('/internal/store-credentials', window.location.origin);

      // POST Request
      const response: Response | null = await request(requestURL.toString(), {
        method: 'POST',
        body: JSON.stringify({
          "stateCode": stateCode,
          "authCode": authCode,
        })
      });

      if(response?.status === 200){
        const data: Bool | null = await response.json() as Bool;
        window.location.href = `/authenticated/projects${data?.elevate ? "?settings=true": ""}`;
      }
      // TODO - add an else-if status === 400 and redirect the user back to their home page unsuccessfully
    }

    // Redirect
    saveCredentials();

  }, []);
  
  return null;
}