// Import styles
import styles from "./OptionArray.module.scss";

// External imports
import { useContext, useEffect, useRef, useState } from "react";

// Internal imports
import request from "@/lib/nothrow_request";
import { TicketContext } from "@/contexts/TicketContext";
import { FieldContextInterface, FieldContextResponseInterface, FieldOptionsResponseInterface, FieldOptionInterface } from "../OptionInput/OptionContextInterface";


export default function OptionArray({ className, issueID, keyName, name, operations, defaultValue = [], allowedValues = []}: { className?: string, issueID: string, keyName: string, name: string, operations: string[], defaultValue: FieldOptionInterface[] | null, allowedValues: FieldOptionInterface[]}){

  // State Values
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedOptions, setSelectedOptions] = useState<FieldOptionInterface[]>(defaultValue ?? []);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [permittedValues, setPermittedValues] = useState<FieldOptionInterface[]>([]);
  const [filteredPermittedValues, setFilteredPermittedValues] = useState<FieldOptionInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [focused, setFocused] = useState<boolean>(false);
  
  // Refs
  const ref = useRef<HTMLDivElement | null>(null);
  const initial = useRef<boolean>(true);

  // Contexts
  const context = useContext(TicketContext);


  /**
   * This recursive function retrieves all of the contexts corresponding to this field
   * 
   * @param fieldID The field ID
   * 
   * @param contexts The output contexts
   * 
   * @param startAt The "startAt" URL parameter
   * 
   * @returns A full list of all contexts corresponding to this field
   */
  async function getContexts(fieldID: string, contexts: FieldContextInterface[] = [], startAt: number = 0): Promise<FieldContextInterface[]>{
  
    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/field/${fieldID}/context`);
    url.searchParams.append("startAt", startAt.toString());

    // GET request
    const response = await request(
      url.toString(),
      {
        method: "GET"
      }
    );

    // Process response
    let contextResponse: FieldContextResponseInterface | undefined;

    if(response?.status.toString().startsWith("2")){
      
      contextResponse = (await response.json()) as FieldContextResponseInterface;
      contexts = [...contexts, ...contextResponse!.values];

    }

    if(contextResponse && !contextResponse.isLast){
      return getContexts(fieldID, contexts, contextResponse.startAt + contextResponse.maxResults);
    }

    return contexts;
  }


  /**
   * This recursive function retrieves all of the field options
   * 
   * @param fieldID The field ID
   * 
   * @param contextID The context ID
   * 
   * @param fieldOptions The output field options
   * 
   * @param startAt The "startAt" URL parameter
   * 
   * @returns A full list of all contexts corresponding to this field
   */
  async function getFieldOptions(fieldID: string, contextID: string, fieldOptions: FieldOptionInterface[] = [], startAt: number = 0): Promise<FieldOptionInterface[]>{

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/field/${fieldID}/context/${contextID}/option`);
    url.searchParams.append("startAt", startAt.toString());

    // GET request
    const response = await request(
      url.toString(),
      {
        method: "GET"
      }
    );

    // Process response
    let fieldOptionsResponse: FieldOptionsResponseInterface | undefined;

    if(response?.status.toString().startsWith("2")){
      
      fieldOptionsResponse = (await response.json()) as FieldOptionsResponseInterface;
      fieldOptions = [...fieldOptions, ...fieldOptionsResponse.values];

    }

    if(fieldOptionsResponse && !fieldOptionsResponse.isLast){
      return getFieldOptions(fieldID, contextID, fieldOptions, fieldOptionsResponse.startAt + fieldOptionsResponse.maxResults);
    }

    return fieldOptions;
  }


  /**
   * This function retrives the valid options for the dropdown
   */
  async function getDropdownOptions(){

    // Set "loading signal"
    setLoading(true);
    
    const fieldContexts: FieldContextInterface[] = await getContexts(keyName);

    let options: FieldOptionInterface[] = [];

    for(let context of fieldContexts){
      options = [...options, ...(await getFieldOptions(keyName, context.id))]
    }

    setLoading(false);
    setPermittedValues(options);
    setFilteredPermittedValues(options);
  }


  /**
   * This function adds the selected option from the Jira Issue
   * 
   * @param option The option being added
   * 
   * @returns The success or failure of the request is returned
   */
  async function addToIssue(option: FieldOptionInterface): Promise<boolean>{

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}`);

    // PUT Request Body
    const body: any = {};
    body.update = {};
    body.update[keyName] = [
      {
        "add": { value: option.value }
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
  async function removeFromIssue(option: FieldOptionInterface): Promise<boolean>{

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}`);

    // PUT Request Body
    const body: any = {};
    body.fields = {};
    body.fields[keyName] = [];

    for(let selectedOption of selectedOptions){
      if(selectedOption.id !== option.id){
        body.fields[keyName].push(
          { value: option.value }
        );
      }
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
   * This function adds an option from the dropdown to the list of selected options.
   * 
   * @param option: The option being added
   */
  function addOption(option: FieldOptionInterface){

    // Upon successfully updating the issue type update the UI
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
  function removeOption(option: FieldOptionInterface){

    // Upon successfully updating the issue type update the UI
    removeFromIssue(option).then((success: boolean) => {
      if(success){
        setSelectedOptions(prev => prev.filter((value: FieldOptionInterface) => value.id !== option.id));
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

    setFilteredPermittedValues(permittedValues.filter((option: FieldOptionInterface) => option.value.toLowerCase().includes(textInput.toLowerCase())));

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
      if(allowedValues.length > 0){
        setPermittedValues(allowedValues);
        setFilteredPermittedValues(allowedValues);
      }else{
        getDropdownOptions();
      }
    }
    
  }, []);


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
            }}/>
          { selectedOptions.length > 0 && (
              selectedOptions.map((option: FieldOptionInterface) => {
                return (
                  <div className={styles.selectedOption} key={option.id}>
                    <p className={styles.selectedOptionName}>{option.value}</p>
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
        <div className={`${styles.fieldDropdown} ${showDropdown ? styles.displayDropdown : ""}`}>
          <>
            {operations.includes("set") && operations.includes("add") && (
                filteredPermittedValues.map((option: FieldOptionInterface) => {
                    if(!selectedOptions.some((value: FieldOptionInterface) => value.id === option.id)){
                      return (
                        <div className={styles.dropdownOption} onMouseDown={() => {addOption(option)}} key={option.id}>
                          <p className={styles.dropdownOptionName}>{option.value}</p>
                        </div>
                      )
                    }
                  }
                )
              )
            }
            {loading && (
              <div className={styles.invalidDropdownOption}>
                <p className={styles.dropdownOptionName}>Loading</p>
              </div>
            )}
          </>
        </div>
      </div>
    </div>
  );
}