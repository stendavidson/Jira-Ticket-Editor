'use client'

// Styles
import styles from  "./Navbar.module.scss";

// Internal Imports
import Link from "../Link/Link";
import Avatar from "../Avatar/Avatar";
import Settings from "../Settings/Settings";
import request from "../../lib/nothrow_request";
import AtlassianUser from "../../interfaces/AtlassianUserInterface";

// External Imports
import { useEffect, useState } from "react";

export default function Navbar(){

  // Show Settings
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Show Dropdown
  const [showDropdown, setshowDropdown] = useState<boolean>(false);
  
  // Account info
  const [accountID, setAccountID] = useState<string | undefined>(undefined);

  // Logged in status - higher level account
  const [elevated, setElevated] = useState<boolean | null>(null); // changed to null

  useEffect(() => {
    //////////////////////////////////////////////////////////////
    ////////////////////// Fetch user data ///////////////////////
    //////////////////////////////////////////////////////////////
    const fetchUser = async () => {

      // URL Params
      const url: URL = new URL("/api", window.location.origin);
      url.searchParams.append("pathname", "/myself");

      // User request
      const response = await request(
        url.toString(),
        {
          method: "GET",
        }
      );
      const user: AtlassianUser | null = await response?.json();

      // Set component variables & trigger re-render
      setAccountID(user?.accountId);
    }

    fetchUser();

    //////////////////////////////////////////////////////////////
    ////////////////////// Validate Higher Level Auth ////////////
    //////////////////////////////////////////////////////////////
    const fetchElevated = async () => {

      // URL Params
      const url: URL = new URL("/check-elevated", window.location.origin);

      // User request
      const response = await request(
        url.toString(),
        {
          method: "GET",
        }
      );

      // Set component variables & trigger re-render
      setElevated(response?.status === 204);
    }

    fetchElevated();
  }, [])


  useEffect(() => {

    if (elevated !== null){
      
      const displaySettings = () => {
        // URL
        const url = new URL(window.location.href);

        // Display Settings Window
        if(url.searchParams.get("settings") === "true"){
          setShowSettings(true);
        }
      }

      displaySettings();
    } 
  }, [elevated]); // Run this effect when `elevated` changes


  const onClick = () => {

    // Update URL Params
    const url = new URL(window.location.href);

    if(showSettings){
      url.searchParams.delete("settings");
    }else{
      url.searchParams.set("settings", "true");
    }
    
    window.history.replaceState(null, '', url.toString());

    setShowSettings(prev => !prev)
  }


  return (
    <>
    <header className={styles.myHeader}>
      <nav className={styles.myNav}>
        <Link className={styles.link} href="/authenticated/my-work">My Work</Link>
        <Link className={styles.link} href="/authenticated/projects">Projects</Link>
        <Avatar accountID={accountID} display={() => {setshowDropdown(true)}} hide={() => {setshowDropdown(false)}} className={styles.avatar}/>
        <div className={styles.dropDown} style={{display: showDropdown ? "flex": "none"}}>
          <div className={styles.dropButton} onClick={onClick}>Settings</div>
          <Link className={styles.dropButton} href="/logout">Logout</Link>
        </div>
      </nav>
    </header>
    <Settings onClick={onClick} showSettings={showSettings} elevated={elevated} setElevated={setElevated}/>
    </>
  );
}
