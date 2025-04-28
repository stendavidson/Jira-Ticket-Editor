'use client'

// Styles
import styles from "./Settings.module.scss";

// Internal Imports
import request from "../../lib/nothrow_request";
import AtlassianUser from "../../interfaces/AtlassianUserInterface";

// External Imports
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "../Avatar/Avatar";


export default function Settings({ onClick, showSettings, elevated, setElevated }: { onClick: () => void, showSettings: boolean, elevated: boolean | null, setElevated: (arg: boolean) => void}) {

  // Router
  const router = useRouter();

  // Account info
  const [accountID, setAccountID] = useState<string | null>(null);

  useEffect(() => {
    
    // Async function to fetch coponent data
    const fetchUser = async () => {

      if(elevated){
  
        // URL Params
        const url: URL = new URL("/api", window.location.origin);
        url.searchParams.append("pathname", "/myself");
        url.searchParams.append("elevate", "true");
  
        // User request
        const response = await request(
          url.toString(),
          {
            method: "GET",
          }
        );
        const user: AtlassianUser | null = await response?.json();
  
        // Set component variables & trigger re-render
        if (user) {
          setAccountID(user.accountId);
        }
      }
    }
  
    fetchUser();
    
  }, [elevated])


  // Login callback
  const login = () => {

    // Construct URL
    const url = new URL('/authorize', window.location.origin);
    url.searchParams.append("elevate", "true");

    // Redirect
    router.push(url.toString())

  }

  // Logout callback
  const logout = () => {
    
    // Construct URL
    const url = new URL('/deauthorize', window.location.origin);

    // Logout the higher level account
    request(url.toString(), {
      method: "DELETE"
    }).then((response) => {

      // Upon successful logout set vals
      if(response?.status === 204){
        setElevated(false);
        setAccountID(null);
      }

    })
  }


  return(
    <div className={styles.overlay} style={{display: showSettings ? "flex": "none"}}>
      <div className={styles.popup}>
        <button className={styles.closeButton} onClick={onClick} type="button">
          ×
        </button>
        <div className={styles.userBar}>
          <Avatar className={styles.avatar} accountID={accountID}/> 
          <div>
            <p className={styles.accountName}>{elevated ? "Higher Level Account": "No Higher Level Account"}</p>
            <p className={styles.email}>{elevated ? "Higher Level Account": "No Higher Level Account"}</p>
          </div>
        </div>
        <button className={styles.authButton} onClick={elevated ? logout: login} type="button">{elevated ? "Deauthorize": "Authorize"}</button>     
      </div>
    </div>
  );
}