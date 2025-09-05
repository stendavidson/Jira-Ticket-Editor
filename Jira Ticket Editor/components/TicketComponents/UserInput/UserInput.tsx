// Import styles
import styles from "./UserInput.module.scss";

// External imports
import { useContext, useEffect, useRef, useState } from "react";

// Internal imports
import request from "@/lib/NoExceptRequestLib";
import { TicketContext } from "@/contexts/TicketContext";
import UserInterface from "./UserInterface";
import { checkIfLoaderVisibleAndFetch } from "@/lib/DropdownLib";


export default function UserInput({ className, issueID, issueKey, keyName, name, operations, nullable, defaultValue}: { className?: string, issueID: string, issueKey: string, keyName: string, name: string, operations: string[], nullable: boolean, defaultValue: UserInterface | null}){

  // State values
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<UserInterface | null>(defaultValue);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [permittedValues, setPermittedValues] = useState<UserInterface[]>([]);
  const [filteredPermittedValues, setFilteredPermittedValues] = useState<UserInterface[]>([]);
  const [startAt, setStartAt] = useState<number>(0);
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
    if(!overrideToken && startAt === -1){
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
    url.searchParams.append("pathname", `/user/permission/search`);
    url.searchParams.append("elevate", "true");
    url.searchParams.append("issueKey", issueKey);
    url.searchParams.append("permissions", "ASSIGNABLE_USER");
    url.searchParams.append("startAt", startAt.toString());
    url.searchParams.append("maxResults", maxResults.toString());

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
      setStartAt(-1);
      return;
    }

    // Process response
    let options: UserInterface[] = [];
    let filteredOptions: UserInterface[] = [];

    if(response?.status.toString().startsWith("2")){

      options = ((await response?.json()) as UserInterface[]);

      // Set next start
      if(options.length === maxResults){
        setStartAt(startAt + maxResults);
      }else{
        setStartAt(-1);
      }

      options = options.filter((value: UserInterface) => value.accountType === "atlassian");
      filteredOptions = options.filter((value: UserInterface) => {
        return (value.displayName.toLowerCase().includes(textInput.toLowerCase()) || value.emailAddress.toLowerCase().includes(textInput.toLowerCase()));
      })
    }

    // If the request is out of date exit.
    if(token !== requestToken.current){
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
  async function setInIssue(option: UserInterface | null): Promise<boolean>{

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}`);
    url.searchParams.append("elevate", "true");

    // PUT Request Body
    const body: any = {};
    body.fields = {};

    if(option){
      body.fields[keyName] = {
        accountId: option.accountId
      }
    }else{
      body.fields[keyName] = null;
    }
    
    // Update request
    const response = await request(
      url.toString(),
      {
        method: "PUT",
        body: JSON.stringify(body)
      }
    );

    // Return status
    return response?.status.toString().startsWith("2") ? true : false;
  }



  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Callbacks //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function selects an option from the dropdown list
   * 
   * @param option: The option being selected
   */
  function selectOption(option: UserInterface | null){

    // Upon successfully updating the selected options
    setInIssue(option).then((success: boolean) => {
      if(success){
        setSelectedOption(option);
        context?.setUpdateIndicator(issueID);
      }
    })
  }


  /**
   * This function filters the dropdown list
   * 
   * @param textInput The user input
   */
  function filterDropdown(textInput: string){

    setFilteredPermittedValues(permittedValues.filter((value: UserInterface) => (
      value.displayName.toLowerCase().includes(textInput.toLowerCase()) || value.emailAddress.toLowerCase().includes(textInput.toLowerCase())
    )))

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
   * This effect retrieves options if no options were initially loaded
   */
  useEffect(() => {

    getDropdownOptions("", false);

  }, [triggerLoad]);


  /**
   * This effect retrieves options if there are NOW options to be retrieved
   */
  useEffect(() => {
    
    checkIfLoaderVisibleAndFetch(loadDiv.current, parentRef.current, showDropdown, inputValue, getDropdownOptions, false);
  
  }, [startAt, showDropdown]);



  return (
    <div className={`${styles.fieldEditor} ${className ? className : ""}`}>
      <h1 className={styles.label}>{name}</h1>
      <div className={`${styles.fieldButton} ${focused ? styles.focused : ""}`}>
        <>
          <img 
            className={styles.userIcon}
            src={(selectedOption?.displayName.toLowerCase().includes(inputValue.toLowerCase()) || selectedOption?.emailAddress.toLowerCase().includes(inputValue.toLowerCase())) ? (selectedOption?.avatarUrls["48x48"] ?? "./../defaultAvatar.png") : "./../defaultAvatar.png"}
            alt={`Account avatar - ${selectedOption?.displayName ?? "Unassigned"}`}/>
          <input 
            className={styles.inputField} 
            type="text" 
            value={inputValue} 
            placeholder={selectedOption?.displayName ?? "Unassigned"}
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
            filteredPermittedValues.map((option: UserInterface) => {
                if(selectedOption?.accountId !== option.accountId){
                  return (
                    <div className={styles.dropdownOption} onMouseDown={() => {selectOption(option)}} key={option.accountId}>
                      <img 
                        className={styles.userIcon} 
                        src={option.avatarUrls["48x48"]} 
                        alt={`Account avatar - ${option.displayName}`}/>
                      <p className={styles.dropdownOptionName}>{option.displayName}</p>
                    </div>
                  )
                }
              }
            )
          )}
          {nullable && (
            <div className={styles.dropdownOption} onMouseDown={() => {selectOption(null)}}>
              <img className={styles.userIcon} src="./../defaultAvatar.png" alt={`Account avatar - Unassigned`}/>
              <p className={styles.dropdownOptionName}>Unassigned</p>
            </div>
          )}
          {startAt !== -1 && (
            <div className={styles.invalidDropdownOption} ref={loadDiv}>
              Loading...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}