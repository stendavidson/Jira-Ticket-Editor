// Import styles
import styles from "./ParentInput.module.scss";

// External imports
import { useContext, useEffect, useRef, useState } from "react";

// Internal imports
import request from "@/lib/NoExceptRequestLib";
import { TicketContext } from "@/contexts/TicketContext";
import { IssueInterface, IssueResponseInterface } from "../IssueLinkInput/IssueInput/IssueInterface";
import IssueTypeInterface from "./IssueTypeInterface";
import { checkIfLoaderVisibleAndFetch } from "@/lib/DropdownLib";


export default function ParentInput({ className, projectID, issueID, keyName, name, operations, issueType, defaultValue = null}: { className?: string, projectID: string, issueID: string, keyName: string, name: string, operations: string[], issueType: IssueTypeInterface, defaultValue: IssueInterface | null}){

  // State values
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<IssueInterface | null>(defaultValue);
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

  // Contexts
  const context = useContext(TicketContext);



  ///////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// API Functions ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////


  /**
   * This function retrieves all possible dropdown options
   * 
   * @param textInput The user's search/filter input
   * 
   * @param overrideToken An indicator that the startAt value should be ignored
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

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/search/jql`);
    url.searchParams.append("elevate", "true");
    url.searchParams.append("jql", `project = ${projectID} AND hierarchyLevel = ${issueType.hierarchyLevel + 1}`);
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
   * This function updates the issue data with the input option
   * 
   * @param option The option being used to update the issue.
   * 
   * @returns The success of the PUT request
   */
  async function setInIssue(option: IssueInterface | null): Promise<boolean>{

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}`);
    url.searchParams.append("elevate", "true");

    // PUT Request Body
    const body: any = {};
    body.fields = {};

    if(option === null){
      body.fields[keyName] = null;
    }else{
      body.fields[keyName] = {
        key: option.key
      };
    }
    
    // Update Request
    const response = await request(
      url.toString(),
      {
        method: "PUT",
        body: JSON.stringify(body)
      }
    );

    return response?.status.toString().startsWith("2") ? true : false;
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


  /**
   * This handles the selection 
   * 
   * @param option The Issue Type data
   */
  function selectOption(option: IssueInterface | null){

    // Upon successfully updating the issue type update the UI
    setInIssue(option).then((success: boolean) => {
      if(success){
        setSelectedOption(option);
        context?.setUpdateIndicator(issueID);
      }else{

      }
    })
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
   * Effect runs lazy loading if no items were loaded intially
   */
  useEffect(() => {

    getDropdownOptions("", false);

  }, [triggerLoad]);


  /**
   * Effect runs lazy loading if there are NOW options to load
   */
  useEffect(() => {
    
    checkIfLoaderVisibleAndFetch(loadDiv.current, parentRef.current, showDropdown, inputValue, getDropdownOptions, false);

  }, [nextPageToken, showDropdown]);



  return (
    <div className={`${styles.fieldEditor} ${className ? className : ""}`}>
      <h1 className={styles.label}>{name}</h1>
      <div className={`${styles.fieldButton} ${focused ? styles.focused : ""}`}>
        <>
          {
            (selectedOption?.fields.summary.toLowerCase().includes(inputValue.toLowerCase()) || selectedOption?.key.toLowerCase().includes(inputValue.toLowerCase())) && (
              <img 
                className={styles.icon}
                src={selectedOption.fields.issuetype.iconUrl} 
                alt={`Issue type icon - ${selectedOption?.fields.issuetype?.name ?? "Unknown"}`}/>
            )
          }
          <input 
            className={styles.inputField} 
            type="text" 
            value={inputValue} 
            placeholder={selectedOption ? `${selectedOption.key}: ${selectedOption.fields.summary}` : "None"}
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
          {operations.includes("set") && (
            filteredPermittedValues.map((option: IssueInterface) => {
                if(selectedOption?.id !== option.id){
                  return (
                    <div className={styles.dropdownOption} onMouseDown={() => {selectOption(option)}} key={option.id}>
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
          )}
          {!issueType.subtask && (
            <div className={styles.dropdownOption} onMouseDown={() => {selectOption(null)}}>
              <p className={styles.dropdownOptionName}>None</p>
            </div>
          )}
          {(nextPageToken !== "") &&  (
            <div className={styles.invalidDropdownOption} ref={loadDiv}>
              Loading...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
