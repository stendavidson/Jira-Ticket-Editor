// Import styles
import styles from "./SentimentInput.module.scss";

// External imports
import { useContext, useRef, useState } from "react";

// Internal imports
import request from "@/lib/NoExceptRequestLib";
import { TicketContext } from "@/contexts/TicketContext";
import SentimentInterface from "./SentimentInterface";


export default function SentimentInput({ className, issueID, keyName, name, operations, defaultValue, allowedValues = []}: { className?: string, issueID: string, keyName: string, name: string, operations: string[], defaultValue: SentimentInterface, allowedValues: SentimentInterface[]}){

  // State values
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<SentimentInterface | null>(defaultValue);
  const [filteredPermittedValues, setFilteredPermittedValues] = useState<SentimentInterface[]>(allowedValues);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [focused, setFocused] = useState<boolean>(false);

  // Refs
  const ref = useRef<HTMLDivElement | null>(null);

  // Contexts
  const context = useContext(TicketContext);



  ///////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// API Functions ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function updates the issue data with the input option
   * 
   * @param option The option being used to update the issue.
   * 
   * @returns The success of the PUT request
   */
  async function setInIssue(option: SentimentInterface | null): Promise<boolean>{

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}`);
    url.searchParams.append("elevate", "true");

    // PUT Request Body
    const body: any = {};
    body.fields = {};

    if(option !== null){
      body.fields[keyName] = option.id;
    }else{
      body.fields[keyName] = null;
    }
    
    // Sentiment request
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
   * This handles the selection 
   * 
   * @param option The Issue Type data
   */
  function selectOption(option: SentimentInterface | null){

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
    
    setFilteredPermittedValues(allowedValues.filter((value: SentimentInterface) => (
      value.name.toLowerCase().includes(textInput.toLowerCase())
    )))

  }



  return (
    <div className={`${styles.fieldEditor} ${className ? className : ""}`} ref={ref}>
      <h1 className={styles.label}>{name}</h1>
      <div className={`${styles.fieldButton} ${focused ? styles.focused : ""}`}>
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
            setFilteredPermittedValues(allowedValues);
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
            filteredPermittedValues.map((option: SentimentInterface) => {
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
        </div>
      </div>
    </div>
  );
}