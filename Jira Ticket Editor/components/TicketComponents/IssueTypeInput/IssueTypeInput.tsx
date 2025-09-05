// Import styles
import styles from "./IssueTypeInput.module.scss";

// External imports
import { useContext, useEffect, useRef, useState } from "react";

// Internal imports
import IssueTypeInterface from "./IssueTypeInterface";
import request from "@/lib/NoExceptRequestLib";
import { TicketContext } from "@/contexts/TicketContext";


export default function IssueTypeInput({ issueID, defaultValue, allowedValues = []}: { issueID: string, defaultValue: IssueTypeInterface, allowedValues: IssueTypeInterface[]}){

  // State values
  const [issueType, setIssueType] = useState<IssueTypeInterface>(defaultValue);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // Refs
  const ref = useRef<HTMLDivElement | null>(null);

  // Context
  const context = useContext(TicketContext);



  //////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// API Calls ///////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////


  
  /**
   * This function updates the issue's type
   * 
   * @param issueType The new issue type
   * 
   * @returns The success of the PUT request
   */
  async function updateIssueType(issueType: IssueTypeInterface): Promise<boolean>{

    // URL Params
    const url: URL = new URL("/proxy", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}`);
    url.searchParams.append("elevate", "true");

    // PUT Request Body
    const body: any = {
      fields: {
        issuetype: {
          id: issueType.id
        }
      }
    }

    // User request
    const response = await request(
      url.toString(),
      {
        method: "PUT",
        body: JSON.stringify(body)
      }
    );

    return response?.status.toString().startsWith("2") ? true : false;
  }


  //////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// Callbacks ///////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////


  /**
   * This handles the selection 
   * 
   * @param value The Issue Type data
   */
  function select(value: IssueTypeInterface){

    // Upon successfully updating the issue type update the UI
    updateIssueType(value).then((success: boolean) => {
      if(success){
        setIssueType(value);
        context?.setUpdateIndicator(issueID);
      }
    })

    // Hide Dropdown regardless
    setShowDropdown(prev => !prev);
  }



  //////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////// Effects ////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////



  /**
   * Click-away handling has been added.
   */
  useEffect(() => {

    function handler(ev: MouseEvent){

      const target: HTMLDivElement = ev.target as HTMLDivElement;
      
      // Hide dropdown if click away occurs
      if(!ref.current?.contains(target)){
        setShowDropdown(false);
      }

    }

    document.addEventListener("mousedown", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
    };

  }, []);

  

  return (
    <div className={styles.issueTypeEditor} ref={ref}>
      { issueType ?
          <div className={styles.issueTypeButton} onClick={() => {setShowDropdown(prev => !prev)}}>
            <img 
              className={styles.issueTypeIcon} 
              src={issueType.iconUrl} 
              alt={`Issue type icon - ${issueType.name}`}/>
          </div>
        :
          <div className={styles.issueTypeButton} onClick={() => {setShowDropdown(prev => !prev)}}>
            <img 
              className={styles.issueTypeIcon}
              src="./../FailThrough.png" 
              alt={`Issue type icon - Unknown`}/>
          </div>
      }    
      <div className={`${styles.issueTypesDropdown} ${showDropdown ? styles.displayDropdown : ""}`}>
        {allowedValues.map((value: IssueTypeInterface) => (
            <div className={styles.issueTypeOption} onClick={() => {select(value)}} key={value.id}>
              <img 
                className={styles.issueTypeIcon}
                src={value.iconUrl} 
                alt={`Issue type icon - ${value.name}`}/>
              <p className={styles.issueTypeName}>{value.name}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}