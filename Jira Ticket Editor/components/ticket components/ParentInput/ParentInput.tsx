// Import styles
import styles from "./ParentInput.module.scss";

// External imports
import { useContext, useEffect, useRef, useState } from "react";

// Internal imports
import request from "@/lib/nothrow_request";
import { TicketContext } from "@/contexts/TicketContext";
import { DefaultIssueTypeInterface, IssueTypeInterface, ParentInterface, ParentResponseInterface } from "./ParentInterface";


export default function ParentInput({ className, projectID, issueID, keyName, name, operations, issueType, defaultValue = null}: { className?: string, projectID: string, issueID: string, keyName: string, name: string, operations: string[], issueType: DefaultIssueTypeInterface, defaultValue: ParentInterface | null}){

  // State values
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<ParentInterface | null>(defaultValue);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [permittedValues, setPermittedValues] = useState<ParentInterface[]>([]);
  const [filteredPermittedValues, setFilteredPermittedValues] = useState<ParentInterface[]>([]);
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
   * This function retrieves the valid issue type(s) of a potential parent issue.
   */
  async function getParentIssueType(): Promise<IssueTypeInterface[]> {
    
    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issuetype/project`);
    url.searchParams.append("elevate", "true");
    url.searchParams.append("projectId", projectID);
    url.searchParams.append("level", (issueType.hierarchyLevel + 1).toString());

    // GET request
    const response = await request(
      url.toString(),
      {
        method: "GET"
      }
    );

    // Process response
    let options : IssueTypeInterface[] = [];

    if(response?.status.toString().startsWith("2")){
      options = (await response?.json()) as IssueTypeInterface[];
    }

    return options;
  }


  /**
   * This function retrieves issues of the provided issue type.
   */
  async function getIssues(issueType: string): Promise<ParentInterface[]>{

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/search/jql`);
    url.searchParams.append("elevate", "true");

    // POST Body
    const postBody = {
      "fields": ["summary", "status", "priority", "issuetype"],
      "jql": `project=${projectID} AND issuetype=${issueType}`,
    }

    // POST request
    const response = await request(
      url.toString(),
      {
        method: "POST",
        body: JSON.stringify(postBody)
      }
    );

    let options : ParentInterface[] = [];

    // Process response
    if(response?.status.toString().startsWith("2")){
      options = ((await response?.json()) as ParentResponseInterface).issues;
    }

    return options;
  }


  /**
   * This function retrives the valid options for the dropdown
   */
  async function getDropdownOptions() {

    // Parent issue type(s) are retrieved
    const parentIssueTypes: IssueTypeInterface[] = await getParentIssueType();

    // Valid potential parent issues are retrived
    let parentIssues: ParentInterface[] = [];

    for(let type of parentIssueTypes){
      parentIssues = [...parentIssues, ...(await getIssues(type.name))];
    }

    // Values are set
    setPermittedValues(parentIssues);
    setFilteredPermittedValues(parentIssues);
  }


  /**
   * This function updates the issue data with the input option
   * 
   * @param option The option being used to update the issue.
   * 
   * @returns The success of the PUT request
   */
  async function setInIssue(option: ParentInterface | null): Promise<boolean>{

    if(!issueType.subtask){

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

    return false;    
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
    
     setFilteredPermittedValues(permittedValues.filter((value: ParentInterface) => (
        value.fields.summary.toLowerCase().includes(textInput.toLowerCase())
        ||
        value.key.toLowerCase().includes(textInput.toLowerCase())
      )
    ));

  }


  /**
   * This handles the selection 
   * 
   * @param option The Issue Type data
   */
  function selectOption(option: ParentInterface | null){

    // Upon successfully updating the issue type update the UI
    setInIssue(option).then((success: boolean) => {
      if(success){
        setSelectedOption(option);
        context?.setUpdateIndicator(issueID);
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
    
    // Prevent unnecessary re-renders
    if(initial.current){
      getDropdownOptions();
      initial.current = false;
    }
    
  }, [])



  return (
    <div className={`${styles.fieldEditor} ${className ? className : ""}`} ref={ref}>
      <h1 className={styles.label}>{name}</h1>
      <div className={`${styles.fieldButton} ${focused ? styles.focused : ""}`}>
        <>
          {
            (selectedOption?.fields.summary.toLowerCase().includes(inputValue.toLowerCase()) || selectedOption?.key.toLowerCase().includes(inputValue.toLowerCase())) && (
              <img src={selectedOption.fields.issuetype.iconUrl} className={styles.icon}/>
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
              setInputValue(ev.target.value);
              filterDropdown(ev.target.value);
            }}
          />
        </> 
        <div className={`${styles.fieldDropdown} ${showDropdown ? styles.displayDropdown : ""}`}>
          {operations.includes("set") && (
            filteredPermittedValues.map((option: ParentInterface) => {
                if(selectedOption?.id !== option.id){
                  return (
                    <div className={styles.dropdownOption} onMouseDown={() => {selectOption(option)}} key={option.id}>
                      <img src={option.fields.issuetype.iconUrl} className={styles.icon}/>
                      <p className={styles.dropdownOptionName}>{`${option.key}: ${option.fields.summary}`}</p>
                    </div>
                  )
                }
              }
            )
          )}
          <div className={styles.dropdownOption} onMouseDown={() => {selectOption(null)}}>
            <p className={styles.dropdownOptionName}>None</p>
          </div>
        </div>
      </div>
    </div>
  );
}