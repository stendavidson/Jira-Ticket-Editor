// Import styles
import styles from "./LogTimeInput.module.scss";

// External imports
import { useContext, useRef, useState } from "react";

// Internal imports
import request from "@/lib/nothrow_request";
import { TicketContext } from "@/contexts/TicketContext";
import ReactQuill from "react-quill-new";
import { imageHandler } from "../RichTextInput/QuillUtils";
import { parseHTMLtoADF, stringToHTML } from "@/lib/parser";



/**
 * Toolbar configuration
 */
const fullToolbar = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code'],
  [{ color: [] }],
  [{ script: 'sub' }, { script: 'super' }],
  [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
  ['link', 'image'],
  ['clean']
];



export default function LogTimeInput({className, issueID, keyName, name, operations, timeSpent, updateTimeSpent}: {className: string, issueID: string, keyName: string, name: string, operations: string[], timeSpent: string, updateTimeSpent: (value: string) => void}) {

  // State Values
  const [inputTime, setInputTime] = useState<string>("");
  const [inputDateTime1, setInputDateTime1] = useState<string>("");
  const [inputDateTime2, setInputDateTime2] = useState<string>("");
  const [inputComment, setInputComment] = useState<string>("");
  const [timeFocused, setTimeFocused] = useState<boolean>(false);
  const [dateTimeFocused, setDateTimeFocused] = useState<boolean>(false);
  const [commentFocused, setCommentFocused] = useState<boolean>(false);
  const [logTime, setLogTime] = useState<boolean>(false);

  // Time Refs
  const timeRef = useRef<HTMLInputElement | null>(null);

  // DateTime Refs
  const dateTimeFieldRef = useRef<HTMLDivElement | null>(null);
  const dateTime1Ref = useRef<HTMLInputElement | null>(null);
  const dateTime2Ref = useRef<HTMLInputElement | null>(null);

  // Quill Refs
  const quillFieldRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<ReactQuill | null>(null);
  const onBlurRef = useRef<boolean>(true);

  // Contexts
  const context = useContext(TicketContext);
  

  /**
   * This constant stores the Quill toolbar config, handlers and other configs
   */
  const modules = {
    toolbar: {
      container: fullToolbar,
      handlers: {
        image: () => { imageHandler(issueID, onBlurRef, quillRef) }
      }
    },
    history: {
      delay: 2000,
      maxStack: 100,
      userOnly: true
    }
  };


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
    url.searchParams.append("pathname", `/issue/${issueID}/worklog`);
    url.searchParams.append("elevate", "true");

    // PUT Request Body
    const body: any = {
      started: getLocalDateTimeWithOffset(inputDateTime1, inputDateTime2),
      timeSpent: inputTime
    };

    if(inputComment !== ""){
      body.comment = {
        type: "doc",
        version: 1,
        content: parseHTMLtoADF(stringToHTML(inputComment))
      }
    }
    

    // Update Request
    const response = await request(url.toString(), {
      method: "POST",
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


  /**
   * This function combines Jira style "time" strings.
   * 
   * @param timeStrings Jira style "time" strings to add together.
   * 
   * @returns The total time.
   */
  function addTimes(...timeStrings: string[]): string {

    const timeUnits = { w: 0, d: 0, h: 0, m: 0 };
    const regex = /(\d+)\s*(w|d|h|m)/g;

    // Iterate over the input times
    for (const timeStr of timeStrings) {

      let match;

      // Retrieves regex extracted values
      while ((match = regex.exec(timeStr)) !== null) {
        const value = parseInt(match[1], 10);
        const unit = match[2] as keyof typeof timeUnits;
        timeUnits[unit] += value;
      }
    }

    // Normalize minutes to hours, hours to days, days to weeks
    if (timeUnits.m >= 60) {
      timeUnits.h += Math.floor(timeUnits.m / 60);
      timeUnits.m %= 60;
    }

    if (timeUnits.h >= 24) {
      timeUnits.d += Math.floor(timeUnits.h / 24);
      timeUnits.h %= 24;
    }

    if (timeUnits.d >= 7) {
      timeUnits.w += Math.floor(timeUnits.d / 7);
      timeUnits.d %= 7;
    }


    // Build the result string
    return (["w", "d", "h", "m"] as const)
      .filter(unit => timeUnits[unit] > 0)
      .map(unit => `${timeUnits[unit]}${unit}`)
      .join(" ");
  }



  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Callbacks //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function handles the scenario in which the user clicks away - similar to
   * Jira this triggers a field update.
   */
  function submissionHandler() {    

    // Early exit
    if(!validateInputTimeField(inputTime) || inputDateTime1 === "" || inputDateTime2 === ""){
      return;
    }

    // Prevent update if the inputValue value hasn't been updated.
    if (inputTime !== "") {
      
      // Update text field
      setInIssue().then((success: boolean) => {
        
        // Hide the popup & clear values
        setLogTime(false);
        setInputTime("");
        setInputDateTime1("");
        setInputDateTime2("");
        setInputComment("");

        // Update the ticket
        if(success){
          context?.setUpdateIndicator(issueID);
          updateTimeSpent(addTimes(inputTime, timeSpent));
        }
      });
    }
  }


  /**
   * This function validates the users input value
   * 
   * @param timeInput The user input value
   */
  function validateInputTimeField(timeInput: string): boolean {
    
    // Setup
    const inputFieldRef = timeRef.current!;

    // Checks
    const regex = /^\s*(?:(\d+)\s*w\s*)?(?:(\d+)\s*d\s*)?(?:(\d+)\s*h\s*)?(?:(\d+)\s*m\s*)?$/;
    const match = timeInput.match(regex);
    
    // Prevent unnecessary checks
    if (document.activeElement === timeRef.current) {
      // Create visible errors
      if (match === null) {
        inputFieldRef.setCustomValidity("Use the format: 1w 2d 3h 4m");
      } else {
        inputFieldRef.setCustomValidity("");
      }

      inputFieldRef.reportValidity();
    }

    return (timeInput !== "" && match !== null);
  }


  return (
    <>

      {/* Ticket Field */}
      <div className={`${styles.fieldEditor} ${className || ""}`}>
        <h1 className={styles.label}>{name}</h1>
        <div className={styles.buttonContainer}>
          <button 
            className={styles.logButton}
            onMouseDown={() => {setLogTime(true)}}
            type="button"
          >
            Log Time
          </button>
        </div>
      </div>

      {/* Global Overlay */}
      {logTime && (

        <div className={styles.overlay}>

          {/* Popup */}
          <div className={styles.popup}>
            <h1 className={styles.popupTitle}>Time Tracking</h1>

            {/* "Time Spent" field */}
            <div className={styles.fieldContainer}>
              <label className={styles.fieldLabel}>{`${(inputTime === "") ? "*" : ""}`} Time Spent</label>
              <input
                className={`${styles.inputField} ${timeFocused ? styles.focused : ""} ${timeFocused && (inputTime === "" || !validateInputTimeField(inputTime)) ? styles.warning : ""}`}
                type="text"
                disabled={false}
                value={inputTime}
                placeholder="None"
                onInput={(ev: React.ChangeEvent<HTMLInputElement>) => {
                  setInputTime(ev.target.value);
                }}
                onFocus={() => {setTimeFocused(true)}}
                onBlur={() => {setTimeFocused(false)}}
                required={true}
                ref={timeRef}
              />
            </div>

            {/* "Date & Time Started" field */}
            <div className={styles.fieldContainer}>
              <label className={styles.fieldLabel}>{`${(inputDateTime1 === "" || inputDateTime2 === "") ? "*" : ""}`} Date Started</label>
              <div 
                className={`${styles.dateTimeField} ${dateTimeFocused ? styles.focused : ""} ${dateTimeFocused && (inputDateTime1 === "" || inputDateTime2 === "") ? styles.warning : ""}`}
                tabIndex={-1}
                ref={dateTimeFieldRef}
                onMouseDown={() => {setDateTimeFocused(true)}}
                onBlur={() => {
                  // Delay to allow focus to move to another child
                  setTimeout(() => {
                    if (!dateTimeFieldRef.current!.contains(document.activeElement)) {
                      setDateTimeFocused(false);
                    }
                  }, 0);
                }}
              >
                <input
                  className={styles.inputDateField}
                  type="date"
                  disabled={false}
                  value={inputDateTime1}
                  placeholder=""
                  onMouseDown={() => {dateTime1Ref.current!.focus()}}
                  onInput={(ev: React.ChangeEvent<HTMLInputElement>) => {
                    setInputDateTime1(ev.target.value);
                  }}
                  required={true}
                  ref={dateTime1Ref}
                />
                <input
                  className={styles.inputTimeField}
                  type="time"
                  disabled={!operations.includes("set")}
                  value={inputDateTime2}
                  placeholder=""
                  onMouseDown={() => {dateTime2Ref.current!.focus()}}
                  onInput={(ev: React.ChangeEvent<HTMLInputElement>) => {
                    setInputDateTime2(ev.target.value);
                  }}
                  required={true}
                  ref={dateTime2Ref}
                />
              </div>
            </div>

            {/* "Work Description" field */}
            <div className={styles.fieldContainer}>
              <label className={styles.fieldLabel}>Work Description</label>
              <div
                className={`${styles.inputTextField} ${commentFocused ? styles.focused : ''}`}
                tabIndex={-1}
                onBlur={(ev: React.FocusEvent<HTMLDivElement>) => {

                  // Prevent "blur" when images are being added
                  if (onBlurRef.current) {

                    const nextFocused = ev.relatedTarget as Node | null;
                    const currentNode = quillFieldRef.current;

                    if (currentNode && (!nextFocused || !currentNode.contains(nextFocused))) {
                      setCommentFocused(false);
                    }
                  }

                }}
                onMouseDown={() => {

                  setCommentFocused(true);

                }}
                ref={quillFieldRef}
              >
                <ReactQuill
                  theme="snow"
                  value={inputComment}
                  onChange={setInputComment}
                  modules={modules}
                  ref={quillRef}
                />
              </div>
            </div>

            {/* Popup's Control Buttons */}
            <div className={styles.buttonContainer}>
              <button 
                className={styles.saveButton} 
                type="button" 
                onMouseDown={() => {
                  submissionHandler();
                }}
              >
                  Save
              </button>
              <button 
                className={styles.cancelButton} 
                type="button" 
                onMouseDown={() => {
                  setLogTime(false);
                }}
              >
                  Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
