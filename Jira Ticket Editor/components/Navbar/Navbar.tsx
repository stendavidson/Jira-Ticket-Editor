'use client'

// Styles
import styles from  "./Navbar.module.scss";

// Internal Imports
import Link from "../Link/Link";
import UserAvatar from "../UserAvatar/UserAvatar";
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

  // Write access
  const [writeAccess, setWriteAccess] = useState<boolean>(false);

  // Selected tab
  const [selectedTab, setSelectedTab] = useState<number>(2);

  useEffect(() => {
    //////////////////////////////////////////////////////////////
    ////////////////////// Fetch user data ///////////////////////
    //////////////////////////////////////////////////////////////
    const fetchUser = async () => {

      let user: AtlassianUser | null = null;

      // URL Params
      const url: URL = new URL("/proxy", window.location.origin);
      url.searchParams.append("pathname", "/myself");

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
      setAccountID(user?.accountId);
    }

    fetchUser();

    //////////////////////////////////////////////////////////////
    ////////////////////// Validate Higher Level Auth ////////////
    //////////////////////////////////////////////////////////////
    const fetchElevated = async () => {

      // URL Params
      const url: URL = new URL("/internal/check-elevated", window.location.origin);

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


    //////////////////////////////////////////////////////////////
    ////////////////////// Validate Write Access /////////////////
    //////////////////////////////////////////////////////////////
    const fetchWriteAccess = async () => {

      // URL Params
      const url: URL = new URL("/internal/check-write-access", window.location.origin);

      // User request
      const response = await request(
        url.toString(),
        {
          method: "GET",
        }
      );

      // Set component variables & trigger re-render
      setWriteAccess(response?.status === 204);
    }

    fetchWriteAccess();
    
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


  function clickSettings() {

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

  useEffect(() => {

    // URL Params
    const url = new URL(window.location.href);
    
    // Set the select tab from url params
    if(url.pathname.startsWith("/authenticated/my-work")){
      setSelectedTab(1);
    }else{
      setSelectedTab(2);
    }

  }, [])

  return (
    <>
      <header className={styles.myHeader}>
        <nav className={styles.myNav}>
          <Link className={`${styles.link} ${selectedTab === 1 ? styles.highlight : ""}`} href="/authenticated/my-work" onClick={() => {setSelectedTab(1)}}>My Work</Link>
          <Link className={`${styles.link} ${selectedTab === 2 ? styles.highlight : ""}`} href="/authenticated/projects" onClick={() => {setSelectedTab(2)}}>Projects</Link>
          <UserAvatar accountID={accountID} display={() => {setshowDropdown(true)}} hide={() => {setshowDropdown(false)}} className={styles.avatar}/>
          <div className={styles.dropDown} style={{display: showDropdown ? "flex": "none"}}>
            <div className={styles.dropButton} onClick={clickSettings}>Settings</div>
            <Link className={styles.dropButton} href="/internal/logout">Logout</Link>
          </div>
        </nav>
      </header>
      <Settings onClick={clickSettings} showSettings={showSettings} elevated={elevated} setElevated={setElevated} writeAccess={writeAccess}/>
    </>
  );
}
