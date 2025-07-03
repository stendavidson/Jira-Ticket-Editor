// Import styles
import styles from "./OptionInput.module.scss";

// External imports
import { useContext, useEffect, useRef, useState } from "react";

// Internal imports
import request from "@/lib/nothrow_request";
import { TicketContext } from "@/contexts/TicketContext";
import { FieldContextInterface, FieldContextResponseInterface, FieldOptionsResponseInterface, FieldOptionInterface } from "./OptionContextInterface";


export default function OptionInput({ className, issueID, keyName, name, operations, defaultValue, allowedValues = []}: { className?: string, issueID: string, keyName: string, name: string, operations: string[], defaultValue: FieldOptionInterface | null, allowedValues: FieldOptionInterface[]}){

  // State values
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<FieldOptionInterface | null>(defaultValue);
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
  


  ///////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// API Functions ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function retrieves a list of Field Contexts associated with this Option Field
   * 
   * @param contexts A list of existing contexts associated with the field.
   * 
   * @param startAt The starting index of the request
   * 
   * @returns A list of all Field Contexts associated with this Option Field
   */
  async function getContexts(contexts: FieldContextInterface[] = [], startAt: number = 0): Promise<FieldContextInterface[]>{

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/field/${keyName}/context`);

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
      contexts = [...contexts, ...contextResponse.values];
    }

    // Recursive base condition
    if(contextResponse && !contextResponse.isLast){
      return getContexts(contexts, contextResponse.startAt + contextResponse.maxResults);
    }

    return contexts;
  }


  /**
   * This function retrieves a list of possible options associated with this Option Field
   * 
   * @param contextID The context ID to use when retrieving the field options
   * 
   * @param fieldOptions The existing list of possible options
   * 
   * @param startAt The starting index of the request
   * 
   * @returns A list of all Field options associated with this Option Field
   */
  async function getFieldOptions(contextID: string, fieldOptions: FieldOptionInterface[] = [], startAt: number = 0): Promise<FieldOptionInterface[]>{

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/field/${keyName}/context/${contextID}/option`);

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

    // Recursive base condition
    if(fieldOptionsResponse && !fieldOptionsResponse.isLast){
      return getFieldOptions(contextID, fieldOptions, fieldOptionsResponse.startAt + fieldOptionsResponse.maxResults);
    }

    return fieldOptions;
  }


  /**
   * This function retrives the valid options for the dropdown
   */
  async function getDropdownOptions(){

    // Mark as loading
    setLoading(true);
    
    // Retrieve field contexts
    const contexts: FieldContextInterface[] = await getContexts();

    // Retrieve field options
    let options: FieldOptionInterface[] = [];

    for(let context of contexts){
      options = [...options, ...(await getFieldOptions(context.id))]
    }

    // Set the field options
    setLoading(false);
    setPermittedValues(options);
    setFilteredPermittedValues(options);
  }


  /**
   * This function updates the issue data with the input option
   * 
   * @param option The option being used to update the issue.
   * 
   * @returns The success of the PUT request
   */
  async function setInIssue(option: FieldOptionInterface | null): Promise<boolean>{

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}`);

    // PUT Request Body
    const body: any = {};
    body.fields = {};

    if(option){
      body.fields[keyName] = {
        value: option?.value ?? null
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
  function selectOption(option: FieldOptionInterface | null){

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
    
    setFilteredPermittedValues(permittedValues.filter((value: FieldOptionInterface) => (
      value.value.toLowerCase().includes(textInput.toLowerCase())
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

      initial.current = false;

      // If pre-filtered values are present utilize
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
        <input 
          className={styles.inputField} 
          type="text" 
          value={inputValue} 
          placeholder={selectedOption?.value ?? "None"}
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
            filteredPermittedValues.map((option: FieldOptionInterface) => {
                if(selectedOption?.value !== option.value){
                  return (
                    <div className={styles.dropdownOption} onMouseDown={() => {selectOption(option)}} key={option.value}>
                      <p className={styles.dropdownOptionName}>{option.value}</p>
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