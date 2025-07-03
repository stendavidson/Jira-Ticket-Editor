'use client'

// Styles
import styles from "./UserAvatar.module.scss";

// Internal Imports
import request from '../../lib/nothrow_request';

// Component Imports
import AtlassianUser from '../../interfaces/AtlassianUserInterface';
import { useEffect, useRef, useState } from "react";



export default function UserAvatar({ accountID, display, hide, className, defaultDisplayName = "Unknown" }: { accountID?: string | null, display?: () => void, hide?: () => void, className?: string, defaultDisplayName?: string}){

  //////////////////////////////////////////////////////////////////
  ///////////////////// Retrieving API Data ////////////////////////
  //////////////////////////////////////////////////////////////////

  // Re-render triggering variables
  const [avatarURL, setAvatarURL] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {

    // Async function to fetch coponent data
    const fetchUser = async () => {

      let user: AtlassianUser | null = null;

      if(accountID){

        setAvatarURL(null);
        setDisplayName(null);

        // URL Params
        const url: URL = new URL("/proxy-api", window.location.origin);
        url.searchParams.append("pathname", "/user");
        url.searchParams.append("accountId", accountID);

        // User request
        const response = await request(
          url.toString(),
          {
            method: "GET",
          }
        );

        if(response?.status.toString().startsWith("2")){
          user = await response?.json();
        }

        // Set component variables & trigger re-render
        setAvatarURL(user?.avatarUrls["48x48"] ? user.avatarUrls["48x48"]: null);
        setDisplayName(user?.displayName ? user.displayName: null);
      }else{
        // Set component variables & trigger re-render
        setAvatarURL(null);
        setDisplayName(null);
      }
    }

    fetchUser();
    
  }, [accountID])

  //////////////////////////////////////////////////////////////////
  /////////////////////// Handling Events //////////////////////////
  //////////////////////////////////////////////////////////////////

  // UserAvatar Element Reference
  const avatarRef = useRef<HTMLDivElement>(null);

  // Attach event listener
  useEffect(() => {

    const handleMouseDown = (event: MouseEvent) => {

      let target = event.target as Node;
      let ancestor = avatarRef.current;

      if(ancestor && ancestor.contains(target)){
        display?.();
      }else{
        setTimeout(() => {
          hide?.();
        }, 300);
      }

    }
    
    document.addEventListener("mousedown", handleMouseDown)

    // Clean up function
    return () => { document.removeEventListener("mousedown", handleMouseDown) };

  }, [avatarURL, displayName, accountID]);

  // Only re-render as required
  return (
    <>
      <div className={`${styles.avatarCircle} ${className}`} ref={avatarRef}>
          <img className={styles.avatarImg} src={avatarURL ? avatarURL : "./../defaultAvatar.png"} alt={displayName ? `The avatar for the user ${displayName}`: "Avatar logo couldn't be loaded"}/> 
          <p className={styles.avatarTooltip}>{displayName ? displayName: defaultDisplayName}</p>
      </div>
    </>
  );
}
