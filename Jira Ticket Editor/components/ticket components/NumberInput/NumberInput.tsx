// Import styles
import styles from "./NumberInput.module.scss";

// External imports
import { useContext, useRef, useState } from "react";

// Internal imports
import request from "@/lib/nothrow_request";
import { TicketContext } from "@/contexts/TicketContext";


export default function NumberInput({className, issueID, keyName, name, operations, defaultValue}: {className: string, issueID: string, keyName: string, name: string, operations: string[],  defaultValue: string}) {

  // State Values
  const [initial, setInitial] = useState<string>(defaultValue ?? "");
  const [inputValue, setInputValue] = useState<string>(defaultValue ?? "");
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

    // PUT Request Body
    const body: any = {}
    body.fields = {};
    body.fields[keyName] = (inputValue === "" ? null : parseInt(inputValue));

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

    // Early exit
    if(!ref.current!.validity){
      return;
    }

    // Submit text on "Enter"
    if (ev.key === "Enter") {

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
    if(!ref.current!.validity){
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
   * This function validates the users inputValue
   * 
   * @param numberInput The user inputValue
   * 
   * @param target The user inputValue field
   */
  function validateInputField(numberInput: string): string {
    
    // Setup
    const inputFieldRef = ref.current!;
    let returnVal = "";

    // Checks
    const isPartial = /^[-.]?$|^-?\d*\.?\d*$/.test(numberInput);
    const isFloat = /^-?\d*\.\d+$/.test(numberInput);
    const isNegativeOrZero = /^-\d*\.?\d*$/.test(numberInput) || numberInput === "0";

    if (numberInput !== "" && !isPartial) {
      inputFieldRef.setCustomValidity("Numerical input only");
      returnVal = "";
    } else if (isFloat) {
      inputFieldRef.setCustomValidity("Integer numbers only");
      const intVal = parseInt(numberInput);
      returnVal = Number.isNaN(intVal) ? "" : intVal.toString();
    } else if (isNegativeOrZero) {
      inputFieldRef.setCustomValidity("Numbers must be greater than 0");
      returnVal = "";
    } else {
      inputFieldRef.setCustomValidity("");
      returnVal = numberInput;
    }

    inputFieldRef.reportValidity();
    return returnVal;
  }


  /**
   * This function safely increases the value of the input field by 1.
   */
  function increaseInputValue(){

    const number: number = parseInt(inputValue);

    if(inputValue === ""){
      setInputValue("1");
    }else{
      setInputValue((number + 1).toString());
    }
  }


  /**
   * This function safely decreases the value of the input field by 1.
   */
  function decreaseInputValue(){

    const number: number = parseInt(inputValue);

    if(inputValue !== "" && number > 1){
      setInputValue((number - 1).toString());
    }
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
          placeholder="None"
          onInput={(ev: React.ChangeEvent<HTMLInputElement>) => {
            setInputValue(validateInputField(ev.target.value));
          }}
          onFocus={() => {setFocused(true);}}
          onBlur={() => {
            setFocused(false);
            clickAwayHandler();
          }}
          onKeyDown={inputKeyHandler}
          ref={ref}
        />
        <div className={`${styles.verticalContainer} ${focused ? styles.showControls : ""}`}>
          <button className={styles.increaseButton} onMouseDown={(ev: React.MouseEvent<HTMLButtonElement>) => {
            ev.preventDefault(); 
            ev.stopPropagation();
            increaseInputValue()
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round">
              <polyline points="6 15 12 9 18 15" />
            </svg>
          </button>
          <button className={styles.decreaseButton} onMouseDown={(ev: React.MouseEvent<HTMLButtonElement>) => {
            ev.preventDefault();
            ev.stopPropagation();
            decreaseInputValue()
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
