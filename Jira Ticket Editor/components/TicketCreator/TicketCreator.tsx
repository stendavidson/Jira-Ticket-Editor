// Import styles
import styles from "./TicketCreator.module.scss";

// External imports
import { useEffect, useRef, useState } from "react";

// Internal imports
import request from "@/lib/NoExceptRequestLib";
import IssueTypeInterface from "@/interfaces/IssueTypeInterface";
import TicketCreationInterface from "./TicketCreationInterface";



export default function TicketCreator({className, projectID, issueTypes, addIssue, subTask, parentID}: {className: string, projectID?: string, issueTypes: IssueTypeInterface[], addIssue: (issueID: string) => void, subTask: boolean, parentID?: string}) {

  // State Values
  const [createTicket, setCreateTicket] = useState<boolean>(false);
  const [inputSummary, setInputSummary] = useState<string>("");
  const [summaryFocused, setSummaryFocused] = useState<boolean>(false);
  const [issueTypeSearchValue, setIssueTypeSearchValue] = useState<string>("");
  const [selectedIssueType, setSelectedIssueType] = useState<IssueTypeInterface | null>(issueTypes[0]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [permittedValues, setPermittedValues] = useState<IssueTypeInterface[]>(issueTypes);
  const [filteredPermittedValues, setFilteredPermittedValues] = useState<IssueTypeInterface[]>(issueTypes);
  const [issueTypeFocused, setIssueTypeFocused] = useState<boolean>(false);

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
          id: selectedIssueType!.id
        }
      }
    }    

    // Handle subtasks
    if(subTask){
      body.fields.parent = {
        id: parentID
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
    if (selectedIssueType && inputSummary !== "") {
      
      // Update text field
      createIssue().then((ticketID: string | null) => {
        
        // Hide the popup & clear values
        setSelectedIssueType(issueTypes[0]);
        setInputSummary("");
        setCreateTicket(false);

        // Update the ticket
        if(ticketID){
          addIssue(ticketID);
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
      setSelectedIssueType(issueTypes[0]);
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
              <label className={styles.fieldLabel}>{`${selectedIssueType === null ? "*" : ""}`}Issue Type</label>
              <div 
                className={`${styles.fieldButton} ${issueTypeFocused ? styles.focused : ""} ${(issueTypeFocused && selectedIssueType === null) ? styles.warning : ""}`}
                >
                <img 
                  className={styles.icon} 
                  src={selectedIssueType?.iconUrl ?? "./../Transparent.png"}
                  alt={`An issue type icon - ${selectedIssueType?.name ?? "Unknown"}`} />
                <input 
                  className={`${styles.inputDropdownField}`} 
                  type="text" 
                  value={issueTypeSearchValue} 
                  placeholder={selectedIssueType?.name ?? "None"}
                  onFocus={() => {
                    setIssueTypeFocused(true);
                    setShowDropdown(true);
                  }}
                  onBlur={() => {
                    setIssueTypeSearchValue("");
                    setFilteredPermittedValues(permittedValues);
                    setIssueTypeFocused(false);
                    setShowDropdown(false);
                  }}
                  onInput={(ev: React.ChangeEvent<HTMLInputElement>) => {
                    setIssueTypeSearchValue(ev.target.value);
                    filterDropdown(ev.target.value);
                  }}
                />
                <div className={`${styles.fieldDropdown} ${showDropdown ? styles.displayDropdown : ""}`}>
                  {
                    filteredPermittedValues.map((option: IssueTypeInterface) => {
                        if(selectedIssueType?.name !== option.name && ((subTask && option.hierarchyLevel === -1) || (!subTask && option.hierarchyLevel > -1))){
                          return (
                            <div className={styles.dropdownOption} onMouseDown={() => {setSelectedIssueType(option)}} key={option.name}>
                              <img src={option.iconUrl} className={styles.icon} alt={`An issue type icon - ${option.name}`}/>
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
