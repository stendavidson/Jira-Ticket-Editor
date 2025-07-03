// Import styles
import styles from "./ShortTextInput.module.scss";

// External imports
import { useContext, useEffect, useRef, useState } from "react";

// Internal imports
import request from "@/lib/nothrow_request";
import { TicketContext } from "@/contexts/TicketContext";


export default function ShortTextInput({className, issueID, keyName, name, operations, defaultValue}: {className: string, issueID: string, keyName: string, name: string, operations: string[],  defaultValue: string}) {

  // State Values
  const [initial, setInitial] = useState<string>(defaultValue ?? "");
  const [inputValue, setInputValue] = useState<string>(defaultValue ?? "");

  // Refs
  const ref = useRef<HTMLTextAreaElement | null>(null);

  // Contexts
  const context = useContext(TicketContext);



  ///////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// API Functions ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function updates the issue data with the user inputValue
   * 
   * @returns The success of the PUT request
   */
  async function setInIssue(): Promise<boolean> {

    // URL Params
    const url = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}`);

    // PUT Request body
    const body: any = {}
    body.fields = {};
    body.fields[keyName] = (inputValue !== "" ? inputValue : null);

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
  function inputKeyHandler(ev: React.KeyboardEvent<HTMLTextAreaElement>): void {

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



  ///////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////// Effects ///////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This effect is used to set the initial height of the text field
   */
  useEffect(() => {
    if(ref.current){
      ref.current.style.height = "max(1.6vh, 16px)";
      ref.current.style.height = `max(${(ref.current.scrollHeight - 26) / 10}vh, ${ref.current.scrollHeight - 26}px)`;
    }
  }, []);



  return (
    <div className={`${styles.fieldEditor} ${className || ""}`}>
      <h1 className={styles.label}>{name}</h1>
      <textarea
        className={styles.inputField}
        disabled={!operations.includes("set")}
        value={inputValue}
        placeholder="None"
        onChange={(ev: React.ChangeEvent<HTMLTextAreaElement>) => {
          setInputValue(ev.target.value);
          if(ref.current){
            ref.current.style.height = "max(1.6vh, 16px)";
            ref.current.style.height = `max(${(ref.current.scrollHeight - 26) / 10}vh, ${ref.current.scrollHeight - 26}px)`;
          }
        }}
        onBlur={clickAwayHandler}
        onKeyDown={inputKeyHandler}
        ref={ref}
      />
    </div>
  );
}
