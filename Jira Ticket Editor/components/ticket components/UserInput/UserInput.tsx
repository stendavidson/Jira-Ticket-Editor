// Import styles
import styles from "./UserInput.module.scss";

// External imports
import { useContext, useEffect, useRef, useState } from "react";

// Internal imports
import request from "@/lib/nothrow_request";
import { TicketContext } from "@/contexts/TicketContext";
import UserInterface from "../UserInput/UserInterface";


export default function UserInput({ className, issueID, issueKey, keyName, name, operations, defaultValue}: { className?: string, issueID: string, issueKey: string, keyName: string, name: string, operations: string[], defaultValue: UserInterface | null}){

  // State values
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<UserInterface | null>(defaultValue);
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

    // Early exit
    if(startAt === -1 || loading.current){
      return;
    }

    // Mark as loading
    loading.current = true;

    // Max Results
    const maxResults = 50;

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
        method: "GET"
      }
    );

    // Process Response
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

    // Values are set
    setPermittedValues(prev => [...prev, ...options.filter((value: UserInterface) => value.accountType === "atlassian")]);
    setFilteredPermittedValues(prev => [...prev, ...options.filter((value: UserInterface) => {
      return value.accountType === "atlassian" && (value.displayName.toLowerCase().includes(inputValue.toLowerCase()) || value.emailAddress.toLowerCase().includes(inputValue.toLowerCase()));
    })]);

    loading.current = false;
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

  }



  ///////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////// Effects ///////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This retrieves the initial list of dropdown options
   */
  useEffect(() => {

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
        <>
          <img src={(selectedOption?.displayName.toLowerCase().includes(inputValue.toLowerCase()) || selectedOption?.emailAddress.toLowerCase().includes(inputValue.toLowerCase())) ? (selectedOption?.avatarUrls["48x48"] ?? "./../defaultAvatar.png") : "./../defaultAvatar.png"} className={styles.userIcon}/>
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
        <div className={`${styles.fieldDropdown} ${showDropdown ? styles.displayDropdown : ""}`} ref={parentRef}>
          {operations.includes("set") && (
            filteredPermittedValues.map((option: UserInterface) => {
                if(selectedOption?.accountId !== option.accountId){
                  return (
                    <div className={styles.dropdownOption} onMouseDown={() => {selectOption(option)}} key={option.accountId}>
                      <img src={option.avatarUrls["48x48"]} className={styles.userIcon}/>
                      <p className={styles.dropdownOptionName}>{option.displayName}</p>
                    </div>
                  )
                }
              }
            )
          )}
          <div className={styles.dropdownOption} onMouseDown={() => {selectOption(null)}}>
            <img src="./../defaultAvatar.png" className={styles.userIcon}/>
            <p className={styles.dropdownOptionName}>Unassigned</p>
          </div>
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