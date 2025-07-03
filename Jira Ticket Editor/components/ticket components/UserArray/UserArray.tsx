// Import styles
import styles from "./UserArray.module.scss";

// External imports
import { useContext, useEffect, useRef, useState } from "react";

// Internal imports
import request from "@/lib/nothrow_request";
import { TicketContext } from "@/contexts/TicketContext";
import UserInterface from "../UserInput/UserInterface";


export default function UserArray({ className, issueID, issueKey, keyName, name, operations, defaultValue = []}: { className?: string, issueID: string, issueKey: string, keyName: string, name: string, operations: string[], defaultValue: UserInterface[] | null}){

  // State Values
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedOptions, setSelectedOptions] = useState<UserInterface[]>(defaultValue ?? []);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [permittedValues, setPermittedValues] = useState<UserInterface[]>([]);
  const [filteredPermittedValues, setFilteredPermittedValues] = useState<UserInterface[]>([]);
  const [startAt, setStartAt] = useState<number>(0);
  const [focused, setFocused] = useState<boolean>(false);

  // Refs
  const ref = useRef<HTMLDivElement | null>(null);
  const parentRef = useRef<HTMLDivElement | null>(null);
  const loadDiv = useRef<HTMLDivElement | null>(null);
  const initial = useRef<boolean>(true);
  const loading = useRef<boolean>(false);

  // Contexts
  const context = useContext(TicketContext);


  ///////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// API Functions ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////


  /**
   * This function retrives the valid options for the dropdown
   */
  async function getDropdownOptions(){

    // Early return
    if(startAt === -1 || loading.current){
      return;
    }

    // Prevent overlapping requests
    loading.current = true;

    // Max Results
    const maxResults = 50;

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/user/permission/search`);
    url.searchParams.append("issueKey", issueKey);
    url.searchParams.append("permissions", "ASSIGNABLE_USER");
    url.searchParams.append("startAt", startAt.toString());
    url.searchParams.append("maxResults", maxResults.toString());

    // GET request
    const response = await request(
      url.toString(),
      {
        method: "GET"
      }
    );

    // Process response
    let options : UserInterface[] = [];

    if(response?.status.toString().startsWith("2")){

      options = ((await response?.json()) as UserInterface[]);

      // Set next start
      if(options.length === maxResults){
        setStartAt(prev => prev + maxResults);
      }else{
        setStartAt(-1);
      }
    }

    // Filter values
    setPermittedValues(prev => [...prev, ...options.filter((value: UserInterface) => value.accountType === "atlassian")]);
    setFilteredPermittedValues(prev => [...prev, ...options.filter((value: UserInterface) => {
      return value.accountType === "atlassian" && (value.displayName.toLowerCase().includes(inputValue.toLowerCase()) || value.emailAddress.toLowerCase().includes(inputValue.toLowerCase()));
    })]);

    loading.current = false;
  }


  /**
   * This function adds the selected option from the Jira Issue
   * 
   * @param option The option being added
   * 
   * @returns The success or failure of the request is returned
   */
  async function addToIssue(option: UserInterface): Promise<boolean>{

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}`);

    // PUT Request Body
    const body: any = {};
    body.update = {};
    body.update[keyName] = [
      {
        "add" : {
          accountId: option.accountId
        }
      }
    ];

    // Update request
    const response = await request(
      url.toString(),
      {
        method: "PUT",
        body: JSON.stringify(body)
      }
    );

    return response?.status.toString().startsWith("2") ? true : false;
  }


   /**
   * This function removes the selected option from the Jira Issue
   * 
   * @param option The option being removed
   * 
   * @returns The success or failure of the request is returned
   */
  async function removeFromIssue(option: UserInterface): Promise<boolean>{

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}`);

    // PUT Request Body
    const body: any = {};
    body.update = {};
    body.update[keyName] = [
      {
        "remove" : {
          accountId: option.accountId
        }
      }
    ];

    // User request
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
   * This function adds an option from the dropdown to the list of selected options.
   * 
   * @param option: The option being added
   */
  function addOption(option: UserInterface){

    // Upon successfully updating the selected options
    addToIssue(option).then((success: boolean) => {
      if(success){
        setSelectedOptions(prev => [...prev, option]);
        context?.setUpdateIndicator(issueID);
      }
    })
  }


  /**
   * This function removes a given option from the list of selected options.
   * 
   * @param option: The option being removed
   */
  function removeOption(option: UserInterface){

    // Upon successfully updating the selected options
    removeFromIssue(option).then((success: boolean) => {
      if(success){
        setSelectedOptions(prev => prev.filter((value: UserInterface) => value.accountId !== option.accountId));
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

  }


  ///////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////// Effects ///////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////


  /**
   * This retrieves the initial list of dropdown options
   */
  useEffect(() => {

    // Prevent unnecessary re-renders
    if(initial.current){
      getDropdownOptions();
      initial.current = false;
    }

  }, [])


  /**
   * Configure the intersection observer
   */
  useEffect(() => {

    // Early exit
    const loader = loadDiv.current;
    const parent = parentRef.current;
    
    if(!loader || !parent){
      return;
    }

    // Create observer
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          getDropdownOptions();
        }
      },
      {
        root: parent,
        rootMargin: "0px 0px 150px 0px",
        threshold: 0,
      }
    );

    // Observe
    if(loader){
      observer.observe(loader);
    }

    // Function to remove observer
    return () => {
      if (loader) {
        observer.unobserve(loader);
      }
    };

  }, [startAt, showDropdown]);



  return (
    <div className={`${styles.fieldEditor} ${className ? className : ""}`} ref={ref}>
      <h1 className={styles.label}>{name}</h1>
      <div className={`${styles.fieldButton} ${focused ? styles.focused : ""}`}>
        <div className={styles.verticalContainer}>
          <input 
            className={styles.inputField} 
            type="text" 
            value={inputValue} 
            placeholder={`Search ${name}...`}
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
          { selectedOptions.length > 0 && (
              selectedOptions.map((option: UserInterface) => {
                return (
                  <div className={styles.selectedOption} key={option.accountId}>
                    <img src={option.avatarUrls["48x48"]} className={styles.userIcon}/>
                    <p className={styles.selectedOptionName}>{option.displayName}</p>
                    <button className={styles.selectedRemoveButton} type="button" onMouseDown={() => {removeOption(option)}}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <line x1="1" y1="1" x2="15" y2="15" stroke="#ADADAD" strokeWidth="2" />
                        <line x1="15" y1="1" x2="1" y2="15" stroke="#ADADAD" strokeWidth="2" />
                      </svg>
                    </button>
                  </div>
                )
              })
            )
          }
        </div>
        <div className={`${styles.fieldDropdown} ${showDropdown ? styles.displayDropdown : ""}`} ref={parentRef}>
          <>
            {operations.includes("set") && operations.includes("add") && (
                filteredPermittedValues.map((option: UserInterface) => {
                    if(!selectedOptions.some((value: UserInterface) => value.accountId === option.accountId)){
                      return (
                        <div className={styles.dropdownOption} onMouseDown={() => {addOption(option)}} key={option.accountId}>
                          <img src={option.avatarUrls["48x48"]} className={styles.userIcon}/>
                          <p className={styles.dropdownOptionName}>{option.displayName}</p>
                        </div>
                      )
                    }
                  }
                )
              )
            }
            {startAt !== -1 && (
              <div className={styles.invalidDropdownOption} ref={loadDiv}>
                Loading...
              </div>
            )}
          </>
        </div>
      </div>
    </div>
  );
}