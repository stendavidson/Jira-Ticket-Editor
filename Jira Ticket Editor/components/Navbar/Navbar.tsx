'use client'

// Styles
import styles from  "./Navbar.module.scss";

// Internal Imports
import Link from "../Link/Link";
import UserAvatar from "../UserAvatar/UserAvatar";
import Settings from "../Settings/Settings";
import request from "../../lib/NoExceptRequestLib";
import UserInterface from "../../interfaces/UserInterface";

// External Imports
import { useContext, useEffect, useState, Suspense } from "react";
import { UserContext } from "@/contexts/UserContext";
import { usePathname, useRouter, useSearchParams } from "next/navigation";



function Navbar(){

  // Next.js hooks
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPath = usePathname();

  // State Values
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showDropdown, setshowDropdown] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<number>(2);

  // Context(s)
  const userContext = useContext(UserContext);


  ////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////// API Calls //////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////


  /**
   * This function retrieves & sets the current user's information
   */
  async function fetchUser(){

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", "/myself");

    // User request
    const response = await request(
      url.toString(),
      {
        method: "GET",
      }
    );

    // Process response
    let user: UserInterface | undefined = undefined;

    if(response?.status.toString().startsWith("2")){
      user = (await response?.json()) as UserInterface;
    }

    // Set component variables & trigger re-render
    if(user && !userContext?.userData){
      userContext?.setUserData(user);
    }
  }



  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Callbacks //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function is used to hide or display the settings component thereby setting
   * or unsetting the relevant URL parameters.
   */
  function clickSettings() {

    // Search parameters
    const params = new URLSearchParams(searchParams.toString());

    // Add or remove "settings=true" from query parameters
    if (showSettings) {
      params.delete("settings");
    } else {
      params.set("settings", "true");
    }

    // Shallow routing = update URL without page reload or getServerSideProps rerun
    router.replace(`${currentPath}?${params.toString()}`);

    setShowSettings((prev) => !prev);
  }



  ///////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////// Effects ///////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This effect performs initial state and data loading.
   */
  useEffect(() => {

    // Search parameters
    const params = new URLSearchParams(searchParams.toString());
    
    // Set the select tab from url params
    if(currentPath.startsWith("/authenticated/my-work")){
      setSelectedTab(1);
    }else{
      setSelectedTab(2);
    }

    // Display settings
    if(params.has("settings", "true")){
      setShowSettings(true);
    }
    
    // Retrieve necessary data
    fetchUser();
    
  }, []);



  return (
    <>
      <header className={styles.myHeader}>
        <nav className={styles.myNav}>
          <Link className={`${styles.link} ${selectedTab === 1 ? styles.highlight : ""}`} href="/authenticated/my-work" onClick={() => {setSelectedTab(1)}}>My Work</Link>
          <Link className={`${styles.link} ${selectedTab === 2 ? styles.highlight : ""}`} href="/authenticated/projects" onClick={() => {setSelectedTab(2)}}>Projects</Link>
          <UserAvatar className={styles.avatar} avatarURL={userContext?.userData?.avatarUrls?.["48x48"]} displayName={userContext?.userData?.displayName} display={() => {setshowDropdown(true)}} hide={() => {setshowDropdown(false)}}/>
          <div className={styles.dropDown} style={{display: showDropdown ? "flex": "none"}}>
            <div className={styles.dropButton} onClick={clickSettings}>Settings</div>
            <Link className={styles.dropButton} href="/internal/logout">Logout</Link>
          </div>
        </nav>
      </header>
      <Settings onClick={clickSettings} showSettings={showSettings}/>
    </>
  );
}


export default function Header(){
  return (
    <Suspense fallback={<header className={styles.myHeader}><nav className={styles.myNav}></nav></header>}>
      <Navbar/>
    </Suspense>
  );
}
