// Import styles
import styles from "./PriorityInput.module.scss";

// External imports
import { useContext, useEffect, useRef, useState } from "react";

// Internal imports
import request from "@/lib/nothrow_request";
import { TicketContext } from "@/contexts/TicketContext";
import { PriorityResponseInterface, PriorityInterface } from "./PriorityInterface";


export default function PriorityInput({ className, projectID, issueID, keyName, name, operations, defaultValue, allowedValues = []}: { className?: string, projectID: string, issueID: string, keyName: string, name: string, operations: string[], defaultValue: PriorityInterface, allowedValues: PriorityInterface[]}){

  // State values
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<PriorityInterface>(defaultValue);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [permittedValues, setPermittedValues] = useState<PriorityInterface[]>([]);
  const [filteredPermittedValues, setFilteredPermittedValues] = useState<PriorityInterface[]>([]);
  const [startAt, setStartAt] = useState<number>(allowedValues.length > 0 ? -1 : 0);
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

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", "/priority/search");
    url.searchParams.append("elevate", "true");
    url.searchParams.append("projectId", projectID);
    url.searchParams.append("startAt", startAt.toString());

    // GET request
    const response = await request(
      url.toString(),
      {
        method: "GET"
      }
    );

    // Process response
    let priorityResponse: PriorityResponseInterface | undefined;
    let options : PriorityInterface[] = [];

    if(response?.status.toString().startsWith("2")){
      priorityResponse = (await response?.json()) as PriorityResponseInterface;
      options = priorityResponse.values;
      setStartAt(priorityResponse.isLast ? -1 : priorityResponse.startAt + priorityResponse.maxResults);
    }
  
    // Set the field options
    setPermittedValues(prev => [...prev, ...options]);
    setFilteredPermittedValues(prev => [...prev, ...options.filter((value: PriorityInterface) => value.name.toLowerCase().includes(inputValue.toLowerCase()))]);

    loading.current = false;
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
          {
            selectedOption?.name.toLowerCase().includes(inputValue.toLowerCase()) && (
              <img src={selectedOption.iconUrl} className={styles.icon}/>
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
        <div className={`${styles.fieldDropdown} ${showDropdown ? styles.displayDropdown : ""}`} ref={parentRef}>
          {operations.includes("set") && (
            filteredPermittedValues.map((option: PriorityInterface) => {
                if(selectedOption.id !== option.id){
                  return (
                    <div className={styles.dropdownOption} onMouseDown={() => {selectOption(option)}} key={option.id}>
                      <img src={option.iconUrl} className={styles.icon}/>
                      <p className={styles.dropdownOptionName}>{option.name}</p>
                    </div>
                  )
                }
              }
            )
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