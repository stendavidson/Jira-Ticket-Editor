// Import styles
import styles from "./LabelArray.module.scss";

// External imports
import { useContext, useEffect, useRef, useState } from "react";

// Internal imports
import request from "@/lib/NoExceptRequestLib";
import { TicketContext } from "@/contexts/TicketContext";
import LabelsResponseInterface from "./LabelsResponseInterface";
import { checkIfLoaderVisibleAndFetch } from "@/lib/DropdownLib";


export default function LabelArray({ className, issueID, keyName, name, operations, defaultValue = []}: { className?: string, issueID: string, keyName: string, name: string, operations: string[], defaultValue: string[]}){

  // State Values
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>(defaultValue ?? []);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [permittedValues, setPermittedValues] = useState<string[]>([]);
  const [filteredPermittedValues, setFilteredPermittedValues] = useState<string[]>([]);
  const [startAt, setStartAt] = useState<number>(0);
  const [focused, setFocused] = useState<boolean>(false);
  const [triggerLoad, setTriggerLoad] = useState<boolean>(false);

  // Refs
  const inputFieldRef = useRef<HTMLInputElement | null>(null);
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
   * This function retrieves the valid options for the dropdown
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
    url.searchParams.append("pathname", "/label");
    url.searchParams.append("elevate", "true");
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

    // Process responses
    let labelsResponse: LabelsResponseInterface | undefined;
    let options: string[] = [];
    let filteredOtions: string[] = [];

    if(response?.status.toString().startsWith("2")){

      labelsResponse = (await response.json()) as LabelsResponseInterface;
      options = labelsResponse.values;
      filteredOtions = options.filter((value: string) => {
        return (value.toLowerCase().includes(textInput.toLowerCase()));
      })

      setStartAt(labelsResponse.isLast ? -1 : labelsResponse.startAt + maxResults);
    }

    // If the request is out of date exit.
    if (token !== requestToken.current){
      return;
    }

    // Set permitted values or recurse
    if(options.length > 0){

      setPermittedValues(prev => [...prev, ...options].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })));

      if(filteredOtions.length > 0){
        setFilteredPermittedValues(prev => [...prev, ...options].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })));
      }else{
        setTriggerLoad(prev => !prev);
      }

    }else{
      setTriggerLoad(prev => !prev);
    }
  }


  /**
   * This function adds the selected option from the Jira Issue
   * 
   * @param option The option being added
   * 
   * @returns The success or failure of the request is returned
   */
  async function addToIssue(option: string): Promise<boolean>{

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}`);
    url.searchParams.append("elevate", "true");

    // PUT Request Body
    const body: any = {};
    body.update = {};
    body.update[keyName] = [
      {
        "add": option
      }
    ];

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


  /**
   * This function removes the selected option from the Jira Issue
   * 
   * @param option The option being removed
   * 
   * @returns The success or failure of the request is returned
   */
  async function removeFromIssue(option: string): Promise<boolean>{

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}`);
    url.searchParams.append("elevate", "true");

    // PUT Request Body
    const body: any = {};
    body.fields = {};
    body.fields[keyName] = [...(selectedOptions.filter((value: string) => value !== option))];

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


 
  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Callbacks //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////


  /**
   * This function adds an option from the dropdown to the list of selected options.
   * 
   * @param option: The option being added
   */
  function addOption(option: string){

    // Upon successfully updating the selected options
    addToIssue(option).then((success: boolean) => {

      if(success){

        setSelectedOptions(prev => [...prev, option]);

        // Ensure option is included in permittedValues
        setPermittedValues(prev =>
          [...prev, option].filter((v, i, self) => self.indexOf(v) === i).sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
          )
        );

        // Reset filtered list to full list
        setFilteredPermittedValues(
          [...permittedValues, option].filter((v, i, self) => self.indexOf(v) === i).sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
          )
        );

        context?.setUpdateIndicator(issueID);
      }
    })
  }


  /**
   * This function handles the scenario in which the user presses 'Enter' - similar to
   * Jira this triggers a field update.
   */
  function inputKeyHandler(ev: React.KeyboardEvent<HTMLInputElement>): void {

    const inputElement: HTMLInputElement = ev.target as HTMLInputElement;
    const value: string = inputElement.value;

    // Submit text on "Enter"
    if (ev.key === "Enter" && value !== "") {

      // Prevent double handling
      ev.preventDefault();

      // Update text field
      addOption(inputValue);
      setInputValue("");
      setFilteredPermittedValues(permittedValues);
      setFocused(false);
      setShowDropdown(false);
    }
  }


  /**
   * This function removes a given option from the list of selected options.
   * 
   * @param option: The option being removed
   */
  function removeOption(option: string){

    // Upon successfully updating the selected options
    removeFromIssue(option).then((success: boolean) => {
      if(success){
        setSelectedOptions(prev => prev.filter(value => value !== option));
        setFilteredPermittedValues(permittedValues);
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

    // If allowed values exist - then filtered the restricted list
    if (permittedValues.length > 0) {

      setFilteredPermittedValues(permittedValues.filter((value: string) => 
        value.toLowerCase().includes(textInput.toLowerCase())
      ));

    }

    checkIfLoaderVisibleAndFetch(loadDiv.current, parentRef.current, showDropdown, textInput, getDropdownOptions, true);
  }


  /**
   * This function validates the users input
   * 
   * @param textInput The user input
   * 
   * @param target The user input field
   */
  function validateInputField(textInput: string){

    // Input validation
    if (/\s/.test(textInput)) {
      inputFieldRef.current!.setCustomValidity("Labels cannot contain spaces.");
    } else if (/[^a-zA-Z0-9-]/.test(textInput)) {
      inputFieldRef.current!.setCustomValidity("Labels cannot contain special characters");
    } else if (/^-|-$/.test(textInput)) {
      inputFieldRef.current!.setCustomValidity("Labels cannot start or end with a hyphen");
    } else if (textInput.length === 0 || textInput.length > 255) {
      inputFieldRef.current!.setCustomValidity("Labels must be 1–255 characters in length");
    } else {
      inputFieldRef.current!.setCustomValidity("");
    }
    inputFieldRef.current!.reportValidity();

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
   * Effect runs lazy loading if there are more items to load NOW
   */
  useEffect(() => {
      
    checkIfLoaderVisibleAndFetch(loadDiv.current, parentRef.current, showDropdown, inputValue, getDropdownOptions, false);
  
  }, [startAt, showDropdown]);



  return (
    <div className={`${styles.fieldEditor} ${className ? className : ""}`}>
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
              validateInputField(ev.target.value);
              filterDropdown(ev.target.value);
            }}
            onKeyDown={inputKeyHandler}
            ref={inputFieldRef}
          />
          { selectedOptions.length > 0 && (
              selectedOptions.map((option: string) => {
                return (
                  <div className={styles.selectedOption} key={option}>
                    <p className={styles.selectedOptionName}>{option}</p>
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
        <div 
          className={`${styles.fieldDropdown} ${showDropdown ? styles.displayDropdown : ""}`}
          onScroll={() => {
            checkIfLoaderVisibleAndFetch(loadDiv.current, parentRef.current, showDropdown, inputValue, getDropdownOptions, false);
          }}
          ref={parentRef}>
          <>
            {operations.includes("set") && operations.includes("add") && (
                filteredPermittedValues.map((option: string) => {
                    if(!selectedOptions.includes(option)){
                      return (
                        <div className={styles.dropdownOption} onMouseDown={() => {addOption(option)}} key={option}>
                          <p className={styles.dropdownOptionName}>{option}</p>
                        </div>
                      )
                    }
                  }
                )
              )
            }
            {operations.includes("add") && inputValue !== "" && !permittedValues.includes(inputValue) && (
                <div className={styles.dropdownOption} onMouseDown={() => {addOption(inputValue)}}>
                  <p className={styles.dropdownOptionName}>{inputValue} (new label)</p>
                </div>
              )
            }
            {startAt !== -1 && (
              <div className={styles.invalidDropdownOption} ref={loadDiv}>
                <p className={styles.dropdownOptionName}>Loading</p>
              </div>
            )}
          </>
        </div>
      </div>
    </div>
  );
}