// Import styles
import styles from "./TicketCreator.module.scss";

// External imports
import { useEffect, useRef, useState } from "react";

// Internal imports
import request from "@/lib/nothrow_request";
import IssueTypeInterface from "@/interfaces/IssueTypeInterface";
import TicketCreationInterface from "./TicketCreationInterface";



export default function TicketCreator({className, projectID, issueTypes, ticketIDs, setTicketIDs}: {className: string, projectID?: string, issueTypes: IssueTypeInterface[], ticketIDs: {id : string}[], setTicketIDs: (ticketIDs: {id : string}[]) => void}) {

  // State Values
  const [createTicket, setCreateTicket] = useState<boolean>(false);

  const [inputSummary, setInputSummary] = useState<string>("");
  const [summaryFocused, setSummaryFocused] = useState<boolean>(false);
  
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<IssueTypeInterface | null>(issueTypes[0]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [permittedValues, setPermittedValues] = useState<IssueTypeInterface[]>(issueTypes);
  const [filteredPermittedValues, setFilteredPermittedValues] = useState<IssueTypeInterface[]>(issueTypes);
  const [focused, setFocused] = useState<boolean>(false);
  

  // Refs
  const summaryRef = useRef<HTMLInputElement | null>(null);



  ///////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// API functions /////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function creates a new jira Ticket from the user's input
   * 
   * @returns The success of the PUT request
   */
  async function createIssue(): Promise<string | null> {

    // URL Params
    const url = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue`);
    url.searchParams.append("elevate", "true");

    // PUT Request Body
    const body: any = {
      fields: {
        project: {
          id: projectID
        },
        summary: inputSummary,
        issuetype: {
          id: selectedOption!.id
        }
      }
    }    

    // Update Request
    const response = await request(url.toString(), {
      method: "POST",
      body: JSON.stringify(body),
    });

    // Process Response
    let ticket: TicketCreationInterface | null = null;
    
    if(response?.status.toString().startsWith("2")){
      ticket = (await response.json()) as TicketCreationInterface;
    }

    return ticket?.id ?? null;
  }



  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Callbacks //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////


  /**
   * This function triggers the creation of a new Jira issue/ticket
   */
  function submissionHandler() {    

    // Prevent update if required fields aren't filled
    if (selectedOption && inputSummary !== "") {
      
      // Update text field
      createIssue().then((ticketID: string | null) => {
        
        // Hide the popup & clear values
        setSelectedOption(null);
        setInputSummary("");
        setCreateTicket(false);

        // Update the ticket
        if(ticketID){
          setTicketIDs([...ticketIDs, {id: ticketID}]);
        }
      });
    }
  }



  /**
   * This function filters the dropdown list
   * 
   * @param textInput The user input
   */
  function filterDropdown(textInput: string){
    
    setFilteredPermittedValues(permittedValues.filter((value: IssueTypeInterface) => (
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

  // If pre-filtered values are present utilize
  if(issueTypes.length > 0){
    setSelectedOption(issueTypes[0]);
    setPermittedValues(issueTypes);
    setFilteredPermittedValues(issueTypes);
  }

  }, [issueTypes]);



  return (
    <>

      {/* Ticket Field */}
      <button 
        className={className} 
        type="button" 
        onClick={() => {
          setCreateTicket(true);
        }}
        disabled={projectID === undefined}
      >Create</button>

      {/* Global Overlay */}
      {createTicket && (

        <div className={styles.overlay}>

          {/* Popup */}
          <div className={styles.popup}>
            <h1 className={styles.popupTitle}>Create Ticket</h1>

            {/* "Issue Type" field */}
            <div className={styles.fieldContainer}>
              <h1 className={styles.fieldLabel}>{`${(selectedOption) ? "*" : ""}`}Issue Type</h1>
              <div className={`${styles.fieldButton}`}>
                <input 
                  className={`${styles.inputDropdownField} ${focused ? styles.focused : ""} ${(focused && selectedOption === null) ? styles.warning : ""}`} 
                  type="text" 
                  value={inputValue} 
                  placeholder={selectedOption?.name ?? "None"}
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
                <div className={`${styles.fieldDropdown} ${showDropdown ? styles.displayDropdown : ""}`}>
                  {
                    filteredPermittedValues.map((option: IssueTypeInterface) => {
                        if(selectedOption?.name !== option.name && option.hierarchyLevel > -1){
                          return (
                            <div className={styles.dropdownOption} onMouseDown={() => {setSelectedOption(option)}} key={option.name}>
                              <p className={styles.dropdownOptionName}>{option.name}</p>
                            </div>
                          )
                        }
                      }
                    )
                  }
                </div>
              </div>
            </div>

            {/* "Summary" field */}
            <div className={styles.fieldContainer}>
              <label className={styles.fieldLabel}>{`${(inputSummary === "") ? "*" : ""}`}Summary</label>
              <input
                className={`${styles.inputTextField} ${summaryFocused ? styles.focused : ""} ${(summaryFocused && inputSummary === "") ? styles.warning : ""}`}
                disabled={false}
                value={inputSummary}
                placeholder="Enter Summary..."
                onInput={(ev: React.ChangeEvent<HTMLInputElement>) => {
                  setInputSummary(ev.target.value);
                }}
                onFocus={() => {setSummaryFocused(true)}}
                onBlur={() => {setSummaryFocused(false)}}
                required={true}
                ref={summaryRef}
              />
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
                  setCreateTicket(false);
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
