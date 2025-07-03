// Import styles
import styles from "./DateInput.module.scss";

// External imports
import { useContext, useRef, useState } from "react";

// Internal imports
import request from "@/lib/nothrow_request";
import { TicketContext } from "@/contexts/TicketContext";


export default function DateInput({className, issueID, keyName, name, custom, operations, defaultValue}: {className: string, issueID: string, keyName: string, name: string, custom: string, operations: string[],  defaultValue: string }) {

  // State Values
  const [initial, setInitial] = useState<string>(defaultValue ?? "");
  const [inputValue, setInputValue] = useState<string>(defaultValue ?? "");

  // Refs
  const ref = useRef<HTMLInputElement | null>(null);

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

    // PUT Request Body
    const body: any = {}
    body.fields = {};
    body.fields[keyName] = (inputValue !== "" ? formatDate(inputValue) : null);

    // Update Request
    const response = await request(url.toString(), {
      method: "PUT",
      body: JSON.stringify(body),
    });

    return response?.status.toString().startsWith("2") ?? false;
  }



  ///////////////////////////////////////////////////////////////////////////////
  //////////////////////////// Helper Function(s) ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function formats the date
   * 
   * @param dateStr The date string from the HTML date input field
   * 
   * @returns A correctly formatted date-time string with UTC offset for the user's location.
   */
  function formatDate(dateStr: string): string | null {

    // Early exit
    if (dateStr === ""){
      return null;
    }

    let output = dateStr;

    if(custom.includes("com.atlassian.jira.ext.charting")){

      // Convert into a Date object
      const dateTime = new Date(`${dateStr}`);

      // Get date/time components
      const day: string = dateTime.getDate().toString();
      const month: string = dateTime.toLocaleString("en-US", { month: "short" });
      const year: string = dateTime.getFullYear().toString().slice(-2);
      
      // Alternat date format
      output = `${day}/${month}/${year}`;
    }
    

    return output;
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



  return (
    <div className={`${styles.fieldEditor} ${className || ""}`}>
      <h1 className={styles.label}>{name}</h1>
      <input
        className={styles.inputField}
        type="date"
        disabled={!operations.includes("set")}
        value={inputValue}
        placeholder="None"
        onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
          setInputValue(ev.target.value);
        }}
        onBlur={clickAwayHandler}
        onKeyDown={inputKeyHandler}
        ref={ref}
      />
    </div>
  );
}
