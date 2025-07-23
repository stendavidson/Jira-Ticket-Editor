// Import styles
import styles from "./DateTimeInput.module.scss";

// External imports
import { useContext, useEffect, useRef, useState } from "react";

// Internal imports
import request from "@/lib/nothrow_request";
import { TicketContext } from "@/contexts/TicketContext";


export default function DateTimeInput({className, issueID, keyName, name, operations, defaultValue}: {className: string, issueID: string, keyName: string, name: string, operations: string[],  defaultValue: string}) {


  // State Values
  const [initialOne, setInitialOne] = useState<string>("");
  const [initialTwo, setInitialTwo] = useState<string>("")
  const [inputValueOne, setInputValueOne] = useState<string>("");
  const [inputValueTwo, setInputValueTwo] = useState<string>("");
  const [focused, setFocused] = useState<boolean>(false);

  // Refs
  const refDate = useRef<HTMLInputElement | null>(null);
  const refTime = useRef<HTMLInputElement | null>(null);
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
    url.searchParams.append("elevate", "true");

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
    if (!refDate.current?.validity.valid || !refTime.current?.validity.valid) {
      return;
    }

    // Submit text on "Enter"
    if (ev.key === "Enter") {

      // Leave field
      divRef.current!.blur();
      refDate.current!.blur();
      refTime.current!.blur();

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
    if (!refDate.current?.validity.valid || !refTime.current?.validity.valid) {
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



  ///////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////// Effects //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This (re-)sets the default input values
   */
  useEffect(() => {

    if (defaultValue) {

      // Format date and time
      const date = new Date(defaultValue);
      const newDate = date.toLocaleDateString("en-CA");
      const newTime = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

      setInitialOne(newDate);
      setInitialTwo(newTime);
      setInputValueOne(newDate);
      setInputValueTwo(newTime);

    } else {

      setInitialOne("");
      setInitialTwo("");
      setInputValueOne("");
      setInputValueTwo("");

    }

  }, [defaultValue]);



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
          // Delay to allow focus to move to another child
          setTimeout(() => {
            if (!divRef.current!.contains(document.activeElement)) {
              setFocused(false);
              clickAwayHandler();
            }
          }, 0);
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
          ref={refDate}
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
          ref={refTime}
        />
      </div>
    </div>
  );
}
