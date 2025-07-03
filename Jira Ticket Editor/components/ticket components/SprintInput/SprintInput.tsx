// Import styles
import styles from "./SprintInput.module.scss";

// External imports
import { useContext, useEffect, useRef, useState } from "react";

// Internal imports
import request from "@/lib/nothrow_request";
import { TicketContext } from "@/contexts/TicketContext";
import { SprintInterface, SprintListResponse }  from "./SprintInterface";
import { BoardResponseInterface } from "./BoardInterface";


export default function SprintInput({ className, projectID, issueID, keyName, name, operations, defaultValue = [], allowedValues = []}: { className?: string, projectID:string, issueID: string, keyName: string, name: string, operations: string[], defaultValue: SprintInterface[] | null, allowedValues: SprintInterface[]}){

  // State values
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<SprintInterface | null>((defaultValue?.length ?? 0 > 0) ? defaultValue!.find((sprint: SprintInterface) => sprint.state === "active") ?? null : null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [permittedValues, setPermittedValues] = useState<SprintInterface[]>([]);
  const [filteredPermittedValues, setFilteredPermittedValues] = useState<SprintInterface[]>([]);
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
   * This function recursively retrieve all board IDs
   * 
   * @param boardIDs The output array containing all the board IDs
   * 
   * @param startAt The startAt value for the API call
   * 
   * @returns All the board IDs
   */
  async function getBoards(boardIDs: number[] = [], startAt: number = 0): Promise<string[]>{
    
    // URL Params
    const url: URL = new URL("/proxy-agile", window.location.origin);
    url.searchParams.append("pathname", `/board`);
    url.searchParams.append("projectKeyOrId", projectID);
    url.searchParams.append("startAt", startAt.toString());

    // GET request
    const response = await request(
      url.toString(),
      {
        method: "GET"
      }
    );

    
    // Process response
    let boardResponse : BoardResponseInterface | undefined;

    if(response?.status.toString().startsWith("2")){

      // Extract boards
      boardResponse = (await response?.json()) as BoardResponseInterface;
      
      // Add board IDs
      for(let value of boardResponse.values){
        boardIDs.push(value.id);
      }
    }

    // Base recursion condition
    if(boardResponse && !boardResponse.isLast){
      return getBoards(boardIDs, boardResponse.startAt + boardResponse.maxResults);
    }

    return boardIDs.map(num => num.toString());
  }


  /**
   * This function recursively retrieves the Sprints associated within a given board ID.
   * 
   * @param boardID The board ID used to retrieve Sprints
   * 
   * @param sprints The output array containing the Sprints
   * 
   * @param startAt The startAt value for the API call
   * 
   * @returns A list of all Sprints corresponding to the input board ID
   */
  async function getSprint(boardID: string, sprints: SprintInterface[] = [], startAt: number = 0): Promise<SprintInterface[]>{
    
    // URL Params
    const url: URL = new URL("/proxy-agile", window.location.origin);
    url.searchParams.append("pathname", `/board/${boardID}/sprint`);
    url.searchParams.append("startAt", startAt.toString());

    // GET request
    const response = await request(
      url.toString(),
      {
        method: "GET"
      }
    );

    // Process Response
    let sprintResponse: SprintListResponse | undefined;

    if(response?.status.toString().startsWith("2")){

      // Extract sprints
      sprintResponse = (await response?.json()) as SprintListResponse;
      
      // Add sprints
      sprints = sprints.concat(sprintResponse.values);
    }

    // Base recursion condition
    if(sprintResponse && !sprintResponse.isLast){
      return getSprint(boardID, sprints, sprintResponse.startAt + sprintResponse.maxResults);
    }

    return sprints;
  }


  /**
   * This function retrives the valid options for the dropdown
   */
  async function getDropdownOptions(){

    // The board IDs are retrieved
    const boardIDs: string[] = await getBoards();

    // Valid potential sprints are retrieved
    let sprints: SprintInterface[] = [];

    for(let boardID of boardIDs){
      sprints = sprints.concat(await getSprint(boardID));
    }

    sprints = Array.from(new Set(sprints));

    // Values are set
    setPermittedValues(sprints);
    setFilteredPermittedValues(sprints);
  }


  /**
   * This function updates the issue data with the input option
   * 
   * @param option The option being used to update the issue.
   * 
   * @returns The success of the PUT request
   */
  async function setInIssue(option: SprintInterface | null): Promise<boolean>{

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}`);

    // PUT Request Body
    const body: any = {};
    body.fields = {};

    if(option){
      body.fields[keyName] = option.id;
    }else{
      body.fields[keyName] = null;
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
    
    setFilteredPermittedValues(permittedValues.filter((value: SprintInterface) => (
      value.name.toLowerCase().includes(textInput.toLowerCase())
    )))

  }


  /**
   * This handles the selection 
   * 
   * @param option The Issue Type data
   */
  function selectOption(option: SprintInterface | null){

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

      initial.current = false;

      // If pre-filtered values are present utilize
      if(allowedValues.length !== 0){

        setPermittedValues(allowedValues);

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
          placeholder={selectedOption?.name ?? "None"}
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
            filteredPermittedValues.map((option: SprintInterface) => {
                if(selectedOption?.id !== option.id){
                  return (
                    <div className={styles.dropdownOption} onMouseDown={() => {selectOption(option)}} key={option.id}>
                      <p className={styles.dropdownOptionName}>{option.name}</p>
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