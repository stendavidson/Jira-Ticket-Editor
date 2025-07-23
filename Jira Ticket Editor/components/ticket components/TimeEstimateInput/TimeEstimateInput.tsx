// Import styles
import styles from "./TimeEstimateInput.module.scss";

// External imports
import { useContext, useRef, useState } from "react";

// Internal imports
import request from "@/lib/nothrow_request";
import { TicketContext } from "@/contexts/TicketContext";


export default function TimeEstimateInput({className, issueID, keyName, name, operations, defaultValue}: {className: string, issueID: string, keyName: string, name: string, operations: string[],  defaultValue: string}) {

  // State Values
  const [initial, setInitial] = useState<string>(defaultValue);
  const [inputValue, setInputValue] = useState<string>(defaultValue);
  const [focused, setFocused] = useState<boolean>(false);

  // Refs
  const ref = useRef<HTMLInputElement | null>(null);

  // Contexts
  const context = useContext(TicketContext);



  ///////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// API Functions ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function updates the issue data with the user input
   * 
   * @returns The success of the PUT request
   */
  async function setInIssue(): Promise<boolean> {

    // URL Params
    const url = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}`);
    url.searchParams.append("elevate", "true");

    // PUT Request Body
    const body: any = {}
    body.fields = {};
    body.fields[keyName] = {
      originalEstimate: inputValue
    }

    // Update Request
    const response = await request(url.toString(), {
      method: "PUT",
      body: JSON.stringify(body),
    });

    return response?.status.toString().startsWith("2") ?? false;
  }



  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Callbacks //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////


  /**
   * This function handles the scenario in which the user presses 'Enter'  - similar to
   * Jira this triggers a field update.
   */
  function inputKeyHandler(ev: React.KeyboardEvent<HTMLInputElement>): void {

    // Submit text on "Enter"
    if (ev.key === "Enter") {

      // Early exit
      if(!validateInputField(inputValue)){
        setInputValue(initial);
        return;
      }

      // Leave field
      ref.current!.blur();

      // Prevent double handling
      ev.preventDefault();

      // Prevent unnecessary re-renders
      if(inputValue !== initial){

        // Update text field
        setInIssue().then((success: boolean) => {
          if(success){
            context?.setUpdateIndicator(issueID);
            setInitial(inputValue);
          }else{
            setInputValue(initial);
          }
        });
      }
    }
  }


  /**
   * This function handles the scenario in which the user clicks away - similar to
   * Jira this triggers a field update.
   */
  function clickAwayHandler() {    

    // Early exit
    if(!validateInputField(inputValue)){
      setInputValue(initial);
      return;
    }

    // Prevent update if the inputValue value hasn't been updated.
    if (inputValue !== initial) {
      
      // Update text field
      setInIssue().then((success: boolean) => {
        if(success){
          context?.setUpdateIndicator(issueID);
          setInitial(inputValue);
        }else{
          // Reset inputValue field to previous value on fail
          setInputValue(initial);
        }
      });
    }
  }


  /**
   * This function validates the users input value
   * 
   * @param timeInput The user input value
   */
  function validateInputField(timeInput: string): boolean {
    
    // Setup
    const inputFieldRef = ref.current!;

    // Checks
    const regex = /^\s*(?:(\d+)\s*w\s*)?(?:(\d+)\s*d\s*)?(?:(\d+)\s*h\s*)?(?:(\d+)\s*m\s*)?$/;
    const match = timeInput.match(regex);

    if (timeInput !== "" && match === null) {
      inputFieldRef.setCustomValidity("Use the format: 1w 2d 3h 4m");
    } else {
      inputFieldRef.setCustomValidity("");
    }

    inputFieldRef.reportValidity();

    return !(timeInput !== "" && match === null);
  }


  return (
    <div className={`${styles.fieldEditor} ${className || ""}`}>
      <h1 className={styles.label}>{name}</h1>
      <div className={`${styles.fieldButton} ${focused ? styles.focused : ""}`}>
        <input
          className={styles.inputField}
          type="text"
          disabled={!operations.includes("set")}
          value={inputValue}
          placeholder="Log time e.g. 1w 2d 3h 4m"
          onInput={(ev: React.ChangeEvent<HTMLInputElement>) => {
            setInputValue(ev.target.value);
          }}
          onFocus={() => {setFocused(true);}}
          onBlur={() => {
            setFocused(false);
            clickAwayHandler();
          }}
          onKeyDown={inputKeyHandler}
          ref={ref}
        />
      </div>
    </div>
  );
}
