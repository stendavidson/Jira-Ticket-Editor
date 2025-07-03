// Import styles
import styles from "./DateTimeInput.module.scss";

// External imports
import { useContext, useRef, useState } from "react";

// Internal imports
import request from "@/lib/nothrow_request";
import { TicketContext } from "@/contexts/TicketContext";


export default function DateTimeInput({className, issueID, keyName, name, operations, defaultValue}: {className: string, issueID: string, keyName: string, name: string, operations: string[],  defaultValue: string}) {

  // The local date and time
  let localDate: string = "";
  let localTime: string = "";
  
  // Parse default value
  if(defaultValue){
    const date = new Date(defaultValue);
    localDate = date.toLocaleDateString('en-CA');
    localTime = date.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'});
  }

  // State Values
  const [initialOne, setInitialOne] = useState<string>(defaultValue ? localDate : "");
  const [initialTwo, setInitialTwo] = useState<string>(defaultValue ? localTime : "")
  const [inputValueOne, setInputValueOne] = useState<string>(defaultValue ? localDate : "");
  const [inputValueTwo, setInputValueTwo] = useState<string>(defaultValue ? localTime : "");
  const [focused, setFocused] = useState<boolean>(false);

  // Refs
  const ref = useRef<HTMLInputElement | null>(null);
  const divRef = useRef<HTMLDivElement | null>(null);

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
    body.fields[keyName] = (inputValueOne === "" && inputValueTwo === "" ? null : getLocalDateTimeWithOffset(inputValueOne, inputValueTwo));

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
   * This function combines the date and time data from HTML input fields.
   * 
   * @param dateStr The date string from the HTML date input field
   * 
   * @param timeStr The date string from the HTML time input field
   * 
   * @returns A correctly formatted date-time string with UTC offset for the user's location.
   */
  function getLocalDateTimeWithOffset(dateStr: string, timeStr: string): string | null {

    // Early exit
    if (dateStr === "" || timeStr === ""){
      return null;
    }

    const dateTime = new Date(`${dateStr}T${timeStr}`);

    // Malformed data will trigger early exit
    if (Number.isNaN(dateTime.getTime())){
      return null;
    }

    // Calculate timezone offset
    const offsetMinutes = dateTime.getTimezoneOffset();
    const sign = offsetMinutes > 0 ? "-" : "+";
    const abs = Math.abs(offsetMinutes);
    const hours = String(Math.floor(abs / 60)).padStart(2, "0");
    const minutes = String(abs % 60).padStart(2, "0");

    return `${dateStr}T${timeStr}:00.000${sign}${hours}${minutes}`;
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
      if(inputValueOne !== initialOne || inputValueTwo !== initialTwo){

        // Prevent partially filled/emptied fields
        if((inputValueOne === "" && inputValueTwo === "") || (inputValueOne !== "" && inputValueTwo !== "")){
          
          // Update text field
          setInIssue().then((success: boolean) => {
            if(success){
              context?.setUpdateIndicator(issueID);
              setInitialOne(inputValueOne);
              setInitialTwo(inputValueTwo);
            }else{
              setInputValueOne(initialOne);
              setInputValueTwo(initialTwo);
            }
          });
        }else{

          setInputValueOne(initialOne);
          setInputValueTwo(initialTwo);

        }
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

    // Prevent unnecessary re-renders
    if(inputValueOne !== initialOne || inputValueTwo !== initialTwo){

      // Prevent partially filled/emptied fields
      if((inputValueOne === "" && inputValueTwo === "") || (inputValueOne !== "" && inputValueTwo !== "")){
        
        // Update text field
        setInIssue().then((success: boolean) => {
          if(success){
            context?.setUpdateIndicator(issueID);
            setInitialOne(inputValueOne);
            setInitialTwo(inputValueTwo);
          }else{
            setInputValueOne(initialOne);
            setInputValueTwo(initialTwo);
          }
        });

      }else{

        setInputValueOne(initialOne);
        setInputValueTwo(initialTwo);

      }
    }
  }



  return (
    <div className={`${styles.fieldEditor} ${className || ""}`}>
      <h1 className={styles.label}>{name}</h1>
      <div 
        className={`${styles.fieldButton} ${focused ? styles.focused : ""}`}
        tabIndex={-1}
        ref={divRef}
        onClick={() => {
          setFocused(true);
        }}
        onBlur={() => {
          setFocused(false);
          clickAwayHandler();
        }}
      >
        <input
          className={styles.inputDateField}
          type="date"
          disabled={!operations.includes("set")}
          value={inputValueOne}
          placeholder=""
          onInput={(ev: React.ChangeEvent<HTMLInputElement>) => {
            setInputValueOne(ev.target.value);
          }}
          onKeyDown={inputKeyHandler}
          ref={ref}
        />
        <input
          className={styles.inputTimeField}
          type="time"
          disabled={!operations.includes("set")}
          value={inputValueTwo}
          placeholder=""
          onInput={(ev: React.ChangeEvent<HTMLInputElement>) => {
            setInputValueTwo(ev.target.value);
          }}
          onKeyDown={inputKeyHandler}
          ref={ref}
        />
      </div>
    </div>
  );
}
