'use client'

// Styles
import styles from "./Settings.module.scss";

// Internal Imports
import request from "../../lib/NoExceptRequestLib";
import UserInterface from "../../interfaces/UserInterface";

// External Imports
import { useEffect, useRef, useState } from "react";
import React from "react";
import { BasicAuthAccessInterface } from "@/interfaces/AccessInterface";
import UserAvatar from "../UserAvatar/UserAvatar";



export default function Settings({ onClick, showSettings }: { onClick: () => void, showSettings: boolean }) {


  // State value(s)
  const [account, setAccount] = useState<UserInterface | null>(null);
  const [inputEmail, setInputEmail] = useState<string>("");
  const [inputKey, setInputKey] = useState<string>("");
  const [elevated, setElevated] = useState<boolean | null>(null);
  const [writeAccess, setWriteAccess] = useState<boolean>(false);

  // Refs
  const emailRef = useRef<HTMLInputElement | null>(null);
  const keyRef = useRef<HTMLInputElement | null>(null);


  ///////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// API Functions ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////


  /**
   * This function retrieves the application's service account information
   */
  async function fetchUser(){
  
    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", "/myself");
    url.searchParams.append("elevate", "true");

    // User request
    const response = await request(
      url.toString(),
      {
        method: "GET",
      }
    );

    // Process response
    let user: UserInterface | null = null;

    if(response?.status.toString().startsWith("2")){
      user = await response?.json();
    }

    setAccount(user);
  }


  /**
   * This function returns the "elevated" status of the application
   */
  async function fetchElevated(){

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


  /**
   * This function retrieves the user's "write access" to the service account credentials.
   */
  async function fetchWriteAccess(){

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


  /**
   * This function clear's the application's service account credentials
   */
  async function deauthorize(): Promise<boolean>{
    
    // Construct URL
    const url = new URL('/internal/deauthorize', window.location.origin);

    // Logout the higher level account
    const response: Response | null = await request(url.toString(), {
      method: "DELETE"
    })

    // Upon successful logout set vals
    return (response?.status === 204);
  }



  /**
   * This function set's the application's service account credentials
   */
  async function authorize(): Promise<boolean>{
    
    // Construct URL
    const url = new URL('/internal/authorize', window.location.origin);

    // Request body
    const body: BasicAuthAccessInterface = {
      emailAddress: inputEmail,
      access_token: inputKey
    }

    // Logout the higher level account
    const response: Response | null = await request(url.toString(), {
      body: JSON.stringify(body),
      method: "POST"
    })

    return (response?.status === 204);
  }



  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Callbacks //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  function validateInputs(override: boolean = false): boolean{

    // Input elements
    const emailInputElement: HTMLInputElement = emailRef.current!;
    const keyInputElement: HTMLInputElement= keyRef.current!;

    // Email regex validation
    const emailRegex = /^(?!.*\.\.)[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;

    // Only perform checks when necessary
    if(!emailInputElement.validity || !keyInputElement.validity || override){

      if(emailRegex.test(emailInputElement.value)){
        emailInputElement.setCustomValidity("");
      }else{
        emailInputElement.setCustomValidity("Use format john.doe@domain.com");
      }

      if(keyInputElement.value !== ""){
        keyInputElement.setCustomValidity("");
      }else{
        keyInputElement.setCustomValidity("Please provide a key");
      }

      // Update validity status & message
      emailInputElement.reportValidity();
      keyInputElement.reportValidity();
    }

    return (emailInputElement.checkValidity() && keyInputElement.checkValidity());
  }


  
  /**
   * This function saves the service account credentials provided by the user.
   */
  function saveCredentials(){

    // Check the current form validity
    if(validateInputs(true)){

      authorize().then((success: boolean) => {

        if(success){
          setElevated(true);
          setWriteAccess(true);
          fetchUser();
          setInputEmail("");
          setInputKey("");
        }

      })
    }
  }



  /**
   * This function deletes the service account credentials.
   */
  function deleteCredentials(){

    // Prevent unnecessary credential deletion
    if(elevated && writeAccess){

      deauthorize().then((success: boolean) => {

        if(success){
          setElevated(false);
          setWriteAccess(false);
          setAccount(null);
        }

      })
    }
  }



  ///////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////// Effects ///////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * The user's access level is retrieved
   */
  useEffect(() => {

    fetchElevated();
    fetchWriteAccess();

  }, []);


  /**
   * If the application has a service account attached retrieve it's credentials
   */
  useEffect(() => {

    if(elevated){
      fetchUser();
    }
    
  }, [elevated]);
  


  return(
    <div className={styles.overlay} style={{display: showSettings ? "flex": "none"}}>
      <div className={styles.popup}>
        <button className={styles.closeButton} onClick={onClick} type="button">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <line x1="1" y1="1" x2="11" y2="11" stroke="#ADADAD" strokeWidth="2" />
              <line x1="11" y1="1" x2="1" y2="11" stroke="#ADADAD" strokeWidth="2" />
            </svg>
        </button>
        {account ? (
          <div className={styles.userBar}>
            <UserAvatar className={styles.avatar} avatarURL={account?.avatarUrls?.["48x48"]} displayName={account?.displayName}/> 
            <div>
              <p className={styles.accountName}>{elevated ? account?.displayName : "No Higher Level Account"}</p>
              <p className={styles.email}>{elevated ? account?.emailAddress : "No Higher Level Account"}</p>
            </div>
          </div>
        )
        :
        (
          <div className={styles.inputContainer}>
            <div className={styles.inputFieldContainer}>
              <label className={styles.label}>{`${inputEmail === "" ? "*" : ""}`}Email Address</label>
              <input 
                className={styles.inputField}
                type="email"
                value={inputEmail}
                onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                  setInputEmail(ev.target.value);
                  validateInputs();
                }}
                placeholder="Email Address..."
                ref={emailRef}>
              </input>
            </div>
            <div className={styles.inputFieldContainer}>
              <label className={styles.label}>{`${inputKey === "" ? "*" : ""}`}API Key</label>
              <input 
                className={styles.inputField}
                type="password"
                value={inputKey}
                onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                  setInputKey(ev.target.value);
                  validateInputs();
                }}
                placeholder="API Key..."
                ref={keyRef}>
              </input>
            </div>
          </div>
        )}
        <button className={styles.authButton} onClick={elevated ? deleteCredentials : saveCredentials} type="button" disabled={elevated !== null && elevated && !writeAccess}>{elevated ? "Deauthorize": "Authorize"}</button>     
      </div>
    </div>
  );
}