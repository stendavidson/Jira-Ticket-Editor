// Import styles
import styles from "./TeamInput.module.scss";

// External imports
import { useContext, useEffect, useRef, useState } from "react";

// Internal imports
import request from "@/lib/nothrow_request";
import { TicketContext } from "@/contexts/TicketContext";
import { TeamInterface, TeamOptionResponseInterface, TeamOptionInterface } from "./TeamInterface";

export default function TeamInput({ className, issueID, keyName, name, operations, defaultValue, allowedValues = []}: { className?: string, issueID: string, keyName: string, name: string, operations: string[], defaultValue: TeamInterface | null, allowedValues: TeamInterface[]}){

  // State values
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<TeamOptionInterface | null>(defaultValue ? {value: defaultValue.id, displayName: defaultValue.title} : null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [permittedValues, setPermittedValues] = useState<TeamOptionInterface[]>([]);
  const [filteredPermittedValues, setFilteredPermittedValues] = useState<TeamOptionInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [focused, setFocused] = useState<boolean>(false);

  // Refs
  const ref = useRef<HTMLDivElement | null>(null);
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const requestToken = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);
  const initial = useRef<boolean>(true);

  // Contexts
  const context = useContext(TicketContext);



  ///////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// API Functions ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function retrieves the valid options for the dropdown
   * 
   */
  async function getDropdownOptions(textInput: string){

    // Set request token
    const token = requestToken.current + 1;
    requestToken.current++;

    // Mark as loading
    setLoading(true);
    
    // Abort previous request
    abortRef.current?.abort();

    // Create new AbortController to exit early if necessary
    const abortController = new AbortController();
    abortRef.current = abortController;

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/jql/autocompletedata/suggestions`);
    url.searchParams.append("elevate", "true");
    url.searchParams.append("fieldName", name);
    url.searchParams.append("fieldValue", textInput);

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
      setLoading(false);
      return;
    }

    // Process response
    let options: TeamOptionResponseInterface | null = null;
    let results: TeamOptionInterface[] = [];
    let cleanedResults: TeamOptionInterface[] = [];

    if(response?.status.toString().startsWith("2")){
      options = (await response?.json()) as TeamOptionResponseInterface;
      results = options.results;
    }

    // Clean the results of html tags
    for(let i = 0; i < results.length; i++){
      // Clean the results
      results[i].displayName = results[i].displayName.replace(/<\/?[^>]+>/g, "");

      // Copy the results
      cleanedResults.push({
        value: results[i].value,
        displayName: results[i].displayName
      })
    }

    // If the request is out of date exit.
    if (token !== requestToken.current){
      setLoading(false);
      return;
    }

    // Updated dropdown options
    setLoading(false);
    setPermittedValues(prev => [...prev.filter((value: TeamOptionInterface) => !cleanedResults.some((result: TeamOptionInterface) => result.value === value.value)), ...cleanedResults]);
    setFilteredPermittedValues(results);
  }



  /**
   * This function updates the issue data with the input option
   * 
   * @param option The option being used to update the issue.
   * 
   * @returns The success of the PUT request
   */
  async function setInIssue(option: TeamOptionInterface | null): Promise<boolean> {

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}`);
    url.searchParams.append("elevate", "true");

    // Request body
    const body: any = {};
    body.fields = {};
    body.fields[keyName] = option?.value ?? null;

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
  function selectOption(option: TeamOptionInterface | null) {

    // Upon successfully updating the selected options
    setInIssue(option).then((success: boolean) => {
      if (success) {
        setSelectedOption(option);
        context?.setUpdateIndicator(issueID);
      }
    });
  }


  /**
   * This function filters the dropdown list
   * 
   * @param textInput The user input
   */
  function filterDropdown(textInput: string){

    // If allowed values exist - then filtered the restricted list
    if (allowedValues.length > 0) {

      setFilteredPermittedValues(permittedValues.filter((permittedValue: TeamOptionInterface) => (
        permittedValue.value.toLowerCase().includes(textInput.toLowerCase())
      )));

    }else{

      // Clear existing timeouts
      if(timeout.current){
        clearTimeout(timeout.current);
      }
      
      // Prevent immediate execution - in case user is typing.
      timeout.current = setTimeout(() => {
        getDropdownOptions(textInput);
      }, 200);
      
    }
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

      initial.current = false;

      // If pre-filtered values are present, utilize them
      if (allowedValues.length !== 0) {

        // Construct dropdown option objects from allowedValues
        let options: TeamOptionInterface[] = [];
        
        for (let team of allowedValues) {
          options.push({
            value: team.id,
            displayName: team.title
          });
        }

        // Set permitted values
        setPermittedValues(options);

      } else {

        // Retrieve dropdown options
        getDropdownOptions("");

      }
    }

  }, []);


  return (
    <div className={`${styles.fieldEditor} ${className ? className : ""}`} ref={ref}>
      <h1 className={styles.label}>{name}</h1>
      <div className={`${styles.fieldButton} ${focused ? styles.focused : ""}`}>
        <input 
          className={styles.inputField} 
          type="text" 
          value={inputValue} 
          placeholder={selectedOption?.displayName.replace(/<\/?[^>]+>/g, "") ?? "None"}
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
        <div className={`${styles.fieldDropdown} ${showDropdown ? styles.displayDropdown : ""}`}>
          {operations.includes("set") && (
            filteredPermittedValues.map((option: TeamOptionInterface) => {
                if(selectedOption?.value !== option.value){
                  return (
                    <div className={styles.dropdownOption} onMouseDown={() => {selectOption(option)}} key={option.value}>
                      <p className={styles.dropdownOptionName}>{option.displayName}</p>
                    </div>
                  )
                }
              }
            )
          )}
          <div className={styles.dropdownOption} onMouseDown={() => {selectOption(null)}}>
            <p className={styles.dropdownOptionName}>None</p>
          </div>
          {loading && (
            <div className={styles.invalidDropdownOption}>
              Loading...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
