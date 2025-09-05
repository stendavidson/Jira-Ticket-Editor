// Import styles
import styles from "./IssueInput.module.scss";

// External imports
import { useEffect, useRef, useState } from "react";

// Internal imports
import request from "@/lib/NoExceptRequestLib";
import { IssueInterface, IssueResponseInterface } from "./IssueInterface";
import React from "react";
import { checkIfLoaderVisibleAndFetch } from "@/lib/DropdownLib";


export default function IssueInput({ className, setLinkedIssue}: { className?: string, setLinkedIssue: (value: IssueInterface) => void}){

  // State values
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<IssueInterface | null>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [permittedValues, setPermittedValues] = useState<IssueInterface[]>([]);
  const [filteredPermittedValues, setFilteredPermittedValues] = useState<IssueInterface[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [focused, setFocused] = useState<boolean>(false);
  const [triggerLoad, setTriggerLoad] = useState<boolean>(false);
  

  // Refs
  const parentRef = useRef<HTMLDivElement | null>(null);
  const loadDiv = useRef<HTMLDivElement | null>(null);
  const requestToken = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);



  ///////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// API Functions ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function retrieves the valid options for the dropdown
   * 
   * @param textInput The user's search text
   * 
   * @param overrideToken This tells the function to execute the search ignoring previous state
   */
  async function getDropdownOptions(textInput: string, overrideToken: boolean = false){

    // Early exit
    if(!overrideToken && nextPageToken === ""){
      return;
    }

    // Max results
    const maxResults = 50;

    // Set request token
    requestToken.current++;
    const token = requestToken.current;
    
    // Abort previous request
    abortRef.current?.abort();

    // Create new AbortController to exit early if necessary
    const abortController = new AbortController();
    abortRef.current = abortController;

    // JQL
    let jql;

    if(textInput === "" && (nextPageToken === null || nextPageToken !== "")){
      jql = "created >= -60d order by created DESC";
    }else{
      const projectKey: string = extractProjectKey(textInput);
      jql = `text ~ "${textInput}" OR project = "${projectKey}"`;
    }
    
    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/search/jql`);
    url.searchParams.append("elevate", "true");
    url.searchParams.append("jql", jql);
    url.searchParams.append("fields", "issuetype,summary");
    url.searchParams.append("maxResults", maxResults.toString());
    if(nextPageToken){url.searchParams.append("nextPageToken", nextPageToken)};

    // GET request
    const response = await request(
      url.toString(),
      {
        method: "GET",
        signal: abortController.signal
      }
    ); 

    // If the request was aborted exit early
    if (!response){
      setNextPageToken("");
      return;
    }

    // Process response
    let issueResponse: IssueResponseInterface | null = null;
    let options: IssueInterface[] = [];
    let filteredOptions: IssueInterface[] = [];

    if(response?.status.toString().startsWith("2")){
      
      issueResponse = (await response?.json()) as IssueResponseInterface;
      options = issueResponse.issues.filter((newValue: IssueInterface) => !permittedValues.some((oldValue: IssueInterface) => newValue.id === oldValue.id));
      filteredOptions = options.filter((value: IssueInterface) => {
        return (value.key.toLowerCase().includes(textInput.toLowerCase()) || value.fields.summary.toLowerCase().includes(textInput.toLowerCase()));
      });

      // Set the next requests' starting position
      if(!issueResponse.isLast){
        setNextPageToken(issueResponse.nextPageToken);
      }else{
        setNextPageToken("");
      }
    }

    // If the request is out of date exit.
    if (token !== requestToken.current){
      return;
    }

    // Set permitted values or recurse
    if(options.length > 0){

      setPermittedValues(prev => [...prev, ...options]);

      if(filteredOptions.length > 0){
        setFilteredPermittedValues(prev => [...prev, ...filteredOptions]);
      }else{
        setTriggerLoad(prev => !prev);
      }

    }else{
      setTriggerLoad(prev => !prev);
    }
  }



  /**
   * This function extracts the project key from the user's input.
   * 
   * @param value Input string from which to extract the project key
   * 
   * @returns The project key
   */
  function extractProjectKey(value: string): string {

    const match = value.match(/^([a-zA-Z][a-zA-Z0-9]+)-\d+$/);
    const projectKey = match?.[1] ?? value;

    return projectKey;
  }



  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Callbacks //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////


  
  /**
   * This function filters the dropdown list
   * 
   * @param textInput The user input
   */
  function filterDropdown(textInput: string){

    // If allowed values exist - then filtered the restricted list
    if (permittedValues.length > 0) {

      setFilteredPermittedValues(permittedValues.filter((value: IssueInterface) => {
        return (value.key.toLowerCase().includes(textInput.toLowerCase()) || value.fields.summary.toLowerCase().includes(textInput.toLowerCase()));
      }));

    }

    checkIfLoaderVisibleAndFetch(loadDiv.current, parentRef.current, showDropdown, textInput, getDropdownOptions, true);
  }



  ///////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////// Effects ///////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This retrieves the initial list of dropdown options
   */
  useEffect(() => {

    getDropdownOptions("", false);

  }, []);


  /**
   * Lazy loading triggered - if no items have been loaded initially.
   */
  useEffect(() => {

    getDropdownOptions("", false);

  }, [triggerLoad]);


  /**
   * Lazy loading triggered - if more items can NOW be loaded.
   */
  useEffect(() => {
    
    checkIfLoaderVisibleAndFetch(loadDiv.current, parentRef.current, showDropdown, inputValue, getDropdownOptions, false);

  }, [nextPageToken, showDropdown]);



  return (
      <div className={`${styles.fieldEditor} ${className ? className : ""} ${focused ? styles.focused : ""}`}>
        <>
          {(selectedOption?.key.toLowerCase().includes(inputValue.toLowerCase()) || selectedOption?.fields.summary.toLowerCase().includes(inputValue.toLowerCase())) && (
            <img 
              className={styles.icon}
              src={selectedOption.fields.issuetype.iconUrl} 
              alt={`Issue type icon - ${selectedOption.fields.issuetype?.name ?? "Unknown"}`}/>
          )}
          <input 
            className={styles.inputField} 
            type="text" 
            value={inputValue} 
            placeholder={selectedOption ? `${selectedOption.key}: ${selectedOption.fields.summary}`: "Search for issue..."}
            onFocus={() => {
              setFocused(true);
              setShowDropdown(true);
            }}
            onBlur={() => {
              setInputValue("");
              setFilteredPermittedValues(permittedValues);
              setFocused(false);
              setShowDropdown(false);
            }}
            onInput={(ev: React.ChangeEvent<HTMLInputElement>) => {
              setNextPageToken(null);
              setInputValue(ev.target.value);
              filterDropdown(ev.target.value);
            }}
          />
        </> 
        <div 
          className={`${styles.fieldDropdown} ${showDropdown ? styles.displayDropdown : ""}`} 
          onScroll={() => {
            checkIfLoaderVisibleAndFetch(loadDiv.current, parentRef.current, showDropdown, inputValue, getDropdownOptions, false);
          }} 
          ref={parentRef}>
          {
            filteredPermittedValues.map((option: IssueInterface) => {
                if(selectedOption?.id !== option.id){
                  return (
                    <div 
                      className={styles.dropdownOption} onMouseDown={() => {
                        setSelectedOption(option);
                        setLinkedIssue(option);
                      }} 
                      key={option.id}>
                      <img 
                        className={styles.icon} 
                        src={option.fields.issuetype.iconUrl} 
                        alt={`Issue type icon - ${option.fields.issuetype?.name ?? "Unknown"}`}/>
                      <p className={styles.dropdownOptionName}>{`${option.key}: ${option.fields.summary}`}</p>
                    </div>
                  )
                }
              }
            )
          }
          {(nextPageToken !== "") && (
            <div className={styles.invalidDropdownOption} ref={loadDiv}>
              Loading...
            </div>
          )}
        </div>
      </div>
  );
}