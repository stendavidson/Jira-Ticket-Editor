// Import styles
import styles from "./ShortTextInput.module.scss";

// External imports
import { useContext, useEffect, useRef, useState } from "react";

// Internal imports
import request from "@/lib/NoExceptRequestLib";
import { TicketContext } from "@/contexts/TicketContext";


export default function ShortTextInput({className, fontSize, issueID, keyName, name, operations, defaultValue}: {className?: string, fontSize: number, issueID: string, keyName: string, name?: string, operations: string[],  defaultValue: string}) {

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
  async function setInIssue(textInput: string): Promise<boolean> {

    // URL Params
    const url = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}`);
    url.searchParams.append("elevate", "true");

    // PUT Request body
    const body: any = {}
    body.fields = {};
    body.fields[keyName] = (textInput !== "" ? textInput : null);

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

    const inputElement: HTMLInputElement = ev.target as HTMLInputElement;

    // Submit text on "Enter"
    if (ev.key === "Enter") {

      // Leave field
      inputElement.blur();

      // Prevent double handling
      ev.preventDefault();

      // Prevent unnecessary re-renders
      if(inputElement.value !== initial){

        // Update text field
        setInIssue(inputElement.value).then((success: boolean) => {
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
      setInIssue(inputValue).then((success: boolean) => {
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
   * This function handles resizing of the short text input area
   */
  function resizeHandler(){

    if(ref.current){
      ref.current!.style.height = `max(${(fontSize + (fontSize/7))/10}vh, ${fontSize + (fontSize/7)}px)`;
      ref.current!.style.height = `max(${(ref.current!.scrollHeight - 26) / 10}vh, ${ref.current!.scrollHeight - 26}px)`;
    }
  }



  ///////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////// Effects ///////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This effect is used to set the initial height of the text field
   */
  useEffect(() => {
    resizeHandler()
  }, []);


  /**
   * This effect is used to set the initial height of the text field
   */
  useEffect(() => {

    window.addEventListener("resize", resizeHandler);

    return () => {
        window.removeEventListener("resize", resizeHandler);
    };

  }, []);


  return (
    <div className={`${styles.fieldEditor} ${className ?? ""}`}>
      {name && (
        <h1 className={styles.label}>{name}</h1>
      )}
      <textarea
        className={styles.inputField}
        style={{fontSize: fontSize}}
        disabled={!operations.includes("set")}
        value={inputValue}
        placeholder="None"
        onChange={(ev: React.ChangeEvent<HTMLTextAreaElement>) => {
          setInputValue(ev.target.value);
          resizeHandler();
        }}
        onBlur={clickAwayHandler}
        onKeyDown={inputKeyHandler}
        ref={ref}
      />
    </div>
  );
}
