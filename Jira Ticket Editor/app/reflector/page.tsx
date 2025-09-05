'use client'

// External Imports
import { useEffect } from "react";

// Internal Imports
import request from "@/lib/NoExceptRequestLib";


export default function Reflector(){
  
  useEffect(() => {

    // Search params
    const requestParams = (new URL(window.location.href)).searchParams;
    const stateCode: string | null = requestParams.get("state");
    const authCode: string | null = requestParams.get("code");

    const saveCredentials = async () => {

      // Request URL
      const requestURL = new URL('/internal/login-credentials', window.location.origin);

      // POST Request
      const response: Response | null = await request(requestURL.toString(), {
        method: 'POST',
        body: JSON.stringify({
          "stateCode": stateCode,
          "authCode": authCode,
        })
      });

      window.location.href = `/authenticated/projects`;
    }

    // Redirect
    saveCredentials();

  }, []);
  
  return null;
}