// Import styles
import styles from "./PriorityInput.module.scss";

// External imports
import { useContext, useEffect, useRef, useState } from "react";

// Internal imports
import request from "@/lib/NoExceptRequestLib";
import { TicketContext } from "@/contexts/TicketContext";
import { PriorityResponseInterface, PriorityInterface } from "./PriorityInterface";
import { checkIfLoaderVisibleAndFetch } from "@/lib/DropdownLib";


export default function PriorityInput({ className, projectID, issueID, keyName, name, operations, defaultValue, allowedValues = []}: { className?: string, projectID: string, issueID: string, keyName: string, name: string, operations: string[], defaultValue: PriorityInterface, allowedValues: PriorityInterface[]}){

  // State values
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<PriorityInterface>(defaultValue);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [permittedValues, setPermittedValues] = useState<PriorityInterface[]>([]);
  const [filteredPermittedValues, setFilteredPermittedValues] = useState<PriorityInterface[]>([]);
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
   * This function retrives the valid options for the dropdown
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
    url.searchParams.append("pathname", "/priority/search");
    url.searchParams.append("elevate", "true");
    url.searchParams.append("projectId", projectID);
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
    let priorityResponse: PriorityResponseInterface | undefined;
    let options : PriorityInterface[] = [];
    let filteredOptions : PriorityInterface[] = [];

    if(response?.status.toString().startsWith("2")){
      
      priorityResponse = (await response?.json()) as PriorityResponseInterface;
      options = priorityResponse.values;
      filteredOptions = options.filter((value: PriorityInterface) => {
        return value.name.toLowerCase().includes(textInput.toLowerCase());
      });

      // Set next start index
      if(!priorityResponse.isLast){
        setStartAt(startAt + priorityResponse.maxResults);
      }else{
        setStartAt(-1)
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
  async function setInIssue(option: PriorityInterface): Promise<boolean>{

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}`);
    url.searchParams.append("elevate", "true");

    // PUT Request Body
    const body: any = {};
    body.fields = {};
    body.fields[keyName] = {
      id: option.id
    };

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
   * This function selects an option from the dropdown list
   * 
   * @param option: The option being selected
   */
  function selectOption(option: PriorityInterface){

    // Upon successfully updating the issue type update the UI
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
    
    setFilteredPermittedValues(permittedValues.filter((value: PriorityInterface) => (
      value.name.toLowerCase().includes(textInput.toLowerCase())
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

    // If pre-filtered values are present utilize
    if(allowedValues.length > 0){

      setPermittedValues(allowedValues);
      setFilteredPermittedValues(allowedValues);

    }else{

      getDropdownOptions("", false);
      
    }    

  }, []);


  /**
   * Effect runs lazy loading if no items were loaded intially
   */
  useEffect(() => {

    if(allowedValues.length === 0){
      getDropdownOptions("", false);
    }
    

  }, [triggerLoad]);


  /**
   * Effect runs lazy loading if there are NOW options to load
   */
  useEffect(() => {
    
    checkIfLoaderVisibleAndFetch(loadDiv.current, parentRef.current, showDropdown, inputValue, getDropdownOptions, false);

  }, [startAt, showDropdown]);



  return (
    <div className={`${styles.fieldEditor} ${className ? className : ""}`}>
      <h1 className={styles.label}>{name}</h1>
      <div className={`${styles.fieldButton} ${focused ? styles.focused : ""}`}>
        <>
          {
            selectedOption?.name.toLowerCase().includes(inputValue.toLowerCase()) && (
              <img 
                className={styles.icon}
                src={selectedOption.iconUrl} 
                alt={`Priority icon - ${selectedOption.name ?? "Unknown"}`}/>
            )
          }
          <input 
            className={styles.inputField} 
            type="text" 
            value={inputValue} 
            placeholder={selectedOption?.name ?? "Unassigned"}
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
            filteredPermittedValues.map((option: PriorityInterface) => {
                if(selectedOption.id !== option.id){
                  return (
                    <div className={styles.dropdownOption} onMouseDown={() => {selectOption(option)}} key={option.id}>
                      <img 
                        className={styles.icon} 
                        src={option.iconUrl} 
                        alt={`Priority icon - ${option.name}`}/>
                      <p className={styles.dropdownOptionName}>{option.name}</p>
                    </div>
                  )
                }
              }
            )
          )}
          {(startAt !== -1 && allowedValues.length === 0) && (
            <div className={styles.invalidDropdownOption} ref={loadDiv}>
              Loading...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}