'use client'

// Styles
import styles from "./UserAvatar.module.scss";

// Internal Imports
import request from '../../lib/nothrow_request';

// Component Imports
import AtlassianUser from '../../interfaces/AtlassianUserInterface';
import { useEffect, useRef, useState } from "react";



export default function UserAvatar({ accountID, display, hide, className, defaultDisplayName = "Unknown" }: { accountID?: string | null, display?: () => void, hide?: () => void, className?: string, defaultDisplayName?: string}){

  // State values
  const [avatarURL, setAvatarURL] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Refs
  const avatarRef = useRef<HTMLDivElement>(null);



  ///////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// API Functions ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function retrieves the user data
   */
  async function fetchUser(){

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", "/user");
    url.searchParams.append("elevate", "true");
    url.searchParams.append("accountId", accountID!);

    // User request
    const response = await request(
      url.toString(),
      {
        method: "GET",
      }
    );

    // Process response
    let user: AtlassianUser | null = null;

    if(response?.status.toString().startsWith("2")){
      user = await response?.json();
    }

    // Set component variables & trigger re-render
    setAvatarURL(user?.avatarUrls["48x48"] ? user.avatarUrls["48x48"] : null);
    setDisplayName(user?.displayName ? user.displayName : null);
  }



  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Callbacks //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This retrieves the user data
   */
  useEffect(() => {

    // Prevent unnecessary requests
    if(accountID){
      fetchUser();
    }else{
      setAvatarURL(null);
      setDisplayName(null);
    }
    
  }, [accountID]);


  return (
    <>
      <div 
        className={`${styles.avatarCircle} ${className}`}
        tabIndex={-1}
        onMouseDown={() => {
          
          display?.();

        }}
        onBlur={(ev: React.FocusEvent<HTMLDivElement>) => {

          const nextFocused = ev.relatedTarget as Node | null;
          const currentNode = avatarRef.current;

          // Call hide or display depending on focus
          if (currentNode && (!nextFocused || !currentNode.contains(nextFocused))) {
            setTimeout(() => {
              hide?.();
            }, 200);
          }
          
        }}
        ref={avatarRef}
      >
        <img className={styles.avatarImg} src={avatarURL ? avatarURL : "./../defaultAvatar.png"} alt={displayName ? `The avatar for the user ${displayName}`: "Avatar logo couldn't be loaded"}/> 
        <p className={styles.avatarTooltip}>{displayName ? displayName: defaultDisplayName}</p>
      </div>
    </>
  );
}
